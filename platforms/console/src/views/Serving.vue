<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Serving</h4>
        <p>Serving tanks: volume from ledger; set volume when you measure, record removal when beer is poured or lost.</p>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-body">
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">
          All serving locations are listed below (vessels linked to a location and standalone serving locations). Inventory is ledger on-hand at each location. Use <strong>Set volume</strong> after measuring; use <strong>Record removal</strong> when beer is poured or lost.
        </p>
        <div v-if="loading" class="text-sm text-neutral-500">Loading tanks…</div>
        <div v-else-if="tanks.length === 0" class="space-y-3 text-sm text-neutral-600 dark:text-stone-400">
          <p v-if="unlinkedServingCount > 0" class="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3">
            You have <strong>{{ unlinkedServingCount }}</strong> Serving Tank(s) that aren’t linked to a location. Edit them on <router-link to="/vessels" class="text-primary-600 dark:text-primary-400 underline font-medium">Vessels</router-link> and select a <strong>location</strong> (not “None”) so they appear here.
          </p>
          <p v-else>
            No serving tanks yet. On the <router-link to="/vessels" class="text-primary-600 dark:text-primary-400 underline font-medium">Vessels</router-link> page: create or edit a vessel, set type to <strong>Serving Tank</strong>, and select a <strong>location</strong> (Serving or Cellar — not “None”). Linked tanks will show here.
          </p>
        </div>
        <div v-else class="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
          <div
            v-for="tank in tanks"
            :key="tank.vesselId || 'loc-' + tank.locationId"
            class="border border-neutral-200 dark:border-stone-700 rounded-lg p-4 bg-white dark:bg-stone-900 shadow-sm"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="font-semibold text-neutral-900 dark:text-neutral-100">{{ tank.vesselName }}</div>
                <div class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">
                  {{ tank.locationName }}{{ tank.vesselId ? '' : ' (no vessel)' }}
                </div>
              </div>
              <div class="font-mono text-neutral-900 dark:text-neutral-100 text-sm">
                {{ tank.onHand != null ? tank.onHand.toFixed(2) : '0' }} bbl
              </div>
            </div>
            <div class="mt-2 text-sm text-neutral-600 dark:text-stone-300">
              {{ tank.beerItemName }}
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button v-if="tank.vesselId" type="button" class="btn btn-secondary btn-sm" :disabled="tank.conflict || !tank.beerItem" @click="openSetVolume(tank)">
                Set volume
              </button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="tank.vesselId && (tank.conflict || !tank.beerItem)" @click="openRecordRemoval(tank)">
                Record removal
              </button>
              <button
                v-if="tank.vesselId && tank.beerItem && (tank.onHand == null ? 0 : tank.onHand) > 0"
                type="button"
                class="btn btn-secondary btn-sm border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300"
                :disabled="tank.conflict"
                @click="openSetEmpty(tank)"
              >
                Set empty
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Set volume modal -->
    <div v-if="modals.setVolume" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Set volume — {{ setVolumeTank?.vesselName }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-3">
          This will reconcile ledger at <strong>{{ setVolumeTank?.locationName }}</strong> to the entered value. Current on-hand: <strong>{{ setVolumeTank?.onHand != null ? setVolumeTank.onHand.toFixed(2) : '0' }}</strong> bbl.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Measured volume (bbl)</label>
          <input v-model.number="forms.setVolume.measured_volume" type="number" step="0.01" min="0" class="input w-full" placeholder="0.00">
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="modals.setVolume = false">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveSetVolume" :disabled="saving || forms.setVolume.measured_volume == null">Save</button>
        </div>
      </div>
    </div>

    <!-- Record removal modal -->
    <div v-if="modals.recordRemoval" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Record removal — {{ recordRemovalTank?.vesselName }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-3">
          Record a pour or loss from <strong>{{ recordRemovalTank?.locationName }}</strong>. This posts a CONSUME for TTB Line 21.
        </p>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Amount to remove (bbl)</label>
          <input v-model.number="forms.recordRemoval.quantity" type="number" step="0.01" min="0" class="input w-full" placeholder="0.00">
          <p v-if="recordRemovalExceedsOnHand" class="text-xs text-amber-600 dark:text-amber-400 mt-1">Cannot remove more than current on-hand ({{ recordRemovalTank?.onHand != null ? recordRemovalTank.onHand.toFixed(2) : '0' }} bbl).</p>
        </div>
        <div class="mb-4">
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Note (optional)</label>
          <input v-model="forms.recordRemoval.note" type="text" class="input w-full" placeholder="e.g. Tap 1 pour">
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="modals.recordRemoval = false">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveRecordRemoval" :disabled="saving || !forms.recordRemoval.quantity || forms.recordRemoval.quantity <= 0 || recordRemovalExceedsOnHand">Record</button>
        </div>
      </div>
    </div>

    <!-- Set empty modal -->
    <div v-if="modals.setEmpty" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Set empty — {{ setEmptyTank?.vesselName }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">
          This will set the ledger at <strong>{{ setEmptyTank?.locationName }}</strong> to 0 bbl for the current beer. The tank will be available for another batch.
        </p>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="modals.setEmpty = false">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveSetEmpty" :disabled="saving">Set empty</button>
        </div>
      </div>
    </div>

    <!-- Record removal at location (no vessel): mini consume – pick item + quantity -->
    <div v-if="modals.recordRemovalLocation" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Record removal — {{ recordRemovalLocationTank?.locationName }}</h3>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mb-3">
          Record a pour or loss from this location. Choose the beer item and amount. This posts a CONSUME for TTB Line 21.
        </p>
        <div v-if="recordRemovalLocationItems.length === 0" class="mb-4 text-sm text-neutral-500 dark:text-stone-400">
          No beer at this location. Add beer first (e.g. via Mark Production Complete to this location).
        </div>
        <template v-else>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Item</label>
            <select v-model="forms.recordRemovalLocation.item_id" class="input w-full">
              <option :value="null">Select item</option>
              <option v-for="row in recordRemovalLocationItems" :key="row.item.id" :value="row.item.id">
                {{ row.item.name }} — {{ row.onHand != null ? row.onHand.toFixed(2) : '0' }} bbl on hand
              </option>
            </select>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Amount to remove (bbl)</label>
            <input v-model.number="forms.recordRemovalLocation.quantity" type="number" step="0.01" min="0" class="input w-full" placeholder="0.00">
            <p v-if="recordRemovalLocationExceedsOnHand" class="text-xs text-amber-600 dark:text-amber-400 mt-1">Cannot remove more than on-hand ({{ recordRemovalLocationSelectedOnHand != null ? recordRemovalLocationSelectedOnHand.toFixed(2) : '0' }} bbl).</p>
          </div>
          <div class="mb-4">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Note (optional)</label>
            <input v-model="forms.recordRemovalLocation.note" type="text" class="input w-full" placeholder="e.g. Tap 1 pour">
          </div>
        </template>
        <div class="flex justify-end gap-2">
          <button type="button" class="btn btn-secondary" @click="modals.recordRemovalLocation = false">Cancel</button>
          <button type="button" class="btn btn-primary" @click="saveRecordRemovalLocation" :disabled="saving || recordRemovalLocationItems.length === 0 || !forms.recordRemovalLocation.item_id || !forms.recordRemovalLocation.quantity || forms.recordRemovalLocation.quantity <= 0 || recordRemovalLocationExceedsOnHand">Record</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, inject } from 'vue'
import { VesselRepository } from '../repositories/VesselRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { SyncService } from '../services/SyncService'
import { getCurrentBeerAtLocation } from '../services/ServingOccupancyService'

const modal = inject('modal', null)
const showAlert = (title, message, variant = 'primary') => {
  if (modal?.alert) modal.alert(title, message, variant)
  else alert(`${title}: ${message}`)
}

const loading = ref(true)
const saving = ref(false)
const tanks = ref([])
const unlinkedServingCount = ref(0)
const modals = ref({ setVolume: false, recordRemoval: false, setEmpty: false, recordRemovalLocation: false })
const setVolumeTank = ref(null)
const recordRemovalTank = ref(null)
const setEmptyTank = ref(null)
const recordRemovalLocationTank = ref(null)
const recordRemovalLocationItems = ref([])
const forms = ref({
  setVolume: { measured_volume: null },
  recordRemoval: { quantity: null, note: '' },
  recordRemovalLocation: { item_id: null, quantity: null, note: '' }
})

const recordRemovalExceedsOnHand = computed(() => {
  const qty = Number(forms.value.recordRemoval.quantity)
  if (!recordRemovalTank.value || qty <= 0) return false
  const onHand = recordRemovalTank.value.onHand != null ? recordRemovalTank.value.onHand : 0
  return qty > onHand
})

const recordRemovalLocationSelectedOnHand = computed(() => {
  if (!forms.value.recordRemovalLocation.item_id) return null
  const row = recordRemovalLocationItems.value.find(r => r.item.id === forms.value.recordRemovalLocation.item_id)
  return row ? row.onHand : null
})

const recordRemovalLocationExceedsOnHand = computed(() => {
  const qty = Number(forms.value.recordRemovalLocation.quantity)
  if (qty <= 0) return false
  const onHand = recordRemovalLocationSelectedOnHand.value
  return onHand != null && qty > onHand
})

async function loadTanks() {
  loading.value = true
  try {
    const [vessels, locations] = await Promise.all([
      VesselRepository.getAll(),
      LocationRepository.getAll()
    ])
    const hasLocationId = (v) => v.location_id != null && v.location_id !== ''
    const isServingType = (v) => (v.type === 'SERVING' || v.type === 'Serving')
    const servingVessels = vessels.filter(v => hasLocationId(v) && isServingType(v) && !v.deleted_at)
    unlinkedServingCount.value = vessels.filter(v => !v.deleted_at && isServingType(v) && !hasLocationId(v)).length

    // Location-first: one card per serving location. Vessel links to location; no duplication.
    const vesselByLocationId = new Map(servingVessels.map(v => [v.location_id, v]))
    const servingLocations = (locations || []).filter(
      l => !l.deleted_at && (l.stage === 'serving')
    )
    const result = []

    for (const loc of servingLocations) {
      const vessel = vesselByLocationId.get(loc.id)
      const occupancy = await getCurrentBeerAtLocation(loc.id)
      let onHand = null
      let beerItem = null
      let beerItemName = 'No beer'
      let conflict = false
      if (occupancy.conflict) {
        beerItemName = 'Multiple beers – resolve inventory'
        conflict = true
      } else if (occupancy.item) {
        beerItem = occupancy.item
        beerItemName = occupancy.item.name
        onHand = occupancy.onHand
      }
      result.push({
        vesselId: vessel?.id ?? null,
        vesselName: vessel?.name || loc.name || 'Location',
        locationId: loc.id,
        locationName: loc.name || 'Location',
        onHand: onHand != null ? onHand : 0,
        beerItem,
        beerItemName,
        conflict
      })
    }

    tanks.value = result
  } finally {
    loading.value = false
  }
}

function openSetVolume(tank) {
  if (tank.conflict || !tank.beerItem) {
    showAlert('Cannot set volume', tank.conflict ? 'This location has more than one beer. Resolve inventory so only one beer has quantity here.' : 'Add beer to this location first (e.g. via Mark Production Complete).', 'danger')
    return
  }
  setVolumeTank.value = tank
  forms.value.setVolume = { measured_volume: tank.onHand != null ? tank.onHand : 0 }
  modals.value.setVolume = true
}

async function saveSetVolume() {
  if (!setVolumeTank.value || forms.value.setVolume.measured_volume == null) return
  const beerItem = setVolumeTank.value.beerItem
  if (!beerItem) {
    showAlert('Error', 'No beer item at this location. Add beer first (e.g. via Mark Production Complete).', 'danger')
    return
  }
  saving.value = true
  try {
    const measured = Number(forms.value.setVolume.measured_volume)
    const onHand = setVolumeTank.value.onHand != null ? setVolumeTank.value.onHand : await LedgerRepository.getOnhand(beerItem.id, setVolumeTank.value.locationId)
    const delta = measured - onHand
    const note = `Set volume reconcile (measured ${measured} bbl) — ${setVolumeTank.value.vesselName}`
    if (delta < 0) {
      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: beerItem.id,
        location_id: setVolumeTank.value.locationId,
        quantity: delta,
        removal_purpose: 'serving',
        consumption_form: 'cellar',
        note,
        data: { source: 'set_volume_reconcile' }
      })
    } else if (delta > 0) {
      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: beerItem.id,
        location_id: setVolumeTank.value.locationId,
        quantity: delta,
        note,
        data: { source: 'set_volume_reconcile' }
      })
    }
    modals.value.setVolume = false
    await loadTanks()
    SyncService.sync()
    showAlert('Volume set', 'Volume updated successfully.')
  } catch (e) {
    showAlert('Error', e.message || 'Failed to set volume.', 'danger')
  } finally {
    saving.value = false
  }
}

