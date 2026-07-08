<template>
  <div class="desktop-container">
    <nav class="mb-6" aria-label="Breadcrumb">
      <router-link :to="route.query.from === 'beers' ? '/beers' : '/items'" class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <i class="ri-arrow-left-line" aria-hidden="true"></i>
        {{ route.query.from === 'beers' ? 'Beers' : 'Items' }}
      </router-link>
    </nav>

    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-5">
        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Name</label>
          <input v-model="form.name" required class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Pale Malt" />
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Category</label>
          <select v-model="form.category" required class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Unit</label>
          <select v-model="form.unit" required class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
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

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Vendor (optional)</label>
          <input v-model="form.vendor" class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Crisp, BSG, Muntons" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Default Unit Cost</label>
            <input v-model.number="form.default_unit_cost" type="number" min="0" step="0.01" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 2.50">
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Currency</label>
            <select v-model="form.currency" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
              <option value="USD">USD</option>
              <option value="CAD">CAD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>
        </div>

        <div v-if="form.category === 'Finished Beer' && (form.unit === 'ea' || form.unit === 'each')">
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Volume per unit (bbl)</label>
          <input v-model.number="form.volume_per_unit" type="number" min="0" step="0.01" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. 0.16 for 1/6 bbl keg">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">For TTB conversion. E.g. 0.16 for 1/6 bbl keg, 0.5 for 1/2 bbl.</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Default Location</label>
          <select v-model="form.default_location_id" class="w-full max-w-md px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
            <option :value="null">— None —</option>
            <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="submit" class="btn btn-primary">{{ isEdit ? 'Save' : 'Create' }}</button>
        <button type="button" @click="$router.back()" class="btn btn-secondary">Cancel</button>
      </div>

      <div v-if="isEdit && !isDefaultFinishedBeerItem" class="pt-8 mt-8 border-t border-neutral-200 dark:border-neutral-700">
        <button type="button" @click="remove" class="px-6 py-3 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-xl font-bold transition-colors">
          Delete Item
        </button>
        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">This will clear all inventory of this item from all locations.</p>
      </div>
      <div v-else-if="isEdit && isDefaultFinishedBeerItem" class="pt-8 mt-8 border-t border-neutral-200 dark:border-neutral-700">
        <p class="text-sm text-neutral-600 dark:text-neutral-400">The default Finished Beer item cannot be deleted. It is required for TTB reporting and production tracking.</p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { CategoryRepository } from '../repositories/CategoryRepository'
import { SyncService } from '../services/SyncService'

const route = useRoute()
const router = useRouter()
const providedModal = inject('modal', null)
const showConfirm = providedModal?.confirm ?? ((title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm?.() })
const showAlert = providedModal?.alert ?? ((title, message) => window.alert(`${title}: ${message}`))

const allLocations = ref([])
const vessels = ref([])
const categories = ref([])
const isEdit = computed(() => !!route.params.id)

const form = ref({
  name: '',
  category: '',
  unit: 'lb',
  vendor: '',
  default_location_id: null,
  default_unit_cost: 0,
  currency: 'USD',
  volume_per_unit: null
})

const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
)

const locations = computed(() =>
  (allLocations.value || []).filter((l) => !l.deleted_at && !nonServingTankLocationIds.value.has(l.id))
)

const loadedItem = ref(null)
const isDefaultFinishedBeerItem = computed(() =>
  isEdit.value && loadedItem.value?.name === 'Finished Beer' && loadedItem.value?.category === 'Finished Beer'
)

onMounted(async () => {
  const [locsList, vesselsList, catsList] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    CategoryRepository.getAll()
  ])
  allLocations.value = locsList || []
  vessels.value = vesselsList || []
  categories.value = catsList || []

  if (isEdit.value) {
    const item = await ItemRepository.getById(route.params.id)
    loadedItem.value = item
    if (item) {
      form.value = {
        ...item,
        volume_per_unit: item.data?.volume_per_unit ?? null
      }
    }
  } else {
    if (route.query.category) {
      form.value.category = route.query.category
    } else if (categories.value?.length > 0) {
      form.value.category = categories.value[0].name
    }
  }
})

const save = async () => {
  try {
    if (isEdit.value) {
      await ItemRepository.update(route.params.id, form.value)
    } else {
      await ItemRepository.create(form.value)
    }
    SyncService.sync()
    const goToBeers = route.query.from === 'beers' || (!isEdit.value && form.value.category === 'Finished Beer')
    router.push(goToBeers ? '/beers' : '/items')
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

const remove = () => {
  showConfirm('Delete Item', 'Are you sure? This will instantly clear all inventory of this item from all locations.', async () => {
    try {
      await ItemRepository.delete(route.params.id)
      SyncService.sync()
      router.push(route.query.from === 'beers' ? '/beers' : '/items')
    } catch (e) {
      showAlert('Error', e.message, 'danger')
    }
  }, 'danger', 'Delete & Clear Inventory')
}
</script>
