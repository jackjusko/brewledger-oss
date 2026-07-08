<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Consume</h1>

    <div class="space-y-3">
      <!-- Context Card -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
        <!-- Batch Picker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">For batch</label>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <select v-model="batchId" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
                <option :value="null" disabled>Select batch...</option>
                <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
              <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
            </div>
            <router-link to="/batches/add" class="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 rounded-md flex items-center justify-center font-bold text-base hover:bg-orange-200">+</router-link>
          </div>
        </div>

        <!-- Location Picker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">From location</label>
          <div class="relative">
            <select v-model="locationId" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
              <option :value="null" disabled>Select source...</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>
      </div>

      <!-- Lines -->
      <div v-if="locationId" class="space-y-2">
        <div v-for="(line, idx) in lines" :key="idx" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 relative">
          <button @click="removeLine(idx)" class="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded text-xs hover:bg-red-100">
            ×
          </button>
          
          <div class="mb-2 pr-6">
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Item</label>
            <select v-model="line.item_id" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500" @change="checkOnhand(line)">
              <option :value="null" disabled>Select item</option>
              <option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} ({{ item.unit }})</option>
            </select>
            <div v-if="line.currentOnhand !== undefined" class="flex items-center gap-1 mt-1">
              <span class="text-xs text-gray-400 dark:text-gray-300">Available:</span>
              <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ line.currentOnhand }}</span>
            </div>
          </div>
          
          <div class="flex items-center gap-2">
            <div class="flex-1">
              <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Quantity</label>
              <input v-model.number="line.quantity" type="number" step="any" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-base font-medium text-gray-900 dark:text-gray-50 placeholder-gray-300 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800" placeholder="0.00" />
            </div>
            <div class="text-gray-500 dark:text-gray-400 self-end mb-1 font-medium bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" v-if="line.item_id">
              {{ getItemUnit(line.item_id) }}
            </div>
          </div>
          
          <div v-if="line.currentOnhand !== undefined && line.quantity > line.currentOnhand" class="mt-1.5 px-1.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 text-xs rounded font-medium">
            ⚠️ Cannot consume more than on-hand
          </div>
        </div>

        <button @click="addLine" class="w-full py-2 border border-dashed border-gray-300 dark:border-gray-500 rounded-md text-gray-500 dark:text-gray-400 font-medium hover:bg-gray-50 text-sm flex items-center justify-center gap-1">
          <span class="text-base">+</span> Add item
        </button>
      </div>

      <!-- Actions -->
      <div v-if="batchId && locationId" class="pt-1">
        <button @click="save" :disabled="!isValid" class="w-full bg-orange-600 text-white py-2 rounded-md font-bold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
          Confirm consumption
        </button>
      </div>
    </div>
    
    <ModalDialog 
      :isOpen="modal.isOpen" 
      :title="modal.title" 
      :message="modal.message" 
      :type="modal.type" 
      :variant="modal.variant"
      :confirmText="modal.confirmText"
      @confirm="modal.onConfirm" 
      @cancel="modal.isOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { BatchRepository } from '../repositories/BatchRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const router = useRouter();
const locations = ref([]);
const items = ref([]);
const batches = ref([]);

const locationId = ref(null);
const batchId = ref(null);
const lines = ref([{ item_id: null, quantity: null }]);

const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
);

const locations = computed(() =>
  (allLocations.value || []).filter((l) => !l.deleted_at && !nonServingTankLocationIds.value.has(l.id))
);

onMounted(async () => {
  const [allLocs, allVessels, allItemsRaw, allBatches] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    ItemRepository.getAll(),
    BatchRepository.getAll()
  ]);
  allLocations.value = allLocs || [];
  vessels.value = allVessels || [];
  items.value = allItemsRaw || [];
  batches.value = allBatches || [];
});

const getItemUnit = (id) => {
  const item = items.value.find(i => i.id === id);
  return item ? item.unit : '';
};

const checkOnhand = async (line) => {
  if (line.item_id && locationId.value) {
    line.currentOnhand = await LedgerRepository.getOnhand(line.item_id, locationId.value);
  }
};

const addLine = () => {
  lines.value.push({ item_id: null, quantity: null });
};

const removeLine = (idx) => {
  lines.value.splice(idx, 1);
};

const isValid = computed(() => {
  return batchId.value && 
         locationId.value && 
         lines.value.length > 0 && 
         lines.value.every(l => 
           l.item_id && 
           l.quantity > 0 && 
           (l.currentOnhand === undefined || l.quantity <= l.currentOnhand)
         );
});

const save = async () => {
  if (!isValid.value) return;

  try {
    for (const line of lines.value) {
      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: line.item_id,
        location_id: locationId.value,
        batch_id: batchId.value,
        quantity: -Math.abs(line.quantity), // Ensure negative
        note: 'Manual consumption'
      });
    }
    showAlert('Success', `Consumed ${lines.value.length} lines.`);
    router.push('/batches/' + batchId.value);
  } catch (e) {
    showAlert('Error', 'Error saving: ' + e.message, 'danger');
  }
};
</script>
