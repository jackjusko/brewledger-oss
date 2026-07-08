<template>
  <div class="desktop-container">
    <div class="console-page-header">
      <div></div>
      <router-link to="/recipes/add" class="btn btn-primary inline-flex items-center gap-2 shrink-0">
        + New Recipe
      </router-link>
    </div>

    <div v-if="loading" class="card p-12 text-center">
      <p class="text-neutral-500 dark:text-neutral-400">Loading...</p>
    </div>

    <div v-else-if="recipes.length === 0" class="card console-empty">
      <p class="text-neutral-500 dark:text-neutral-400 mb-4">No recipes yet.</p>
      <router-link to="/recipes/add" class="btn btn-primary">Create first recipe</router-link>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="card-header flex items-center justify-between">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">Recipes</h2>
        <input
          v-model="search"
          type="text"
          placeholder="Search recipes..."
          class="input w-64 px-4 py-2 text-sm"
        />
      </div>
      <div class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Base volume</th>
              <th>Ingredients</th>
              <th class="w-32 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in sortedRecipes" :key="r.id" class="border-b border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
              <td class="font-semibold text-neutral-900 dark:text-neutral-100">{{ r.name }}</td>
              <td class="text-neutral-600 dark:text-neutral-400 max-w-xs truncate">{{ r.description || '—' }}</td>
              <td class="text-neutral-600 dark:text-neutral-400">
                <span v-if="r.base_volume != null && r.base_volume !== ''">{{ r.base_volume }} {{ r.base_volume_unit || '' }}</span>
                <span v-else>—</span>
              </td>
              <td class="text-neutral-600 dark:text-neutral-400">{{ r.itemCount }} item(s)</td>
              <td class="text-right">
                <router-link :to="`/recipes/${r.id}/edit`" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mr-3">Edit</router-link>
                <button type="button" @click="confirmDelete(r)" class="text-sm font-medium text-danger-600 dark:text-danger-400 hover:text-danger-700 dark:hover:text-danger-300">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-recipe-title">
      <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 w-full max-w-sm shadow-xl">
        <h3 id="delete-recipe-title" class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">Delete recipe</h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">Delete "{{ recipeToDelete?.name }}"? This cannot be undone.</p>
        <div class="flex gap-3 justify-end">
          <button type="button" @click="showDeleteModal = false" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="deleteRecipe" class="px-4 py-2 bg-danger-600 text-white rounded-lg font-semibold hover:bg-danger-700">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { RecipeRepository } from '../repositories/RecipeRepository'
import { SyncService } from '../services/SyncService'
import { useSync } from '../composables/useSync'

const recipes = ref([])
const loading = ref(true)
const search = ref('')
const showDeleteModal = ref(false)
const recipeToDelete = ref(null)
const { syncTrigger } = useSync()

const filteredRecipes = computed(() => {
  if (!search.value.trim()) return recipes.value
  const term = search.value.toLowerCase()
  return recipes.value.filter(r =>
    (r.name && r.name.toLowerCase().includes(term)) ||
    (r.description && r.description.toLowerCase().includes(term))
  )
})

const sortedRecipes = computed(() => {
  return [...filteredRecipes.value].sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

async function loadRecipes() {
  loading.value = true
  try {
    const data = await RecipeRepository.getAll()
    const enriched = await Promise.all(data.map(async r => {
      const items = await RecipeRepository.getItems(r.id)
      return { ...r, itemCount: items.length }
    }))
    recipes.value = enriched
  } finally {
    loading.value = false
  }
}

onMounted(loadRecipes)
watch(syncTrigger, loadRecipes)

function confirmDelete(recipe) {
  recipeToDelete.value = recipe
  showDeleteModal.value = true
}

async function deleteRecipe() {
  if (!recipeToDelete.value) return
  try {
    await RecipeRepository.delete(recipeToDelete.value.id)
    SyncService.sync()
    await loadRecipes()
    showDeleteModal.value = false
    recipeToDelete.value = null
  } catch (e) {
    window.alert('Failed to delete recipe: ' + (e.message || 'Unknown error'))
  }
}
</script>
