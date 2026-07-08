import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Dashboard from '../../src/views/Dashboard.vue';
import { ParLevelRepository } from '../../src/repositories/ParLevelRepository';
import { LedgerRepository } from '../../src/repositories/LedgerRepository';
import { ItemRepository } from '../../src/repositories/ItemRepository';
import { LocationRepository } from '../../src/repositories/LocationRepository';
import { AuthService } from '../../src/services/AuthService';

// Mock child components/router
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  RouterLink: { template: '<a><slot /></a>' }
}));

// Mock repositories
vi.mock('../../src/repositories/ParLevelRepository');
vi.mock('../../src/repositories/LedgerRepository');
vi.mock('../../src/repositories/ItemRepository');
vi.mock('../../src/repositories/LocationRepository');
vi.mock('../../src/services/AuthService');
vi.mock('../../src/services/SyncService');

describe('Dashboard.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mocks
    vi.mocked(AuthService.getSession).mockResolvedValue({ orgId: 'test-org' });
    vi.mocked(ParLevelRepository.getAll).mockResolvedValue([]);
    vi.mocked(LedgerRepository.getAllOnhand).mockResolvedValue([]);
    vi.mocked(ItemRepository.getAll).mockResolvedValue([]);
    vi.mocked(LocationRepository.getAll).mockResolvedValue([]);
  });

  it('should not show alert when stock is healthy', async () => {
    const wrapper = mount(Dashboard);
    await flushPromises();
    
    expect(wrapper.text()).not.toContain('Low Stock');
  });

  it('should show alert when item is below par level', async () => {
    // Setup data
    const items = [{ id: 'item-1', name: 'Malt' }];
    const locations = [{ id: 'loc-1', name: 'Pantry' }];
    const parLevels = [{ item_id: 'item-1', location_id: 'loc-1', min_qty: 10 }];
    const onHand = [{ item_id: 'item-1', location_id: 'loc-1', quantity: 5 }]; // 5 < 10

    vi.mocked(ItemRepository.getAll).mockResolvedValue(items);
    vi.mocked(LocationRepository.getAll).mockResolvedValue(locations);
    vi.mocked(ParLevelRepository.getAll).mockResolvedValue(parLevels);
    vi.mocked(LedgerRepository.getAllOnhand).mockResolvedValue(onHand);

    const wrapper = mount(Dashboard);
    await flushPromises();

    expect(wrapper.text()).toContain('Low Stock: 1 item');
  });

  it('should IGNORE deleted items even if below par', async () => {
    // This tests the fix for the "orphaned par level" bug
    
    // Par level exists for 'item-1'
    const parLevels = [{ item_id: 'item-1', location_id: 'loc-1', min_qty: 10 }];
    const onHand = []; // 0 < 10, would trigger alert if item existed
    
    // But items list is EMPTY (item-1 was deleted)
    vi.mocked(ItemRepository.getAll).mockResolvedValue([]);
    vi.mocked(LocationRepository.getAll).mockResolvedValue([{ id: 'loc-1' }]);
    vi.mocked(ParLevelRepository.getAll).mockResolvedValue(parLevels);
    vi.mocked(LedgerRepository.getAllOnhand).mockResolvedValue(onHand);

    const wrapper = mount(Dashboard);
    await flushPromises();

    // Should NOT show alert because item is missing from ItemRepository
    expect(wrapper.text()).not.toContain('Low Stock');
  });

  it('should IGNORE deleted locations even if below par', async () => {
    // This tests the fix for the "orphaned par level" bug
    
    const parLevels = [{ item_id: 'item-1', location_id: 'loc-1', min_qty: 10 }];
    const onHand = []; 
    
    vi.mocked(ItemRepository.getAll).mockResolvedValue([{ id: 'item-1' }]);
    // Location list is EMPTY (loc-1 was deleted)
    vi.mocked(LocationRepository.getAll).mockResolvedValue([]);
    vi.mocked(ParLevelRepository.getAll).mockResolvedValue(parLevels);
    vi.mocked(LedgerRepository.getAllOnhand).mockResolvedValue(onHand);

    const wrapper = mount(Dashboard);
    await flushPromises();

    // Should NOT show alert
    expect(wrapper.text()).not.toContain('Low Stock');
  });
});
