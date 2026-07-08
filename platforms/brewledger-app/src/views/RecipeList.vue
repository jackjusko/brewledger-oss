<template>
  <div class="p-3 pb-20 space-y-3">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Recipes</h1>
      <router-link to="/recipes/add" class="bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1">
        <span>+</span> New
      </router-link>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
      Loading...
    </div>

    <div v-else-if="recipes.length === 0" class="text-center py-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="text-3xl mb-2">📖</div>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">No recipes</p>
      <router-link to="/recipes/add" class="text-pink-600 dark:text-pink-400 font-medium text-sm">Create first recipe</router-link>
    </div>

    <div v-else class="grid gap-2">
      <div v-for="recipe in recipes" :key="recipe.id" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-sm text-gray-900 dark:text-gray-50">{{ recipe.name }}</h3>
            <p v-if="recipe.description" class="text-gray-500 dark:text-gray-400 text-xs mt-0.5 line-clamp-2">{{ recipe.description }}</p>
            
            <div class="flex items-center gap-2 mt-2">
              <div v-if="recipe.base_volume" class="bg-pink-50 dark:bg-pink-900/30 text-pink-700 px-1.5 py-0.5 rounded text-xs">
                Vol: {{ recipe.base_volume }} {{ recipe.base_volume_unit }}
              </div>
              <div class="text-xs text-gray-400 dark:text-gray-300">
                {{ recipe.itemCount }} ingredients
              </div>
            </div>
          </div>
          
          <div class="flex gap-1">
            <router-link :to="`/recipes/${recipe.id}/edit`" class="p-1 text-gray-400 dark:text-gray-300 hover:text-blue-600 text-sm">
              ✏️
            </router-link>
            <button @click="confirmDelete(recipe)" class="p-1 text-gray-400 dark:text-gray-300 hover:text-red-500 text-sm">
              🗑️
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 w-full max-w-sm">
        <h3 class="text-base font-bold mb-3 text-gray-900 dark:text-gray-50">Delete recipe</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Delete "{{ recipeToDelete?.name }}"?
          This cannot be undone.
        </p>
        <div class="flex gap-2">
          <button @click="showDeleteModal = false" class="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md font-bold text-sm hover:bg-gray-200">
            Cancel
          </button>
          <button @click="deleteRecipe" class="flex-1 px-3 py-2 bg-red-600 text-white rounded-md font-bold text-sm hover:bg-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { SyncService } from '../services/SyncService';

const recipes = ref([]);
const loading = ref(true);
const showDeleteModal = ref(false);
const recipeToDelete = ref(null);

const loadRecipes = async () => {
  loading.value = true;
  try {
    const data = await RecipeRepository.getAll();
    // Load item counts for display
    const enriched = await Promise.all(data.map(async r => {
      const items = await RecipeRepository.getItems(r.id);
      return { ...r, itemCount: items.length };
    }));
    recipes.value = enriched.sort((a, b) => a.name.localeCompare(b.name));
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRecipes();
});

const confirmDelete = (recipe) => {
  recipeToDelete.value = recipe;
  showDeleteModal.value = true;
};

const deleteRecipe = async () => {
  if (!recipeToDelete.value) return;
  
  try {
    await RecipeRepository.delete(recipeToDelete.value.id);
    await SyncService.sync();
    await loadRecipes();
    showDeleteModal.value = false;
    recipeToDelete.value = null;
  } catch (e) {
    alert('Failed to delete recipe: ' + e.message);
  }
};
</script>
