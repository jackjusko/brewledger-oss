<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Consume</h4>
        <p>Record manual ingredient consumption for a batch</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center gap-3">
        <i class="ri-delete-bin-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Record Consumption</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Select batch, location, and items consumed</p>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="save" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
                For batch <span class="text-danger-600">*</span>
              </label>
              <div class="flex gap-2">
                <select
                  v-model="batchId"
                  class="input flex-1"
                  required
                >
                  <option :value="null" disabled>Select batch...</option>
                  <option v-for="b in batches" :key="b.id" :value="b.id">{{ b.name }}</option>
                </select>
                <router-link to="/batches/add" class="btn btn-secondary shrink-0 px-3" title="Add batch">
                  <i class="ri-add-line" aria-hidden="true"></i>
                </router-link>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
                From location <span class="text-danger-600">*</span>
              </label>
              <select
                v-model="locationId"
                class="input w-full"
                required
              >
                <option :value="null" disabled>Select source...</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
              </select>
            </div>
          </div>

          <div v-if="locationId" class="space-y-4">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300">Items consumed</label>
              <button type="button" @click="addLine" class="btn btn-secondary text-sm">
                <i class="ri-add-line" aria-hidden="true"></i>
                Add item
              </button>
            </div>
            <div v-for="(line, idx) in lines" :key="idx" class="p-4 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40 relative">
              <button
                type="button"
                @click="removeLine(idx)"
                class="absolute top-3 right-3 p-1.5 rounded text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                aria-label="Remove line"
              >
                <i class="ri-close-line text-lg" aria-hidden="true"></i>
              </button>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pr-10">
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-stone-400 mb-1">Item</label>
                  <select
                    v-model="line.item_id"
                    class="input w-full"
                    @change="checkOnhand(line)"
                  >
                    <option :value="null" disabled>Select item</option>
                    <option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} ({{ item.unit }})</option>
                  </select>
                  <p v-if="line.currentOnhand !== undefined" class="text-xs text-neutral-500 dark:text-stone-400 mt-1">
                    Available: {{ line.currentOnhand }} {{ getItemUnit(line.item_id) }}
                  </p>
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-stone-400 mb-1">Quantity</label>
                  <div class="flex gap-2 items-center">
                    <input
                      v-model.number="line.quantity"
                      type="number"
                      step="any"
                      min="0"
                      class="input flex-1"
                      placeholder="0.00"
                    />
                    <span v-if="line.item_id" class="text-sm font-medium text-neutral-500 dark:text-stone-400 shrink-0">
                      {{ getItemUnit(line.item_id) }}
                    </span>
                  </div>
                  <p v-if="line.currentOnhand !== undefined && line.quantity > line.currentOnhand" class="text-xs text-danger-600 dark:text-danger-400 mt-1">
                    Cannot consume more than on-hand
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="batchId && locationId" class="pt-2">
            <button
              type="submit"
              :disabled="!isValid || saving"
              class="btn btn-primary"
            >
              <span v-if="saving">Saving…</span>
              <span v-else>Confirm consumption</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { BatchRepository } from '../repositories/BatchRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ConsumeRepository } from '../repositories/ConsumeRepository'
import { SyncService } from '../services/SyncService'

const { alert } = inject('modal')
const router = useRouter()
const allLocations = ref([])
const vessels = ref([])
const items = ref([])
const batches = ref([])
const saving = ref(false)

const locationId = ref(null)
const batchId = ref(null)
const lines = ref([{ item_id: null, quantity: null }])

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

onMounted(async () => {
  const [allLocs, allVessels, allItemsRaw, allBatches] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    ItemRepository.getAll(),
    BatchRepository.getAll()
  ])
  allLocations.value = allLocs || []
  vessels.value = allVessels || []
  items.value = allItemsRaw || []
  batches.value = allBatches || []
})

const getItemUnit = (id) => {
  const item = items.value.find(i => i.id === id)
  return item ? item.unit : ''
}

const checkOnhand = async (line) => {
  if (line.item_id && locationId.value) {
    line.currentOnhand = await LedgerRepository.getOnhand(line.item_id, locationId.value)
  }
}

const addLine = () => {
  lines.value.push({ item_id: null, quantity: null })
}

const removeLine = (idx) => {
  lines.value.splice(idx, 1)
}

const isValid = computed(() => {
  return batchId.value &&
    locationId.value &&
    lines.value.length > 0 &&
    lines.value.every(l =>
      l.item_id &&
      l.quantity > 0 &&
      (l.currentOnhand === undefined || l.quantity <= l.currentOnhand)
    )
})

const save = async () => {
  if (!isValid.value) return

  saving.value = true
  try {
    await ConsumeRepository.recordConsume({
      batchId: batchId.value,
      locationId: locationId.value,
      lines: lines.value,
      note: 'Manual consumption'
    })
    await SyncService.sync()
    alert('Success', `Consumed ${lines.value.length} line(s).`)
    router.push('/batches/' + batchId.value)
  } catch (e) {
    alert('Error', 'Error saving: ' + (e.message || 'Unknown error'), 'danger')
  } finally {
    saving.value = false
  }
}
</script>
