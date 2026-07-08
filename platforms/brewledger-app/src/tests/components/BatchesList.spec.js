import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BatchesList from '../../src/views/BatchesList.vue';
import { BatchRepository } from '../../src/repositories/BatchRepository';
import { VesselRepository } from '../../src/repositories/VesselRepository';

// Mock Repositories
vi.mock('../../src/repositories/BatchRepository', () => ({
  BatchRepository: {
    getAll: vi.fn()
  }
}));
vi.mock('../../src/repositories/VesselRepository', () => ({
  VesselRepository: {
    getAll: vi.fn()
  }
}));

describe('BatchesList', () => {
  it('should render a list of batches', async () => {
    BatchRepository.getAll.mockResolvedValue([
      { id: 'b1', name: 'Batch 1', status: 'BREWED', batch_date: '2023-01-01', planned_volume: 10, planned_volume_unit: 'Gallons' },
      { id: 'b2', name: 'Batch 2', status: 'PLANNED', batch_date: '2023-01-02' }
    ]);
    VesselRepository.getAll.mockResolvedValue([]);

    const wrapper = mount(BatchesList, {
      global: {
        stubs: {
          RouterLink: { template: '<a><slot /></a>' }
        }
      }
    });

    // Wait for onMounted
    await new Promise(process.nextTick);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('Batch 1');
    expect(wrapper.text()).toContain('Batch 2');
    expect(wrapper.text()).toContain('BREWED');
  });

  it('should handle empty state', async () => {
    BatchRepository.getAll.mockResolvedValue([]);
    VesselRepository.getAll.mockResolvedValue([]);

    const wrapper = mount(BatchesList, {
        global: {
          stubs: {
            RouterLink: { template: '<a><slot /></a>' }
          }
        }
      });

    await new Promise(process.nextTick);
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain('No batches');
  });
});