async function openRecordRemoval(tank) {
  if (tank.vesselId) {
    if (tank.conflict || !tank.beerItem) {
      showAlert('Cannot record removal', tank.conflict ? 'This location has more than one beer. Resolve inventory so only one beer has quantity here.' : 'Add beer to this location first (e.g. via Mark Production Complete).', 'danger')
      return
    }
    recordRemovalTank.value = tank
    forms.value.recordRemoval = { quantity: null, note: '' }
    modals.value.recordRemoval = true
    return
  }
  recordRemovalLocationTank.value = tank
  const occupancy = await getCurrentBeerAtLocation(tank.locationId)
  if (occupancy.empty) {
    recordRemovalLocationItems.value = []
  } else if (occupancy.conflict && occupancy.items) {
    recordRemovalLocationItems.value = occupancy.items
  } else if (occupancy.item) {
    recordRemovalLocationItems.value = [{ item: occupancy.item, onHand: occupancy.onHand }]
  } else {
    recordRemovalLocationItems.value = []
  }
  const firstId = recordRemovalLocationItems.value[0]?.item?.id ?? null
  forms.value.recordRemovalLocation = { item_id: firstId, quantity: null, note: '' }
  modals.value.recordRemovalLocation = true
}

async function saveRecordRemoval() {
  if (!recordRemovalTank.value || !forms.value.recordRemoval.quantity || forms.value.recordRemoval.quantity <= 0 || recordRemovalExceedsOnHand.value) return
  const beerItem = recordRemovalTank.value.beerItem
  if (!beerItem) {
    showAlert('Error', 'No beer item at this location. Add beer first (e.g. via Mark Production Complete).', 'danger')
    return
  }
  saving.value = true
  try {
    const qty = -Math.abs(Number(forms.value.recordRemoval.quantity))
    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: beerItem.id,
      location_id: recordRemovalTank.value.locationId,
      quantity: qty,
      removal_purpose: 'serving',
      consumption_form: 'cellar',
      note: forms.value.recordRemoval.note || `Pour/loss from ${recordRemovalTank.value.vesselName}`
    })
    modals.value.recordRemoval = false
    await loadTanks()
    SyncService.sync()
    showAlert('Removal recorded', 'Removal recorded successfully.')
  } catch (e) {
    showAlert('Error', e.message || 'Failed to record removal.', 'danger')
  } finally {
    saving.value = false
  }
}

