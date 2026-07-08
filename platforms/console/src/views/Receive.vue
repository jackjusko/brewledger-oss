<template>
  <div class="desktop-container space-y-6">
    <nav class="mb-2" aria-label="Breadcrumb">
      <router-link
        to="/inventory"
        class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
      >
        <i class="ri-arrow-left-line" aria-hidden="true"></i>
        Inventory
      </router-link>
    </nav>

    <div class="console-toolbar">
      <div class="console-toolbar-title">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-stone-400">Inventory</p>
        <h4 class="heading-refined text-xl text-neutral-900 dark:text-neutral-50">Receive inventory</h4>
        <p class="text-sm text-neutral-600 dark:text-stone-400">Add received items with invoice/note as needed.</p>
      </div>
      <div class="console-toolbar-actions">
        <span class="filter-pill" :class="{ 'is-active': !!locationName }">
          <i class="ri-map-pin-line" aria-hidden="true"></i>
          <span>{{ locationName || 'Select location' }}</span>
        </span>
        <span class="filter-pill">
          <i class="ri-list-unordered" aria-hidden="true"></i>
          <span>{{ lines.length }} line{{ lines.length === 1 ? '' : 's' }}</span>
        </span>
        <span v-if="totalCost != null" class="filter-pill">
          <i class="ri-money-dollar-circle-line" aria-hidden="true"></i>
          <span>Est. ${{ totalCost.toFixed(2) }}</span>
        </span>
        <span v-if="invoiceNumber" class="filter-pill">
          <i class="ri-file-text-line" aria-hidden="true"></i>
          <span>Invoice {{ invoiceNumber }}</span>
        </span>
      </div>
    </div>

    <div v-if="!submitted" class="space-y-4">
      <div
        v-if="loadError"
        class="p-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 text-sm flex items-center justify-between"
      >
        <span>Failed to load data: {{ loadError }}</span>
        <button class="btn btn-secondary text-sm" @click="loadData" :disabled="loading">Retry</button>
      </div>

      <div v-if="loading" class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 text-neutral-600 dark:text-stone-400 text-sm">
        Loading items and locations…
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-3 gap-5" :aria-busy="loading">
        <div class="xl:col-span-2 space-y-4">
          <div class="card">
            <div class="card-header flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-stone-400">Receipt details</p>
                <h2 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Destination & metadata</h2>
                <p class="text-sm text-neutral-500 dark:text-stone-400">Pick the destination; add invoice or note if needed.</p>
              </div>
              <span class="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300 border border-neutral-200 dark:border-stone-700">
                RECEIVE
              </span>
            </div>
            <div class="card-body space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">Location</label>
                  <select
                    v-model="locationId"
                    :disabled="loading || saving || !!loadError"
                    class="input w-full"
                  >
                    <option :value="null" disabled>Select destination...</option>
                    <option v-for="loc in locations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">Invoice / Bill #</label>
                  <input v-model="invoiceNumber" :disabled="loading || saving || !!loadError" class="input w-full" placeholder="Reference #" />
                </div>
                <div>
                  <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">Note (optional)</label>
                  <input v-model="note" :disabled="loading || saving || !!loadError" class="input w-full" placeholder="e.g. PO #1234" />
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header flex items-center justify-between gap-3">
              <div>
                <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-stone-400">Line items</p>
                <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Quantities & costs</h3>
                <p class="text-sm text-neutral-500 dark:text-stone-400">Add items; totals auto-calc.</p>
              </div>
              <button
                type="button"
                class="btn btn-secondary text-sm"
                @click="addLine"
                :disabled="loading || saving || !!loadError || !locationId"
              >
                <i class="ri-add-line" aria-hidden="true"></i>
                Add item
              </button>
            </div>
            <div class="card-body space-y-4" :class="{ 'opacity-60': !locationId }">
              <p v-if="!locationId" class="text-sm text-neutral-500 dark:text-stone-400 flex items-center gap-2">
                <i class="ri-arrow-right-circle-line" aria-hidden="true"></i>
                Select a location to add items.
              </p>

              <div v-for="(line, idx) in lines" :key="idx" class="border border-neutral-200 dark:border-stone-700 rounded-xl p-4 bg-white dark:bg-stone-800 shadow-sm space-y-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 flex-1">
                    <span class="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-stone-900/50 border border-neutral-200 dark:border-stone-700 text-neutral-600 dark:text-stone-300 flex items-center justify-center text-sm font-semibold">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-1">
                      <label class="block text-sm font-semibold text-neutral-700 dark:text-stone-300 mb-1">Item</label>
                      <select
                        v-model="line.item_id"
                        :disabled="loading || saving || !!loadError || !locationId"
                        @change="line.unit_cost = getItemDefaultCost(line.item_id)"
                        class="input w-full"
                      >
                        <option :value="null" disabled>Select item</option>
                        <option v-for="item in items" :key="item.id" :value="item.id">{{ item.name }} ({{ item.unit }})</option>
                      </select>
                      <p class="mt-1 text-xs text-neutral-500 dark:text-stone-400">Unit: {{ getItemUnit(line.item_id) || '—' }}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="p-2 rounded-lg text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/30 transition-colors"
                    @click="removeLine(idx)"
                    :disabled="lines.length === 1 || loading || saving || !!loadError || !locationId"
                    aria-label="Remove line"
                  >
                    <i class="ri-delete-bin-line" aria-hidden="true"></i>
                  </button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label class="block text-sm font-semibold text-neutral-700 dark:text-stone-300 mb-1">Quantity</label>
                    <input
                      v-model.number="line.quantity"
                      type="number"
                      min="0"
                      step="any"
                      :disabled="loading || saving || !!loadError || !locationId"
                      class="input w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-neutral-700 dark:text-stone-300 mb-1">Unit cost</label>
                    <input
                      v-model.number="line.unit_cost"
                      type="number"
                      min="0"
                      step="0.01"
                      :disabled="loading || saving || !!loadError || !locationId"
                      class="input w-full"
                      placeholder="0.00"
                    />
                  </div>
                  <div class="flex items-end">
                    <div class="px-3 py-2 bg-neutral-50 dark:bg-stone-900 rounded-lg text-sm text-neutral-700 dark:text-stone-300 w-full border border-neutral-200 dark:border-stone-700 flex items-center justify-between">
                      <span class="text-xs text-neutral-500 dark:text-stone-400">Line total</span>
                      <span class="font-semibold text-neutral-900 dark:text-stone-100">
                        {{ getLineTotal(line) != null ? `$${getLineTotal(line).toFixed(2)}` : '—' }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside class="card xl:sticky xl:top-24">
          <div class="card-body space-y-4">
            <div class="flex items-start gap-3">
              <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                <i class="ri-information-line" aria-hidden="true"></i>
              </div>
              <p class="text-sm text-neutral-600 dark:text-stone-400 leading-relaxed">Adds stock here; totals = quantity × unit cost.</p>
            </div>

            <div class="grid grid-cols-2 gap-3 text-sm">
              <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700">
                <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Lines</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ lines.length }}</p>
              </div>
              <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700">
                <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Est. total</p>
                <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">
                  {{ totalCost != null ? `$${totalCost.toFixed(2)}` : '—' }}
                </p>
              </div>
              <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700 col-span-2">
                <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Location</p>
                <p class="text-base font-semibold text-neutral-900 dark:text-stone-100">{{ locationName || 'Select a location' }}</p>
              </div>
              <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700 col-span-2">
                <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Invoice / Bill #</p>
                <p class="text-base font-semibold text-neutral-900 dark:text-stone-100">{{ invoiceNumber || '—' }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <button
                class="btn btn-primary w-full"
                :disabled="!isValid || saving || loading || !!loadError"
                @click="save"
              >
                <span v-if="saving">Saving...</span>
                <span v-else>Confirm receipt</span>
              </button>
              <button class="btn btn-secondary w-full" :disabled="saving || loading" @click="router.back()">Cancel</button>
            </div>
            <p v-if="saveError" class="text-sm text-danger-600 dark:text-danger-400">{{ saveError }}</p>
          </div>
        </aside>
      </div>
    </div>

    <div v-if="submitted" class="card space-y-4">
      <div class="card-header flex items-center gap-3">
        <div class="p-2 rounded-lg bg-success-100 dark:bg-success-900/30">
          <i class="ri-checkbox-circle-line text-success-600 dark:text-success-300 text-xl" aria-hidden="true"></i>
        </div>
        <div>
          <h2 class="text-lg font-bold text-success-700 dark:text-success-300">Receipt complete</h2>
          <p class="text-sm text-neutral-600 dark:text-stone-400">Inventory updated and synced.</p>
        </div>
      </div>

      <div class="card-body space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700">
            <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Location</p>
            <p class="text-base font-semibold text-neutral-900 dark:text-stone-100">{{ locationName || '—' }}</p>
          </div>
          <div class="p-3 rounded-lg bg-neutral-50 dark:bg-stone-900/40 border border-neutral-200 dark:border-stone-700">
            <p class="text-xs uppercase font-semibold text-neutral-500 dark:text-stone-400">Invoice / Bill #</p>
            <p class="text-base font-semibold text-neutral-900 dark:text-stone-100">{{ invoiceNumber || '—' }}</p>
          </div>
        </div>

        <div class="border border-neutral-200 dark:border-stone-700 rounded-lg overflow-hidden">
          <div class="bg-neutral-50 dark:bg-stone-900/40 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-stone-300">Summary</div>
          <div class="divide-y divide-neutral-200 dark:divide-neutral-700">
            <div v-for="(entry, idx) in createdEntries" :key="idx" class="px-4 py-3 flex items-center justify-between">
              <div>
                <div class="font-medium text-neutral-900 dark:text-stone-100">{{ entry.item_name }}</div>
                <div class="text-xs text-neutral-500 dark:text-stone-400">{{ entry.location_name }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-success-600 dark:text-success-300">+{{ entry.quantity }}</div>
                <div v-if="entry.total_cost != null" class="text-xs text-neutral-500 dark:text-stone-400">${{ entry.total_cost.toFixed(2) }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap gap-3">
          <button class="btn btn-primary" @click="startNew" :disabled="saving">New receipt</button>
          <button class="btn btn-secondary" @click="router.push('/inventory')" :disabled="saving">Back to inventory</button>
          <button class="btn btn-secondary text-danger-600 dark:text-danger-400 border-danger-200 dark:border-danger-700" @click="undo" :disabled="saving">
            Undo receipt
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { LocationRepository } from '../repositories/LocationRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { SyncService } from '../services/SyncService'

const providedModal = inject('modal', null)
const showConfirm = providedModal?.confirm ?? ((title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm?.() })
const showAlert = providedModal?.alert ?? ((title, message) => window.alert(`${title}: ${message}`))

const router = useRouter()

const locations = ref([])
const items = ref([])

const locationId = ref(null)
const note = ref('')
const invoiceNumber = ref('')
const lines = ref([{ item_id: null, quantity: null, unit_cost: null }])
const submitted = ref(false)
const createdEntries = ref([])
const saving = ref(false)
const loading = ref(true)
const loadError = ref('')
const saveError = ref('')
const locationName = computed(() => {
  const loc = locations.value.find(l => l.id === locationId.value)
  return loc ? loc.name : ''
})

const loadData = async () => {
  try {
    loading.value = true
    loadError.value = ''
    const [locs, itemsList, vessels] = await Promise.all([
      LocationRepository.getAll(),
      ItemRepository.getAll(),
      VesselRepository.getAll()
    ])
    const tankLocationIds = new Set((vessels || []).filter(v => v.location_id).map(v => v.location_id))
    locations.value = (locs || []).filter(l => !l.deleted_at && !tankLocationIds.has(l.id))
    items.value = itemsList || []
  } catch (e) {
    loadError.value = e?.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const getItemUnit = (id) => {
  const item = items.value.find(i => i.id === id)
  return item ? item.unit : ''
}

const getItemDefaultCost = (id) => {
  const item = items.value.find(i => i.id === id)
  if (!item) return null
  return typeof item.default_unit_cost === 'number' ? item.default_unit_cost : null
}

const getItemVendor = (id) => items.value.find(i => i.id === id)?.vendor ?? null

const addLine = () => {
  lines.value.push({ item_id: null, quantity: null, unit_cost: null })
}

const removeLine = (idx) => {
  if (lines.value.length === 1) return
  lines.value.splice(idx, 1)
}

const isValid = computed(() => {
  if (loading.value || loadError.value) return false
  if (!locationId.value) return false
  if (!lines.value.length) return false
  return lines.value.every(l => {
    const qty = Number(l.quantity)
    const cost = Number(l.unit_cost)
    return l.item_id && Number.isFinite(qty) && qty > 0 && Number.isFinite(cost) && cost >= 0
  })
})

const getLineTotal = (line) => {
  if (line == null) return null
  const qty = Number(line.quantity)
  const cost = Number(line.unit_cost)
  if (!Number.isFinite(qty) || !Number.isFinite(cost) || qty <= 0 || cost < 0) return null
  return qty * cost
}

const totalCost = computed(() => {
  const totals = lines.value
    .map(getLineTotal)
    .filter((v) => Number.isFinite(v))
  if (!totals.length) return null
  return totals.reduce((a, b) => a + b, 0)
})

const buildSummaryEntry = (entry) => {
  const item = items.value.find(i => i.id === entry.item_id)
  const loc = locations.value.find(l => l.id === entry.location_id)
  return {
    ...entry,
    item_name: item?.name || entry.item_id,
    location_name: loc?.name || entry.location_id,
    vendor: entry.vendor ?? getItemVendor(entry.item_id)
  }
}

const save = async () => {
  if (!isValid.value) return
  saving.value = true
  saveError.value = ''
  try {
    const entries = []
    for (const line of lines.value) {
      const totalCost = getLineTotal(line)
      const entry = await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: line.item_id,
        location_id: locationId.value,
        quantity: Number(line.quantity),
        note: note.value || null,
        vendor: getItemVendor(line.item_id) || null,
        invoice_number: invoiceNumber.value || null,
        unit_cost: line.unit_cost != null ? Number(line.unit_cost) : null,
        total_cost: totalCost
      })
      entries.push(buildSummaryEntry(entry))
    }
    await LedgerRepository.recomputeCache()
    await SyncService.sync()
    createdEntries.value = entries
    submitted.value = true
  } catch (e) {
    console.error('Receive save error', e)
    saveError.value = e?.message || 'Failed to save receipt'
    showAlert('Error', saveError.value)
  } finally {
    saving.value = false
  }
}

const startNew = () => {
  submitted.value = false
  createdEntries.value = []
  locationId.value = null
  note.value = ''
  invoiceNumber.value = ''
  lines.value = [{ item_id: null, quantity: null, unit_cost: null }]
  loadData()
}

const undo = () => {
  showConfirm(
    'Undo Receipt',
    'Are you sure you want to reverse this receipt? This will deduct the items from inventory.',
    async () => {
      try {
        saving.value = true
        for (const entry of createdEntries.value) {
          await LedgerRepository.reverseEntry(entry, 'Undo Receipt')
        }
        await SyncService.sync()
        showAlert('Undone', 'Receipt reversed successfully.')
        router.push('/inventory')
      } catch (e) {
        console.error('Undo failed', e)
        showAlert('Error', e?.message || 'Undo failed')
      } finally {
        saving.value = false
      }
    },
    'danger',
    'Confirm Undo'
  )
}
</script>

