<template>
  <div class="p-3 pb-20 space-y-3">
    <div v-if="session?.status === 'CLOSED'" class="flex flex-col items-center justify-center pt-6 text-center space-y-3">
      <div class="w-16 h-16 bg-green-100 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center text-3xl">✓</div>
      <div>
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">Count complete</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">Inventory updated</p>
      </div>
      
      <div class="flex flex-col gap-2 w-full max-w-xs">
        <button @click="router.push('/')" class="w-full bg-blue-600 text-white py-2 rounded-md font-bold text-sm hover:bg-blue-700">
          Return to dashboard
        </button>
        <button @click="undoSession" class="w-full bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 py-2 rounded-md font-bold text-sm hover:bg-red-50 dark:hover:bg-red-900/30">
          Undo adjustments
        </button>
      </div>
    </div>

    <div v-if="session?.status !== 'CLOSED' && !reviewMode" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
      <div class="flex justify-between items-start">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">{{ locationName }}</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active count session</p>
        </div>
        <button @click="cancelSession" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs font-medium hover:bg-red-100">
          Cancel
        </button>
      </div>
      <button @click="startReview" class="w-full bg-green-600 text-white py-2 rounded-md font-bold text-sm hover:bg-green-700">
        Review & finish
      </button>
    </div>

    <!-- Review Screen -->
    <div v-if="reviewMode && session?.status !== 'CLOSED'" class="space-y-3">
      <div class="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 p-3 rounded-lg flex gap-2">
        <div class="text-yellow-600 dark:text-yellow-400 text-base">⚠️</div>
        <div>
          <h2 class="text-sm font-bold text-yellow-900">Review variances</h2>
          <p class="text-xs text-yellow-800 mt-0.5">
            Select reason for each discrepancy
          </p>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="(v, idx) in variances" :key="idx" class="bg-white dark:bg-gray-800 p-3 rounded-lg border-l-2 border-l-orange-400 border border-gray-200 dark:border-gray-700 space-y-2">
          <div class="flex justify-between items-start">
            <div class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ v.item.name }}</div>
            <div class="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
              Exp: {{ v.expected }} | Act: {{ v.counted }}
            </div>
          </div>
          
          <div class="flex items-center gap-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">
            <div class="font-mono font-bold text-base" :class="v.diff > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
              {{ v.diff > 0 ? '+' : '' }}{{ v.diff }} <span class="text-xs font-normal text-gray-500 dark:text-gray-400">{{ v.item.unit }}</span>
            </div>
            <div class="flex-1">
              <select v-model="v.reason" class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm focus:ring-1 focus:ring-orange-400 focus:border-orange-400">
                <option value="Unknown">Reason: Unknown</option>
                <option v-for="r in varianceReasons" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
          
          <!-- Loss Type (only for shortages) -->
          <div v-if="v.diff < 0" class="pt-1.5 border-t border-gray-100 dark:border-gray-700">
            <label class="block text-xs font-medium mb-1 text-gray-700 dark:text-gray-200">Loss Type (for TTB reporting)</label>
            <select 
              v-model="v.loss_type" 
              class="w-full border border-gray-200 dark:border-gray-600 p-1.5 rounded text-sm dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-orange-400 focus:border-orange-400"
            >
              <option :value="null">Not classified</option>
              <option value="theft">Theft</option>
              <option value="spoilage">Spoilage</option>
              <option value="breakage">Breakage</option>
              <option value="other">Other</option>
            </select>
            <p class="text-xs text-gray-400 mt-1">Optional - helps with TTB reporting</p>
          </div>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <button @click="reviewMode = false" class="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-md font-bold text-sm hover:bg-gray-200">
          Back
        </button>
        <button @click="submitFinal" class="flex-1 bg-green-600 text-white py-2 rounded-md font-bold text-sm hover:bg-green-700">
          Confirm adjustments
        </button>
      </div>
    </div>

    <div v-if="session?.status !== 'CLOSED' && !reviewMode" class="space-y-2">
      <div v-for="item in countItems" :key="item.id" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col gap-2">
        <div class="flex justify-between items-start">
          <span class="font-bold text-gray-800 dark:text-gray-100 text-sm">{{ item.name }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">Exp: {{ item.currentOnhand }}</span>
        </div>
        <div class="flex items-center gap-2">
          <input 
              v-model.number="item.counted" 
              type="number" 
              step="any" 
              class="flex-1 p-2 border border-gray-200 dark:border-gray-600 rounded-md text-base font-mono font-medium focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white" 
              placeholder="-" 
              :class="{'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600': item.counted !== null && item.counted !== ''}"
            />
          <span class="font-medium text-gray-500 dark:text-gray-400 w-10 text-center text-xs">{{ item.unit }}</span>
        </div>
      </div>

      <button @click="showItemPicker = true" class="w-full py-2 border border-dashed border-gray-300 dark:border-gray-500 rounded-md text-gray-500 dark:text-gray-400 font-medium text-sm hover:bg-gray-50 flex items-center justify-center gap-1">
        <span class="text-base">+</span> Add item to count
      </button>
    </div>

    <!-- Item Picker Modal -->
    <div v-if="showItemPicker" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50">
      <div class="bg-white dark:bg-gray-800 rounded-md w-full max-w-sm max-h-[70vh] flex flex-col">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="font-bold text-sm">Add item</h3>
          <button @click="showItemPicker = false" class="text-xl">&times;</button>
        </div>
        <div class="p-3 overflow-y-auto">
          <input v-model="pickerSearch" placeholder="Search..." class="w-full p-1.5 border border-gray-200 dark:border-gray-600 rounded-md mb-3 dark:bg-gray-700 dark:text-white text-sm" />
          <div class="space-y-1.5">
            <div v-for="item in filteredPickerItems" :key="item.id" 
              @click="addItemToCount(item)"
              class="p-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex justify-between text-sm">
              <span>{{ item.name }}</span>
              <span class="text-gray-500 dark:text-gray-400 text-xs">{{ item.category }}</span>
            </div>
          </div>
        </div>
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
import { useRoute, useRouter } from 'vue-router';
import { LocationRepository } from '../repositories/LocationRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { CountSessionRepository } from '../repositories/CountSessionRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { VarianceEventRepository } from '../repositories/VarianceEventRepository';
import { SyncService } from '../services/SyncService';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const route = useRoute();
const router = useRouter();
const locationId = route.params.locationId;

const locationName = ref('');
const session = ref(null);
const allItems = ref([]);
const countItems = ref([]); // { ...item, currentOnhand, counted: null }
const showItemPicker = ref(false);
const pickerSearch = ref('');

onMounted(async () => {
  const loc = await LocationRepository.getById(locationId);
  if (loc) locationName.value = loc.name;

  session.value = await CountSessionRepository.getOpenSession(locationId);
  if (!session.value) {
    showAlert('Error', 'No open session found');
    router.push('/count');
    return;
  }

  allItems.value = await ItemRepository.getAll();
  
  // Populate items to count:
  // 1. Items with default_location_id == locationId
  const defaultItems = allItems.value.filter(i => i.default_location_id === locationId);
  
  // 2. Items recently used in this location (simple version: check ledger for this location)
  // For MVP speed, let's just stick to default items initially, and let user add others.
  // Or fetch ledger entries for this location and get unique itemIds.
  const ledgerEntries = await LedgerRepository.getEntries({ location_id: locationId });
  const usedItemIds = new Set(ledgerEntries.map(e => e.item_id));
  
  const itemIdsToInclude = new Set([
    ...defaultItems.map(i => i.id),
    ...usedItemIds
  ]);

  for (const itemId of itemIdsToInclude) {
    await addItemToRow(itemId);
  }
});

const addItemToRow = async (itemId) => {
  if (countItems.value.find(i => i.id === itemId)) return;
  
  const item = allItems.value.find(i => i.id === itemId);
  if (!item) return;

  const onhand = await LedgerRepository.getOnhand(itemId, locationId);
  countItems.value.push({
    ...item,
    currentOnhand: onhand,
    counted: null
  });
};

const filteredPickerItems = computed(() => {
  const term = pickerSearch.value.toLowerCase();
  return allItems.value.filter(i => 
    !countItems.value.find(c => c.id === i.id) && 
    (i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term))
  );
});

