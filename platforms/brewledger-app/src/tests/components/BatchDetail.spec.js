import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BatchDetail from '../../src/views/BatchDetail.vue';
import { BatchRepository } from '../../src/repositories/BatchRepository';
import { BatchMilestoneRepository } from '../../src/repositories/BatchMilestoneRepository';
import { VesselRepository } from '../../src/repositories/VesselRepository';
import { useRoute } from 'vue-router';

// Mock Repositories
vi.mock('../../src/repositories/BatchRepository');
vi.mock('../../src/repositories/BatchMilestoneRepository');
vi.mock('../../src/repositories/VesselRepository');
vi.mock('../../src/repositories/BatchAdditionRepository', () => ({ BatchAdditionRepository: { getByBatchId: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/repositories/BatchReadingRepository', () => ({ BatchReadingRepository: { getByBatchId: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/repositories/PackagingRunRepository', () => ({ PackagingRunRepository: { getByBatchId: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/repositories/ItemRepository', () => ({ ItemRepository: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/repositories/LocationRepository', () => ({ LocationRepository: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/repositories/CategoryRepository', () => ({ CategoryRepository: { getAll: vi.fn().mockResolvedValue([]) } }));
vi.mock('../../src/services/SyncService', () => ({ SyncService: { sync: vi.fn() } }));

// Mock Vue Router
vi.mock('vue-router', () => ({
  useRoute: vi.fn()
}));

describe('BatchDetail', () => {
  it('should render batch details and milestones', async () => {
    // Setup Mocks
    useRoute.mockReturnValue({ params: { id: 'b1' } });
    
    BatchRepository.getById.mockResolvedValue({
      id: 'b1', name: 'Test Batch', status: 'BREWED', batch_date: '2023-01-01'
    });
    
    VesselRepository.getAll.mockResolvedValue([{ id: 'v1', name: 'FV-1' }]);
    
    // Mock definitions if they are static property
    BatchMilestoneRepository.DEFINITIONS = [
        { type: 'KNOCKOUT', label: 'Knocked Out' },
        { type: 'PITCHED', label: 'Pitched' }
    ];
    
    BatchMilestoneRepository.getByBatchId.mockResolvedValue([
      { id: 'm1', milestone_type: 'KNOCKOUT', completed: true, occurred_at: '2023-01-01T10:00:00Z' }
    ]);

    const wrapper = mount(BatchDetail, {
      global: {
        stubs: {
          ModalDialog: true
        }
      }
    });

    // Wait for loadData
    await new Promise(process.nextTick);
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // Extra tick for computed props/watchers

    expect(wrapper.text()).toContain('Test Batch');
    expect(wrapper.text()).toContain('Knocked Out');
    
    // Check if milestone is checked (visual check logic might be complex in unit test without full dom, 
    // but we can check if classes are applied or logic holds)
    // The component uses `isMilestoneCompleted`
    expect(wrapper.vm.isMilestoneCompleted('KNOCKOUT')).toBe(true);
    expect(wrapper.vm.isMilestoneCompleted('PITCHED')).toBeFalsy();
  });
});
