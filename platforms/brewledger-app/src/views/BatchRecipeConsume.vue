<template>
  <div class="p-4 pb-24">
    <h1 class="text-2xl font-bold mb-2">Consume Ingredients</h1>
    <p v-if="recipe" class="text-gray-600 dark:text-gray-300 mb-6">Recipe: {{ recipe.name }}</p>

    <div v-if="loading" class="text-center py-8">Loading...</div>

    <form v-else @submit.prevent="submit" class="space-y-6">
      <div v-for="(item, index) in items" :key="item.id" class="bg-white dark:bg-gray-800 p-4 rounded shadow border border-gray-100 dark:border-gray-700">
        <div class="flex justify-between items-start mb-2">
          <div>
            <div class="font-bold text-lg">{{ getItemName(item.item_id) }}</div>
            <div class="text-blue-600 dark:text-blue-400 font-bold">
              Required: {{ item.quantity }} {{ item.unit }}
            </div>
          </div>
          <div v-if="selections[index]?.alreadyConsumed" class="text-green-500 font-bold">✓ Already Added</div>
          <div v-else-if="getStatus(index).valid" class="text-green-500 font-bold">✓ Ready</div>
          <div v-else class="text-red-500 font-bold">⚠ Issue</div>
        </div>

        <!-- Already consumed message -->
        <div v-if="selections[index]?.alreadyConsumed" class="mt-3 text-sm text-green-600 dark:text-green-400">
          This ingredient was already added to the batch. Quantity consumed: {{ selections[index].consumedQty }} {{ item.unit }}
        </div>

        <!-- Location Selection -->
        <div v-else class="mt-3">
          <label class="block text-sm font-medium mb-1">Source Location</label>
          <select 
            v-model="selections[index].location_id" 
            class="w-full border p-2 rounded bg-white dark:bg-gray-800"
            :class="{'border-red-500': !getStatus(index).valid && selections[index]?.location_id}"
          >
            <option :value="null" disabled>Select location...</option>
            <option v-for="loc in getAvailableLocations(item.item_id)" :key="loc.id" :value="loc.id">
              {{ loc.name }} (Available: {{ loc.quantity }})
            </option>
          </select>
          
          <!-- Validation Message -->
          <div v-if="selections[index]?.location_id" class="mt-1 text-sm">
            <span v-if="!getStatus(index).hasEnough" class="text-red-600 dark:text-red-400 font-bold">
              Insufficient stock! Need {{ item.quantity }}, have {{ getLocationStock(item.item_id, selections[index].location_id) }}.
            </span>
            <span v-else class="text-green-600 dark:text-green-400">
              Stock available.
            </span>
          </div>
          <div v-else class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Select a location to withdraw stock from.
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4">
        <button type="button" @click="refreshStock" class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg">
          Refresh Stock
        </button>
        <button type="button" @click="skip" class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-lg">
          Skip Consumption
        </button>
        <button
          type="submit"
          :disabled="!allValid || submitting"
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Processing...' : 'Consume & Start Brew' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, inject, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { SyncService } from '../services/SyncService';
import { BatchCostService } from '../services/BatchCostService';
import { BatchRepository } from '../repositories/BatchRepository';

const route = useRoute();
const router = useRouter();
const { confirm: confirmModal, alert: alertModal } = inject('modal');

const batchId = route.params.batchId;
const recipeId = route.params.recipeId;

const batch = ref(null);
const recipe = ref(null);
const items = ref([]);
const allItems = ref([]);
const allLocations = ref([]);
const vessels = ref([]);
const onhandCache = ref([]);
const existingConsumes = ref([]);
const loading = ref(true);
const submitting = ref(false);

const selections = reactive({}); // { index: { location_id: ... } }

const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
);

