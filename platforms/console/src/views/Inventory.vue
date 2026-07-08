<template>
  <div class="desktop-container">
    <!-- Error Display -->
    <div v-if="error" class="console-error-banner mb-6">
      <i class="ri-error-warning-line" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-danger-900 dark:text-danger-100 text-sm">Error loading inventory</p>
        <p class="text-xs text-danger-700 dark:text-danger-300 mt-0.5">{{ error }}</p>
      </div>
      <button @click="loadData" class="btn btn-primary text-sm shrink-0">Retry</button>
    </div>

    <!-- Inventory Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-primary">
            <i class="ri-archive-drawer-line" aria-hidden="true"></i>
          </div>
          <span class="text-[10px] font-semibold text-neutral-500 dark:text-stone-400 uppercase tracking-wider">Total</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-0.5 heading-refined">{{ totalItems }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400">Total Items</p>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-warning">
            <i class="ri-error-warning-line" aria-hidden="true"></i>
          </div>
          <span class="text-[10px] font-semibold text-neutral-500 dark:text-stone-400 uppercase tracking-wider">Alert</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-0.5 heading-refined">{{ lowStockCount }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400">Low Stock</p>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-neutral">
            <i class="ri-map-pin-line" aria-hidden="true"></i>
          </div>
          <span class="text-[10px] font-semibold text-neutral-500 dark:text-stone-400 uppercase tracking-wider">Total</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-0.5 heading-refined">{{ totalLocations }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400">Locations</p>
      </div>
    </div>

    <!-- Inventory Table -->
    <div class="card overflow-hidden mb-8">
      <div class="card-header flex items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Inventory Items</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Click any column header to sort.</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative">
            <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" aria-hidden="true"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search items..."
              class="input w-64 pl-9 pr-4 py-2 text-sm"
            />
          </div>
          <router-link to="/par-levels" class="btn btn-primary text-sm inline-flex items-center gap-2">
            <i class="ri-bar-chart-grouped-line" aria-hidden="true"></i>
            Par Levels
          </router-link>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th class="w-10"></th>
              <th class="w-12">ID</th>
              <th>
                <button type="button" @click="setSort('name')" class="sortable-th">
                  Item Name
                  <span v-if="sortKey === 'name'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('type_class')" class="sortable-th">
                  Type
                  <span v-if="sortKey === 'type_class'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('category')" class="sortable-th">
                  Category
                  <span v-if="sortKey === 'category'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('vendor')" class="sortable-th">
                  Vendor
                  <span v-if="sortKey === 'vendor'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('totalOnhand')" class="sortable-th">
                  Current Stock
                  <span v-if="sortKey === 'totalOnhand'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('minQty')" class="sortable-th">
                  Min Stock
                  <span v-if="sortKey === 'minQty'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('unit')" class="sortable-th">
                  Unit
                  <span v-if="sortKey === 'unit'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('default_unit_cost')" class="sortable-th">
                  Price
                  <span v-if="sortKey === 'default_unit_cost'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('locationsCount')" class="sortable-th">
                  Locations
                  <span v-if="sortKey === 'locationsCount'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
              <th>
                <button type="button" @click="setSort('status')" class="sortable-th">
                  Status
                  <span v-if="sortKey === 'status'" class="sort-icon">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="text-center py-6 text-neutral-500 dark:text-stone-400">Loading...</td>
            </tr>
            <tr v-else-if="sortedFilteredItems.length === 0">
              <td colspan="12" class="text-center py-6 text-neutral-500 dark:text-stone-400">No items found</td>
            </tr>
            <template v-else v-for="item in sortedFilteredItems" :key="item.id">
              <tr
                class="border-b border-neutral-200 dark:border-stone-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                :class="{ 'bg-neutral-50/50 dark:bg-stone-800/30': expandedItems.has(item.id) }"
              >
                <td class="w-10">
                  <button
                    v-if="item.locations.length > 0 || item.globalPar"
                    type="button"
                    @click="toggleExpanded(item.id)"
                    class="p-1 rounded text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-stone-700"
                    :aria-expanded="expandedItems.has(item.id)"
                  >
                    <span v-if="expandedItems.has(item.id)">▼</span>
                    <span v-else>▶</span>
                  </button>
                  <span v-else class="inline-block w-6"></span>
                </td>
                <td class="font-mono text-sm text-neutral-500 dark:text-stone-400">{{ item.id.substring(0, 8) }}...</td>
                <td class="font-medium text-neutral-900 dark:text-stone-100">
                  <div class="flex items-center gap-2">
                    {{ item.name }}
                    <span v-if="item.template_id" class="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">Template</span>
                  </div>
                </td>
                <td>
                  <span v-if="item.type_class" class="px-2 py-1 rounded text-xs font-medium bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300">
                    {{ item.type_class }}
                  </span>
                  <span v-else class="text-neutral-400">-</span>
                </td>
                <td>
                  <span class="px-3 py-1 rounded-full text-sm font-medium" :class="getCategoryClass(item.category)">
                    {{ item.category || 'Uncategorized' }}
                  </span>
                </td>
                <td class="text-neutral-600 dark:text-stone-400">{{ item.vendor || '-' }}</td>
                <td class="font-medium">
                  <span v-if="item.interval && item.unit">
                    {{ formatQuantityWithInterval(item.totalOnhand, item.interval, item.unit) }}
                  </span>
                  <span v-else>{{ item.totalOnhand }}</span>
                </td>
                <td class="text-neutral-600 dark:text-stone-400">{{ item.minQty != null ? item.minQty : '-' }}</td>
                <td class="text-neutral-600 dark:text-stone-400">
                  <span v-if="item.interval && item.unit">
                    {{ item.unit }} ({{ item.interval }}/unit)
                  </span>
                  <span v-else>{{ item.unit || '-' }}</span>
                </td>
                <td class="text-neutral-600 dark:text-stone-400">{{ typeof item.default_unit_cost === 'number' ? `$${item.default_unit_cost.toFixed(2)}` : '-' }}</td>
                <td class="text-neutral-600 dark:text-stone-400">
                  <span v-if="item.locations.length === 0 && !item.globalPar">—</span>
                  <span v-else>
                    {{ item.locations.length }} location{{ item.locations.length !== 1 ? 's' : '' }}
                    <span v-if="item.globalPar" class="text-xs text-neutral-500 dark:text-stone-400">+ global</span>
                  </span>
                </td>
                <td>
                  <span class="px-3 py-1 rounded-full text-sm font-medium" :class="getStatusClass(item.status)">
                    {{ item.status }}
                  </span>
                </td>
              </tr>
              <!-- Expanded row: locations + global par -->
              <tr v-if="expandedItems.has(item.id)" class="bg-neutral-50 dark:bg-stone-800/50 border-b border-neutral-200 dark:border-stone-700">
                <td colspan="12" class="p-0">
                  <div class="px-6 py-4 pl-14">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <!-- Global par -->
                      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-stone-700 p-4">
                        <h4 class="text-sm font-semibold text-neutral-700 dark:text-stone-300 mb-2">Global par level</h4>
                        <div v-if="item.globalPar">
                          <p class="text-sm text-neutral-600 dark:text-stone-400">
                            Total on-hand: <strong>{{ item.interval && item.unit ? formatQuantityWithInterval(item.globalPar.totalOnhand, item.interval, item.unit) : item.globalPar.totalOnhand }}</strong>
                            · Min: <strong>{{ item.globalPar.minQty }}</strong>
                          </p>
                          <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(item.globalPar.status)">
                            {{ item.globalPar.status }}
                          </span>
                        </div>
                        <p v-else class="text-sm text-neutral-500 dark:text-stone-400">No global par set</p>
                      </div>
                      <!-- Per-location table -->
                      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-stone-700 overflow-hidden">
                        <h4 class="text-sm font-semibold text-neutral-700 dark:text-stone-300 px-4 py-2 border-b border-neutral-200 dark:border-stone-700">By location</h4>
                        <div v-if="item.locations.length > 0" class="overflow-x-auto">
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="border-b border-neutral-200 dark:border-stone-700">
                                <th class="text-left py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Location</th>
                                <th class="text-right py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Qty</th>
                                <th class="text-right py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Par (min)</th>
                                <th class="text-left py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="loc in item.locations"
                                :key="loc.locationId"
                                class="border-b border-neutral-100 dark:border-stone-700/50 last:border-0"
                              >
                                <td class="py-2 px-4 text-neutral-900 dark:text-stone-100">{{ loc.locationName }}</td>
                                <td class="py-2 px-4 text-right font-mono">
                                  {{ item.interval && item.unit ? formatQuantityWithInterval(loc.quantity, item.interval, item.unit) : loc.quantity }}
                                </td>
                                <td class="py-2 px-4 text-right text-neutral-600 dark:text-stone-400">{{ loc.parMin != null ? loc.parMin : '—' }}</td>
                                <td class="py-2 px-4">
                                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(loc.status)">
                                    {{ loc.status }}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p v-else class="px-4 py-3 text-sm text-neutral-500 dark:text-stone-400">No locations with stock or par levels</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="px-6 py-4 border-t border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/50 flex items-center justify-between">
        <p class="text-sm text-neutral-600 dark:text-stone-400 font-medium">Showing <span class="font-semibold text-neutral-900 dark:text-stone-100">{{ sortedFilteredItems.length }}</span> ingredient items</p>
      </div>
    </div>

    <!-- Finished Beer (separate section; not in main ingredients table) -->
    <div v-if="filteredBeerItems.length > 0" class="card overflow-hidden mt-6">
      <div class="card-header">
        <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Finished Beer</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th class="w-10"></th>
              <th>Item Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Unit</th>
              <th>Locations</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="item in filteredBeerItems" :key="item.id">
              <tr
                class="border-b border-neutral-200 dark:border-stone-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                :class="{ 'bg-neutral-50/50 dark:bg-stone-800/30': expandedItems.has(item.id) }"
              >
                <td class="w-10">
                  <button
                    v-if="(item.locations?.length || 0) > 0 || item.globalPar"
                    type="button"
                    @click="toggleExpanded(item.id)"
                    class="p-1 rounded text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-stone-700"
                    :aria-expanded="expandedItems.has(item.id)"
                  >
                    <span v-if="expandedItems.has(item.id)">▼</span>
                    <span v-else>▶</span>
                  </button>
                  <span v-else class="inline-block w-6"></span>
                </td>
                <td class="font-medium text-neutral-900 dark:text-stone-100">{{ item.name }}</td>
                <td><span class="px-3 py-1 rounded-full text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200">{{ item.category || 'Uncategorized' }}</span></td>
                <td>{{ item.interval && item.unit ? formatQuantityWithInterval(item.totalOnhand, item.interval, item.unit) : item.totalOnhand }}</td>
                <td class="text-neutral-600 dark:text-stone-400">{{ item.unit || '-' }}</td>
                <td class="text-neutral-600 dark:text-stone-400">
                  <span v-if="(item.locations?.length || 0) === 0 && !item.globalPar">—</span>
                  <span v-else>
                    {{ item.locations?.length || 0 }} location{{ (item.locations?.length || 0) !== 1 ? 's' : '' }}
                    <span v-if="item.globalPar" class="text-xs text-neutral-500 dark:text-stone-400">+ global</span>
                  </span>
                </td>
              </tr>
              <!-- Expanded row: stock by location (same as ingredients) -->
              <tr v-if="expandedItems.has(item.id)" class="bg-neutral-50 dark:bg-stone-800/50 border-b border-neutral-200 dark:border-stone-700">
                <td colspan="6" class="p-0">
                  <div class="px-6 py-4 pl-14">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <!-- Global par -->
                      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-stone-700 p-4">
                        <h4 class="text-sm font-semibold text-neutral-700 dark:text-stone-300 mb-2">Global par level</h4>
                        <div v-if="item.globalPar">
                          <p class="text-sm text-neutral-600 dark:text-stone-400">
                            Total on-hand: <strong>{{ item.interval && item.unit ? formatQuantityWithInterval(item.globalPar.totalOnhand, item.interval, item.unit) : item.globalPar.totalOnhand }}</strong>
                            · Min: <strong>{{ item.globalPar.minQty }}</strong>
                          </p>
                          <span class="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(item.globalPar.status)">
                            {{ item.globalPar.status }}
                          </span>
                        </div>
                        <p v-else class="text-sm text-neutral-500 dark:text-stone-400">No global par set</p>
                      </div>
                      <!-- Per-location table -->
                      <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-stone-700 overflow-hidden">
                        <h4 class="text-sm font-semibold text-neutral-700 dark:text-stone-300 px-4 py-2 border-b border-neutral-200 dark:border-stone-700">By location</h4>
                        <div v-if="(item.locations?.length || 0) > 0" class="overflow-x-auto">
                          <table class="w-full text-sm">
                            <thead>
                              <tr class="border-b border-neutral-200 dark:border-stone-700">
                                <th class="text-left py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Location</th>
                                <th class="text-right py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Qty</th>
                                <th class="text-right py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Par (min)</th>
                                <th class="text-left py-2 px-4 font-medium text-neutral-600 dark:text-stone-400">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="loc in item.locations"
                                :key="loc.locationId"
                                class="border-b border-neutral-100 dark:border-stone-700/50 last:border-0"
                              >
                                <td class="py-2 px-4 text-neutral-900 dark:text-stone-100">{{ loc.locationName }}</td>
                                <td class="py-2 px-4 text-right font-mono">
                                  {{ item.interval && item.unit ? formatQuantityWithInterval(loc.quantity, item.interval, item.unit) : loc.quantity }}
                                </td>
                                <td class="py-2 px-4 text-right text-neutral-600 dark:text-stone-400">{{ loc.parMin != null ? loc.parMin : '—' }}</td>
                                <td class="py-2 px-4">
                                  <span class="px-2 py-0.5 rounded text-xs font-medium" :class="getStatusClass(loc.status)">
                                    {{ loc.status }}
                                  </span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p v-else class="px-4 py-3 text-sm text-neutral-500 dark:text-stone-400">No locations with stock or par levels</p>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ParLevelRepository } from '../repositories/ParLevelRepository'
