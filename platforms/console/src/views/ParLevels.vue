<template>
  <div class="desktop-container">
    <div v-if="error" class="console-error-banner mb-6">
      <i class="ri-error-warning-line" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-danger-900 dark:text-danger-100 text-sm">Error loading par levels</p>
        <p class="text-xs text-danger-700 dark:text-danger-300 mt-0.5">{{ error }}</p>
      </div>
      <button @click="loadData" class="btn btn-primary text-sm shrink-0">Retry</button>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="card-header flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-3 flex-1 min-w-0">
          <label class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">Scope</label>
          <select
            v-model="scope"
            class="input flex-1 min-w-[240px] max-w-md"
          >
            <option value="">Select scope...</option>
            <option value="GLOBAL">Global (total across all locations)</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div v-if="scope" class="relative">
          <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" aria-hidden="true"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search items..."
            aria-label="Search items by name or category"
            class="input w-56 pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="scope"
            @click="saveParLevels"
            :disabled="saving"
            class="btn btn-primary text-sm"
          >
            {{ saving ? 'Saving...' : 'Save Changes' }}
          </button>
          <router-link
            to="/inventory"
            class="text-sm text-neutral-600 dark:text-stone-400 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <i class="ri-arrow-left-line" aria-hidden="true"></i>
            Back to Inventory
          </router-link>
        </div>
      </div>

      <div v-if="scope" class="p-6 overflow-y-auto max-h-[calc(100vh-320px)]">
        <div v-if="loading" class="py-16 text-center text-neutral-500 dark:text-stone-400 text-sm">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mb-3"></div>
          <p>Loading items...</p>
        </div>
        <div v-else-if="items.length === 0" class="py-16 text-center text-neutral-500 dark:text-stone-400">
          <i class="ri-archive-drawer-line text-4xl text-neutral-300 dark:text-stone-500 mb-3 block" aria-hidden="true"></i>
          <p class="text-sm font-medium mb-1">No items found</p>
          <p class="text-xs text-neutral-500 dark:text-stone-400">Add items in Inventory first</p>
        </div>
        <div v-else-if="filteredItems.length === 0" class="py-16 text-center text-neutral-500 dark:text-stone-400">
          <i class="ri-search-line text-4xl text-neutral-300 dark:text-stone-500 mb-3 block" aria-hidden="true"></i>
          <p class="text-sm font-medium mb-1">No items match your search</p>
          <p class="text-xs text-neutral-500 dark:text-stone-400">Try a different search term</p>
        </div>
        <div v-else class="space-y-2">
          <p v-if="searchQuery.trim()" class="text-xs text-neutral-500 dark:text-stone-400 mb-2">
            Showing {{ filteredItems.length }} of {{ items.length }} items
          </p>
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="flex justify-between items-center py-3.5 px-4 rounded-lg border border-neutral-200 dark:border-stone-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 hover:border-neutral-300 dark:hover:border-stone-600 transition-all group"
          >
            <div class="flex-1 min-w-0">
              <div class="font-semibold text-neutral-900 dark:text-neutral-100 truncate text-sm">{{ item.name }}</div>
              <div class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">{{ item.category || 'Uncategorized' }}</div>
            </div>
            <div class="flex items-center gap-3 ml-6 shrink-0">
              <label class="text-xs text-neutral-500 dark:text-stone-400 whitespace-nowrap font-medium">Min:</label>
              <input
                type="number"
                v-model.number="tempPars[item.id]"
                min="0"
                step="1"
                class="w-28 px-3 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg text-right bg-white dark:bg-stone-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="—"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-else class="px-6 py-16 text-center">
        <i class="ri-bar-chart-grouped-line text-4xl text-neutral-300 dark:text-stone-500 mb-4 block" aria-hidden="true"></i>
        <p class="text-neutral-500 dark:text-stone-400 font-medium mb-1">Select a scope to set par levels</p>
        <p class="text-sm text-neutral-400 dark:text-stone-500">Choose global or a specific location</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { ParLevelRepository } from '../repositories/ParLevelRepository'
import { SyncService } from '../services/SyncService'
import { useSync } from '../composables/useSync'

const scope = ref('')
const searchQuery = ref('')
const locations = ref([])
const items = ref([])
const parLevels = ref([])
const tempPars = ref({})
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const { syncTrigger } = useSync()

const filteredItems = computed(() => {
  if (!searchQuery.value.trim()) return items.value
  const q = searchQuery.value.trim().toLowerCase()
  return items.value.filter(
    item =>
      (item.name || '').toLowerCase().includes(q) ||
      (item.category || '').toLowerCase().includes(q)
  )
})

function getParsForScope() {
  if (!scope.value) return []
  const isGlobal = scope.value === 'GLOBAL'
  return parLevels.value.filter(
    p => isGlobal ? (p.location_id == null || p.location_id === '') : p.location_id === scope.value
  )
}

watch(scope, () => {
  searchQuery.value = ''
  tempPars.value = {}
  const pars = getParsForScope()
  for (const par of pars) {
    tempPars.value[par.item_id] = par.min_qty
  }
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [itemsList, locs, parLevelsList, vessels] = await Promise.all([
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      ParLevelRepository.getAll(),
      VesselRepository.getAll()
    ])
    const tankLocationIds = new Set((vessels || []).filter(v => v.location_id).map(v => v.location_id))
    locations.value = (locs || []).filter(l => !l.deleted_at && !tankLocationIds.has(l.id))
    items.value = (itemsList || []).filter(item => !item.deleted_at)
    parLevels.value = parLevelsList || []
    const pars = getParsForScope()
    const next = {}
    for (const par of pars) {
      next[par.item_id] = par.min_qty
    }
    tempPars.value = next
  } catch (err) {
    console.error('Error loading par levels:', err)
    error.value = err.message || 'Failed to load par levels'
  } finally {
    loading.value = false
  }
}

const saveParLevels = async () => {
  if (!scope.value) return
  saving.value = true
  try {
    const isGlobal = scope.value === 'GLOBAL'
    for (const [itemId, qty] of Object.entries(tempPars.value)) {
      if (qty != null && qty !== '' && !isNaN(Number(qty))) {
        if (isGlobal) {
          await ParLevelRepository.setGlobalParLevel(itemId, Number(qty))
        } else {
          await ParLevelRepository.setParLevel(itemId, scope.value, Number(qty))
        }
      }
    }
    await SyncService.sync()
    await loadData()
  } catch (err) {
    error.value = err.message || 'Failed to save par levels'
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
watch(syncTrigger, loadData)
</script>
