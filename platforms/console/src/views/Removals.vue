<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Beer Removals</h4>
        <p>TTB-classified removals and in-bond receipts</p>
      </div>
      <div class="console-toolbar-actions">
        <span class="filter-pill is-active">
          <i class="ri-shield-check-line" aria-hidden="true"></i>
          TTB alignment
        </span>
        <span class="filter-pill">
          <i class="ri-time-line" aria-hidden="true"></i>
          Last 30 days
        </span>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6 items-start">
      <!-- Removal Form -->
      <div class="card">
        <div class="card-header flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <i class="ri-truck-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">Record Removal</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Classify by purpose and tax status</p>
            </div>
          </div>
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
        <div class="card-body">
          <form @submit.prevent="handleSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Beer Item <span class="text-danger-600">*</span>
                </label>
                <select
                  v-model="form.item_id"
                  class="input"
                  required
                >
                  <option value="">Select beer item...</option>
                  <option v-for="item in beerItems" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
                <p v-if="beerItems.length === 0" class="text-sm text-amber-600 dark:text-amber-400 mt-1">No beer items found. Sync or run TTB beer category migration (server: migrate_ttb_beer_category.js).</p>
              </div>
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
                    {{ location.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Available quantity updates after selecting item & location.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Removal Purpose <span class="text-danger-600">*</span>
                </label>
                <select
                  v-model="form.removal_purpose"
                  class="input"
                  required
                >
                  <option value="">Select purpose...</option>
                  <option value="sale">Sale</option>
                  <option value="consumption">Consumption</option>
                  <option value="export">Export (tax-free)</option>
                  <option value="rnd">Research & Development (tax-free)</option>
                  <option value="supplies">Supplies for vessels/aircraft (tax-free)</option>
                  <option value="inter_brewery">Transfer to related brewery (tax-free)</option>
                  <option value="unfit">Unfit for sale - manufacturing use</option>
                  <option value="on_premise">On-premise consumption</option>
                  <option value="sample">Laboratory sample</option>
                  <option value="destruction">Destroyed at brewery</option>
                  <option value="dsp_transfer">Transferred to Distilled Spirits Plant</option>
                  <option value="loss_theft">Loss or theft</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Tax Status
                </label>
                <select
                  v-model="form.tax_status"
                  class="input"
                >
                  <option value="">Auto (based on purpose)</option>
                  <option value="tax_determined">Tax-determined</option>
                  <option value="tax_free">Tax-free</option>
                  <option value="taxable">Taxable</option>
                </select>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Defaults to purpose; override if needed.</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Removal Date <span class="text-danger-600">*</span>
                </label>
                <input
                  v-model="form.created_at"
                  type="datetime-local"
                  class="input"
                  required
                />
              </div>
            </div>

            <div v-if="form.removal_purpose === 'consumption' || form.removal_purpose === 'on_premise'" class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Served from
                </label>
                <select
                  v-model="form.consumption_form"
                  class="input"
                >
                  <option value="">Not specified (use location stage)</option>
                  <option value="cellar">Cellar (tank)</option>
                  <option value="keg">Keg</option>
                  <option value="case">Case</option>
                </select>
                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Where was the beer served from? (For TTB Line 21 reporting.)</p>
              </div>
            </div>

            <div v-if="form.removal_purpose === 'inter_brewery'">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Destination Brewery TTB Number
              </label>
              <input
                v-model="form.related_brewery_ttb"
                type="text"
                class="input"
                placeholder="BR-XXXXX"
              />
            </div>

            <div v-if="form.removal_purpose === 'export'">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Export Destination Country
              </label>
              <input
                v-model="form.export_destination"
                type="text"
                class="input"
                placeholder="Country name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Notes
              </label>
              <textarea
                v-model="form.note"
                rows="3"
                class="input"
                placeholder="Additional details about this removal..."
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
                <span v-if="isSaving">Recording...</span>
                <span v-else>Record Removal</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- In-Bond Receipt Form -->
      <div class="card">
        <div class="card-header flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <i class="ri-download-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">Record In-Bond Receipt</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Track in-bond beer receipts</p>
            </div>
          </div>
          <span class="meta-pill"><i class="ri-checkbox-circle-line" aria-hidden="true"></i>Compliance</span>
        </div>
        <div class="card-body">
          <form @submit.prevent="handleReceiptSubmit" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Beer Item <span class="text-danger-600">*</span>
                </label>
                <select
                  v-model="receiptForm.item_id"
                  class="input"
                  required
                >
                  <option value="">Select beer item...</option>
                  <option v-for="item in beerItems" :key="item.id" :value="item.id">
                    {{ item.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Location <span class="text-danger-600">*</span>
                </label>
                <select
                  v-model="receiptForm.location_id"
                  class="input"
                  required
                >
                  <option value="">Select location...</option>
                  <option v-for="location in locations" :key="location.id" :value="location.id">
                    {{ location.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Quantity (Barrels) <span class="text-danger-600">*</span>
                </label>
                <input
                  v-model.number="receiptForm.quantity"
                  type="number"
                  step="0.01"
                  min="0"
                  class="input"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Receipt Date <span class="text-danger-600">*</span>
                </label>
                <input
                  v-model="receiptForm.created_at"
                  type="datetime-local"
                  class="input"
                  required
                />
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Source Brewery TTB Number
                </label>
                <input
                  v-model="receiptForm.related_brewery_ttb"
                  type="text"
                  class="input"
                  placeholder="BR-XXXXX"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  Notes
                </label>
                <textarea
                  v-model="receiptForm.note"
                  rows="3"
                  class="input"
                  placeholder="Additional details..."
                ></textarea>
              </div>
            </div>

            <div v-if="receiptMessage" class="p-4 rounded-lg" :class="receiptMessageType === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'">
              {{ receiptMessage }}
            </div>

            <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <button
                type="button"
                @click="resetReceiptForm"
                class="btn btn-secondary"
                :disabled="isSavingReceipt"
              >
                Reset
              </button>
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="isSavingReceipt || !isReceiptValid"
              >
                <span v-if="isSavingReceipt">Recording...</span>
                <span v-else>Record Receipt</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Recent Removals -->
    <div class="card">
      <div class="card-header flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">Recent Removals</h3>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Last 30 days · classified entries</p>
        </div>
        <span class="meta-pill"><i class="ri-list-unordered" aria-hidden="true"></i>{{ recentRemovals.length }}</span>
      </div>
      <div class="card-body p-0">
        <div class="overflow-x-auto">
          <div class="overflow-y-auto max-h-96">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item</th>
                  <th>Location</th>
                  <th class="text-right">Quantity</th>
                  <th>Purpose</th>
                  <th>Tax Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="removal in recentRemovals" :key="removal.id">
                  <td>{{ formatDate(removal.created_at) }}</td>
                  <td>{{ removal.item_name || 'Unknown' }}</td>
                  <td>{{ removal.location_name || 'Unknown' }}</td>
                  <td class="text-right font-mono">{{ Math.abs(removal.quantity).toFixed(2) }}</td>
                  <td>
                    <span class="px-2 py-1 rounded text-xs font-medium" :class="getPurposeClass(removal.removal_purpose)">
                      {{ formatPurpose(removal.removal_purpose) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="removal.tax_status" class="px-2 py-1 rounded text-xs font-medium" :class="getTaxStatusClass(removal.tax_status)">
                      {{ formatTaxStatus(removal.tax_status) }}
                    </span>
                    <span v-else class="text-neutral-400 dark:text-neutral-500 text-xs">—</span>
                  </td>
                </tr>
                <tr v-if="recentRemovals.length === 0">
                  <td colspan="6" class="py-6 text-center text-neutral-500 dark:text-neutral-400">
                    No removals recorded yet
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'

const form = reactive({
  item_id: '',
  location_id: '',
  quantity: null,
  removal_purpose: '',
  tax_status: '',
  created_at: new Date().toISOString().slice(0, 16),
  related_brewery_ttb: '',
  export_destination: '',
  note: '',
  batch_id: '', // Optional, for recall/traceability
  consumption_form: '' // TTB Line 21: cellar|keg|case when on-premise
})

const receiptForm = reactive({
  item_id: '',
  location_id: '',
  quantity: null,
  created_at: new Date().toISOString().slice(0, 16),
  related_brewery_ttb: '',
  note: ''
})

const beerItems = ref([])
const allLocations = ref([])
const vessels = ref([])
const recentRemovals = ref([])
const isSaving = ref(false)
const isSavingReceipt = ref(false)
const message = ref('')
const messageType = ref('')
const receiptMessage = ref('')
const receiptMessageType = ref('')
const availableQty = ref(null)

// Watch for item/location changes to update available quantity
watch([() => form.item_id, () => form.location_id], async ([itemId, locationId]) => {
  if (itemId && locationId) {
    try {
      availableQty.value = await LedgerRepository.getOnhand(itemId, locationId)
    } catch (error) {
      console.error('Failed to get available quantity:', error)
      availableQty.value = 0
    }
  } else {
    availableQty.value = null
  }
}, { immediate: true })

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

const isFormValid = computed(() => {
  return form.item_id && form.location_id && form.quantity > 0 && form.removal_purpose
})

const isReceiptValid = computed(() => {
  return receiptForm.item_id && receiptForm.location_id && receiptForm.quantity > 0
})

const loadData = async () => {
  try {
    const [itemsList, locsList, vesselsList] = await Promise.all([
      ItemRepository.getBeerItems(),
      LocationRepository.getAll(),
      VesselRepository.getAll()
    ])
    beerItems.value = itemsList
    allLocations.value = locsList || []
    vessels.value = vesselsList || []

    // Load recent removals
    const entries = await LedgerRepository.getEntries({
      type: 'CONSUME',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    recentRemovals.value = entries
      .filter(e => e.removal_purpose) // Only show classified removals
      .slice(0, 20)
      .reverse()
  } catch (error) {
    console.error('Failed to load data:', error)
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    message.value = 'Please fill in all required fields'
    messageType.value = 'error'
    return
  }

  // Auto-set tax status based on removal purpose if not set
  let taxStatus = form.tax_status
  if (!taxStatus) {
    const taxFreePurposes = ['export', 'rnd', 'supplies', 'inter_brewery']
    taxStatus = taxFreePurposes.includes(form.removal_purpose) ? 'tax_free' : 'taxable'
  }

  isSaving.value = true
  message.value = ''

  try {
    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: form.item_id,
      location_id: form.location_id,
      quantity: -Math.abs(form.quantity), // Negative for consumption
      removal_purpose: form.removal_purpose,
      tax_status: taxStatus,
      created_at: new Date(form.created_at).toISOString(),
      note: form.note || undefined,
      related_brewery_id: form.related_brewery_ttb || undefined,
      batch_id: form.batch_id || undefined,
      consumption_form: form.consumption_form || undefined
    })

    message.value = 'Removal recorded successfully'
    messageType.value = 'success'
    
    // Reload recent removals
    await loadData()
    
    // Reset form
    resetForm()
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to record removal:', error)
    message.value = error.message || 'Failed to record removal'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

const handleReceiptSubmit = async () => {
  if (!isReceiptValid.value) {
    receiptMessage.value = 'Please fill in all required fields'
    receiptMessageType.value = 'error'
    return
  }

  isSavingReceipt.value = true
  receiptMessage.value = ''

  try {
    await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: receiptForm.item_id,
      location_id: receiptForm.location_id,
      quantity: Math.abs(receiptForm.quantity),
      operation_type: 'in_bond',
      related_brewery_id: receiptForm.related_brewery_ttb || undefined,
      created_at: new Date(receiptForm.created_at).toISOString(),
      note: receiptForm.note || undefined,
      data: { in_bond: true }
    })

    receiptMessage.value = 'In-bond receipt recorded successfully'
    receiptMessageType.value = 'success'

    await loadData()
    resetReceiptForm()
    setTimeout(() => (receiptMessage.value = ''), 3000)
  } catch (error) {
    console.error('Failed to record in-bond receipt:', error)
    receiptMessage.value = error.message || 'Failed to record in-bond receipt'
    receiptMessageType.value = 'error'
  } finally {
    isSavingReceipt.value = false
  }
}

const resetForm = () => {
  form.item_id = ''
  form.location_id = ''
  form.quantity = null
  form.removal_purpose = ''
  form.consumption_form = ''
  form.tax_status = ''
  form.created_at = new Date().toISOString().slice(0, 16)
  form.related_brewery_ttb = ''
  form.export_destination = ''
  form.note = ''
  form.batch_id = ''
  message.value = ''
}

const resetReceiptForm = () => {
  receiptForm.item_id = ''
  receiptForm.location_id = ''
  receiptForm.quantity = null
  receiptForm.created_at = new Date().toISOString().slice(0, 16)
  receiptForm.related_brewery_ttb = ''
  receiptForm.note = ''
  receiptMessage.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatPurpose = (purpose) => {
  const purposes = {
    sale: 'Sale',
    consumption: 'Consumption',
    export: 'Export',
    rnd: 'R&D',
    supplies: 'Supplies',
    inter_brewery: 'Inter-Brewery',
    unfit: 'Unfit',
    on_premise: 'On-Premise',
    sample: 'Sample',
    destruction: 'Destroyed',
    dsp_transfer: 'DSP Transfer',
    loss_theft: 'Loss/Theft'
  }
  return purposes[purpose] || purpose
}

const formatTaxStatus = (status) => {
  const statuses = {
    tax_determined: 'Tax-Determined',
    tax_free: 'Tax-Free',
    taxable: 'Taxable'
  }
  return statuses[status] || status
}

const getPurposeClass = (purpose) => {
  const classes = {
    sale: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    export: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300',
    rnd: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    loss_theft: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300'
  }
  return classes[purpose] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
}

const getTaxStatusClass = (status) => {
  const classes = {
    tax_free: 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300',
    tax_determined: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
    taxable: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
  }
  return classes[status] || 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
}

onMounted(() => {
  loadData()
})
</script>
