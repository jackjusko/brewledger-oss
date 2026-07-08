<template>
  <div class="pb-16 space-y-2">
    <div class="flex items-center justify-between">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-gray-50">Batches</h1>
      <router-link to="/batches/add" class="text-purple-600 dark:text-purple-400 text-sm font-medium hover:underline">+ New</router-link>
    </div>

    <div v-if="loading" class="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">Loading...</div>

    <div v-else-if="batches.length === 0" class="py-6 text-center bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <p class="text-sm text-gray-600 dark:text-gray-300 mb-2">No batches</p>
      <router-link to="/batches/add" class="text-purple-600 dark:text-purple-400 text-sm">Create batch</router-link>
    </div>

    <div v-else class="space-y-4">
      <!-- In progress -->
      <section v-if="activeBatches.length > 0">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">In progress ({{ activeBatches.length }})</h2>
        <div class="space-y-1.5">
          <router-link v-for="batch in activeBatches" :key="batch.id" :to="`/batches/${batch.id}`" class="block bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ batch.name }}</h3>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span>{{ formatDate(batch.batch_date) }}</span>
                  <span v-if="(batch.total_theoretical_volume ?? batch.planned_volume) != null">
                    · {{ batch.total_theoretical_volume ?? batch.planned_volume }} {{ batch.planned_volume_unit || 'L' }}
                  </span>
                  <template v-if="batch.vesselSummaries?.length">
                    · <span v-for="(s, i) in batch.vesselSummaries" :key="i">
                      {{ s.vesselName }}{{ s.current_volume != null ? ` (${s.current_volume})` : '' }}{{ i < batch.vesselSummaries.length - 1 ? ', ' : '' }}
                    </span>
                  </template>
                </div>
              </div>
              <span :class="getStatusClass(batch.status)" class="px-1.5 py-0.5 rounded text-xs shrink-0">{{ batch.status || 'PLANNED' }}</span>
            </div>
            <div class="mt-1 w-full bg-gray-100 dark:bg-gray-800 h-0.5 rounded overflow-hidden">
              <div class="h-full bg-purple-500 rounded" :style="{ width: getProgressWidth(batch.status) }"></div>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Finished (production complete) -->
      <section v-if="finishedBatches.length > 0">
        <h2 class="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">Finished ({{ finishedBatches.length }})</h2>
        <div class="space-y-1.5">
          <router-link v-for="batch in finishedBatches" :key="batch.id" :to="`/batches/${batch.id}`" class="block bg-white dark:bg-gray-800 p-2 rounded border border-green-200 dark:border-green-800 border-l-4 border-l-green-500">
            <div class="flex items-start justify-between gap-2">
              <div class="flex-1 min-w-0">
                <h3 class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ batch.name }}</h3>
                <div class="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  <span>{{ formatDate(batch.batch_date) }}</span>
                  <span v-if="(batch.total_theoretical_volume ?? batch.planned_volume) != null">
                    · {{ batch.total_theoretical_volume ?? batch.planned_volume }} {{ batch.planned_volume_unit || 'L' }}
                  </span>
                  <span class="text-green-600 dark:text-green-400 font-medium">· Production complete</span>
                  <template v-if="batch.vesselSummaries?.length">
                    · <span v-for="(s, i) in batch.vesselSummaries" :key="i">
                      {{ s.vesselName }}{{ s.current_volume != null ? ` (${s.current_volume})` : '' }}{{ i < batch.vesselSummaries.length - 1 ? ', ' : '' }}
                    </span>
                  </template>
                </div>
              </div>
              <span class="px-1.5 py-0.5 rounded text-xs shrink-0 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Complete</span>
            </div>
            <div class="mt-1 w-full bg-gray-100 dark:bg-gray-800 h-0.5 rounded overflow-hidden">
              <div class="h-full bg-green-500 rounded" style="width: 100%"></div>
            </div>
          </router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue';
import { BatchRepository } from '../repositories/BatchRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { useSync } from '../composables/useSync';

const batches = ref([]);
const productionCompleteBatchIds = ref(new Set());
const loading = ref(true);
const { lastSyncTimestamp } = useSync();

const activeBatches = computed(() =>
  batches.value.filter(b => !productionCompleteBatchIds.value.has(b.id))
);
const finishedBatches = computed(() =>
  batches.value.filter(b => productionCompleteBatchIds.value.has(b.id))
);

const loadData = async () => {
  loading.value = true;
  try {
    const [allBatches, completeIds] = await Promise.all([
      BatchRepository.getAll(),
      LedgerRepository.getProductionCompleteBatchIds()
    ]);
    productionCompleteBatchIds.value = new Set(completeIds);
    const [allVessels, allLocations] = await Promise.all([
      VesselRepository.getAll(),
      BatchLocationRepository.getByBatchIds(allBatches.map(b => b.id))
    ]);

    const vesselById = new Map((allVessels || []).map(v => [v.id, v]));
    const locationsByBatchId = (allLocations || []).reduce((acc, loc) => {
      if (!acc[loc.parent_batch_id]) acc[loc.parent_batch_id] = [];
      acc[loc.parent_batch_id].push(loc);
      return acc;
    }, {});

    batches.value = allBatches.map(b => {
      const locations = locationsByBatchId[b.id] || [];
      const vesselSummaries = locations.map(loc => ({
        vesselName: vesselById.get(loc.vessel_id)?.name ?? 'Unknown',
        current_volume: loc.current_volume
      }));
      return {
        ...b,
        vesselSummaries
      };
    });
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
onActivated(loadData);

// Watch for sync updates to refresh batch list
watch(lastSyncTimestamp, () => {
  loadData();
});

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString();
};

const getStatusClass = (status) => {
  const map = {
    PLANNED: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300',
    BREWED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    FERMENTING: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
    CONDITIONING: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    PACKAGING: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-700',
    PACKAGED: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    CLOSED: 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-800'
  };
  return map[status] || map.PLANNED;
};

const getProgressWidth = (status) => {
  const map = {
    PLANNED: '0%',
    BREWED: '20%',
    FERMENTING: '50%',
    CONDITIONING: '75%',
    PACKAGING: '90%', // Added PACKAGING
    PACKAGED: '100%',
    CLOSED: '100%'
  };
  return map[status] || '0%';
};
</script>
