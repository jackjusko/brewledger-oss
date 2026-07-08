<template>
  <div class="p-3 pb-20">
    <h1 class="text-xl font-bold mb-3 text-gray-900 dark:text-gray-50">Export</h1>

    <div class="space-y-3">
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm mb-1.5 text-gray-900 dark:text-gray-50">On-hand inventory</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Current stock levels per location</p>
        <button @click="exportOnhand" class="w-full bg-blue-600 text-white py-2 rounded-md font-bold text-sm">
          Download CSV
        </button>
      </div>

      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm mb-1.5 text-gray-900 dark:text-gray-50">Ledger history</h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Full transaction log</p>
        
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1">Start date</label>
            <input v-model="ledgerStart" type="date" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
          </div>
          <div>
            <label class="text-xs text-gray-500 dark:text-gray-400 mb-1">End date</label>
            <input v-model="ledgerEnd" type="date" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white text-sm" />
          </div>
        </div>

        <button @click="exportLedger" class="w-full bg-blue-600 text-white py-2 rounded-md font-bold text-sm">
          Download CSV
        </button>
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

const ledgerStart = ref(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
const ledgerEnd = ref(new Date().toISOString().split('T')[0]);

const allItems = ref([]);
const allLocations = ref([]);

onMounted(async () => {
   // Pre-fetch historical data
   const { orgId } = await ItemRepository.getContext();
   if (orgId) {
      allItems.value = await db.items.where('org_id').equals(orgId).toArray();
      allLocations.value = await db.locations.where('org_id').equals(orgId).toArray();
   } else {
      allItems.value = await db.items.toArray();
      allLocations.value = await db.locations.toArray();
   }
});

const downloadCSV = (filename, rows) => {
  const csvContent = rows.map(e => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const escape = (val) => {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const exportOnhand = async () => {
  const items = await ItemRepository.getAll();
  const locations = await LocationRepository.getAll();
  const onhands = await LedgerRepository.getAllOnhand(); // this returns cache entries

  const header = ['Item Name', 'Category', 'Unit', 'Location', 'Quantity', 'Threshold'];
  const rows = [header];

  for (const entry of onhands) {
    if (entry.quantity === 0) continue;
    const item = items.find(i => i.id === entry.item_id);
    const loc = locations.find(l => l.id === entry.location_id);
    if (item && loc) {
      rows.push([
        escape(item.name),
        escape(item.category),
        escape(item.unit),
        escape(loc.name),
        escape(entry.quantity),
        escape(item.reorder_threshold)
      ]);
    }
  }

  const filename = `onhand_${new Date().toISOString().split('T')[0]}.csv`;
  downloadCSV(filename, rows);
};

const exportLedger = async () => {
  const items = await ItemRepository.getAll();
  const locations = await LocationRepository.getAll();
  const batches = await BatchRepository.getAll();
  
  const entries = await LedgerRepository.getEntries({
    startDate: ledgerStart.value,
    endDate: ledgerEnd.value + 'T23:59:59'
  });

  const header = ['Date', 'Type', 'Item', 'Location', 'Quantity', 'Unit', 'Batch', 'Note'];
  const rows = [header];

  for (const entry of entries) {
    // Resolve Item Name
    let itemName = entry.item_name; // Snapshot
    let itemUnit = '';
    if (!itemName) {
      const item = allItems.value.find(i => i.id === entry.item_id);
      if (item) {
        itemName = item.name;
        itemUnit = item.unit;
      } else {
        itemName = entry.item_id;
      }
    } else {
      // If snapshot exists, try to get unit from current/deleted item
      const item = allItems.value.find(i => i.id === entry.item_id);
      if (item) itemUnit = item.unit;
    }

    // Resolve Location Name
    let locationName = entry.location_name; // Snapshot
    if (!locationName) {
       const loc = allLocations.value.find(l => l.id === entry.location_id);
       locationName = loc ? loc.name : entry.location_id;
    }
    
    // Resolve Batch Name
    let batchName = entry.batch_name; // Snapshot
    if (!batchName && entry.batch_id) {
       const batch = batches.find(b => b.id === entry.batch_id);
       batchName = batch ? batch.name : 'Batch';
    }

    rows.push([
      escape(entry.created_at),
      escape(entry.type),
      escape(itemName),
      escape(locationName),
      escape(entry.quantity),
      escape(itemUnit),
      escape(batchName || ''),
      escape(entry.note)
    ]);
  }

  const filename = `ledger_${ledgerStart.value}_to_${ledgerEnd.value}.csv`;
  downloadCSV(filename, rows);
};
</script>
