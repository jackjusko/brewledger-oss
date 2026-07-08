<template>
  <div class="desktop-container">
    <div class="console-page-header">
      <div></div>
      <div class="flex items-center gap-3 flex-wrap justify-end">
        <router-link to="/batches/add" class="btn btn-primary inline-flex items-center gap-2 shrink-0">
          <i class="ri-add-line" aria-hidden="true"></i>
          New Batch
        </router-link>
      </div>
    </div>

    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Batches overview</h4>
        <p>{{ activeBatches.length + finishedBatches.length }} shown · {{ batches.length }} total</p>
      </div>
      <div class="console-toolbar-actions">
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" aria-hidden="true"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search batches or vessels..."
            class="input pl-9 pr-3 py-2 text-sm w-56"
          />
        </div>
      </div>
    </div>

    <div v-if="loading" class="card console-empty">
      <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
      <p class="text-neutral-500 dark:text-stone-400 text-sm">Loading batches...</p>
    </div>

    <div v-else-if="batches.length === 0" class="card console-empty">
      <i class="ri-flask-line console-empty-icon" aria-hidden="true"></i>
      <p class="text-neutral-600 dark:text-stone-400 font-medium mb-4">No batches yet</p>
      <router-link to="/batches/add" class="btn btn-primary inline-flex items-center gap-2">
        <i class="ri-add-line" aria-hidden="true"></i>
        Create your first batch
      </router-link>
    </div>

    <div v-else>
      <!-- Active (in-progress) batches -->
      <section v-if="activeBatches.length > 0" class="mb-8">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-3">
          In progress ({{ activeBatches.length }})
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <router-link
            v-for="batch in activeBatches"
            :key="batch.id"
            :to="`/batches/${batch.id}`"
            class="card group cursor-pointer hover:shadow-lg transition-all batch-card border-l-4 border-primary-400 dark:border-primary-600"
          >
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-neutral-900 dark:text-neutral-100 text-lg mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ batch.name }}</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="meta-pill text-[11px]">
                <i class="ri-calendar-line" aria-hidden="true"></i>
                {{ formatDate(batch.batch_date) }}
              </span>
              <span
                v-if="totalVolume(batch) != null"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300"
              >
                <i class="ri-flask-line" aria-hidden="true"></i>
                {{ totalVolume(batch) }} {{ batch.planned_volume_unit || 'L' }}
              </span>
            </div>
          </div>
          <span :class="getStatusClass(batch.status)" class="shrink-0 px-2 py-1 rounded-md text-xs font-medium">
            {{ batch.status || 'PLANNED' }}
          </span>
        </div>

        <!-- Vessels + volumes -->
        <div v-if="batch.vesselSummaries?.length" class="mt-3 rounded-lg bg-neutral-50 dark:bg-stone-800/50 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-stone-400 border-b border-neutral-200 dark:border-neutral-700">
            Vessels
          </div>
          <ul class="divide-y divide-neutral-200 dark:divide-neutral-700">
            <li
              v-for="(s, i) in batch.vesselSummaries"
              :key="i"
              class="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span class="font-medium text-neutral-800 dark:text-stone-200 text-sm truncate">
                {{ s.vesselName }}
              </span>
              <span
                class="shrink-0 font-mono text-sm font-bold tabular-nums text-primary-600 dark:text-primary-400"
              >
                {{ s.current_volume != null ? s.current_volume : '—' }} {{ batch.planned_volume_unit || 'L' }}
              </span>
            </li>
          </ul>
        </div>
        <div v-else-if="totalVolume(batch) != null" class="mt-2 text-xs text-neutral-500 dark:text-stone-400">
          <i class="ri-information-line" aria-hidden="true"></i> No vessels assigned yet
        </div>

        <div class="mt-3 pt-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
          <div class="text-xs text-neutral-500 dark:text-stone-400 flex items-center gap-2">
            <i class="ri-time-line" aria-hidden="true"></i>
            Updated {{ formatRelative(batch.updated_at || batch.created_at) }}
          </div>
          <span class="text-xs font-semibold text-primary-600 dark:text-primary-400 inline-flex items-center gap-1">
            View details <i class="ri-arrow-right-up-line text-sm" aria-hidden="true"></i>
          </span>
        </div>
      </router-link>
        </div>
      </section>

      <!-- Finished (production complete) batches -->
      <section v-if="finishedBatches.length > 0">
        <h2 class="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-stone-400 mb-3">
          Finished ({{ finishedBatches.length }})
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <router-link
            v-for="batch in finishedBatches"
            :key="batch.id"
            :to="`/batches/${batch.id}`"
            class="card group cursor-pointer hover:shadow-lg transition-all batch-card border-l-4 border-success-400 dark:border-success-600"
          >
        <div class="flex items-start justify-between gap-4 mb-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-neutral-900 dark:text-neutral-100 text-lg mb-1 group-hover:text-success-600 dark:group-hover:text-success-400 transition-colors">{{ batch.name }}</h3>
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="meta-pill text-[11px]">
                <i class="ri-calendar-line" aria-hidden="true"></i>
                {{ formatDate(batch.batch_date) }}
              </span>
              <span
                v-if="totalVolume(batch) != null"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300"
              >
                <i class="ri-flask-line" aria-hidden="true"></i>
                {{ totalVolume(batch) }} {{ batch.planned_volume_unit || 'L' }}
              </span>
              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300">
                <i class="ri-check-double-line" aria-hidden="true"></i>
                Production complete
              </span>
            </div>
          </div>
          <span :class="getStatusClass(batch.status)" class="shrink-0 px-2 py-1 rounded-md text-xs font-medium">
            {{ batch.status || 'Production Complete' }}
          </span>
        </div>

        <!-- Vessels + volumes -->
        <div v-if="batch.vesselSummaries?.length" class="mt-3 rounded-lg bg-neutral-50 dark:bg-stone-800/50 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
          <div class="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-stone-400 border-b border-neutral-200 dark:border-neutral-700">
            Vessels
          </div>
          <ul class="divide-y divide-neutral-200 dark:divide-neutral-700">
            <li
              v-for="(s, i) in batch.vesselSummaries"
              :key="i"
              class="flex items-center justify-between gap-2 px-3 py-2"
            >
              <span class="font-medium text-neutral-800 dark:text-stone-200 text-sm truncate">
                {{ s.vesselName }}
              </span>
              <span
                class="shrink-0 font-mono text-sm font-bold tabular-nums text-success-600 dark:text-success-400"
              >
                {{ s.current_volume != null ? s.current_volume : '—' }} {{ batch.planned_volume_unit || 'L' }}
              </span>
            </li>
          </ul>
        </div>
        <div v-else-if="totalVolume(batch) != null" class="mt-2 text-xs text-neutral-500 dark:text-stone-400">
          <i class="ri-information-line" aria-hidden="true"></i> No vessels assigned yet
        </div>

        <div class="mt-3 pt-3 flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700">
          <div class="text-xs text-neutral-500 dark:text-stone-400 flex items-center gap-2">
            <i class="ri-time-line" aria-hidden="true"></i>
            Updated {{ formatRelative(batch.updated_at || batch.created_at) }}
          </div>
          <span class="text-xs font-semibold text-success-600 dark:text-success-400 inline-flex items-center gap-1">
            View details <i class="ri-arrow-right-up-line text-sm" aria-hidden="true"></i>
          </span>
        </div>
      </router-link>
        </div>
      </section>

      <div v-if="activeBatches.length === 0 && finishedBatches.length === 0" class="card console-empty">
        <p class="text-neutral-500 dark:text-stone-400 text-sm">No batches match your search.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { BatchRepository } from '../repositories/BatchRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { BatchLocationRepository } from '../repositories/BatchLocationRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { useSync } from '../composables/useSync'

