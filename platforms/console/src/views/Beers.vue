<template>
  <div class="desktop-container">
    <div class="console-page-header">
      <div>
        <h1 class="console-page-title">Beers</h1>
        <p class="console-page-desc">Manage your brewery’s finished beer products. Beers are items in the Finished Beer category used for production, removals, and TTB reporting.</p>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          @click="ensureBeersFromRecipes"
          :disabled="syncingRecipes"
          class="btn btn-secondary text-sm inline-flex items-center gap-2"
        >
          <i v-if="syncingRecipes" class="ri-loader-4-line animate-spin" aria-hidden="true"></i>
          {{ syncingRecipes ? 'Syncing…' : 'Sync from recipes' }}
        </button>
        <router-link :to="addBeerPath" class="btn btn-primary inline-flex items-center gap-2">
          <i class="ri-add-line" aria-hidden="true"></i>
          Add Beer
        </router-link>
      </div>
    </div>

    <div v-if="syncMessage" class="mb-4 rounded-xl border p-4" :class="syncMessage.type === 'error' ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-700 text-danger-800 dark:text-danger-200' : syncMessage.type === 'success' ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-700 text-success-800 dark:text-success-200' : 'bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'">
      <p class="text-sm font-medium">{{ syncMessage.text }}</p>
    </div>

    <div v-if="emptyStateMessage" class="card console-empty">
      <i class="ri-beer-line console-empty-icon" aria-hidden="true"></i>
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">{{ emptyStateMessage }}</p>
      <div class="flex flex-wrap justify-center gap-3">
        <button type="button" @click="ensureBeersFromRecipes" :disabled="syncingRecipes" class="btn btn-secondary">
          {{ syncingRecipes ? 'Syncing…' : 'Create beers from recipes' }}
        </button>
        <router-link :to="addBeerPath" class="btn btn-primary inline-flex items-center gap-2">
          <i class="ri-add-line" aria-hidden="true"></i>
          Add Beer manually
        </router-link>
      </div>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="card-header flex items-center justify-between gap-4">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">Finished Beer products</h2>
        <div class="relative">
          <i class="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" aria-hidden="true"></i>
          <input
            v-model="search"
            type="text"
            placeholder="Search beers..."
            class="input w-64 pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>
      <div class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit</th>
              <th>Linked recipe</th>
              <th class="w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="beer in sortedBeers" :key="beer.id" class="group border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              <td class="font-semibold text-neutral-900 dark:text-neutral-100">{{ beer.name }}</td>
              <td class="text-neutral-600 dark:text-neutral-400">{{ beer.unit || 'bbl' }}</td>
              <td>
                <span v-if="beer.recipeName" class="text-neutral-700 dark:text-neutral-300">{{ beer.recipeName }}</span>
                <span v-else class="text-neutral-400">—</span>
              </td>
              <td class="text-right">
                <router-link :to="`/items/${beer.id}/edit?from=beers`" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-3">
                  Edit
                </router-link>
                <button
                  v-if="canDeleteBeer(beer)"
                  type="button"
                  @click="confirmDelete(beer)"
                  class="text-sm font-medium text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300"
                >
                  Delete
                </button>
                <span v-else class="text-xs text-neutral-400">Required for TTB</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ItemRepository } from '../repositories/ItemRepository'
import { RecipeRepository } from '../repositories/RecipeRepository'
import { useSync } from '../composables/useSync'
import { SyncService } from '../services/SyncService'

const BEER_CATEGORY_NAME = 'Finished Beer'
const DEFAULT_FINISHED_BEER_NAME = 'Finished Beer'

const beers = ref([])
const recipes = ref([])
const search = ref('')
const syncingRecipes = ref(false)
const syncMessage = ref(null)
const { syncTrigger } = useSync()

const addBeerPath = '/items/add?category=' + encodeURIComponent(BEER_CATEGORY_NAME)

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

const emptyStateMessage = computed(() => {
  if (beers.value.length > 0) return null
  return 'No beers yet. Add a beer manually or create beers from your recipes (each recipe becomes one finished beer product).'
})

function canDeleteBeer(beer) {
  return !(beer.name === DEFAULT_FINISHED_BEER_NAME && beer.category === BEER_CATEGORY_NAME)
}

function confirmDelete(beer) {
  if (!canDeleteBeer(beer)) return
  if (!window.confirm(`Delete "${beer.name}"? This will clear all inventory of this item.`)) return
  deleteBeer(beer.id)
}

async function deleteBeer(id) {
  try {
    await ItemRepository.delete(id)
    SyncService.sync()
    await loadData()
  } catch (e) {
    window.alert('Error: ' + (e.message || 'Could not delete beer'))
  }
}

/** Ensure every recipe has a corresponding Finished Beer item (create if missing). One beer per recipe, even if names duplicate. */
async function ensureBeersFromRecipes() {
  syncingRecipes.value = true
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

    if (created > 0) SyncService.sync()
    await loadData()

    if (created > 0) {
      syncMessage.value = { type: 'success', text: `Created ${created} beer(s) from recipes.` }
    } else if (allRecipes.length === 0) {
      syncMessage.value = { type: 'info', text: 'No recipes found. Create recipes in the mobile app or add a beer manually.' }
    }
  } catch (e) {
    syncMessage.value = { type: 'error', text: e.message || 'Could not sync beers from recipes.' }
  } finally {
    syncingRecipes.value = false
  }
}

async function loadData() {
  const [beerList, recipeList] = await Promise.all([
    ItemRepository.getBeerItems(),
    RecipeRepository.getAll()
  ])
  const recipeById = new Map(recipeList.map(r => [r.id, r]))
  beers.value = beerList.map(b => ({
    ...b,
    recipeName: b.recipe_id ? (recipeById.get(b.recipe_id)?.name || null) : null
  }))
  recipes.value = recipeList
}

onMounted(() => {
  syncMessage.value = null
  loadData()
})
watch(syncTrigger, loadData)
</script>
