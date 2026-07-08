<template>
  <div class="desktop-container">
    <div v-if="loading" class="card console-empty">
      <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
      <p class="text-neutral-500 dark:text-neutral-400 text-sm">Loading transactions...</p>
    </div>

    <div v-else-if="error" class="console-error-banner mb-6">
      <i class="ri-error-warning-line" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-danger-900 dark:text-danger-100 text-sm">Error loading ledger</p>
        <p class="text-xs text-danger-700 dark:text-danger-300 mt-0.5">{{ error }}</p>
      </div>
      <button type="button" @click="retry" class="btn btn-primary text-sm shrink-0">Retry</button>
    </div>

    <div v-else-if="entries.length === 0" class="card console-empty">
      <i class="ri-book-open-line console-empty-icon" aria-hidden="true"></i>
      <p class="text-neutral-500 dark:text-neutral-400 font-medium mb-2">No transactions</p>
      <p class="text-sm text-neutral-400 dark:text-neutral-500">Transaction history will appear here</p>
    </div>

    <div v-else class="ledger-card card overflow-hidden">
      <div class="card-header flex items-center justify-between flex-shrink-0">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined mb-1">Transaction Ledger</h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ entries.length }} transaction{{ entries.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>
      <div class="ledger-table-wrap">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Location</th>
              <th>Date & Time</th>
              <th>Note</th>
              <th class="text-right">Quantity</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in entries"
              :key="entry.id"
              class="group cursor-pointer"
            >
              <td class="font-semibold text-neutral-900 dark:text-neutral-100">{{ getItemName(entry) }}</td>
              <td>
                <span :class="getTypeClass(entry.type)" class="badge">
                  {{ entry.type.replace('_', ' ') }}
                </span>
              </td>
              <td class="text-neutral-600 dark:text-neutral-400 text-sm">{{ getLocationName(entry) }}</td>
              <td class="text-neutral-500 dark:text-neutral-400 text-sm font-mono">{{ formatDateTime(entry.created_at) }}</td>
              <td class="text-neutral-400 dark:text-neutral-500 text-sm italic max-w-xs truncate" :title="entry.note">
                {{ entry.note || '—' }}
              </td>
              <td class="text-right">
                <span
                  class="font-mono font-bold text-base"
                  :class="entry.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                >
                  {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { db } from '../db'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { BatchRepository } from '../repositories/BatchRepository'
import { useSync } from '../composables/useSync'

const entries = ref([])
const items = ref([])
const locations = ref([])
const batches = ref([])
const allItems = ref([])
const allLocations = ref([])
const loading = ref(true)
const error = ref(null)
const { syncTrigger } = useSync()

const filters = ref({
  type: ''
})

async function load() {
  error.value = null
  loading.value = true
  try {
    items.value = await ItemRepository.getAll()
    locations.value = await LocationRepository.getAll()
    batches.value = await BatchRepository.getAll()

    const { orgId } = await ItemRepository.getContext()
    if (orgId) {
      allItems.value = await db.items.where('org_id').equals(orgId).toArray()
      allLocations.value = await db.locations.where('org_id').equals(orgId).toArray()
    } else {
      allItems.value = await db.items.toArray()
      allLocations.value = await db.locations.toArray()
    }

    await refresh()
  } catch (e) {
    error.value = e?.message || 'Failed to load ledger'
  } finally {
    loading.value = false
  }
}

function retry() {
  load()
}

onMounted(() => {
  load()
})

watch(syncTrigger, () => {
  load()
})

const refresh = async () => {
  const f = {}
  if (filters.value.type) f.type = filters.value.type
  entries.value = await LedgerRepository.getEntries(f)
}

const getItemName = (entry) => {
  const item = items.value.find(i => i.id === entry.item_id)
  if (item) return item.name
  const deletedItem = allItems.value.find(i => i.id === entry.item_id)
  if (deletedItem) return deletedItem.name
  if (entry.item_name) return entry.item_name
  return entry.item_id
}

const getLocationName = (entry) => {
  const loc = locations.value.find(l => l.id === entry.location_id)
  if (loc) return loc.name
  const deletedLoc = allLocations.value.find(l => l.id === entry.location_id)
  if (deletedLoc) return deletedLoc.name
  if (entry.location_name) return entry.location_name
  return entry.location_id
}

const getBatchName = (entry) => {
  const batch = batches.value.find(b => b.id === entry.batch_id)
  if (batch) return batch.name
  if (entry.batch_name) return entry.batch_name
  return entry.batch_id ? 'Batch' : ''
}

const formatDateTime = (iso) => {
  if (!iso) return '-'
  return new Date(iso).toLocaleString()
}

const getTypeClass = (type) => {
  if (!type) return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
  if (type.includes('RECEIVE') || (type.includes('ADJUST') && !type.includes('NEG'))) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (type.includes('CONSUME') || type.includes('NEG')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  if (type.includes('TRANSFER')) return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
  return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
}
</script>

<style scoped>
/* Scrollable table inside this page only; max-height keeps it within viewport */
.ledger-card {
  display: flex;
  flex-direction: column;
}

.ledger-table-wrap {
  max-height: calc(100vh - 16rem);
  overflow: auto;
}

.ledger-table-wrap :deep(.data-table thead th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--bg-secondary);
  box-shadow: 0 1px 0 var(--border-light);
}
</style>
