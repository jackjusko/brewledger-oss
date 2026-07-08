<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Transfer</h4>
        <p>Move inventory between locations</p>
      </div>
    </div>

    <div class="card">
      <div class="card-header flex items-center gap-3">
        <i class="ri-arrow-left-right-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Record Transfer</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Item, from/to locations, quantity</p>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="submit" class="space-y-6">
          <div>
            <div class="flex items-center justify-between gap-2 mb-2">
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300">
                Item to transfer <span class="text-danger-600">*</span>
              </label>
              <select v-model="itemSortBy" class="input text-xs py-1 px-2 w-auto max-w-[8rem]">
                <option value="name">Sort by name</option>
                <option value="category">Sort by category</option>
              </select>
            </div>
            <select
              v-model="form.itemId"
              class="input w-full"
              required
            >
              <option value="" disabled>Select item...</option>
              <template v-if="itemSortBy === 'category'">
                <optgroup v-for="group in itemsByCategory" :key="group.category" :label="group.category || 'Uncategorized'">
                  <option v-for="item in group.items" :key="item.id" :value="item.id">{{ item.name }}</option>
                </optgroup>
              </template>
              <template v-else>
                <option v-for="item in sortedItems" :key="item.id" :value="item.id">{{ item.name }}</option>
              </template>
            </select>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
                From location <span class="text-danger-600">*</span>
              </label>
              <select
                v-model="form.fromLocationId"
                class="input w-full"
                required
              >
                <option value="" disabled>Origin...</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id">
                  {{ loc.name }} (Avail: {{ getStock(loc.id) }})
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
                To location <span class="text-danger-600">*</span>
              </label>
              <select
                v-model="form.toLocationId"
                class="input w-full"
                required
              >
                <option value="" disabled>Destination...</option>
                <option v-for="loc in locations" :key="loc.id" :value="loc.id" :disabled="loc.id === form.fromLocationId">
                  {{ loc.name }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              Quantity <span class="text-danger-600">*</span>
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="form.quantity"
                type="number"
                step="any"
                min="0.0001"
                class="input flex-1 max-w-[12rem]"
                placeholder="0.00"
                required
              />
              <span class="font-medium text-neutral-500 dark:text-stone-400 bg-neutral-100 dark:bg-stone-800 px-3 py-2 rounded-lg text-sm">
                {{ selectedItemUnit || '-' }}
              </span>
            </div>
            <p v-if="form.fromLocationId && form.itemId" class="text-xs mt-1.5" :class="insufficient ? 'text-danger-600 dark:text-danger-400' : 'text-neutral-500 dark:text-stone-400'">
              Available: {{ currentStock }} {{ selectedItemUnit }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">Note (optional)</label>
            <textarea
              v-model="form.note"
              class="input w-full"
              rows="2"
              placeholder="Reason for transfer..."
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              Operation type <span class="text-xs text-neutral-400">(optional, for TTB reporting)</span>
            </label>
            <select v-model="form.operationType" class="input w-full max-w-xs">
              <option value="transfer">Transfer</option>
              <option value="racking">Racking</option>
              <option value="bottling">Bottling</option>
              <option value="return">Return to Cellar</option>
              <option value="other">Other</option>
            </select>
            <p class="text-xs text-neutral-500 dark:text-stone-400 mt-1">Defaults to "Transfer" - helps with TTB reporting</p>
          </div>

          <div class="flex justify-end gap-3 pt-2">
            <button type="button" @click="router.back()" class="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" :disabled="!isValid || saving" class="btn btn-primary">
              <span v-if="saving">Transferring…</span>
              <span v-else>Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { TransferRepository } from '../repositories/TransferRepository'
import { SyncService } from '../services/SyncService'

const router = useRouter()
const { confirm, alert } = inject('modal')
const allItems = ref([])
const allLocations = ref([])
const vessels = ref([])
const onhandCache = ref([])
const saving = ref(false)
const itemSortBy = ref('category')

const form = reactive({
  itemId: '',
  fromLocationId: '',
  toLocationId: '',
  quantity: '',
  note: '',
  operationType: 'transfer'
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

onMounted(async () => {
  const [allItemsRaw, allLocs, allVessels, allOnhand] = await Promise.all([
    ItemRepository.getAll(),
    LocationRepository.getAll(),
    VesselRepository.getAll(),
    LedgerRepository.getAllOnhand()
  ])
  allItems.value = allItemsRaw.sort((a, b) => a.name.localeCompare(b.name))
  allLocations.value = (allLocs || []).sort((a, b) => a.name.localeCompare(b.name))
  vessels.value = allVessels || []
  onhandCache.value = allOnhand
})

const sortedItems = computed(() =>
  [...(allItems.value || [])].sort((a, b) => a.name.localeCompare(b.name))
)

const itemsByCategory = computed(() => {
  const items = allItems.value || []
  const byCat = new Map()
  for (const item of items) {
    const cat = item.category || 'Uncategorized'
    if (!byCat.has(cat)) byCat.set(cat, [])
    byCat.get(cat).push(item)
  }
  return [...byCat.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, items]) => ({
      category,
      items: [...items].sort((a, b) => a.name.localeCompare(b.name))
    }))
})

const selectedItemUnit = computed(() => {
  const item = allItems.value?.find(i => i.id === form.itemId)
  return item ? item.unit : ''
})

const getStock = (locationId) => {
  if (!form.itemId) return '-'
  const entry = onhandCache.value.find(c => c.item_id === form.itemId && c.location_id === locationId)
  return entry ? entry.quantity : 0
}

const currentStock = computed(() => {
  if (!form.itemId || !form.fromLocationId) return 0
  return getStock(form.fromLocationId)
})

const insufficient = computed(() => {
  if (!form.quantity) return false
  return form.quantity > currentStock.value
})

watch(() => form.note, (note) => {
  if (!note) return
  const lower = note.toLowerCase()
  if (lower.includes('rack') || lower.includes('keg')) {
    form.operationType = 'racking'
  } else if (lower.includes('bottle') || lower.includes('can')) {
    form.operationType = 'bottling'
  } else if (lower.includes('return')) {
    form.operationType = 'return'
  }
})

const isValid = computed(() => {
  return form.itemId &&
    form.fromLocationId &&
    form.toLocationId &&
    form.fromLocationId !== form.toLocationId &&
    form.quantity > 0
})

const processTransfer = async () => {
  saving.value = true
  try {
    await TransferRepository.recordTransfer({
      itemId: form.itemId,
      fromLocationId: form.fromLocationId,
      toLocationId: form.toLocationId,
      quantity: form.quantity,
      note: form.note,
      operationType: form.operationType || 'transfer'
    })
    await SyncService.sync()
    alert('Success', 'Transfer complete!', 'primary')
    router.back()
  } catch (e) {
    alert('Error', 'Transfer failed: ' + (e.message || 'Unknown error'), 'danger')
  } finally {
    saving.value = false
  }
}

const submit = async () => {
  if (!isValid.value) return

  if (insufficient.value) {
    confirm(
      'Insufficient Stock',
      `You are transferring ${form.quantity} but only have ${currentStock.value} available. This will result in negative inventory. Continue?`,
      processTransfer,
      'warning',
      'Transfer Anyway'
    )
  } else {
    await processTransfer()
  }
}
</script>
