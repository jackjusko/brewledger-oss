<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Receive</h1>

    <div class="space-y-3" v-if="!submitted">
      <!-- Location Picker -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Location</label>
        <div class="relative">
          <select v-model="locationId" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            <option :value="null" disabled>Select destination...</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
          <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
        </div>
      </div>

      <!-- Invoice -->
      <div v-if="locationId" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Invoice / Bill #</label>
        <input v-model="invoiceNumber" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500" placeholder="Reference #" />
      </div>

      <!-- Lines -->
      <div v-if="locationId" class="space-y-2">
        <div v-for="(line, idx) in lines" :key="idx" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 relative">
          <button @click="removeLine(idx)" class="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded text-xs hover:bg-red-100">
            ×
          </button>
          
          <div class="mb-2 pr-6">
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item</label>
            <select v-model="line.item_id" @change="line.unit_cost = getItemDefaultCost(line.item_id)" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option :value="null" disabled>Select item</option>
              <option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} ({{ item.unit }})</option>
            </select>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
              <input v-model.number="line.quantity" type="number" step="any" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-base font-medium text-gray-900 dark:text-gray-50 placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" placeholder="0.00" />
            </div>
            <div class="flex-1">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Unit cost</label>
              <input v-model.number="line.unit_cost" type="number" min="0" step="0.01" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-base font-medium text-gray-900 dark:text-gray-50 placeholder-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800" placeholder="0.00" />
            </div>
            <div class="text-gray-500 dark:text-gray-400 self-end mb-1 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" v-if="line.item_id">
              {{ getItemUnit(line.item_id) }}
            </div>
          </div>
          <div v-if="line.quantity && line.unit_cost != null" class="text-right text-xs text-gray-500 dark:text-gray-400 mt-1">
            Line total: {{ (line.quantity * line.unit_cost).toFixed(2) }}
          </div>
        </div>

        <button @click="addLine" class="w-full py-2 border border-dashed border-gray-300 dark:border-gray-500 rounded-md text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 text-sm flex items-center justify-center gap-1">
          <span class="text-base">+</span> Add item
        </button>
      </div>

      <!-- Note -->
      <div v-if="locationId" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Note (optional)</label>
        <textarea v-model="note" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" rows="2" placeholder="e.g. Invoice #1234"></textarea>
      </div>

      <!-- Actions -->
      <div v-if="locationId" class="pt-1">
        <button @click="save" :disabled="!isValid" class="w-full bg-blue-600 text-white py-2 rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
          Confirm receipt
        </button>
      </div>
    </div>
    
    <!-- Success Summary -->
    <div v-if="submitted" class="space-y-3">
      <div class="bg-green-50 dark:bg-green-900/30 p-3 rounded-md text-center border border-green-200 dark:border-green-700">
          <div class="text-xl mb-1">✅</div>
          <h2 class="text-base font-bold text-green-800 dark:text-green-400 mb-1">Receipt complete</h2>
          <p class="text-green-700 dark:text-green-300 text-xs">Inventory updated</p>
        </div>

      <div class="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
        <h3 class="font-bold text-sm mb-2 text-gray-900 dark:text-gray-50">Summary</h3>
        <div v-for="(entry, idx) in createdEntries" :key="idx" class="flex justify-between py-1 border-b last:border-0">
          <div>
            <div class="font-medium text-sm">{{ entry.item_name }}</div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ entry.location_name }}<span v-if="entry.vendor"> · {{ entry.vendor }}</span></div>
          </div>
          <div class="text-right">
            <div class="font-bold text-green-600 dark:text-green-400">+{{ entry.quantity }}</div>
            <div v-if="entry.total_cost != null" class="text-xs text-gray-500 dark:text-gray-400">${{ entry.total_cost.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-2">
        <button @click="finish" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded font-bold text-sm">
          Done
        </button>
        <button @click="undo" class="w-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 py-1.5 rounded font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/30">
          Undo receipt
        </button>
      </div>
    </div>
    
    <ModalDialog 
      :isOpen="false" 
      title="" 
      message="" 
      type="alert" 
      variant="primary"
      confirmText=""
      @confirm="() => {}" 
      @cancel="() => {}" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue';
import { useRouter } from 'vue-router';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { SyncService } from '../services/SyncService';
import ModalDialog from '../components/ModalDialog.vue'; // Add this import

const { confirm: showConfirm, alert: showAlert } = inject('modal');
const router = useRouter();
const locations = ref([]);
const items = ref([]);

const locationId = ref(null);
const note = ref('');
const invoiceNumber = ref('');
const lines = ref([{ item_id: null, quantity: null, unit_cost: null }]);
const submitted = ref(false);
const createdEntries = ref([]);

onMounted(async () => {
  const [locs, vessels, allItems] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    ItemRepository.getAll()
  ]);
  const tankLocationIds = new Set((vessels || []).filter((v) => v.location_id).map((v) => v.location_id));
  locations.value = (locs || []).filter((l) => !l.deleted_at && !tankLocationIds.has(l.id));
  items.value = allItems;
});

const getItemUnit = (id) => {
  const item = items.value.find(i => i.id === id);
  return item ? item.unit : '';
};

const getItemDefaultCost = (id) => {
  const item = items.value.find(i => i.id === id);
  if (!item) return null;
  return typeof item.default_unit_cost === 'number' ? item.default_unit_cost : null;
};

const getItemVendor = (id) => items.value.find(i => i.id === id)?.vendor ?? null;

const addLine = () => {
  lines.value.push({ item_id: null, quantity: null, unit_cost: null });
};

const removeLine = (idx) => {
  lines.value.splice(idx, 1);
};

const isValid = computed(() => {
  return locationId.value && lines.value.length > 0 && lines.value.every(l => l.item_id && l.quantity > 0 && l.unit_cost !== null && l.unit_cost >= 0);
});

const save = async () => {
  if (!isValid.value) return;

  try {
    const entries = [];
    for (const line of lines.value) {
      const totalCost = line.unit_cost != null && line.quantity ? line.unit_cost * line.quantity : null;
      const entry = await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: line.item_id,
        location_id: locationId.value,
        quantity: line.quantity,
        note: note.value,
        vendor: getItemVendor(line.item_id) || null,
        invoice_number: invoiceNumber.value || null,
        unit_cost: line.unit_cost != null ? Number(line.unit_cost) : null,
        total_cost: totalCost
      });
      entries.push(entry);
    }
    
    await SyncService.sync();
    createdEntries.value = entries;
    submitted.value = true;
    
  } catch (e) {
    showAlert('Error', 'Error saving: ' + e.message, 'danger');
  }
};

const finish = () => {
  router.push('/');
};

const undo = async () => {
  showConfirm('Undo Receipt', 'Are you sure you want to reverse this receipt? This will deduct the items from inventory.', async () => {
    try {
      for (const entry of createdEntries.value) {
        await LedgerRepository.reverseEntry(entry, 'Undo Receipt');
      }
      await SyncService.sync();
      showAlert('Undone', 'Receipt reversed successfully.');
      router.push('/');
    } catch (e) {
      showAlert('Error', 'Undo failed: ' + e.message, 'danger');
    }
  }, 'danger', 'Confirm Undo');
};
</script>
