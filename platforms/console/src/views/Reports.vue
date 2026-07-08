<template>
  <div class="desktop-container">
    <!-- Report Types Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      <router-link to="/reports/ttb-form" class="card group cursor-pointer hover:shadow-lg transition-all p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="stat-card-icon bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
            <i class="ri-file-text-line" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">TTB Form 5130.9</h3>
            <p class="text-xs text-neutral-600 dark:text-stone-400 font-medium">Monthly/Quarterly Report of Operations</p>
          </div>
        </div>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-5 leading-relaxed">Generate TTB Form 5130.9 with automatic population from tracked brewery operations data.</p>
        <button class="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors">
          Generate TTB Form
        </button>
      </router-link>

      <router-link to="/removals" class="card group cursor-pointer hover:shadow-lg transition-all p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="stat-card-icon bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
            <i class="ri-truck-line" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Beer Removals</h3>
            <p class="text-xs text-neutral-600 dark:text-stone-400 font-medium">TTB removal classification</p>
          </div>
        </div>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-5 leading-relaxed">Record beer removals for sale, consumption, export, R&D, and other TTB-classified purposes.</p>
        <button class="w-full py-3 px-4 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors">
          Record Removals
        </button>
      </router-link>

      <router-link to="/losses" class="card group cursor-pointer hover:shadow-lg transition-all p-6">
        <div class="flex items-center gap-4 mb-4">
          <div class="stat-card-icon bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
            <i class="ri-error-warning-line" aria-hidden="true"></i>
          </div>
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Losses & Theft</h3>
            <p class="text-xs text-neutral-600 dark:text-stone-400 font-medium">TTB Line 30</p>
          </div>
        </div>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-5 leading-relaxed">Record inventory losses and theft for TTB Form 5130.9 Line 30 reporting.</p>
        <button class="w-full py-3 px-4 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-colors">
          Record Losses
        </button>
      </router-link>
    </div>

    <!-- Serving / Inventory rollup -->
    <div class="card overflow-hidden mb-8">
      <div class="card-header flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined mb-1">Serving & Inventory Rollup</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400">Server-backed; falls back to local if offline.</p>
        </div>
        <div class="flex gap-3">
          <input type="date" v-model="periodStart" class="px-3 py-2 rounded-lg border border-neutral-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm" />
          <input type="date" v-model="periodEnd" class="px-3 py-2 rounded-lg border border-neutral-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-sm" />
          <button class="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed" @click="loadReport" :disabled="reportLoading">Refresh</button>
        </div>
      </div>
      <div v-if="reportLoading" class="p-6 text-sm text-neutral-600 dark:text-stone-300">Loading report…</div>
      <div v-else class="card-body space-y-6">
        <div v-if="reportError" class="p-3 rounded bg-danger-50 border border-danger-200 text-danger-700 text-sm">
          {{ reportError }}
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-stone-100 text-sm">Brewed volume by location</h4>
              <span class="meta-pill text-[11px]">{{ reportSourceLabel }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="row in report.brewedByLocation" :key="row.location_id" class="flex justify-between text-sm">
                <span class="text-neutral-700 dark:text-stone-300">{{ row.location_name }}</span>
                <span class="font-mono text-neutral-900 dark:text-stone-100">{{ row.quantity }}</span>
              </div>
              <div v-if="!report.brewedByLocation.length" class="text-xs text-neutral-500 dark:text-stone-400">No data</div>
            </div>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-stone-100 text-sm">Inventory change by batch</h4>
              <span class="meta-pill text-[11px]">{{ reportSourceLabel }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="row in report.inventoryChange.byBatch" :key="row.batch_id" class="flex justify-between text-sm">
                <span class="text-neutral-700 dark:text-stone-300">{{ row.batch_name || row.batch_id }}</span>
                <span class="font-mono text-neutral-900 dark:text-stone-100">{{ row.quantity }}</span>
              </div>
              <div v-if="!report.inventoryChange.byBatch.length" class="text-xs text-neutral-500 dark:text-stone-400">No data</div>
            </div>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-stone-100 text-sm">Inventory change by brand</h4>
              <span class="meta-pill text-[11px]">{{ reportSourceLabel }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="row in report.inventoryChange.byBrand" :key="row.item_id" class="flex justify-between text-sm">
                <span class="text-neutral-700 dark:text-stone-300">{{ row.item_name }}</span>
                <span class="font-mono text-neutral-900 dark:text-stone-100">{{ row.quantity }}</span>
              </div>
              <div v-if="!report.inventoryChange.byBrand.length" class="text-xs text-neutral-500 dark:text-stone-400">No data</div>
            </div>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-stone-100 text-sm">Bulk on hand by vessel</h4>
              <span class="meta-pill text-[11px]">{{ reportSourceLabel }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="row in groupedBulkByLocation" :key="row.key" class="flex justify-between text-sm">
                <span class="text-neutral-700 dark:text-stone-300">{{ row.label }}</span>
                <span class="font-mono text-neutral-900 dark:text-stone-100">{{ row.quantity }}</span>
              </div>
              <div v-if="!groupedBulkByLocation.length" class="text-xs text-neutral-500 dark:text-stone-400">No data</div>
            </div>
          </div>
          <div class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
            <div class="flex items-center justify-between mb-2">
              <h4 class="font-semibold text-neutral-900 dark:text-stone-100 text-sm">Packaged on hand by location</h4>
              <span class="meta-pill text-[11px]">{{ reportSourceLabel }}</span>
            </div>
            <div class="space-y-2">
              <div v-for="row in report.packagedByLocation" :key="row.location_id" class="flex justify-between text-sm">
                <span class="text-neutral-700 dark:text-stone-300">{{ row.location_name }}</span>
                <span class="font-mono text-neutral-900 dark:text-stone-100">{{ row.quantity }}</span>
              </div>
              <div v-if="!report.packagedByLocation.length" class="text-xs text-neutral-500 dark:text-stone-400">No data</div>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { ServingReportsService } from '../services/ServingReportsService'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'

const periodStart = ref(dayjs().subtract(30, 'day').format('YYYY-MM-DD'))
const periodEnd = ref(dayjs().format('YYYY-MM-DD'))
const reportLoading = ref(false)
const reportError = ref('')
const reportSource = ref('local')
const report = ref({
  brewedByLocation: [],
  inventoryChange: { byBatch: [], byBrand: [] },
  bulkOnhandByVessel: [],
  packagedByLocation: []
})
const vesselMap = ref(new Map())
const locationMap = ref(new Map())

const loadReference = async () => {
  const [vessels, locations] = await Promise.all([VesselRepository.getAll(), LocationRepository.getAll()])
  vesselMap.value = new Map(vessels.filter(v => !v.deleted_at).map(v => [v.id, v]))
  locationMap.value = new Map(locations.map(l => [l.id, l]))
}

const loadReport = async () => {
  reportLoading.value = true
  reportError.value = ''
  try {
    const data = await ServingReportsService.getReport({
      periodStart: periodStart.value ? new Date(periodStart.value) : undefined,
      periodEnd: periodEnd.value ? new Date(periodEnd.value) : undefined
    })
    report.value = data
    reportSource.value = data.source || 'local'
  } catch (e) {
    reportError.value = e.message || 'Failed to load report'
  } finally {
    reportLoading.value = false
  }
}

const reportSourceLabel = computed(() => (reportSource.value === 'server' ? 'Server' : 'Local cache'))

const groupedBulkByLocation = computed(() => {
  const buckets = new Map()
  report.value.bulkOnhandByVessel.forEach((row) => {
    const vessel = vesselMap.value.get(row.vessel_id)
    const locName = vessel?.location_name || (vessel?.location_id ? locationMap.value.get(vessel.location_id)?.name : null)
    const key = locName || 'unspecified'
    const label = locName || row.vessel_name || 'Vessel'
    const current = buckets.get(key) || { key, label, quantity: 0 }
    current.quantity += Number(row.quantity) || 0
    buckets.set(key, current)
  })
  return Array.from(buckets.values())
})

onMounted(async () => {
  await loadReference()
  await loadReport()
})

watch([periodStart, periodEnd], () => {
  if (reportLoading.value) return
  loadReport()
})
</script>

<style scoped>
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
