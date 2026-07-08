<template>
  <div class="p-3 pb-20 space-y-3">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Reorder</h1>
      <div class="flex gap-2">
        <button @click="showParModal = true" class="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 px-3 py-1.5 rounded-md font-bold text-sm hover:bg-blue-50">
          Set par levels
        </button>
        <button @click="exportCSV" class="bg-blue-600 text-white px-3 py-1.5 rounded-md font-bold text-sm hover:bg-blue-700">
          Export CSV
        </button>
      </div>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">Loading...</div>

    <div v-else-if="reorderItems.length === 0" class="bg-green-50 dark:bg-green-900/30 p-6 rounded-lg text-center border border-green-200 dark:border-green-700">
      <div class="text-3xl mb-2">👍</div>
      <h3 class="text-sm font-bold text-green-800 dark:text-green-400 mb-1">Stock healthy</h3>
      <p class="text-xs text-green-700 dark:text-green-300">No items below par levels</p>
    </div>

    <div v-else class="grid gap-2">
      <div v-for="(item, idx) in reorderItems" :key="item.key" class="bg-white dark:bg-gray-800 p-3 rounded-lg border-l-2 border-l-red-500 border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
        <div class="flex justify-between items-start">
          <div>
            <div class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ item.itemName }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
              <span v-if="item.isGlobal">🌐</span>
              <span v-else>📍</span>
              {{ item.locationName }}
            </div>
          </div>
          <div class="text-right bg-red-50 dark:bg-red-900/30 px-2 py-1.5 rounded-md border border-red-100">
            <div class="text-xs text-red-500 mb-0.5">Deficit</div>
            <div class="text-base font-bold text-red-600 dark:text-red-400 leading-none">{{ item.deficit }} <span class="text-xs font-normal text-red-400">{{ item.unit }}</span></div>
          </div>
        </div>
        
        <div class="flex items-center gap-2 text-xs pt-2 border-t border-gray-100 dark:border-gray-700">
          <div class="flex-1 text-center border-r border-gray-100 dark:border-gray-700 last:border-0">
            <span class="block text-gray-400 dark:text-gray-300 mb-0.5">On hand</span>
            <span class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.onHand }}</span>
          </div>
          <div class="flex-1 text-center border-r border-gray-100 dark:border-gray-700 last:border-0">
            <span class="block text-gray-400 dark:text-gray-300 mb-0.5">Par level</span>
            <span class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.parMin }}</span>
          </div>
          <div class="flex-1 text-center">
             <span class="block text-gray-400 dark:text-gray-300 mb-0.5">Action</span>
             <span class="text-blue-600 dark:text-blue-400 font-bold cursor-pointer text-sm">Order</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Par Level Editor Modal -->
    <div v-if="showParModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-md w-full max-w-sm max-h-[70vh] flex flex-col">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="font-bold text-sm">Set par levels</h3>
          <button @click="showParModal = false" class="text-xl">&times;</button>
        </div>
        
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <select v-model="selectedLocationId" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-sm">
            <option :value="null">Select scope...</option>
            <option value="GLOBAL">🌐 Global (total across all locations)</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">📍 {{ loc.name }}</option>
          </select>
        </div>

        <div class="p-3 overflow-y-auto flex-1" v-if="selectedLocationId">
          <div v-for="item in allItems" :key="item.id" class="flex justify-between items-center py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
            <div class="flex-1">
              <div class="font-medium text-sm">{{ item.name }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.category }}</div>
            </div>
            <div class="flex items-center gap-1.5">
              <label class="text-xs text-gray-500 dark:text-gray-400">Min:</label>
              <input 
                type="number" 
                v-model.number="tempPars[item.id]" 
                class="w-16 p-1 border border-gray-200 dark:border-gray-600 rounded text-right dark:bg-gray-800 dark:text-white text-sm"
                placeholder="-"
              />
            </div>
          </div>
        </div>
        <div class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm" v-else>
          Select scope to edit par levels
        </div>

        <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
          <button @click="showParModal = false" class="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md text-sm">Cancel</button>
          <button @click="savePars" class="px-3 py-1.5 bg-blue-600 text-white rounded-md font-bold text-sm" :disabled="!selectedLocationId || selectedLocationId === null">
            Save changes
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ParLevelRepository } from '../repositories/ParLevelRepository';
import { SyncService } from '../services/SyncService';