import { useSync } from '../composables/useSync'
import { formatQuantityWithInterval } from '../utils/quantityFormat'

const loading = ref(true)
const showParModal = ref(false)
const parModalScope = ref('')
const parModalTempPars = ref({})
const locations = ref([])
const inventoryItems = ref([])
const searchQuery = ref('')
const totalItems = ref(0)
const totalLocations = ref(0)
const lowStockCount = ref(0)
const error = ref(null)
const expandedItems = ref(new Set())
const sortKey = ref('status')
const sortDirection = ref('asc')
const { syncTrigger } = useSync()

function toggleExpanded(itemId) {
  const next = new Set(expandedItems.value)
  if (next.has(itemId)) next.delete(itemId)
  else next.add(itemId)
  expandedItems.value = next
}

function setSort(key) {
  if (sortKey.value === key) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDirection.value = 'asc'
  }
}

const BEER_CATEGORY_NAME = 'Finished Beer'
const filteredItems = computed(() => {
  if (!searchQuery.value) return inventoryItems.value
  const query = searchQuery.value.toLowerCase()
  return inventoryItems.value.filter(item => 
    item.name.toLowerCase().includes(query) ||
    (item.category && item.category.toLowerCase().includes(query)) ||
    (item.type_class && item.type_class.toLowerCase().includes(query)) ||
    (item.vendor && item.vendor.toLowerCase().includes(query)) ||
    (item.locationName && item.locationName.toLowerCase().includes(query))
  )
})
// Ingredients only (main table); beers in separate section below
const filteredIngredientItems = computed(() =>
  filteredItems.value.filter(item => item.category !== BEER_CATEGORY_NAME)
)
const filteredBeerItems = computed(() =>
  filteredItems.value.filter(item => item.category === BEER_CATEGORY_NAME)
)

