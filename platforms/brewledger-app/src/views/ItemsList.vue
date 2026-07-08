
<template>

  <div class="p-3 pb-20 space-y-3">

    <div class="flex justify-between items-center">

      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Items</h1>

        <p class="text-xs text-gray-500 dark:text-gray-400">Ingredients and materials</p>

      </div>
      <div class="flex items-center gap-2">

        <router-link to="/beers" class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-md font-bold text-sm hover:bg-purple-200 flex items-center gap-1">

          <span>🍻</span> Beers
        </router-link>

        <router-link to="/items/add" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1">
          <span>+</span> Add
        </router-link>

      </div>
    </div>


    <!-- Search -->
    <div class="relative">
      <span class="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-gray-400 dark:text-gray-300 text-sm">🔍</span>
      <input
        v-model="search"
        placeholder="Search items..."
        class="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white"
      />
    </div>

    <!-- Ingredients (non-beer); main dropdown stays ingredient-focused -->
    <div v-if="filteredIngredientItems.length > 0" class="space-y-2">
      <h2 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mt-2">Ingredients</h2>
      <div v-for="item in filteredIngredientItems" :key="item.id" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div>
          <h3 class="font-bold text-sm text-gray-800 dark:text-gray-100">{{ item.name }}</h3>
          <div class="flex items-center gap-1.5 mt-1">
            <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded">{{ item.category }}</span>
            <span class="text-gray-400 dark:text-gray-300 text-xs">•</span>
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ item.unit }}</span>
          </div>
          <p v-if="item.reorder_threshold" class="text-xs text-orange-600 dark:text-orange-400 mt-1">Threshold: {{ item.reorder_threshold }}</p>
        </div>
        <div>
          <router-link :to="`/items/${item.id}/edit`" class="text-gray-400 dark:text-gray-300 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium">
            Edit
          </router-link>
        </div>
      </div>
    </div>


    <!-- Note: Beer items are managed on the dedicated Beers page -->


    <div v-if="filteredItems.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
      No items found
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ItemRepository } from '../repositories/ItemRepository';

const items = ref([]);
const search = ref('');

const beerCategoryName = 'Finished Beer';
const ingredientItems = computed(() => items.value.filter(i => i.category !== beerCategoryName));
const beerItems = computed(() => items.value.filter(i => i.category === beerCategoryName));


// Beer items are now managed separately on /beers page

const filteredIngredientItems = computed(() => {
  if (!search.value) return ingredientItems.value;
  const term = search.value.toLowerCase();
  return ingredientItems.value.filter(i =>
    i.name.toLowerCase().includes(term) ||
    (i.category && i.category.toLowerCase().includes(term))
  );
});
const filteredBeerItems = computed(() => {
  if (!search.value) return beerItems.value;
  const term = search.value.toLowerCase();
  return beerItems.value.filter(i =>
    i.name.toLowerCase().includes(term) ||
    (i.category && i.category.toLowerCase().includes(term))
  );
});

onMounted(async () => {
  items.value = await ItemRepository.getAll();
});
</script>