const loading = ref(true);
const showParModal = ref(false);
const allItems = ref([]);
const locations = ref([]);
const parLevels = ref([]);
const reorderItems = ref([]);

// Editor State
const selectedLocationId = ref(null);
const tempPars = ref({}); // { itemId: qty }

onMounted(async () => {
  await loadData();
});

const loadData = async () => {
  loading.value = true;
  const [items, locs, vessels, pars] = await Promise.all([
    ItemRepository.getAll(),
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    ParLevelRepository.getAll()
  ]);
  allItems.value = items;
  parLevels.value = pars;
  const tankLocationIds = new Set((vessels || []).filter((v) => v.location_id).map((v) => v.location_id));
  locations.value = (locs || []).filter((l) => !l.deleted_at && !tankLocationIds.has(l.id));

  const results = [];
  const seenKeys = new Set();

  for (const par of parLevels.value) {
    if (!par.min_qty || par.min_qty <= 0) continue;

    const item = allItems.value.find(i => i.id === par.item_id);
    if (!item) continue;

    const isGlobal = par.location_id == null || par.location_id === '';
    let onHand;
    let locationName;

    if (isGlobal) {
      onHand = await LedgerRepository.getTotalOnhand(par.item_id);
      locationName = 'All Locations (Global)';
    } else {
      const loc = locations.value.find(l => l.id === par.location_id);
      if (!loc) continue;
      onHand = await LedgerRepository.getOnhand(par.item_id, par.location_id);
      locationName = loc.name;
    }

    if (onHand < par.min_qty) {
      const key = `${par.item_id}-${isGlobal ? 'global' : par.location_id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          key,
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          locationId: par.location_id,
          locationName,
          isGlobal,
          onHand,
          parMin: par.min_qty,
          deficit: par.min_qty - onHand
        });
      }
    }
  }

  reorderItems.value = results.sort((a, b) => b.deficit - a.deficit);
  loading.value = false;
};

watch(selectedLocationId, () => {
  tempPars.value = {};
  if (!selectedLocationId.value) return;

  const isGlobal = selectedLocationId.value === 'GLOBAL';
  const pars = isGlobal
    ? parLevels.value.filter(p => p.location_id == null || p.location_id === '')
    : parLevels.value.filter(p => p.location_id === selectedLocationId.value);

  for (const par of pars) {
    tempPars.value[par.item_id] = par.min_qty;
  }
});

const savePars = async () => {
  if (!selectedLocationId.value) return;

  const isGlobal = selectedLocationId.value === 'GLOBAL';

  for (const [itemId, qty] of Object.entries(tempPars.value)) {
    if (qty !== '' && qty != null && !isNaN(Number(qty))) {
      if (isGlobal) {
        await ParLevelRepository.setGlobalParLevel(itemId, Number(qty));
      } else {
        await ParLevelRepository.setParLevel(itemId, selectedLocationId.value, Number(qty));
      }
    }
  }

  await SyncService.sync();
  showParModal.value = false;
  await loadData();
};

const exportCSV = () => {
  const headers = ['Item', 'Scope', 'On Hand', 'Par Level', 'To Order', 'Unit'];
  const rows = reorderItems.value.map(i => [
    `"${i.itemName}"`,
    `"${i.isGlobal ? 'Global' : i.locationName}"`,
    i.onHand,
    i.parMin,
    i.deficit,
    i.unit
  ]);
  
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `reorder_list_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
};
</script>
