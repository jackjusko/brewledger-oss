<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Ledger</h1>

    <div v-if="loading" class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
    
    <div v-else-if="entries.length === 0" class="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="text-3xl mb-2">📜</div>
      <p class="text-sm text-gray-500 dark:text-gray-400">No transactions</p>
    </div>

    <div v-else class="space-y-2">
      <div v-for="entry in entries" :key="entry.id" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-start">
        <div>
          <div class="flex items-center gap-1.5 mb-1">
            <span class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ getItemName(entry) }}</span>
            <span :class="getTypeClass(entry.type)" class="text-xs px-1.5 py-0.5 rounded-full font-medium">
              {{ entry.type.replace('_', ' ') }}
            </span>
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
             <span>{{ getLocationName(entry) }}</span>
             <span class="text-gray-300">•</span>
             <span>{{ formatDateTime(entry.created_at) }}</span>
          </div>
          <div v-if="entry.note" class="text-xs text-gray-400 dark:text-gray-300 mt-1 italic border-l border-gray-200 dark:border-gray-600 pl-1.5">
            "{{ entry.note }}"
          </div>
        </div>
        <div class="font-mono font-bold text-base" :class="entry.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
          {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db } from '../db';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { BatchRepository } from '../repositories/BatchRepository';

const entries = ref([]);
const items = ref([]);
const locations = ref([]);
const batches = ref([]);
const allItems = ref([]); // Includes deleted
const allLocations = ref([]); // Includes deleted

const filters = ref({
  type: ''
});

onMounted(async () => {
  items.value = await ItemRepository.getAll();
  locations.value = await LocationRepository.getAll();
  batches.value = await BatchRepository.getAll();
  
  // Fetch ALL items/locations (including deleted) for historical names
  // We can assume db is available here or add method to Repo
  const { orgId } = await ItemRepository.getContext(); // Helper needed?
  // Let's just fetch raw from DB to be safe and simple
  if (orgId) {
     allItems.value = await db.items.where('org_id').equals(orgId).toArray();
     allLocations.value = await db.locations.where('org_id').equals(orgId).toArray();
  } else {
     allItems.value = await db.items.toArray();
     allLocations.value = await db.locations.toArray();
  }

  await refresh();
});

const refresh = async () => {
  const f = {};
  if (filters.value.type) f.type = filters.value.type;
  entries.value = await LedgerRepository.getEntries(f);
};

const getItemName = (entry) => {
  // 1. Try active items (undeleted)
  const item = items.value.find(i => i.id === entry.item_id);
  if (item) return item.name;
  
  // 2. Try historical/deleted items (if loaded)
  const deletedItem = allItems.value.find(i => i.id === entry.item_id);
  if (deletedItem) return deletedItem.name;
  
  // 3. Fallback to snapshot name stored in ledger
  if (entry.item_name) return entry.item_name;
  
  // 4. Fallback to ID
  return entry.item_id;
};

const getLocationName = (entry) => {
  const loc = locations.value.find(l => l.id === entry.location_id);
  if (loc) return loc.name;
  
  const deletedLoc = allLocations.value.find(l => l.id === entry.location_id);
  if (deletedLoc) return deletedLoc.name;

  if (entry.location_name) return entry.location_name;
  
  return entry.location_id;
};

const getBatchName = (entry) => {
  const batch = batches.value.find(b => b.id === entry.batch_id);
  if (batch) return batch.name;
  
  if (entry.batch_name) return entry.batch_name;
  
  return entry.batch_id ? 'Batch' : '';
};

const formatDateTime = (iso) => {
  if (!iso) return '-';
  return new Date(iso).toLocaleString();
};

const getTypeClass = (type) => {
  if (!type) return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
  if (type.includes('RECEIVE') || (type.includes('ADJUST') && !type.includes('NEG'))) return 'bg-green-100 text-green-700';
  if (type.includes('CONSUME') || type.includes('NEG')) return 'bg-orange-100 text-orange-700';
  if (type.includes('TRANSFER')) return 'bg-blue-100 text-blue-700';
  return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300';
};

const getQtyClass = (qty) => {
  if (qty > 0) return 'text-green-600 dark:text-green-400';
  if (qty < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-300';
};
</script>
