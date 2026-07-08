<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Remove Beer</h1>

    <div class="space-y-3">
      <!-- Beer Item Selection -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
        <div v-if="items.length === 0" class="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md text-sm">
          No beer items (Finished Beer) found. Sync or run the TTB beer category migration to add the Finished Beer item for TTB reporting.
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Beer Item</label>
          <div class="relative">
            <select v-model="form.item_id" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500" @change="checkOnhand">
              <option :value="null" disabled>Select beer item...</option>
              <option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} ({{ item.unit }})</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
          <div v-if="form.item_id && currentOnhand !== undefined" class="flex items-center gap-1 mt-1">
            <span class="text-xs text-gray-400 dark:text-gray-300">Available:</span>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ currentOnhand }}</span>
          </div>
        </div>

        <!-- Location Picker -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">From location</label>
          <div class="relative">
            <select v-model="form.location_id" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500" @change="checkOnhand">
              <option :value="null" disabled>Select location...</option>
              <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>

        <!-- Quantity -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Quantity (Barrels)</label>
          <input v-model.number="form.quantity" type="number" step="0.01" min="0" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md text-base font-medium text-gray-900 dark:text-gray-50 placeholder-gray-300 focus:ring-1 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800" placeholder="0.00" />
          <div v-if="currentOnhand !== undefined && form.quantity > currentOnhand" class="mt-1.5 px-1.5 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 text-xs rounded font-medium">
            ⚠️ Cannot remove more than on-hand
          </div>
        </div>

        <!-- Purpose -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Purpose <span class="text-xs text-gray-400">(for TTB reporting)</span></label>
          <div class="relative">
            <select v-model="form.removal_purpose" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
              <option :value="null" disabled>Select purpose...</option>
              <option v-for="purpose in primaryPurposes" :key="purpose.value" :value="purpose.value">{{ purpose.label }}</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
          <p class="text-xs text-gray-400 mt-1">Required for TTB reporting</p>
        </div>

        <!-- Expanded Purpose Options (when "Other" selected) -->
        <div v-if="form.removal_purpose === 'other'">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Specific Purpose</label>
          <div class="relative">
            <select v-model="form.removal_purpose_detail" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
              <option :value="null" disabled>Select specific purpose...</option>
              <option v-for="purpose in otherPurposes" :key="purpose.value" :value="purpose.value">{{ purpose.label }}</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>

        <!-- Served from (TTB Line 21) when Consumption or On-premise -->
        <div v-if="showServedFrom">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Served from</label>
          <div class="relative">
            <select v-model="form.consumption_form" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500">
              <option value="">Not specified (use location stage)</option>
              <option value="cellar">Cellar (tank)</option>
              <option value="keg">Keg</option>
              <option value="case">Case</option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
          <p class="text-xs text-gray-400 mt-1">Where was the beer served from? (For TTB Line 21 reporting.)</p>
        </div>

        <!-- Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Date</label>
          <input v-model="form.date" type="datetime-local" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500" />
        </div>

        <!-- Note -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Note (optional)</label>
          <textarea v-model="form.note" rows="2" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-500 focus:border-orange-500" placeholder="Optional notes..."></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="pt-1">
        <button @click="save" :disabled="!isValid" class="w-full bg-orange-600 text-white py-2 rounded-md font-bold text-sm hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
          Remove Beer
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
import { LedgerRepository } from '../repositories/LedgerRepository';
import { SyncService } from '../services/SyncService';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';

const { modal, alert: showAlert } = useModal();
const router = useRouter();
const allLocations = ref([]);
const vessels = ref([]);
const items = ref([]);

const form = ref({
  item_id: null,
  location_id: null,
  quantity: null,
  removal_purpose: null,
  removal_purpose_detail: null,
  consumption_form: '',
  date: new Date().toISOString().slice(0, 16),
  note: ''
});

const currentOnhand = ref(undefined);

// Simplified removal purposes for mobile
const PRIMARY_PURPOSES = [
  { value: 'sale', label: 'Sale' },
  { value: 'consumption', label: 'Consumption' },
  { value: 'export', label: 'Export' },
  { value: 'rnd', label: 'R&D' },
  { value: 'other', label: 'Other...' }
];

const OTHER_PURPOSES = [
  { value: 'supplies', label: 'Supplies (vessels/aircraft)' },
  { value: 'inter_brewery', label: 'Inter-brewery transfer' },
  { value: 'unfit', label: 'Unfit for sale' },
  { value: 'on_premise', label: 'On-premise consumption' },
  { value: 'sample', label: 'Laboratory sample' },
  { value: 'destruction', label: 'Destroyed at brewery' },
  { value: 'dsp_transfer', label: 'DSP transfer' },
  { value: 'loss_theft', label: 'Loss or theft' }
];

const primaryPurposes = ref(PRIMARY_PURPOSES);
const otherPurposes = ref(OTHER_PURPOSES);

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

const showServedFrom = computed(() => {
  if (form.value.removal_purpose === 'consumption') return true;
  if (form.value.removal_purpose === 'other' && form.value.removal_purpose_detail === 'on_premise') return true;
  return false;
});

// Auto-set tax status based on purpose
function getTaxStatus(purpose) {
  if (!purpose) return null;
  
  // Use detail if "other" was selected
  const effectivePurpose = purpose === 'other' ? form.value.removal_purpose_detail : purpose;
  
  const taxFree = ['export', 'rnd', 'supplies', 'inter_brewery'];
  if (taxFree.includes(effectivePurpose)) {
    return 'tax_free';
  }
  
  // Tax-determined for on-premise (tavern)
  if (effectivePurpose === 'on_premise') {
    return 'tax_determined';
  }
  
  // Default to taxable
  return 'taxable';
}

onMounted(async () => {
  const [locsList, vesselsList, itemsList] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    ItemRepository.getBeerItems()
  ]);
  allLocations.value = locsList || [];
  vessels.value = vesselsList || [];
  // Beer removals: use beer items only for TTB alignment (same as console Removals)
  items.value = itemsList;
});

const checkOnhand = async () => {
  if (form.value.item_id && form.value.location_id) {
    currentOnhand.value = await LedgerRepository.getOnhand(form.value.item_id, form.value.location_id);
  } else {
    currentOnhand.value = undefined;
  }
};

const isValid = computed(() => {
  const hasPurpose = form.value.removal_purpose && 
    (form.value.removal_purpose !== 'other' || form.value.removal_purpose_detail);
  
  return form.value.item_id && 
         form.value.location_id && 
         form.value.quantity > 0 &&
         hasPurpose &&
         (currentOnhand.value === undefined || form.value.quantity <= currentOnhand.value);
});

const save = async () => {
  if (!isValid.value) return;

  try {
    // Determine final purpose (use detail if "other" was selected)
    const finalPurpose = form.value.removal_purpose === 'other' 
      ? form.value.removal_purpose_detail 
      : form.value.removal_purpose;
    
    // Auto-set tax status
    const taxStatus = getTaxStatus(form.value.removal_purpose);

    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: form.value.item_id,
      location_id: form.value.location_id,
      quantity: -Math.abs(form.value.quantity), // Negative for consumption
      removal_purpose: finalPurpose,
      tax_status: taxStatus,
      consumption_form: form.value.consumption_form || undefined,
      created_at: new Date(form.value.date).toISOString(),
      note: form.value.note || undefined
    });

    await SyncService.sync();
    showAlert('Success', 'Beer removal recorded successfully.');
    router.push('/');
  } catch (e) {
    showAlert('Error', 'Error saving: ' + e.message, 'danger');
  }
};
</script>
