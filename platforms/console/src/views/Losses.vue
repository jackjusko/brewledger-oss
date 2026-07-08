<template>
  <div class="desktop-container">
    <!-- Loss Form -->
    <div class="card mb-8">
      <div class="card-header flex items-center gap-3">
        <i class="ri-error-warning-line text-xl text-warning-600 dark:text-warning-400" aria-hidden="true"></i>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Record Loss</h3>
      </div>
      <div class="card-body">
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Item Selection (beer items only for TTB Line 30) -->
        <div v-if="items.length === 0" class="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-lg text-sm">
          No beer items (Finished Beer) found. Sync or run the TTB beer category migration to add the Finished Beer item for TTB reporting.
        </div>
        <div v-else>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Item <span class="text-danger-600">*</span>
          </label>
          <select
            v-model="form.item_id"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            required
          >
            <option value="">Select item...</option>
            <option v-for="item in items" :key="item.id" :value="item.id">
              {{ item.name }}
            </option>
          </select>
        </div>

        <!-- Location -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Location <span class="text-danger-600">*</span>
          </label>
          <select
            v-model="form.location_id"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            required
          >
            <option value="">Select location...</option>
            <option v-for="location in locations" :key="location.id" :value="location.id">
              {{ location.name }}
            </option>
          </select>
        </div>

        <!-- Loss Type -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Loss Type <span class="text-danger-600">*</span>
          </label>
          <select
            v-model="form.loss_type"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            required
          >
            <option value="">Select loss type...</option>
            <option value="theft">Theft</option>
            <option value="spoilage">Spoilage</option>
            <option value="breakage">Breakage</option>
            <option value="other">Other</option>
          </select>
        </div>

        <!-- Quantity Lost -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Quantity Lost <span class="text-danger-600">*</span>
          </label>
          <input
            v-model.number="form.quantity"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            placeholder="0.00"
            required
          />
          <p class="text-sm text-neutral-500 dark:text-stone-400 mt-1">
            Available: <span v-if="availableQty !== null">{{ availableQty.toFixed(2) }}</span><span v-else>Loading...</span>
          </p>
        </div>

        <!-- Loss Date -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Loss Date <span class="text-danger-600">*</span>
          </label>
          <input
            v-model="form.loss_date"
            type="datetime-local"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            required
          />
        </div>

        <!-- Incident Details -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Incident Details
          </label>
          <textarea
            v-model="form.incident_details"
            rows="3"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
            placeholder="Describe the loss incident..."
          ></textarea>
        </div>

        <!-- Messages -->
        <div v-if="message" class="p-4 rounded-lg" :class="messageType === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'">
          {{ message }}
        </div>

        <!-- Submit -->
        <div class="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-stone-700 transition-colors font-medium"
            :disabled="isSaving"
          >
            Reset
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSaving || !isFormValid"
          >
            <span v-if="isSaving">Recording...</span>
            <span v-else>Record Loss</span>
          </button>
        </div>
      </form>
      </div>
    </div>

    <!-- Recent Losses -->
    <div class="bg-white dark:bg-stone-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
        <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100">Recent Losses</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="text-left py-3 px-6 font-medium text-neutral-700 dark:text-stone-300">Date</th>
              <th class="text-left py-3 px-6 font-medium text-neutral-700 dark:text-stone-300">Item</th>
              <th class="text-left py-3 px-6 font-medium text-neutral-700 dark:text-stone-300">Location</th>
              <th class="text-right py-3 px-6 font-medium text-neutral-700 dark:text-stone-300">Quantity</th>
              <th class="text-left py-3 px-6 font-medium text-neutral-700 dark:text-stone-300">Loss Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="loss in recentLosses" :key="loss.id" class="border-b border-neutral-100 dark:border-stone-700">
              <td class="py-3 px-6 text-neutral-900 dark:text-stone-100">{{ formatDate(loss.created_at) }}</td>
              <td class="py-3 px-6 text-neutral-900 dark:text-stone-100">{{ loss.item_name || 'Unknown' }}</td>
              <td class="py-3 px-6 text-neutral-900 dark:text-stone-100">{{ loss.location_name || 'Unknown' }}</td>
              <td class="py-3 px-6 text-right font-mono text-neutral-900 dark:text-stone-100">{{ Math.abs(loss.quantity).toFixed(2) }}</td>
              <td class="py-3 px-6">
                <span class="px-2 py-1 rounded text-xs font-medium" :class="getLossTypeClass(loss.loss_type)">
                  {{ formatLossType(loss.loss_type) }}
                </span>
              </td>
            </tr>
            <tr v-if="recentLosses.length === 0">
              <td colspan="5" class="py-8 text-center text-neutral-500 dark:text-stone-400">
                No losses recorded yet
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { VarianceEventRepository } from '../repositories/VarianceEventRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'