const STATUS_ORDER = { 'Low Stock': 0, 'In Stock': 1, 'Out of Stock': 2 }

const sortedFilteredItems = computed(() => {
  const items = [...filteredIngredientItems.value]
  const key = sortKey.value
  const dir = sortDirection.value === 'asc' ? 1 : -1

  items.sort((a, b) => {
    let va = a[key]
    let vb = b[key]

    if (key === 'status') {
      va = STATUS_ORDER[va] ?? 2
      vb = STATUS_ORDER[vb] ?? 2
      return (va - vb) * dir
    }
    if (key === 'locationsCount') {
      va = a.locations?.length ?? 0
      vb = b.locations?.length ?? 0
      return (va - vb) * dir
    }
    if (key === 'totalOnhand' || key === 'minQty' || key === 'default_unit_cost') {
      va = Number(va) ?? 0
      vb = Number(vb) ?? 0
      if (va < vb) return -1 * dir
      if (va > vb) return 1 * dir
      return 0
    }
    va = (va ?? '').toString().toLowerCase()
    vb = (vb ?? '').toString().toLowerCase()
    return va.localeCompare(vb) * dir
  })

  return items
})

const loadData = async () => {
  loading.value = true
  error.value = null
  try {
    const [items, locs, allOnhand, parLevels] = await Promise.all([
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      LedgerRepository.getAllOnhand(),
      ParLevelRepository.getAll()
    ])

    locations.value = locs
    totalItems.value = items.length
    totalLocations.value = locs.length

    const locationMap = new Map(locs.map(l => [l.id, l.name]))
    const parLevelMap = new Map()
    
    // Build par level map (individual + global)
    parLevels.forEach(par => {
      const isGlobal = par.location_id == null || par.location_id === ''
      const key = isGlobal ? `${par.item_id}-global` : `${par.item_id}-${par.location_id}`
      if (!parLevelMap.has(key) || par.min_qty > 0) {
        parLevelMap.set(key, { ...par, isGlobal })
      }
    })

    let lowStock = 0

    inventoryItems.value = items
      .filter(item => !item.deleted_at)
      .map(item => {
        const onhandEntries = allOnhand.filter(o => o.item_id === item.id)
        const totalQty = onhandEntries.reduce((sum, e) => sum + e.quantity, 0)
        const mainLocation = onhandEntries.find(e => e.quantity > 0)
        const locationId = mainLocation ? mainLocation.location_id : null
        const location = locationId ? locationMap.get(locationId) : null

        let minQty = null
        let isLowStock = false

        const globalParRow = parLevelMap.get(`${item.id}-global`)
        let globalPar = null
        if (globalParRow && globalParRow.min_qty != null) {
          const gStatus = totalQty < globalParRow.min_qty ? 'Low Stock' : 'In Stock'
          if (gStatus === 'Low Stock') isLowStock = true
          globalPar = { minQty: globalParRow.min_qty, totalOnhand: totalQty, status: gStatus }
          minQty = minQty == null ? globalParRow.min_qty : Math.min(minQty, globalParRow.min_qty)
        }

        const itemPars = parLevels.filter(p => p.item_id === item.id && (p.location_id != null && p.location_id !== ''))
        const locationIdsWithPar = new Set(itemPars.map(p => p.location_id))
        const locationIdsWithQty = new Set(onhandEntries.filter(e => e.quantity > 0).map(e => e.location_id))
        const allLocationIds = new Set([...locationIdsWithPar, ...locationIdsWithQty])

        const locationsList = []
        for (const locId of allLocationIds) {
          const locName = locationMap.get(locId) || locId
          const qty = onhandEntries.find(e => e.location_id === locId)?.quantity ?? 0
          const par = itemPars.find(p => p.location_id === locId)
          const parMin = par ? par.min_qty : null
          let locStatus = 'No par'
          if (parMin != null) {
            locStatus = qty < parMin ? 'Low Stock' : 'In Stock'
            if (locStatus === 'Low Stock') isLowStock = true
            minQty = minQty == null ? parMin : Math.min(minQty, parMin)
          }
          locationsList.push({
            locationId: locId,
            locationName: locName,
            quantity: qty,
            parMin: parMin,
            status: locStatus
          })
        }
        locationsList.sort((a, b) => a.locationName.localeCompare(b.locationName))

        if (isLowStock) lowStock++

        return {
          ...item,
          totalOnhand: totalQty,
          locationName: location || null,
          minQty: minQty,
          status: isLowStock ? 'Low Stock' : totalQty > 0 ? 'In Stock' : 'Out of Stock',
          locations: locationsList,
          globalPar
        }
      })
      .sort((a, b) => {
        // Sort by status: Low Stock first, then by quantity
        if (a.status === 'Low Stock' && b.status !== 'Low Stock') return -1
        if (a.status !== 'Low Stock' && b.status === 'Low Stock') return 1
        return b.totalOnhand - a.totalOnhand
      })

    lowStockCount.value = lowStock

  } catch (err) {
    console.error('Error loading inventory:', err)
    error.value = err.message || 'Failed to load inventory data'
  } finally {
    loading.value = false
  }
}

const getCategoryClass = (category) => {
  const classes = {
    'Hops': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'Grains': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Yeast': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
    'Chemicals': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'Packaging': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'Clarifiers': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return classes[category] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-stone-300'
}

const getStatusClass = (status) => {
  const classes = {
    'In Stock': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    'Low Stock': 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
    'Out of Stock': 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
  }
  return classes[status] || 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300'
}

onMounted(loadData)

watch(syncTrigger, () => {
  loadData()
})
</script>

<style scoped>
/* Custom table styles */
.data-table th {
  white-space: nowrap;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
}

.dark .data-table th {
  color: var(--text-secondary);
  background-color: var(--bg-secondary);
}

.data-table td {
  vertical-align: middle;
  padding: 12px;
}

.sortable-th {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 0;
  text-align: left;
  font-weight: 600;
  color: var(--neutral-700);
  background: none;
  border: none;
  cursor: pointer;
  white-space: nowrap;
}

.dark .sortable-th {
  color: var(--neutral-300);
}

.sortable-th:hover {
  color: var(--neutral-900);
}

.dark .sortable-th:hover {
  color: var(--neutral-100);
}

.sort-icon {
  font-size: 0.75rem;
  opacity: 0.9;
}

/* Hover effects */
.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
