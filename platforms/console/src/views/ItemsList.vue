<template>
  <div class="desktop-container">
    <div class="console-page-header">
      <div></div>
      <router-link to="/items/add" class="btn btn-primary inline-flex items-center gap-2 shrink-0">
        <i class="ri-add-line" aria-hidden="true"></i>
        Add Item
      </router-link>
    </div>

    <!-- Toolbar: search, sort, view mode -->
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Items</h4>
        <p class="text-xs text-neutral-500 dark:text-stone-400">{{ filteredItems.length }} item{{ filteredItems.length !== 1 ? 's' : '' }}</p>
      </div>
      <div class="console-toolbar-actions flex flex-wrap items-center gap-3">
        <div class="relative max-w-xs flex-1 min-w-[180px]">
          <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" aria-hidden="true"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search items..."
            class="input w-full pl-9 pr-4 py-2 text-sm"
          />
        </div>
        <select v-model="sortBy" class="input py-2 pl-3 pr-8 text-sm min-w-[140px]" aria-label="Sort by">
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="onhand-desc">On hand (high)</option>
          <option value="onhand-asc">On hand (low)</option>
          <option value="value-desc">Value (high)</option>
          <option value="value-asc">Value (low)</option>
          <option value="category">Category</option>
        </select>
        <div class="flex rounded-lg border border-neutral-300 dark:border-stone-600 overflow-hidden" role="group" aria-label="View mode">
          <button
            type="button"
            :class="['px-3 py-2 text-sm font-medium transition-colors', viewMode === 'list' ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600' : 'bg-white dark:bg-stone-800 text-neutral-600 dark:text-stone-400 hover:bg-neutral-50 dark:hover:bg-stone-700 border border-neutral-300 dark:border-stone-600']"
            :aria-pressed="viewMode === 'list'"
            @click="viewMode = 'list'"
          >
            <i class="ri-list-unordered" aria-hidden="true"></i>
          </button>
          <button
            type="button"
            :class="['px-3 py-2 text-sm font-medium transition-colors', viewMode === 'grid' ? 'bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-600' : 'bg-white dark:bg-stone-800 text-neutral-600 dark:text-stone-400 hover:bg-neutral-50 dark:hover:bg-stone-700 border border-neutral-300 dark:border-stone-600']"
            :aria-pressed="viewMode === 'grid'"
            @click="viewMode = 'grid'"
          >
            <i class="ri-layout-grid-line" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- List view (compressed) -->
    <template v-if="viewMode === 'list' && filteredItems.length > 0">
      <div class="card overflow-hidden p-0">
        <div class="overflow-x-auto">
          <table class="data-table items-list-table w-full">
            <thead>
              <tr>
                <th class="text-left">Name</th>
                <th class="text-left">Category</th>
                <th class="text-left">Unit</th>
                <th class="text-right">Cost/unit</th>
                <th class="text-right">On hand</th>
                <th class="text-right">Est. value</th>
                <th class="w-24"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in sortedIngredientItems" :key="'ing-' + item.id" class="item-row">
                <td>
                  <div class="flex items-center gap-2">
                    <div class="item-icon-sm rounded-lg shrink-0" :class="getCategoryIconClass(item.category)">
                      <i class="ri-box-3-line" aria-hidden="true"></i>
                    </div>
                    <span class="font-medium text-neutral-900 dark:text-stone-100">{{ item.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getCategoryClass(item.category)">{{ item.category || 'Uncategorized' }}</span>
                </td>
                <td class="text-neutral-600 dark:text-stone-400 text-sm">{{ item.unit || 'unit' }}</td>
                <td class="text-right font-medium">{{ formatCostPerUnit(item) }}</td>
                <td class="text-right font-medium">{{ getOnhand(item.id).toFixed(2) }} {{ item.unit || '' }}</td>
                <td class="text-right font-medium">{{ formatValue(item, getOnhand(item.id)) }}</td>
                <td>
                  <router-link :to="`/items/${item.id}/edit`" class="btn btn-secondary btn-sm py-1.5 px-2 text-xs">Edit</router-link>
                </td>
              </tr>
              <tr v-for="item in sortedBeerItems" :key="'beer-' + item.id" class="item-row">
                <td>
                  <div class="flex items-center gap-2">
                    <div class="item-icon-sm rounded-lg shrink-0 item-icon-beer">
                      <i class="ri-beer-line" aria-hidden="true"></i>
                    </div>
                    <span class="font-medium text-neutral-900 dark:text-stone-100">{{ item.name }}</span>
                  </div>
                </td>
                <td>
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium" :class="getCategoryClass(item.category)">{{ item.category || 'Finished Beer' }}</span>
                </td>
                <td class="text-neutral-600 dark:text-stone-400 text-sm">{{ item.unit || 'unit' }}</td>
                <td class="text-right font-medium">{{ formatCostPerUnit(item) }}</td>
                <td class="text-right font-medium">{{ getOnhand(item.id).toFixed(2) }} {{ item.unit || '' }}</td>
                <td class="text-right font-medium">{{ formatValue(item, getOnhand(item.id)) }}</td>
                <td>
                  <router-link :to="`/items/${item.id}/edit`" class="btn btn-secondary btn-sm py-1.5 px-2 text-xs">Edit</router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- Grid view (expanded cards) -->
    <template v-else-if="viewMode === 'grid'">
      <!-- Ingredients (cards) -->
      <div v-if="sortedIngredientItems.length > 0" class="space-y-3 mb-6">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Ingredients</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="item in sortedIngredientItems" :key="item.id" class="card item-card" :class="'item-card-category-' + categorySlug(item.category)">
            <div class="item-card-header">
              <div class="flex items-center gap-2">
                <div class="item-icon rounded-lg" :class="getCategoryIconClass(item.category)">
                  <i class="ri-box-3-line" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-neutral-900 dark:text-stone-100 truncate">{{ item.name }}</p>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="getCategoryClass(item.category)">{{ item.category || 'Ingredient' }}</span>
                </div>
              </div>
              <span class="meta-pill text-xs">
                <i class="ri-price-tag-3-line" aria-hidden="true"></i>
                {{ item.unit || 'unit' }}
              </span>
            </div>
            <div class="item-card-body">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Cost/unit</p>
                  <p class="font-semibold text-neutral-900 dark:text-stone-100">{{ formatCostPerUnit(item) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">On hand</p>
                  <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ getOnhand(item.id).toFixed(2) }} {{ item.unit || '' }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Est. value</p>
                  <p class="font-semibold text-neutral-900 dark:text-stone-100">{{ formatValue(item, getOnhand(item.id)) }}</p>
                </div>
              </div>
              <router-link :to="`/items/${item.id}/edit`" class="btn btn-secondary w-full justify-center mt-4">
                Edit item
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Finished Beer (cards) -->
      <div v-if="sortedBeerItems.length > 0" class="space-y-3">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Finished Beer</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div v-for="item in sortedBeerItems" :key="item.id" class="card item-card item-card-beer item-card-category-finished-beer">
            <div class="item-card-header">
              <div class="flex items-center gap-2">
                <div class="item-icon beer rounded-lg">
                  <i class="ri-beer-line" aria-hidden="true"></i>
                </div>
                <div class="min-w-0">
                  <p class="font-semibold text-neutral-900 dark:text-stone-100 truncate">{{ item.name }}</p>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" :class="getCategoryClass('Finished Beer')">{{ item.category || 'Finished Beer' }}</span>
                </div>
              </div>
              <span class="meta-pill text-xs">
                <i class="ri-price-tag-3-line" aria-hidden="true"></i>
                {{ item.unit || 'unit' }}
              </span>
            </div>
            <div class="item-card-body">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Cost/unit</p>
                  <p class="font-semibold text-neutral-900 dark:text-stone-100">{{ formatCostPerUnit(item) }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">On hand</p>
                  <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ getOnhand(item.id).toFixed(2) }} {{ item.unit || '' }}</p>
                </div>
                <div>
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Est. value</p>
                  <p class="font-semibold text-neutral-900 dark:text-stone-100">{{ formatValue(item, getOnhand(item.id)) }}</p>
                </div>
              </div>
              <router-link :to="`/items/${item.id}/edit`" class="btn btn-secondary w-full justify-center mt-4">
                Edit item
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="filteredItems.length === 0" class="card console-empty">
      <i class="ri-price-tag-3-line console-empty-icon" aria-hidden="true"></i>
      <p class="text-neutral-500 dark:text-stone-400 mb-4">No items found.</p>
      <router-link to="/items/add" class="btn btn-primary inline-flex items-center gap-2">
        <i class="ri-add-line" aria-hidden="true"></i>
        Add your first item
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ItemRepository } from '../repositories/ItemRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { useSync } from '../composables/useSync'

const items = ref([])
const search = ref('')
const sortBy = ref('name-asc')
const viewMode = ref('list') // 'list' | 'grid'
const onhandMap = ref(new Map())
const { syncTrigger } = useSync()

const beerCategoryName = 'Finished Beer'
const ingredientItems = computed(() => items.value.filter(i => i.category !== beerCategoryName))
const beerItems = computed(() => items.value.filter(i => i.category === beerCategoryName))

const filteredItems = computed(() => {
  if (!search.value.trim()) return items.value
  const term = search.value.toLowerCase()
  return items.value.filter(i =>
    (i.name && i.name.toLowerCase().includes(term)) ||
    (i.category && i.category.toLowerCase().includes(term))
  )
})
const filteredIngredientItems = computed(() => {
  if (!search.value.trim()) return ingredientItems.value
  const term = search.value.toLowerCase()
  return ingredientItems.value.filter(i =>
    (i.name && i.name.toLowerCase().includes(term)) ||
    (i.category && i.category.toLowerCase().includes(term))
  )
})
const filteredBeerItems = computed(() => {
  if (!search.value.trim()) return beerItems.value
  const term = search.value.toLowerCase()
  return beerItems.value.filter(i =>
    (i.name && i.name.toLowerCase().includes(term)) ||
    (i.category && i.category.toLowerCase().includes(term))
  )
})

function sortItems (list) {
  const dir = sortBy.value.endsWith('-asc') ? 1 : -1
  const key = sortBy.value.replace(/-asc|-desc$/, '')
  return [...list].sort((a, b) => {
    if (key === 'name') {
      const na = (a.name || '').toLowerCase()
      const nb = (b.name || '').toLowerCase()
      return dir * (na < nb ? -1 : na > nb ? 1 : 0)
    }
    if (key === 'category') {
      const ca = (a.category || '').toLowerCase()
      const cb = (b.category || '').toLowerCase()
      return ca < cb ? -1 : ca > cb ? 1 : 0
    }
    if (key === 'onhand') {
      const oa = getOnhand(a.id)
      const ob = getOnhand(b.id)
      return dir * (oa - ob)
    }
    if (key === 'value') {
      const va = (a.default_unit_cost ?? 0) * getOnhand(a.id)
      const vb = (b.default_unit_cost ?? 0) * getOnhand(b.id)
      return dir * (va - vb)
    }
    return 0
  })
}

const sortedIngredientItems = computed(() => sortItems(filteredIngredientItems.value))
const sortedBeerItems = computed(() => sortItems(filteredBeerItems.value))

const loadData = async () => {
  const [allItems, onhand] = await Promise.all([
    ItemRepository.getAll(),
    LedgerRepository.getAllOnhand()
  ])
  items.value = allItems
  const map = new Map()
  onhand.forEach(entry => {
    const current = map.get(entry.item_id) || 0
    map.set(entry.item_id, current + entry.quantity)
  })
  onhandMap.value = map
}

const getOnhand = (itemId) => onhandMap.value.get(itemId) || 0

const formatValue = (item, qty) => {
  const cost = item.default_unit_cost
  if (cost == null || Number.isNaN(cost)) return '—'
  return `$${(cost * qty).toFixed(2)}`
}

const formatCostPerUnit = (item) => {
  const cost = item.default_unit_cost
  if (cost == null || Number.isNaN(cost)) return '—'
  return `$${Number(cost).toFixed(2)}`
}

/** Pill/badge text + background by category (aligns with Inventory.vue) */
const getCategoryClass = (category) => {
  const classes = {
    'Finished Beer': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Hops': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    'Grains': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    'Yeast': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
    'Chemicals': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    'Packaging': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    'Clarifiers': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
    'Other': 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300'
  }
  return classes[category] || 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300'
}

/** Icon container background by category for color-coding */
const getCategoryIconClass = (category) => {
  const classes = {
    'Finished Beer': 'item-icon-beer',
    'Hops': 'item-icon-hops',
    'Grains': 'item-icon-grains',
    'Yeast': 'item-icon-yeast',
    'Chemicals': 'item-icon-chemicals',
    'Packaging': 'item-icon-packaging',
    'Clarifiers': 'item-icon-clarifiers',
    'Other': ''
  }
  return classes[category] || 'item-icon-default'
}

const categorySlug = (category) => (category || 'other').toLowerCase().replace(/\s+/g, '-')

onMounted(loadData)
watch(syncTrigger, loadData)
</script>

<style scoped>
/* List view table */
.items-list-table th {
  white-space: nowrap;
}
.items-list-table td {
  vertical-align: middle;
}
.item-row:hover {
  background: var(--neutral-50);
}
.dark .item-row:hover {
  background: var(--bg-secondary);
}

.item-icon-sm {
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  background: var(--neutral-100);
  color: var(--primary-600);
}
.dark .item-icon-sm {
  background: var(--neutral-800);
  color: var(--primary-300);
}

/* Item cards */
.item-card {
  display: flex;
  flex-direction: column;
  border-left: 4px solid var(--neutral-200);
}
.dark .item-card {
  border-left-color: var(--neutral-700);
}

.item-card-category-finished-beer { border-left-color: var(--amber-500); }
.item-card-category-hops { border-left-color: #9333ea; }
.item-card-category-grains { border-left-color: var(--amber-600); }
.item-card-category-yeast { border-left-color: #78716c; }
.item-card-category-chemicals { border-left-color: #dc2626; }
.item-card-category-packaging { border-left-color: #16a34a; }
.item-card-category-clarifiers { border-left-color: #4f46e5; }
.item-card-category-other { border-left-color: var(--neutral-400); }

.item-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1rem 0.5rem 1rem;
}

.item-card-body {
  padding: 0 1rem 1rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.item-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  background: var(--neutral-100);
  color: var(--primary-600);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
}

.item-icon.item-icon-beer,
.item-icon.beer {
  background: var(--amber-100, #fef3c7);
  color: var(--amber-700, #b45309);
}
.item-icon.item-icon-hops { background: #f3e8ff; color: #6b21a8; }
.item-icon.item-icon-grains { background: #fef3c7; color: #b45309; }
.item-icon.item-icon-yeast { background: #dbeafe; color: #1d4ed8; }
.item-icon.item-icon-chemicals { background: #fee2e2; color: #b91c1c; }
.item-icon.item-icon-packaging { background: #dcfce7; color: #15803d; }
.item-icon.item-icon-clarifiers { background: #e0e7ff; color: #3730a3; }
.item-icon.item-icon-default {
  background: var(--neutral-100);
  color: var(--text-secondary);
}

.dark .item-icon {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}
.dark .item-icon.item-icon-beer,
.dark .item-icon.beer {
  background: rgba(180, 83, 9, 0.18);
  color: #f8af47;
}
.dark .item-icon.item-icon-hops { background: rgba(107, 33, 168, 0.25); color: #c084fc; }
.dark .item-icon.item-icon-grains { background: rgba(180, 83, 9, 0.2); color: #fcd34d; }
.dark .item-icon.item-icon-yeast { background: rgba(120, 113, 108, 0.25); color: #a8a29e; }
.dark .item-icon.item-icon-chemicals { background: rgba(185, 28, 28, 0.25); color: #fca5a5; }
.dark .item-icon.item-icon-packaging { background: rgba(21, 128, 61, 0.25); color: #86efac; }
.dark .item-icon.item-icon-clarifiers { background: rgba(55, 48, 163, 0.25); color: #a5b4fc; }
.dark .item-icon.item-icon-default {
  background: var(--bg-elevated);
  color: var(--text-tertiary);
}

/* Small icon in list view */
.item-icon-sm.item-icon-beer { background: var(--amber-100); color: var(--amber-700); }
.item-icon-sm.item-icon-hops { background: #f3e8ff; color: #6b21a8; }
.item-icon-sm.item-icon-grains { background: #fef3c7; color: #b45309; }
.item-icon-sm.item-icon-yeast { background: #dbeafe; color: #1d4ed8; }
.item-icon-sm.item-icon-chemicals { background: #fee2e2; color: #b91c1c; }
.item-icon-sm.item-icon-packaging { background: #dcfce7; color: #15803d; }
.item-icon-sm.item-icon-clarifiers { background: #e0e7ff; color: #3730a3; }
.dark .item-icon-sm.item-icon-beer { background: rgba(180, 83, 9, 0.18); color: #f8af47; }
.dark .item-icon-sm.item-icon-hops { background: rgba(107, 33, 168, 0.25); color: #c084fc; }
.dark .item-icon-sm.item-icon-grains { background: rgba(180, 83, 9, 0.2); color: #fcd34d; }
.dark .item-icon-sm.item-icon-yeast { background: rgba(120, 113, 108, 0.25); color: #a8a29e; }
.dark .item-icon-sm.item-icon-chemicals { background: rgba(185, 28, 28, 0.25); color: #fca5a5; }
.dark .item-icon-sm.item-icon-packaging { background: rgba(21, 128, 61, 0.25); color: #86efac; }
.dark .item-icon-sm.item-icon-clarifiers { background: rgba(55, 48, 163, 0.25); color: #a5b4fc; }
</style>
