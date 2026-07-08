<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Sales Order</h4>
        <p>Create a sales order with optional QuickBooks Invoice sync</p>
      </div>
      <div class="console-toolbar-actions">
        <span class="meta-pill">
          <i class="ri-database-2-line" aria-hidden="true"></i>
          <template v-if="availableQty !== null">
            {{ availableQty.toFixed(2) }} bbl
          </template>
          <template v-else>
            Select item & location
          </template>
        </span>
      </div>
    </div>

    <div
      v-if="!qboConnected"
      class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
    >
      <p class="text-amber-800 dark:text-amber-200 text-sm">
        Connect QuickBooks in Distribution → Integrations to sync invoices.
      </p>
      <router-link to="/integrations" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
        Go to Integrations →
      </router-link>
    </div>

    <div
      v-else-if="createInvoice && form.item_id && !selectedBeerHasMapping"
      class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
    >
      <p class="text-amber-800 dark:text-amber-200 text-sm">
        Map this beer in Distribution → Integrations before syncing to QuickBooks.
      </p>
      <router-link to="/integrations" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
        Go to Integrations →
      </router-link>
    </div>

    <div v-if="beerItems.length === 0 && !loading" class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <p class="text-amber-800 dark:text-amber-200 text-sm">No finished beer items. Add beers in Beers or Items first.</p>
      <router-link to="/beers" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
        Go to Beers →
      </router-link>
    </div>

    <div v-if="locations.length === 0 && !loading" class="mb-6 p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <p class="text-amber-800 dark:text-amber-200 text-sm">No locations. Add a location first.</p>
      <router-link to="/locations" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
        Go to Locations →
      </router-link>
    </div>

    <div class="card">
      <div class="card-header flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <i class="ri-draft-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">New Sales Order</h3>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Customer, product, quantity & price. Optionally sync to QuickBooks.</p>
          </div>
        </div>
      </div>
      <div class="card-body">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Customer <span v-if="createInvoice" class="text-danger-600">*</span>
              </label>
              <select
                v-model="form.qbo_customer_id"
                class="input"
                :required="createInvoice"
                :disabled="!qboConnected"
              >
                <option value="">Select customer...</option>
                <option v-for="c in customers" :key="c.Id" :value="String(c.Id)">
                  {{ c.DisplayName || c.CompanyName || `Customer ${c.Id}` }}
                </option>
              </select>
              <p v-if="createInvoice && !qboConnected" class="text-xs text-amber-600 dark:text-amber-400 mt-1">Connect QuickBooks to select a customer.</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Product <span class="text-danger-600">*</span>
              </label>
              <select
                v-model="form.item_id"
                class="input"
                required
              >
                <option value="">Select product...</option>
                <option v-for="item in beerItems" :key="item.id" :value="item.id">
                  {{ item.name }}
                </option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Location <span class="text-danger-600">*</span>
              </label>
              <select
                v-model="form.location_id"
                class="input"
                required
              >
                <option value="">Select location...</option>
                <option v-for="location in locations" :key="location.id" :value="location.id">
                  {{ form.item_id ? `${location.name} – ${(onhandByLocation[location.id] ?? 0).toFixed(2)} bbl` : location.name }}
                </option>
              </select>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{ form.item_id ? 'Shows available quantity per location' : 'Fulfill from this location' }}
              </p>
            </div>
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Quantity (Barrels) <span class="text-danger-600">*</span>
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                step="0.01"
                min="0"
                class="input"
                placeholder="0.00"
                required
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{ form.item_id && form.location_id && availableQty !== null ? `Available at this location: ${availableQty.toFixed(2)} bbl` : 'Select product & location to see available quantity.' }}
              </p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Wholesale Price (per unit) <span class="text-danger-600">*</span>
              </label>
              <input
                v-model.number="form.unit_cost"
                type="number"
                step="0.01"
                min="0"
                class="input"
                placeholder="0.00"
                required
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">USD</p>
            </div>
            <div class="flex items-center">
              <label class="flex items-center gap-2 cursor-pointer" :class="{ 'opacity-60': !qboConnected }">
                <input
                  v-model="createInvoice"
                  type="checkbox"
                  class="rounded border-neutral-300 dark:border-stone-600"
                  :disabled="!qboConnected"
                />
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">Create Invoice in QuickBooks?</span>
              </label>
              <p v-if="!qboConnected" class="text-xs text-neutral-500 dark:text-neutral-400 ml-2">Connect in Integrations first.</p>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Notes</label>
            <textarea
              v-model="form.note"
              rows="2"
              class="input"
              placeholder="Optional note..."
            ></textarea>
          </div>

          <div v-if="message" class="p-4 rounded-lg" :class="messageType === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'">
            {{ message }}
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
            <button
              type="button"
              @click="resetForm"
              class="btn btn-secondary"
              :disabled="isSaving"
            >
              Reset
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="isSaving || !isFormValid"
            >
              <span v-if="isSaving">Creating...</span>
              <span v-else>Create Sales Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { QBOService } from '../services/QBOService'
