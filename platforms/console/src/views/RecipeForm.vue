<template>
  <div class="desktop-container">
    <nav class="mb-6" aria-label="Breadcrumb">
      <router-link to="/recipes" class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <span aria-hidden="true">←</span> Recipes
      </router-link>
    </nav>

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2 heading-refined">{{ isEdit ? 'Edit recipe' : 'New recipe' }}</h1>
    </div>

    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-5">
        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Name</label>
          <input v-model="form.name" type="text" required class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. IPA #7" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Base volume</label>
            <input v-model.number="form.base_volume" type="number" step="any" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 10" />
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Unit</label>
            <input v-model="form.base_volume_unit" type="text" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="bbl" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Description</label>
          <textarea v-model="form.description" class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none text-sm" rows="2" placeholder="Optional notes..."></textarea>
        </div>
      </div>

      <div class="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-100">Ingredients</h2>
          <button type="button" @click="openItemModal" class="btn btn-secondary text-sm">
            + Add ingredient
          </button>
        </div>

        <div v-if="form.items.length === 0" class="py-6 text-center text-neutral-500 dark:text-neutral-400 text-sm border border-dashed border-neutral-200 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-900/50">
          No ingredients added
        </div>

        <div v-else class="overflow-x-auto">
          <table class="data-table w-full max-w-lg">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th class="w-16"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in form.items" :key="index" class="border-b border-neutral-200 dark:border-neutral-700">
                <td class="font-medium text-neutral-900 dark:text-neutral-100">{{ getItemName(item.item_id) }}</td>
                <td class="text-neutral-600 dark:text-neutral-400 font-mono">{{ item.quantity }}</td>
                <td class="text-neutral-600 dark:text-neutral-400">{{ item.unit || '—' }}</td>
                <td>
                  <button type="button" @click="removeItem(index)" class="p-1 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded" aria-label="Remove ingredient">×</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Update recipe' : 'Create recipe' }}</button>
        <button type="button" @click="$router.back()" class="btn btn-secondary">Cancel</button>
      </div>
    </form>

    <!-- Add ingredient modal -->
    <div v-if="showItemModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="add-ingredient-title">
      <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6 w-full max-w-md shadow-xl">
        <h3 id="add-ingredient-title" class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Add ingredient</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Item</label>
            <select v-model="newItem.item_id" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="" disabled>Select item...</option>
              <option v-for="item in availableItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Quantity</label>
            <input v-model.number="newItem.quantity" type="number" step="any" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 5.25" />
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Unit</label>
            <input v-model="newItem.unit" type="text" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. lb" />
          </div>
        </div>

        <div class="flex gap-3 justify-end mt-6">
          <button type="button" @click="showItemModal = false" class="btn btn-secondary">Cancel</button>
          <button type="button" @click="addItem" class="btn btn-primary">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RecipeRepository } from '../repositories/RecipeRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { SyncService } from '../services/SyncService'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id)

const allItems = ref([])
const showItemModal = ref(false)

const form = reactive({
  name: '',
  base_volume: null,
  base_volume_unit: '',
  description: '',
  items: []
})

const newItem = reactive({
  item_id: '',
  quantity: '',
  unit: ''
})

const availableItems = computed(() => {
  return [...(allItems.value || [])].filter(i => !i.deleted_at).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
})

function getItemName(id) {
  const item = allItems.value.find(i => i.id === id)
  return item ? item.name : 'Unknown item'
}

watch(() => newItem.item_id, (id) => {
  if (id) {
    const item = allItems.value.find(i => i.id === id)
    if (item && item.unit) newItem.unit = item.unit
  }
})

function openItemModal() {
  newItem.item_id = ''
  newItem.quantity = ''
  newItem.unit = ''
  showItemModal.value = true
}

function addItem() {
  if (newItem.item_id && newItem.quantity !== '' && newItem.quantity != null) {
    form.items.push({ item_id: newItem.item_id, quantity: newItem.quantity, unit: newItem.unit || '' })
    showItemModal.value = false
  }
}

function removeItem(index) {
  form.items.splice(index, 1)
}

onMounted(async () => {
  allItems.value = await ItemRepository.getAll()

  if (isEdit.value) {
    const recipe = await RecipeRepository.getById(route.params.id)
    if (recipe) {
      form.name = recipe.name ?? ''
      form.base_volume = recipe.base_volume ?? null
      form.base_volume_unit = recipe.base_volume_unit ?? ''
      form.description = recipe.description ?? ''
      const items = await RecipeRepository.getItems(recipe.id)
      form.items = items.map(i => ({
        item_id: i.item_id,
        quantity: i.quantity,
        unit: i.unit ?? ''
      }))
    }
  }
})

async function save() {
  if (form.items.length === 0 && !window.confirm('This recipe has no ingredients. Save anyway?')) return

  try {
    if (isEdit.value) {
      await RecipeRepository.update(route.params.id, {
        name: form.name,
        base_volume: form.base_volume,
        base_volume_unit: form.base_volume_unit,
        description: form.description
      }, form.items)
    } else {
      await RecipeRepository.create({
        name: form.name,
        base_volume: form.base_volume,
        base_volume_unit: form.base_volume_unit,
        description: form.description
      }, form.items)
    }
    SyncService.sync()
    router.replace('/recipes')
  } catch (e) {
    window.alert('Failed to save recipe: ' + (e.message || 'Unknown error'))
  }
}
</script>
