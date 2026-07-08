<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Transfer</h1>

    <form @submit.prevent="submit" class="space-y-3">
      
      <!-- Item Selection -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200">Item to transfer</label>
          <select v-model="itemSortBy" class="p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-xs w-auto max-w-[7rem]">
            <option value="name">By name</option>
            <option value="category">By category</option>
          </select>
        </div>
        <div class="relative">
          <select v-model="form.itemId" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="" disabled>Select item...</option>
            <template v-if="itemSortBy === 'category'">
              <optgroup v-for="group in itemsByCategory" :key="group.category" :label="group.category || 'Uncategorized'">
                <option v-for="item in group.items" :key="item.id" :value="item.id">{{ item.name }}</option>
              </optgroup>
            </template>
            <template v-else>
              <option v-for="item in sortedItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </template>
          </select>
          <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
        </div>
      </div>

      <!-- Locations -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-1 gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">From location</label>
          <div class="relative">
            <select v-model="form.fromLocationId" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
              <option value="" disabled>Origin...</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                {{ loc.name }} (Avail: {{ getStock(loc.id) }})
              </option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">To location</label>
          <div class="relative">
            <select v-model="form.toLocationId" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
              <option value="" disabled>Destination...</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id" :disabled="loc.id === form.fromLocationId">
                {{ loc.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>
      </div>

      <!-- Quantity -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Quantity</label>
        <div class="flex items-center gap-2">
          <input 
            v-model.number="form.quantity" 
            type="number" 
            step="any" 
            required 
            min="0.0001"
            class="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="0.00"
          >
          <span class="font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-md min-w-[2.5rem] text-center text-sm">{{ selectedItemUnit || '-' }}</span>
        </div>
        <p v-if="form.fromLocationId && form.itemId" class="text-xs mt-1.5" :class="insufficient ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'">
          Available: {{ currentStock }} {{ selectedItemUnit }}
        </p>
      </div>

      <!-- Note -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Note (optional)</label>
        <textarea v-model="form.note" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm" rows="2" placeholder="Reason for transfer..."></textarea>
      </div>

      <!-- Operation Type (for TTB reporting) -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
          Operation Type <span class="text-xs text-gray-400">(optional, for TTB reporting)</span>
        </label>
        <div class="relative">
          <select v-model="form.operationType" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm">
            <option value="transfer">Transfer</option>
            <option value="racking">Racking</option>
            <option value="bottling">Bottling</option>
            <option value="return">Return to Cellar</option>
            <option value="other">Other</option>
          </select>
          <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
        </div>
        <p class="text-xs text-gray-400 mt-1">Defaults to "Transfer" - helps with TTB reporting</p>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" @click="$router.back()" class="px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md font-bold text-sm">
          Cancel
        </button>
        <button type="submit" :disabled="!isValid" 
          class="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed">
          Transfer
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, inject, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { SyncService } from '../services/SyncService';

const router = useRouter();
const { confirm: confirmModal, alert: alertModal } = inject('modal');

const allItems = ref([]);
const allLocations = ref([]);
const vessels = ref([]);
const onhandCache = ref([]);
const itemSortBy = ref('category');

const form = reactive({
  itemId: '',
  fromLocationId: '',
  toLocationId: '',
  quantity: '',
  note: '',
  operationType: 'transfer' // Default to 'transfer'
});

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
  const [itemsRaw, allLocs, allVessels, allOnhand] = await Promise.all([
    ItemRepository.getAll(),
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    LedgerRepository.getAllOnhand()
  ]);

  allItems.value = itemsRaw.sort((a, b) => a.name.localeCompare(b.name));
  allLocations.value = (allLocs || []).sort((a, b) => a.name.localeCompare(b.name));
  vessels.value = allVessels || [];
  onhandCache.value = allOnhand;
});

const sortedItems = computed(() =>
  [...(allItems.value || [])].sort((a, b) => a.name.localeCompare(b.name))
);

const itemsByCategory = computed(() => {
  const items = allItems.value || [];
  const byCat = new Map();
  for (const item of items) {
    const cat = item.category || 'Uncategorized';
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(item);
  }
  return [...byCat.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name))
    }));
});

const selectedItemUnit = computed(() => {
  const item = allItems.value?.find(i => i.id === form.itemId);
  return item ? item.unit : '';
});

const getStock = (locationId) => {
  if (!form.itemId) return '-';
  const entry = onhandCache.value.find(c => c.item_id === form.itemId && c.location_id === locationId);
  return entry ? entry.quantity : 0;
};

const currentStock = computed(() => {
  if (!form.itemId || !form.fromLocationId) return 0;
  return getStock(form.fromLocationId);
});

const insufficient = computed(() => {
  if (!form.quantity) return false;
  return form.quantity > currentStock.value;
});

// Watch note for smart suggestions
watch(() => form.note, (note) => {
  if (!note) return;
  const lower = note.toLowerCase();
  if (lower.includes('rack') || lower.includes('keg')) {
    form.operationType = 'racking';
  } else if (lower.includes('bottle') || lower.includes('can')) {
    form.operationType = 'bottling';
  } else if (lower.includes('return')) {
    form.operationType = 'return';
  }
});

const isValid = computed(() => {
  return form.itemId && 
         form.fromLocationId && 
         form.toLocationId && 
         form.fromLocationId !== form.toLocationId && 
         form.quantity > 0;
});

const submit = async () => {
  if (!isValid.value) return;

  const processTransfer = async () => {
    try {
      await LedgerRepository.transfer({
        itemId: form.itemId,
        fromLocationId: form.fromLocationId,
        toLocationId: form.toLocationId,
        quantity: form.quantity,
        note: form.note,
        operationType: form.operationType || 'transfer'
      });
      
      await SyncService.sync();
      alertModal('Success', 'Transfer complete!', 'primary');
      router.back();
    } catch (e) {
      alertModal('Error', 'Transfer failed: ' + e.message, 'danger');
    }
  };

  if (insufficient.value) {
    confirmModal(
      'Insufficient Stock',
      `You are transferring ${form.quantity} but only have ${currentStock.value} available. This will result in negative inventory. Continue?`,
      processTransfer,
      'warning',
      'Transfer Anyway'
    );
  } else {
    await processTransfer();
  }
};
</script>