async function saveRecordRemovalLocation() {
  const tank = recordRemovalLocationTank.value
  if (!tank || !forms.value.recordRemovalLocation.item_id || !forms.value.recordRemovalLocation.quantity || forms.value.recordRemovalLocation.quantity <= 0 || recordRemovalLocationExceedsOnHand.value) return
  saving.value = true
  try {
    const qty = -Math.abs(Number(forms.value.recordRemovalLocation.quantity))
    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: forms.value.recordRemovalLocation.item_id,
      location_id: tank.locationId,
      quantity: qty,
      removal_purpose: 'serving',
      consumption_form: 'cellar',
      note: forms.value.recordRemovalLocation.note || `Pour/loss from ${tank.locationName}`
    })
    modals.value.recordRemovalLocation = false
    await loadTanks()
    SyncService.sync()
    showAlert('Removal recorded', 'Removal recorded successfully.')
  } catch (e) {
    showAlert('Error', e.message || 'Failed to record removal.', 'danger')
  } finally {
    saving.value = false
  }
}

function openSetEmpty(tank) {
  if (tank.conflict || !tank.beerItem) return
  setEmptyTank.value = tank
  modals.value.setEmpty = true
}

async function saveSetEmpty() {
  if (!setEmptyTank.value) return
  const beerItem = setEmptyTank.value.beerItem
  if (!beerItem) {
    showAlert('Error', 'No beer item at this location.', 'danger')
    return
  }
  saving.value = true
  try {
    const tank = setEmptyTank.value
    const onHand = tank.onHand != null ? tank.onHand : await LedgerRepository.getOnhand(beerItem.id, tank.locationId)
    if (onHand > 0) {
      const note = `Set empty — ${tank.vesselName}`
      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: beerItem.id,
        location_id: tank.locationId,
        quantity: -onHand,
        removal_purpose: 'serving',
        consumption_form: 'cellar',
        note,
        data: { source: 'set_empty' }
      })
    }
    modals.value.setEmpty = false
    setEmptyTank.value = null
    await loadTanks()
    SyncService.sync()
    showAlert('Tank cleared', 'Tank set empty and available for another batch.')
  } catch (e) {
    showAlert('Error', e.message || 'Failed to set empty.', 'danger')
  } finally {
    saving.value = false
  }
}

onMounted(loadTanks)
onActivated(loadTanks)
</script>