import { SyncService } from '../services/SyncService'
import { db } from '../db'

const form = reactive({
  item_id: '',
  location_id: '',
  quantity: null,
  unit_cost: null,
  note: '',
  qbo_customer_id: ''
})

const createInvoice = ref(false)
const beerItems = ref([])
const allLocations = ref([])
const vessels = ref([])
const customers = ref([])
const mappings = ref([])
const qboConnected = ref(false)
const loading = ref(true)
const isSaving = ref(false)
const message = ref('')
const messageType = ref('')
const availableQty = ref(null)
/** Map of location_id -> quantity for the selected product (when product selected first). */
const onhandByLocation = ref({})

watch(() => form.item_id, async (itemId) => {
  if (!itemId) {
    onhandByLocation.value = {}
    return
  }
  const requestedItemId = itemId
  try {
    const rows = await LedgerRepository.getOnhandByItem(itemId)
    if (form.item_id !== requestedItemId) return
    const map = {}
    for (const r of rows) {
      map[r.location_id] = r.quantity
    }
    onhandByLocation.value = map
  } catch {
    if (form.item_id !== requestedItemId) return
    onhandByLocation.value = {}
  }
}, { immediate: true })

watch([() => form.item_id, () => form.location_id], async ([itemId, locationId]) => {
  if (itemId && locationId) {
    try {
      availableQty.value = await LedgerRepository.getOnhand(itemId, locationId)
    } catch {
      availableQty.value = 0
    }
  } else {
    availableQty.value = null
  }
}, { immediate: true })

const isFormValid = computed(() => {
  const base = form.item_id && form.location_id && form.quantity > 0 && form.unit_cost != null && form.unit_cost >= 0
  if (createInvoice.value) {
    return base && form.qbo_customer_id && selectedBeerHasMapping.value
  }
  return base
})

const selectedBeerHasMapping = computed(() => {
  if (!form.item_id) return true
  const m = mappings.value.find(x => x.brew_item_id === form.item_id)
  return !!(m?.qbo_item_id)
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

async function loadData() {
  loading.value = true
  try {
    const [items, locs, vesselsList, status] = await Promise.all([
      ItemRepository.getBeerItems(),
      LocationRepository.getAll(),
      VesselRepository.getAll(),
      QBOService.getStatus()
    ])
    beerItems.value = items
    allLocations.value = locs || []
    vessels.value = vesselsList || []
    qboConnected.value = !!status?.connected

    if (status?.connected) {
      try {
        const [custs, maps] = await Promise.all([
          QBOService.getCustomers(),
          QBOService.getMappings()
        ])
        customers.value = custs
        mappings.value = maps
      } catch (e) {
        console.error('Failed to load QBO data', e)
        customers.value = []
        mappings.value = []
      }
    } else {
      customers.value = []
      mappings.value = []
    }
  } catch (e) {
    console.error('Failed to load data', e)
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.item_id = ''
  form.location_id = ''
  form.quantity = null
  form.unit_cost = null
  form.note = ''
  form.qbo_customer_id = ''
}

async function handleSubmit() {
  if (!isFormValid.value) {
    message.value = createInvoice.value && !form.qbo_customer_id
      ? 'Select a customer when creating an Invoice.'
      : 'Please fill in all required fields.'
    messageType.value = 'error'
    return
  }

  const qty = Math.abs(Number(form.quantity))
  const price = Number(form.unit_cost) || 0

  const available = await LedgerRepository.getOnhand(form.item_id, form.location_id)
  if (qty > available) {
    message.value = `Insufficient quantity. Available: ${available.toFixed(2)} bbl`
    messageType.value = 'error'
    return
  }

  isSaving.value = true
  message.value = ''

  try {
    const entry = await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: form.item_id,
      location_id: form.location_id,
      quantity: -qty,
      removal_purpose: 'sale',
      tax_status: 'taxable',
      unit_cost: price,
      qbo_customer_id: createInvoice.value ? form.qbo_customer_id : null,
      note: form.note || undefined
    })

    await SyncService.sync()

    if (createInvoice.value && qboConnected.value) {
      try {
        const result = await QBOService.pushInvoice(entry.id)
        if (result?.qbo_invoice_id) {
          await db.ledger_entries.update(entry.id, { qbo_invoice_id: result.qbo_invoice_id })
          message.value = 'Sales order created and Invoice synced to QuickBooks.'
        } else {
          message.value = 'Sales order created. Invoice may already exist in QuickBooks.'
        }
      } catch (e) {
        message.value = `Sales order created. Invoice sync failed: ${e.response?.data?.error || e.message}`
        messageType.value = 'error'
      }
    } else {
      message.value = 'Sales order created successfully.'
    }

    if (messageType.value !== 'error') messageType.value = 'success'
    resetForm()
    setTimeout(() => { message.value = ''; messageType.value = '' }, 4000)
  } catch (e) {
    console.error('Failed to create sales order', e)
    message.value = e.message || 'Failed to create sales order'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
