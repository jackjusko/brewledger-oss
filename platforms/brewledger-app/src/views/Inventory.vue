<template>
  <div>
    <!-- Header -->
    <div class="mb-3">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50 mb-0.5">Inventory</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Stock levels across locations</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button
            @click="toggleViewPreference"
            class="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-md font-bold text-sm hover:bg-gray-200 flex items-center gap-1"
          >
            <span v-if="isCompressed">📖</span>
            <span v-else>📋</span>
            <span>{{ isCompressed ? 'Detailed' : 'Compressed' }}</span>
          </button>
          <router-link to="/reorder" class="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700 rounded-md font-bold text-sm hover:bg-yellow-100">
            Reorder
          </router-link>
          <router-link to="/beers" class="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-md font-bold text-sm hover:bg-purple-200">
            Beers
          </router-link>
          <router-link to="/items" class="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm">
            Items
          </router-link>
        </div>
      </div>

      <!-- Search -->
      <div class="mb-2">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 dark:text-gray-500">
            <span class="text-sm">🔍</span>
          </div>
          <input
            v-model="search"
            placeholder="Search items..."
            class="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm outline-none"
          />
        </div>
      </div>
    </div>

    <!-- Detailed View -->
    <div v-if="isDetailed" class="grid grid-cols-1 gap-3">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        :class="{ 'border-l-4 border-l-red-500': item.isLowStock }"
      >
        <!-- Item Header -->
        <div class="p-3 border-b border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1.5">
                <h3 class="text-sm font-bold text-gray-900 dark:text-gray-50">{{ item.name }}</h3>
                <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                  {{ item.category }}
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>Unit: {{ item.unit }}</span>
                <span v-if="typeof item.default_unit_cost === 'number'" class="text-gray-600 dark:text-gray-300">Unit cost: ${{ item.default_unit_cost.toFixed(2) }}</span>
                <span v-else class="text-gray-400 dark:text-gray-500">Unit cost: —</span>
                <span v-if="item.parLabel" class="flex items-center gap-1" :class="{ 'text-yellow-600 dark:text-yellow-400': item.isLowStock }">
                  <span class="w-1.5 h-1.5 rounded-full" :class="item.isLowStock ? 'bg-red-500' : 'bg-yellow-500'"></span>
                  <span>{{ item.parLabel }}</span>
                </span>
              </div>
            </div>
            <div class="text-right">
              <div class="text-base font-bold text-blue-600 dark:text-blue-400">{{ item.totalOnhand }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Total on hand</div>
              <div v-if="typeof item.default_unit_cost === 'number' && item.totalOnhand > 0" class="text-xs text-green-600 dark:text-green-400 mt-0.5">
                Est. value: ${{ (item.default_unit_cost * item.totalOnhand).toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Location Breakdown -->
        <div class="p-3">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-xs font-bold text-gray-700 dark:text-gray-300">Stock locations</h4>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.locations?.length || 0 }} location{{ item.locations?.length !== 1 ? 's' : '' }}</span>
          </div>

          <div v-if="item.locations && item.locations.length > 0">
            <div class="space-y-2">
              <div
                v-for="loc in item.locations"
                :key="loc.id"
                class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-md"
              >
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                    <span class="text-xs">📍</span>
                  </div>
                  <div>
                    <div class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ loc.name }}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">Storage</div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-bold text-green-600 dark:text-green-400">{{ loc.quantity }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">Qty</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="py-4 text-center">
            <div class="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 mx-auto mb-2 flex items-center justify-center">
              <span class="text-xl text-gray-400 dark:text-gray-500">📦</span>
            </div>
            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">No stock</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Out of stock in all locations</p>
            <router-link to="/receive" class="inline-block px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm">
              Receive stock
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Compressed View -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700"
        :class="{ 'border-l-4 border-l-red-500': item.isLowStock }"
      >
        <div class="p-3">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-gray-900 dark:text-gray-50 truncate">{{ item.name }}</h3>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">
                  {{ item.category }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.unit }}</span>
              </div>
            </div>
            <div class="text-right ml-2">
              <div class="text-base font-bold text-blue-600 dark:text-blue-400">{{ item.totalOnhand }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">On hand</div>
            </div>
          </div>

          <div class="flex items-center justify-between text-xs mt-2">
            <div class="text-gray-500 dark:text-gray-400">
              <span v-if="item.locations && item.locations.length > 0">
                {{ item.locations.length }} location{{ item.locations.length !== 1 ? 's' : '' }}
              </span>
              <span v-else class="text-yellow-600 dark:text-yellow-400">
                No stock
              </span>
              <span v-if="typeof item.default_unit_cost === 'number' && item.totalOnhand > 0" class="ml-1 text-green-600 dark:text-green-400">
                · ${{ (item.default_unit_cost * item.totalOnhand).toFixed(2) }} est.
              </span>
            </div>
            <div v-if="item.parLabel" class="flex items-center gap-1" :class="item.isLowStock ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'">
              <span class="w-1.5 h-1.5 rounded-full" :class="item.isLowStock ? 'bg-red-500' : 'bg-yellow-500'"></span>
              <span class="text-xs">{{ item.parLabel }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State (Shared) -->
    <div v-if="filteredItems.length === 0" class="col-span-full">
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
        <div class="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 mx-auto mb-3 flex items-center justify-center">
          <span class="text-3xl text-blue-600 dark:text-blue-400">📦</span>
        </div>
        <h3 class="text-sm font-bold text-gray-900 dark:text-gray-50 mb-2">No items found</h3>
        <p class="text-xs text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">Adjust search or add new items</p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
          <router-link to="/items/add" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm">
            Add new item
          </router-link>
          <button @click="search = ''" class="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md font-bold text-sm hover:bg-gray-50">
            Clear search
          </button>
        </div>
      </div>
    </div>

    <!-- Summary Footer -->
    <div v-if="filteredItems.length > 0" class="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2">
        <div class="text-xs text-gray-600 dark:text-gray-400">
          Showing <span class="font-bold text-gray-900 dark:text-gray-50">{{ filteredItems.length }}</span> of <span class="font-bold text-gray-900 dark:text-gray-50">{{ inventory.length }}</span> items
        </div>
        <div class="flex items-center gap-2">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            Total: <span class="font-bold text-green-600 dark:text-green-400">{{ inventory.length }}</span>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400">
            In stock: <span class="font-bold text-blue-600 dark:text-blue-400">{{ inventory.filter(i => i.totalOnhand > 0).length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ParLevelRepository } from '../repositories/ParLevelRepository';
import { useViewPreference } from '../composables/useViewPreference';

const { viewPreference, toggleViewPreference, isCompressed, isDetailed } = useViewPreference();

const items = ref([]);
const locations = ref([]);
const search = ref('');
const inventory = ref([]);

onMounted(async () => {
  const [allItems, allLocs, allOnhand, parLevels] = await Promise.all([
    ItemRepository.getAll(),
    LocationRepository.getAll(),
    LedgerRepository.getAllOnhand(),
    ParLevelRepository.getAll()
  ]);

  locations.value = allLocs;

  const viewItems = [];

  for (const item of allItems) {
    const itemOnhand = allOnhand.filter(o => o.item_id === item.id);
    const total = itemOnhand.reduce((sum, o) => sum + o.quantity, 0);

    const locBreakdown = itemOnhand
      .filter(o => o.quantity !== 0)
      .map(o => {
        const loc = allLocs.find(l => l.id === o.location_id);
        return {
          id: o.location_id,
          name: loc ? loc.name : 'Unknown',
          quantity: o.quantity
        };
      });

    const globalPar = parLevels.find(p => p.item_id === item.id && (p.location_id == null || p.location_id === ''));
    const hasGlobalPar = globalPar && globalPar.min_qty > 0;
    const itemPars = parLevels.filter(p => p.item_id === item.id && p.location_id);

    let isLowStock = false;
    let parLabel = null;
    if (hasGlobalPar && total < globalPar.min_qty) {
      isLowStock = true;
      parLabel = `Global min: ${globalPar.min_qty}`;
    }
    if (!isLowStock && itemPars.length > 0) {
      for (const par of itemPars) {
        const locQty = itemOnhand.find(o => o.location_id === par.location_id)?.quantity || 0;
        if (locQty < par.min_qty) {
          isLowStock = true;
          const loc = allLocs.find(l => l.id === par.location_id);
          parLabel = parLabel ? `${parLabel}; ${loc?.name || '?'}: ${par.min_qty}` : `${loc?.name || '?'} min: ${par.min_qty}`;
        }
      }
    }
    if (!parLabel && (hasGlobalPar || itemPars.length > 0)) {
      parLabel = hasGlobalPar ? `Global min: ${globalPar.min_qty}` : null;
    }

    viewItems.push({
      ...item,
      totalOnhand: total,
      locations: locBreakdown,
      isLowStock,
      parLabel
    });
  }

  viewItems.sort((a, b) => a.name.localeCompare(b.name));
  inventory.value = viewItems;
});

const filteredItems = computed(() => {
  if (!search.value) return inventory.value;
  const term = search.value.toLowerCase();
  return inventory.value.filter(i =>
    i.name.toLowerCase().includes(term) ||
    i.category.toLowerCase().includes(term)
  );
});
</script>
