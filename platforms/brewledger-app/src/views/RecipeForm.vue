<template>
  <div class="p-3 pb-20">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50 mb-3">{{ isEdit ? 'Edit recipe' : 'New recipe' }}</h1>

    <form @submit.prevent="save" class="space-y-3">
      <!-- Basic Info -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Name</label>
          <input v-model="form.name" type="text" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-pink-500 focus:border-pink-500" placeholder="e.g. IPA #7" />
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Base volume</label>
            <input v-model.number="form.base_volume" type="number" step="any" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-pink-500 focus:border-pink-500" placeholder="e.g. 10" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Unit</label>
            <input v-model="form.base_volume_unit" type="text" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-pink-500 focus:border-pink-500" placeholder="bbl">
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Description</label>
          <textarea v-model="form.description" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm" rows="2" placeholder="Optional notes..."></textarea>
        </div>
      </div>

      <!-- Ingredients -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-center mb-2">
          <h2 class="text-sm font-bold text-gray-900 dark:text-gray-50">Ingredients</h2>
          <button type="button" @click="openItemModal" class="text-xs bg-pink-50 dark:bg-pink-900/30 text-pink-700 px-2 py-1 rounded-md font-bold hover:bg-pink-100">
            + Add item
          </button>
        </div>

        <div v-if="form.items.length === 0" class="text-center py-4 text-gray-400 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-900 rounded-md border border-dashed border-gray-200 dark:border-gray-600">
          No ingredients added
        </div>

        <div v-else class="space-y-2">
          <div v-for="(item, index) in form.items" :key="index" class="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <div>
              <div class="font-bold text-sm text-gray-800 dark:text-gray-100">{{ getItemName(item.item_id) }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                <span class="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 font-mono font-medium">{{ item.quantity }}</span> {{ item.unit }}
              </div>
            </div>
            <button type="button" @click="removeItem(index)" class="w-6 h-6 flex items-center justify-center bg-red-50 dark:bg-red-900/30 text-red-500 rounded text-xs hover:bg-red-100">
              ×
            </button>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-1">
        <button type="button" @click="$router.back()" class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md font-bold text-sm">
          Cancel
        </button>
        <button type="submit" class="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 font-bold text-sm">
          {{ isEdit ? 'Update recipe' : 'Create recipe' }}
        </button>
      </div>
    </form>

    <!-- Add Item Modal -->
    <div v-if="showItemModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div class="bg-white dark:bg-gray-800 rounded-md p-4 w-full max-w-sm max-h-[80vh] overflow-y-auto">
        <h3 class="text-base font-bold mb-4 text-gray-900 dark:text-gray-50">Add ingredient</h3>
        
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Item</label>
          <div class="relative">
            <select v-model="newItem.item_id" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm">
              <option value="" disabled>Select item...</option>
              <option v-for="item in availableItems" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
            <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-500 dark:text-gray-400 text-sm">▼</div>
          </div>
        </div>

        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Quantity</label>
          <input v-model.number="newItem.quantity" type="number" step="any" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm" placeholder="e.g. 5.25" />
        </div>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Unit</label>
          <input v-model="newItem.unit" type="text" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white focus:ring-1 focus:ring-pink-500 focus:border-pink-500 text-sm" placeholder="e.g. lb" />
        </div>

        <div class="flex gap-2">
          <button type="button" @click="showItemModal = false" class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-bold text-sm hover:bg-gray-200">
            Cancel
          </button>
          <button type="button" @click="addItem" class="flex-1 px-3 py-2 bg-pink-600 text-white rounded-md font-bold text-sm hover:bg-pink-700">
            Add
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { SyncService } from '../services/SyncService';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => route.params.id !== undefined);

const allItems = ref([]);
const showItemModal = ref(false);

const form = reactive({
  name: '',
  base_volume: null,
  base_volume_unit: '',
  description: '',
  items: []
});

const newItem = reactive({
  item_id: '',
  quantity: '',
  unit: ''
});

// Load data
onMounted(async () => {
  allItems.value = await ItemRepository.getAll();

  if (isEdit.value) {
    const recipe = await RecipeRepository.getById(route.params.id);
    if (recipe) {
      form.name = recipe.name;
      form.base_volume = recipe.base_volume;
      form.base_volume_unit = recipe.base_volume_unit;
      form.description = recipe.description;
      const items = await RecipeRepository.getItems(recipe.id);
      form.items = items.map(i => ({
        item_id: i.item_id,
        quantity: i.quantity,
        unit: i.unit
      }));
    }
  }
});

const availableItems = computed(() => {
  return allItems.value.sort((a, b) => a.name.localeCompare(b.name));
});

const getItemName = (id) => {
  const item = allItems.value.find(i => i.id === id);
  return item ? item.name : 'Unknown Item';
};

// Update unit when item selected
watch(() => newItem.item_id, (newId) => {
  if (newId) {
    const item = allItems.value.find(i => i.id === newId);
    if (item) newItem.unit = item.unit;
  }
});

const openItemModal = () => {
  newItem.item_id = '';
  newItem.quantity = '';
  newItem.unit = '';
  showItemModal.value = true;
};

const addItem = () => {
  if (newItem.item_id && newItem.quantity) {
    form.items.push({ ...newItem });
    showItemModal.value = false;
  }
};

const removeItem = (index) => {
  form.items.splice(index, 1);
};

const save = async () => {
  if (form.items.length === 0) {
    if (!confirm('This recipe has no ingredients. Save anyway?')) return;
  }

  try {
    if (isEdit.value) {
      await RecipeRepository.update(route.params.id, {
        name: form.name,
        base_volume: form.base_volume,
        base_volume_unit: form.base_volume_unit,
        description: form.description
      }, form.items);
    } else {
      await RecipeRepository.create({
        name: form.name,
        base_volume: form.base_volume,
        base_volume_unit: form.base_volume_unit,
        description: form.description
      }, form.items);
    }
    
    await SyncService.sync();
    router.replace('/recipes');
  } catch (e) {
    alert('Failed to save recipe: ' + e.message);
  }
};
</script>
