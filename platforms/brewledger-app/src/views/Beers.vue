<template>
  <div class="p-3 pb-20 space-y-3">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Beers</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">Manage your finished beer products</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          @click="syncFromRecipes"
          :disabled="syncing"
          class="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-md font-bold text-sm hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          <span v-if="syncing" class="ri-loader-4-line animate-spin"></span>
          {{ syncing ? 'Syncing...' : 'Sync from recipes' }}
        </button>
        <router-link to="/items/add?category=Finished%20Beer" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1">
          <span>+</span> Add Beer
        </router-link>
      </div>
    </div>

    <!-- Sync Message -->
    <div v-if="syncMessage" class="rounded-lg border p-3 text-sm" :class="{
      'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-800 dark:text-green-200': syncMessage.type === 'success',
      'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200': syncMessage.type === 'error',
      'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-200': syncMessage.type === 'info'
    }">
      {{ syncMessage.text }}
    </div>

    <!-- Empty State -->
    <div v-if="!loading && beers.length === 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 text-center">
      <div class="text-4xl mb-3">🍺</div>
      <h3 class="font-bold text-gray-900 dark:text-gray-100 mb-2">No beers yet</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Create beers from your recipes or add them manually. Beers are used for production tracking and TTB reporting.
      </p>
      <div class="flex flex-col sm:flex-row gap-2 justify-center">
        <button @click="syncFromRecipes" :disabled="syncing" class="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-md font-medium text-sm hover:bg-purple-200 disabled:opacity-50">
          {{ syncing ? 'Syncing...' : 'Create beers from recipes' }}
        </button>
        <router-link to="/items/add?category=Finished%20Beer" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm">
          Add Beer Manually
        </router-link>
      </div>
    </div>

    <!-- Beer List -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Search -->
      <div class="p-3 border-b border-gray-100 dark:border-gray-700">
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-2 flex items-center text-gray-400 dark:text-gray-500 text-sm">🔍</span>
          <input
            v-model="search"
            placeholder="Search beers..."
            class="w-full pl-8 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>

      <!-- List -->
      <div v-if="filteredBeers.length === 0" class="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        No beers match your search
      </div>
      <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
        <div v-for="beer in sortedBeers" :key="beer.id" class="p-3 hover:bg-gray-50 dark:hover:bg-gray-900/50">
          <div class="flex items-start justify-between gap-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-gray-900 dark:text-gray-100 truncate">{{ beer.name }}</h3>
                <span class="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-xs rounded-full shrink-0">
                  Beer
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <span>Unit: {{ beer.unit || 'bbl' }}</span>
                <span v-if="beer.recipeName" class="flex items-center gap-1">
                  <span>•</span>
                  <span>Recipe: {{ beer.recipeName }}</span>
                </span>
              </div>
              <div v-if="beer.isDefault" class="text-xs text-amber-600 dark:text-amber-400">
                ⚠️ Default beer item (required for TTB - cannot delete)
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <router-link
                :to="`/items/${beer.id}/edit?from=beers`"
                class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1"
                title="Edit"
              >
                <span class="text-lg">✏️</span>
              </router-link>
              <button
                v-if="canDeleteBeer(beer)"
                @click="confirmDelete(beer)"
                class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                title="Delete"
              >
                <span class="text-lg">🗑️</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Loading beers...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ItemRepository } from '../repositories/ItemRepository'
import { RecipeRepository } from '../repositories/RecipeRepository'
import { SyncService } from '../services/SyncService'

const router = useRouter()

const BEER_CATEGORY_NAME = 'Finished Beer'
const DEFAULT_FINISHED_BEER_NAME = 'Finished Beer'

const beers = ref([])
const recipes = ref([])
const search = ref('')
const syncing = ref(false)
const loading = ref(false)
const syncMessage = ref(null)

const addBeerPath = `/items/add?category=${encodeURIComponent(BEER_CATEGORY_NAME)}`

const filteredBeers = computed(() => {
  if (!search.value.trim()) return beers.value
  const term = search.value.toLowerCase()
  return beers.value.filter(b =>
    (b.name && b.name.toLowerCase().includes(term)) ||
    (b.recipeName && b.recipeName.toLowerCase().includes(term))
  )
})

const sortedBeers = computed(() => {
  return [...filteredBeers.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

const canDeleteBeer = (beer) => {
  return !(beer.name === DEFAULT_FINISHED_BEER_NAME && beer.category === BEER_CATEGORY_NAME)
}

const confirmDelete = (beer) => {
  if (!canDeleteBeer(beer)) return
  if (!window.confirm(`Delete "${beer.name}"? This will clear all inventory of this item.`)) return
  deleteBeer(beer.id)
}

async function deleteBeer(id) {
  try {
    await ItemRepository.delete(id)
    await SyncService.sync()
    await loadData()
  } catch (e) {
    window.alert('Error: ' + (e.message || 'Could not delete beer'))
  }
}

/** Ensure every recipe has a corresponding Finished Beer item (create if missing). One beer per recipe, even if names duplicate. */
async function syncFromRecipes() {
  syncing.value = true
  syncMessage.value = null
  try {
    const allRecipes = await RecipeRepository.getAll()
    const existingBeers = await ItemRepository.getBeerItems()
    const byRecipeId = new Map(existingBeers.filter(b => b.recipe_id).map(b => [b.recipe_id, b]))

    let created = 0
    for (const recipe of allRecipes) {
      if (!recipe.id || byRecipeId.has(recipe.id)) continue
      const name = (recipe.name && recipe.name.trim()) ? recipe.name.trim() : null
      if (!name) continue

      const newItem = await ItemRepository.create({
        name,
        category: BEER_CATEGORY_NAME,
        unit: 'bbl',
        recipe_id: recipe.id
      })
      created++
      byRecipeId.set(recipe.id, newItem)
    }

    if (created > 0) {
      await SyncService.sync()
      syncMessage.value = { type: 'success', text: `Created ${created} beer(s) from recipes.` }
    } else if (allRecipes.length === 0) {
      syncMessage.value = { type: 'info', text: 'No recipes found. Create recipes first or add a beer manually.' }
    } else {
      syncMessage.value = { type: 'info', text: 'All recipes already have corresponding beers.' }
    }

    await loadData()
  } catch (e) {
    syncMessage.value = { type: 'error', text: e.message || 'Could not sync beers from recipes.' }
  } finally {
    syncing.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const [beerList, recipeList] = await Promise.all([
      ItemRepository.getBeerItems(),
      RecipeRepository.getAll()
    ])
    const recipeById = new Map(recipeList.map(r => [r.id, r]))
    beers.value = beerList.map(b => ({
      ...b,
      recipeName: b.recipe_id ? (recipeById.get(b.recipe_id)?.name || null) : null,
      isDefault: b.name === DEFAULT_FINISHED_BEER_NAME && b.category === BEER_CATEGORY_NAME
    }))
    recipes.value = recipeList
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
