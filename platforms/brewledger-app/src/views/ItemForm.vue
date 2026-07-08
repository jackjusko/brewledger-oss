<template>
  <div class="p-4 pb-24">
    <h1 class="text-2xl font-bold mb-4">{{ isEdit ? 'Edit Item' : 'Add Item' }}</h1>

    <form @submit.prevent="save" class="space-y-4">
      <div>
        <label class="block font-medium mb-1">Name</label>
        <input v-model="form.name" required class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
      </div>

      <div>
        <label class="block font-medium mb-1">Category</label>
        <select v-model="form.category" required class="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
          <option v-for="cat in categories" :key="cat.id" :value="cat.name">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div>
        <label class="block font-medium mb-1">Unit</label>
        <select v-model="form.unit" required class="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
          <option value="lb">lb</option>
          <option value="oz">oz</option>
          <option value="kg">kg</option>
          <option value="g">g</option>
          <option value="each">each</option>
          <option value="ea">ea</option>
          <option value="bbl">bbl</option>
          <option value="gal">gal</option>
          <option value="L">L</option>
        </select>
      </div>

      <div v-if="form.category === 'Finished Beer' && (form.unit === 'ea' || form.unit === 'each')">
        <label class="block font-medium mb-1">Volume per unit (bbl)</label>
        <input v-model.number="form.volume_per_unit" type="number" min="0" step="0.01" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 0.16 for 1/6 bbl keg">
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">For TTB conversion. E.g. 0.16 for 1/6 bbl keg, 0.5 for 1/2 bbl.</p>
      </div>

      <div>
        <label class="block font-medium mb-1">Vendor (optional)</label>
        <input v-model="form.vendor" class="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white" placeholder="e.g. Crisp, BSG, Muntons" />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block font-medium mb-1">Default Unit Cost</label>
          <input v-model.number="form.default_unit_cost" type="number" min="0" step="0.01" class="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 2.50" />
        </div>
        <div>
          <label class="block font-medium mb-1">Currency</label>
          <select v-model="form.currency" class="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
            <option value="USD">USD</option>
            <option value="CAD">CAD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div>
        <label class="block font-medium mb-1">Default Location</label>
        <select v-model="form.default_location_id" class="w-full p-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
          <option :value="null">-- None --</option>
          <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
        </select>
      </div>

      <div class="pt-4 flex gap-4">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-3 rounded font-bold">Save</button>
        <button type="button" @click="$router.back()" class="px-4 py-3 border rounded">Cancel</button>
      </div>

      <div v-if="isEdit && !isDefaultFinishedBeerItem" class="pt-8 border-t mt-8">
        <button type="button" @click="remove" class="w-full bg-red-100 text-red-700 py-3 rounded font-bold">Delete Item</button>
      </div>
      <div v-else-if="isEdit && isDefaultFinishedBeerItem" class="pt-8 border-t mt-8">
        <p class="text-sm text-gray-600 dark:text-gray-400">The default Finished Beer item cannot be deleted. It is required for TTB reporting and production tracking.</p>
      </div>
    </form>

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
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SyncService } from '../services/SyncService';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const route = useRoute();
const router = useRouter();
const allLocations = ref([]);
const vessels = ref([]);
const categories = ref([]);
const isEdit = computed(() => !!route.params.id);

const form = ref({
  name: '',
  category: '',
  unit: 'lb',
  vendor: '',
  default_location_id: null,
  default_unit_cost: 0,
  currency: 'USD',
  volume_per_unit: null
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

const loadedItem = ref(null);
const isDefaultFinishedBeerItem = computed(() =>
  isEdit.value && loadedItem.value?.name === 'Finished Beer' && loadedItem.value?.category === 'Finished Beer'
);


onMounted(async () => {
  const [locsList, vesselsList, catsList] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    CategoryRepository.getAll()
  ]);
  allLocations.value = locsList || [];
  vessels.value = vesselsList || [];
  categories.value = catsList || [];



  if (isEdit.value) {

    const item = await ItemRepository.getById(route.params.id);

    loadedItem.value = item;

    if (item) {
      form.value = {
        ...item,
        volume_per_unit: item.data?.volume_per_unit ?? null
      };
    }

  } else {

    // Check if category is specified in query params (e.g., from Beers page)
    const categoryFromQuery = route.query.category;

    if (categoryFromQuery && categories.value.some(c => c.name === categoryFromQuery)) {
      form.value.category = categoryFromQuery;
    } else if (categories.value.length > 0) {
      form.value.category = categories.value[0].name;

    }

  }

});


const save = async () => {
  if (isEdit.value) {
    await ItemRepository.update(route.params.id, form.value);
  } else {
    await ItemRepository.create(form.value);
  }
  SyncService.sync();
  router.back();
};

const remove = async () => {
  showConfirm('Delete Item', 'Are you sure? This will instantly clear all inventory of this item from all locations.', async () => {
    try {
      await ItemRepository.delete(route.params.id);
      SyncService.sync();
      router.back();
    } catch (e) {
      showAlert('Error', e.message, 'danger');
    }
  }, 'danger', 'Delete & Clear Inventory');
};
</script>