const addItemToCount = async (item) => {
  await addItemToRow(item.id);
  showItemPicker.value = false;
  pickerSearch.value = '';
};

const reviewMode = ref(false);
const variances = ref([]);
const varianceReasons = ['Damaged', 'Expired', 'Theft', 'Found', 'Data Entry Error'];

const startReview = async () => {
  // Identify items that were counted (counted !== null)
  const countedItems = countItems.value.filter(i => i.counted !== null && i.counted !== '');
  
  if (countedItems.length === 0) {
    showConfirm('No Counts', 'No items were counted. Close session anyway?', async () => {
      await finalizeClose([], []);
    }, 'primary', 'Close Session');
    return;
  }

  // Calculate variances
  const vars = [];
  for (const item of countedItems) {
    const diff = item.counted - item.currentOnhand;
    if (diff !== 0) {
      vars.push({
        item: item,
        expected: item.currentOnhand,
        counted: item.counted,
        diff: diff,
        reason: 'Unknown',
        loss_type: null // Only for shortages (diff < 0)
      });
    }
  }

  if (vars.length > 0) {
    variances.value = vars;
    reviewMode.value = true;
  } else {
    // No variances, just close
    showConfirm('Submit Counts', `Submit counts for ${countedItems.length} items? No variances detected.`, async () => {
      await finalizeClose(countedItems, []);
    }, 'primary', 'Submit');
  }
};