const batches = ref([])
const productionCompleteBatchIds = ref(new Set())
const loading = ref(true)
const search = ref('')
const { syncTrigger } = useSync()

const loadData = async () => {
  loading.value = true
  try {
    const [allBatches, completeIds] = await Promise.all([
      BatchRepository.getAll(),
      LedgerRepository.getProductionCompleteBatchIds()
    ])
    productionCompleteBatchIds.value = new Set(completeIds)

    const [allVessels, allLocations] = await Promise.all([
      VesselRepository.getAll(),
      BatchLocationRepository.getByBatchIds(allBatches.map(b => b.id))
    ])

    const vesselById = new Map((allVessels || []).map(v => [v.id, v]))
    const locationsByBatchId = (allLocations || []).reduce((acc, loc) => {
      if (!acc[loc.parent_batch_id]) acc[loc.parent_batch_id] = []
      acc[loc.parent_batch_id].push(loc)
      return acc
    }, {})

    batches.value = allBatches.map(b => {
      const locations = locationsByBatchId[b.id] || []
      const vesselSummaries = locations.map(loc => ({
        vesselName: vesselById.get(loc.vessel_id)?.name ?? 'Unknown',
        current_volume: loc.current_volume
      }))
      return { ...b, vesselSummaries }
    })
  } finally {
    loading.value = false
  }
}

const filteredBatches = computed(() => {
  const term = search.value.trim().toLowerCase()
  return batches.value.filter(b => {
    return (
      !term ||
      (b.name && b.name.toLowerCase().includes(term)) ||
      (b.vesselSummaries || []).some(v => v.vesselName?.toLowerCase().includes(term))
    )
  })
})

const activeBatches = computed(() =>
  filteredBatches.value.filter(b => !productionCompleteBatchIds.value.has(b.id))
)
const finishedBatches = computed(() =>
  filteredBatches.value.filter(b => productionCompleteBatchIds.value.has(b.id))
)

onMounted(loadData)
watch(syncTrigger, loadData)

const totalVolume = (batch) => batch.total_theoretical_volume ?? batch.planned_volume ?? null

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const formatRelative = (dateStr) => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  const diff = Date.now() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
}

const getStatusClass = (status) => {
  const map = {
    PLANNED: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300',
    'Knocked Out': 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    'Pitched': 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    'Fermentation Started': 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
    'FG Confirmed': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Cold Crash': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Transferred': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Serving': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Packaging Started': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Packaging Completed': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    'Production Complete': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    'Released': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    'Batch Closed': 'bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800'
  }
  return map[status] || 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
}

</script>

<style scoped>
.batch-card {
  padding: 1.25rem;
}
</style>