const loadData = async () => {
  try {
    const [batchData, recipeData, itemsData, itemsList, locsList, vesselsList, onhandData, ledgerEntries] = await Promise.all([
      BatchRepository.getById(batchId),
      RecipeRepository.getById(recipeId),
      RecipeRepository.getItems(recipeId),
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      VesselRepository.getAll(),
      LedgerRepository.getAllOnhand(),
      LedgerRepository.getEntries({ batch_id: batchId })
    ]);
    
    // Track existing CONSUME entries to prevent double-consumption
    existingConsumes.value = ledgerEntries.filter(e => e.type === 'CONSUME' && !e.reversed);
    
    batch.value = batchData;
    recipe.value = recipeData;
    items.value = itemsData;
    allItems.value = itemsList;
    allLocations.value = locsList;
    vessels.value = vesselsList || [];
    onhandCache.value = onhandData;

    // Init selections
    items.value.forEach((item, index) => {
      if (!selections[index]) selections[index] = { location_id: null };
      
      // Check if this item was already consumed for this batch
      const alreadyConsumed = existingConsumes.value.filter(e => e.item_id === item.item_id);
      const consumedQty = alreadyConsumed.reduce((sum, e) => sum + Math.abs(e.quantity), 0);
      const requiredQty = getRequiredQty(item.quantity);
      
      // Mark as completed if already fully consumed
      if (consumedQty >= requiredQty) {
        selections[index].alreadyConsumed = true;
        selections[index].consumedQty = consumedQty;
      } else {
        // Auto-select if only one location has stock (and enough) and none currently selected
        if (!selections[index].location_id) {
          const avail = getAvailableLocations(item.item_id);
          const valid = avail.filter(l => l.quantity >= item.quantity);
          if (valid.length === 1) {
            selections[index].location_id = valid[0].id;
          } else if (avail.length === 1) {
             // Auto select even if not enough, to show error
             selections[index].location_id = avail[0].id;
          }
        }
      }
    });

  } catch (e) {
    console.error(e);
    alert('Error loading data');
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

// Refresh onhand cache when returning to this page (e.g., after adding ingredients)
watch(() => route.path, (newPath, oldPath) => {
  if (newPath.includes(`/batches/${batchId}/consume`) && !oldPath?.includes(`/batches/${batchId}/consume`)) {
    refreshStock();
  }
});

const refreshStock = async () => {
  try {
    const [onhandData, ledgerEntries] = await Promise.all([
      LedgerRepository.getAllOnhand(),
      LedgerRepository.getEntries({ batch_id: batchId })
    ]);
    onhandCache.value = onhandData;

    // Update existingConsumes to catch manual additions
    existingConsumes.value = ledgerEntries.filter(e => e.type === 'CONSUME' && !e.reversed);

    // Re-check each item's alreadyConsumed status
    items.value.forEach((item, index) => {
      const alreadyConsumed = existingConsumes.value.filter(e => e.item_id === item.item_id);
      const consumedQty = alreadyConsumed.reduce((sum, e) => sum + Math.abs(e.quantity), 0);
      const requiredQty = getRequiredQty(item.quantity);

      if (consumedQty >= requiredQty) {
        selections[index].alreadyConsumed = true;
        selections[index].consumedQty = consumedQty;
      }

      // Re-validate current selections against new stock levels
      const locId = selections[index]?.location_id;
      if (locId) {
        const stock = getLocationStock(item.item_id, locId);
        const required = getRequiredQty(item.quantity);
        // Clear selection if no longer has enough stock
        if (stock < required) {
          selections[index].location_id = null;
        }
      }
    });
  } catch (e) {
    console.error('Failed to refresh stock:', e);
    alert('Failed to refresh stock data');
  }
};

const getItemName = (id) => {
  const i = allItems.value.find(x => x.id === id);
  return i ? i.name : 'Unknown';
};

const getLocationName = (id) => {
  const l = allLocations.value.find(x => x.id === id);
  return l ? l.name : 'Unknown';
};

const getAvailableLocations = (itemId) => {
  const exclude = nonServingTankLocationIds.value;
  return onhandCache.value
    .filter(c => c.item_id === itemId && c.quantity > 0 && !exclude.has(c.location_id))
    .map(c => ({
      id: c.location_id,
      name: getLocationName(c.location_id),
      quantity: c.quantity
    }));
};

const getLocationStock = (itemId, locationId) => {
  const entry = onhandCache.value.find(c => c.item_id === itemId && c.location_id === locationId);
  return entry ? entry.quantity : 0;
};

const scaleFactor = computed(() => {
  if (!batch.value || !recipe.value) return 1;
  const planned = parseFloat(batch.value.total_theoretical_volume ?? batch.value.planned_volume);
  const base = parseFloat(recipe.value.base_volume);
  
  if (!planned || !base || base === 0) return 1;
  return planned / base;
});

const getRequiredQty = (itemQty) => {
  return parseFloat((itemQty * scaleFactor.value).toFixed(2)); // Round to 2 decimals
};

const getStatus = (index) => {
  const item = items.value[index];
  if (!item) return { valid: false, hasEnough: false };
  const selection = selections[index];
  if (!selection) return { valid: false, hasEnough: false };
  
  // Already consumed via manual addition - skip this item
  if (selection.alreadyConsumed) {
    return { valid: true, hasEnough: true, alreadyConsumed: true };
  }
  
  const locId = selection.location_id;
  const required = getRequiredQty(item.quantity);
  
  if (!locId) return { valid: false, hasEnough: false };
  
  const stock = getLocationStock(item.item_id, locId);
  const hasEnough = stock >= required;
  
  return { valid: hasEnough, hasEnough, alreadyConsumed: false };
};

const allValid = computed(() => {
  if (items.value.length === 0) return true;
  // Ensure all items have a valid selection
  return items.value.every((item, index) => {
    const status = getStatus(index);
    return status.valid;
  });
});

const skip = () => {
  confirmModal(
    'Skip Consumption?',
    'Are you sure you want to skip consuming ingredients? Inventory will not be deducted.',
    () => {
      router.replace(`/batches/${batchId}`);
    },
    'danger',
    'Skip'
  );
};

const submit = async () => {
  if (!allValid.value || submitting.value) return;
  submitting.value = true;

  try {
    // Process consumption
    for (let i = 0; i < items.value.length; i++) {
      // Skip items that were already consumed manually
      if (selections[i]?.alreadyConsumed) continue;

      const item = items.value[i];
      const locId = selections[i].location_id;
      const qty = getRequiredQty(item.quantity);

      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: item.item_id,
        location_id: locId,
        batch_id: batchId,
        quantity: -qty, // Negative for consumption
        note: `Recipe: ${recipe.value.name} (Scaled ${scaleFactor.value.toFixed(2)}x)`
      });
    }

    await BatchCostService.computeAndStore(batchId);
    await SyncService.sync();
    router.replace(`/batches/${batchId}`);
  } catch (e) {
    alertModal('Error', 'Failed to process consumption: ' + e.message, 'danger');
  } finally {
    submitting.value = false;
  }
};
</script>