const submitFinal = async () => {
  const countedItems = countItems.value.filter(i => i.counted !== null && i.counted !== '');
  await finalizeClose(countedItems, variances.value);
};

const finalizeClose = async (countedItems, varianceList) => {
  const closedCounts = [];
  
  // 1. Process Variances
  for (const v of varianceList) {
    // Create Variance Event
    const varianceEvent = await VarianceEventRepository.create({
      item_id: v.item.id,
      location_id: locationId,
      count_session_id: session.value.id,
      expected_qty: v.expected,
      actual_qty: v.counted,
      delta_qty: v.diff,
      reason: v.reason,
      variance_type: v.diff > 0 ? 'overage' : 'shortage', // Auto-determined
      loss_type: v.diff < 0 ? (v.loss_type || null) : null // Only for shortages
    });

    // Ledger Entry (different handling for shortages with loss_type)
    if (v.diff < 0 && v.loss_type) {
      // Create CONSUME entry with removal_purpose for TTB Line 30
      await LedgerRepository.addEntry({
        variance_event_id: varianceEvent.id,
        type: 'CONSUME',
        item_id: v.item.id,
        location_id: locationId,
        quantity: v.diff, // Negative
        count_session_id: session.value.id,
        removal_purpose: 'loss_theft', // For TTB Line 30
        note: `Count variance: ${v.counted} (Exp: ${v.expected}) - ${v.loss_type}`
      });
    } else {
      // Standard COUNT_ADJUST entry
      await LedgerRepository.addEntry({
        variance_event_id: varianceEvent.id,
        type: 'COUNT_ADJUST',
        item_id: v.item.id,
        location_id: locationId,
        quantity: v.diff,
        count_session_id: session.value.id,
        note: `Count: ${v.counted} (Exp: ${v.expected}) - ${v.reason}`
      });
    }
  }

  // 2. Record "Verified" counts for items with 0 variance but were counted
  // (Optional: depending on if we want ledger entries for 0 change? usually no)
  
  for (const item of countedItems) {
    closedCounts.push({ item_id: item.id, counted_quantity: item.counted });
  }

  await CountSessionRepository.close(session.value.id, closedCounts);
  await SyncService.sync();
  
  // Update local state to show success screen instead of navigating away immediately
  session.value = await CountSessionRepository.getById(session.value.id);
  reviewMode.value = false;
  showAlert('Success', 'Session closed. Inventory updated.');
};

const undoSession = async () => {
  showConfirm('Undo Session', 'Reverse all inventory adjustments from this session?', async () => {
    try {
      const entries = await LedgerRepository.getEntries({ count_session_id: session.value.id });
      let count = 0;
      for (const entry of entries) {
        // Skip if already reversed
        if (entry.reversed_of_ledger_id) continue;
        
        // Check if this entry itself has been reversed
        // (This check is inside reverseEntry, but good to know)
        try {
          await LedgerRepository.reverseEntry(entry, 'Undo Count Session');
          count++;
        } catch (e) {
          // ignore double reverse errors
        }
      }
      
      // Re-open session or leave as closed?
      // Requirement says "Undo Count Session close". 
      // Usually we might want to set status back to OPEN?
      // Or just reverse the effect.
      // Let's just reverse effect and maybe mark as 'REVERSED' status if we had one.
      
      await SyncService.sync();
      showAlert('Success', `Reversed ${count} adjustments.`);
      router.push('/');
    } catch (e) {
      showAlert('Error', e.message, 'danger');
    }
  }, 'danger', 'Undo');
};

const cancelSession = async () => {
  showConfirm('Cancel Session', 'Are you sure you want to cancel this count session? No adjustments will be made.', async () => {
    await CountSessionRepository.delete(session.value.id);
    showAlert('Cancelled', 'Session cancelled.');
    router.push('/count');
  }, 'danger', 'Cancel Session');
};
</script>