const form = reactive({
  item_id: '',
  location_id: '',
  loss_type: '',
  quantity: null,
  loss_date: new Date().toISOString().slice(0, 16),
  incident_details: ''
})

const items = ref([])
const allLocations = ref([])
const vessels = ref([])
const recentLosses = ref([])
const isSaving = ref(false)
const message = ref('')
const messageType = ref('')
const availableQty = ref(null)

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
  return form.item_id && form.location_id && form.loss_type && form.quantity > 0 && form.loss_date
})

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

const loadData = async () => {
  try {
    const [itemsList, locsList, vesselsList] = await Promise.all([
      ItemRepository.getBeerItems(),
      LocationRepository.getAll(),
      VesselRepository.getAll()
    ])
    items.value = itemsList
    allLocations.value = locsList || []
    vessels.value = vesselsList || []
    
    // Load recent losses (variance events with loss_type)
    const varianceEvents = await VarianceEventRepository.getAll()
    recentLosses.value = varianceEvents
      .filter(e => e.loss_type) // Only show classified losses
      .slice(0, 20)
      .reverse()
    
    // Also load ledger entries with loss classification for display
    const entries = await LedgerRepository.getEntries({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    })
    const lossEntries = entries.filter(e => 
      e.removal_purpose === 'loss_theft' || 
      (e.type === 'CONSUME' && e.note?.toLowerCase().includes('loss'))
    )
    
    // Combine and deduplicate
    const lossMap = new Map()
    lossEntries.forEach(e => {
      if (!lossMap.has(e.id)) {
        lossMap.set(e.id, {
          id: e.id,
          created_at: e.created_at,
          item_name: e.item_name,
          location_name: e.location_name,
          quantity: e.quantity,
          loss_type: e.removal_purpose === 'loss_theft' ? 'theft' : 'other'
        })
      }
    })
    
    recentLosses.value = Array.from(lossMap.values()).slice(0, 20).reverse()
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

  isSaving.value = true
  message.value = ''

  try {
    // Create variance event for the loss
    const varianceEvent = await VarianceEventRepository.create({
      item_id: form.item_id,
      location_id: form.location_id,
      expected_qty: availableQty.value || 0,
      actual_qty: (availableQty.value || 0) - form.quantity,
      delta_qty: -form.quantity, // Negative for loss
      reason: form.incident_details || `Loss: ${form.loss_type}`,
      variance_type: 'shortage', // Losses are shortages
      loss_type: form.loss_type
    })

    // Create ledger entry for the loss (CONSUME with removal_purpose: loss_theft)
    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: form.item_id,
      location_id: form.location_id,
      quantity: -Math.abs(form.quantity), // Negative for consumption
      removal_purpose: 'loss_theft',
      created_at: new Date(form.loss_date).toISOString(),
      note: `Loss (${form.loss_type}): ${form.incident_details || 'No details'}`
    })

    message.value = 'Loss recorded successfully'
    messageType.value = 'success'
    
    // Reload recent losses
    await loadData()
    
    // Reset form
    resetForm()
    
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to record loss:', error)
    message.value = error.message || 'Failed to record loss'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

const resetForm = () => {
  form.item_id = ''
  form.location_id = ''
  form.loss_type = ''
  form.quantity = null
  form.loss_date = new Date().toISOString().slice(0, 16)
  form.incident_details = ''
  message.value = ''
}

const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatLossType = (type) => {
  const types = {
    theft: 'Theft',
    spoilage: 'Spoilage',
    breakage: 'Breakage',
    other: 'Other'
  }
  return types[type] || type
}

const getLossTypeClass = (type) => {
  const classes = {
    theft: 'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300',
    spoilage: 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300',
    breakage: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    other: 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300'
  }
  return classes[type] || 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300'
}

onMounted(() => {
  loadData()
})
</script>
