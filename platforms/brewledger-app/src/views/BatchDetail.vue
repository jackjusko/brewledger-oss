<template>
  <div class="pb-20 space-y-4">
    <!-- Header -->
    <div v-if="loading" class="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">Loading...</div>
    <div v-else>
      <!-- Title & Status -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
        <div class="flex justify-between items-start gap-2">
          <div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-50">{{ batch.name }}</h1>
            <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              <span>{{ formatDate(batch.batch_date) }}</span>
              <span v-if="displayTotalVolume != null">{{ displayTotalVolume }} {{ batch.planned_volume_unit || '' }}</span>
            </div>
          </div>
          <span class="px-2 py-0.5 rounded text-xs font-medium shrink-0" :class="getStatusClass(computedStatus)">{{ computedStatus }}</span>
        </div>

        <!-- Vessel splits -->
        <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div class="flex justify-between items-center mb-2">
            <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Vessels</span>
            <button @click="openSplitTransferModal" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Split / Transfer</button>
          </div>
          <div v-if="batchLocations.length === 0" class="py-3 text-center text-gray-500 dark:text-gray-400 text-xs">
            No vessels assigned.
          </div>
          <div v-for="split in batchLocations" :key="split.id" class="bg-gray-50 dark:bg-gray-900 p-2 rounded border border-gray-100 dark:border-gray-700 mb-2 last:mb-0">
            <div class="flex justify-between items-center mb-2">
              <div>
                <span class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ getVesselName(split.vessel_id) || 'Vessel' }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400 ml-1">{{ split.current_volume != null ? split.current_volume : '—' }} {{ batch.planned_volume_unit || '' }}{{ split.status ? ` · ${split.status}` : '' }}</span>
                <div v-if="getLastSnapshot(split.id)" class="text-[11px] text-gray-500 dark:text-gray-400 ml-1">
                  Set {{ getLastSnapshot(split.id).measured_volume }} @ {{ formatDateTime(getLastSnapshot(split.id).measured_at) }}
                </div>
              </div>
              <div class="flex items-center gap-1">
                <button @click="openSetVolumeModal(split.id)" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Set</button>
                <button @click="openAdjustVolumeModal(split.id)" class="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400">Adjust</button>
                <button @click="openReadingModalForSplit(split.id)" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Log</button>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-3 text-xs">
              <div>
                <div class="text-gray-500 dark:text-gray-400 mb-0.5">Gravity</div>
                <div class="font-mono font-bold text-base text-gray-900 dark:text-gray-100">{{ split.current_gravity ?? '—' }}</div>
              </div>
              <div>
                <div class="text-gray-500 dark:text-gray-400 mb-0.5">Temp</div>
                <div class="font-mono font-bold text-base text-gray-900 dark:text-gray-100">{{ split.current_temp != null ? split.current_temp + '°' : '—' }}</div>
              </div>
              <div>
                <div class="text-gray-500 dark:text-gray-400 mb-0.5">pH</div>
                <div class="font-mono font-bold text-base text-gray-900 dark:text-gray-100">{{ split.current_ph ?? '—' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-3 mb-5">
        <button @click="openReadingModal" class="py-2.5 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-1.5">
          <span>📊</span> Log Reading
        </button>
        <button @click="openAdditionModal" class="py-2.5 bg-purple-600 text-white rounded text-sm font-medium hover:bg-purple-700 flex items-center justify-center gap-1.5">
          <span>➕</span> Add Ingredient
        </button>
        <button @click="openProductionCompleteModal" class="py-2.5 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-1.5">
          <span>🍺</span> Mark Complete
        </button>
        <button @click="openWaterAdditionModal" class="py-2.5 bg-cyan-600 text-white rounded text-sm font-medium hover:bg-cyan-700 flex items-center justify-center gap-1.5">
          <span>💧</span> Add Water
        </button>
        <!-- Recipe consumption button -->
        <button 
          v-if="hasRecipe"
          @click="goToConsumeRecipe"
          :disabled="allIngredientsConsumed"
          class="py-2.5 bg-orange-600 text-white rounded text-sm font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 col-span-2"
        >
          <span>🍽️</span> {{ consumptionButtonText }}
          <span v-if="recipeConsumption.totalItems > 0" class="ml-1 text-xs opacity-80">
            ({{ recipeConsumption.completedItems }}/{{ recipeConsumption.totalItems }})
          </span>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-gray-200 dark:border-gray-600 overflow-x-auto no-scrollbar">
        <button 
          v-for="tab in ['Timeline', 'History']" 
          :key="tab"
          @click="activeTab = tab"
          :class="['px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px', activeTab === tab ? 'text-purple-600 dark:text-purple-400 border-purple-600' : 'text-gray-400 dark:text-gray-300 border-transparent hover:text-gray-600']"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Tab Content: Timeline (Milestones) -->
      <div v-if="activeTab === 'Timeline'" class="space-y-4">
        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 class="font-medium text-sm text-gray-900 dark:text-gray-50">Batch Timeline</h3>
          </div>
          
          <div class="p-3 space-y-4">
            <div>
              <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">Milestones</h4>
              <div class="space-y-0 relative">
                <div class="absolute left-[11px] top-2 bottom-4 w-0.5 bg-gray-100 dark:bg-gray-800"></div>
                <div v-for="(def, idx) in milestoneDefinitions" :key="def.id" class="relative flex items-start gap-3 pb-4 last:pb-0 group">
                  <button 
                    @click="isProductionCompleteDef(def) ? openProductionCompleteModal() : toggleMilestone(def.id)"
                    class="relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all bg-white dark:bg-gray-800"
                    :class="getMilestoneStatusClass(def.id)"
                  >
                    <span v-if="isMilestoneCompleted(def.id)" class="text-xs font-bold">✓</span>
                  </button>
                  <div class="flex-1 -mt-1" :class="{'cursor-pointer': isProductionCompleteDef(def)}" @click="isProductionCompleteDef(def) ? openProductionCompleteModal() : null">
                    <div class="flex justify-between items-center">
                      <span class="font-bold text-gray-900 dark:text-gray-50" :class="{'text-gray-400 dark:text-gray-300': !isMilestoneCompleted(def.id) && !isNextMilestone(def.id)}">
                        {{ def.label }}
                      </span>
                      <span v-if="isMilestoneCompleted(def.id)" class="text-xs font-mono text-gray-500 dark:text-gray-400">
                        {{ formatDateTime(getMilestoneDate(def.id)) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ def.description }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab Content: History -->
      <div v-if="activeTab === 'History'" class="space-y-1.5">
        <div v-if="allHistoryEvents.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400 text-sm bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
          No events logged yet.
        </div>
        <div v-for="event in allHistoryEvents" :key="event.id" class="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 flex justify-between items-start gap-2">
          <div class="flex items-start gap-2 min-w-0">
            <span class="text-lg shrink-0">{{ event.icon }}</span>
            <div class="min-w-0">
              <div class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ event.title }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ event.subtitle }}</div>
            </div>
          </div>
          <span class="text-xs text-gray-400 dark:text-gray-300 shrink-0">{{ formatDateTime(event.date) }}</span>
        </div>
      </div>
    </div>

    <!-- Modals -->

    <!-- Status Modal -->
    <ModalDialog 
      :isOpen="modals.status"
      title="Update Status"
      confirmText="Save"
      type="confirm"
      @confirm="saveStatus"
      @cancel="modals.status = false"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">New Status</label>
          <select v-model="forms.status.status" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="PLANNED">Planned</option>
            <option value="BREWED">Brewed</option>
            <option value="FERMENTING">Fermenting</option>
            <option value="CONDITIONING">Conditioning</option>
            <option value="PACKAGED">Packaged</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        <!-- Dynamic Timestamp Field based on status -->
        <div v-if="['BREWED', 'PACKAGED'].includes(forms.status.status)">
           <label class="block text-sm font-medium mb-1">Date Occurred</label>
           <input v-model="forms.status.date" type="datetime-local" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>
    </ModalDialog>

    <!-- Split / Transfer Modal: one-to-many or many-to-one -->
    <ModalDialog 
      :isOpen="modals.splitTransfer"
      title="Split / Transfer / Combine"
      confirmText="Apply"
      type="confirm"
      @confirm="saveSplitTransfer"
      @cancel="modals.splitTransfer = false"
    >
      <div class="space-y-4">
        <div class="flex gap-2 border-b border-gray-200 dark:border-gray-600 pb-3">
          <button @click="forms.splitTransfer.mode = 'split'" :class="['flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors', forms.splitTransfer.mode === 'split' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300']">
            Split (1 → Many)
          </button>
          <button @click="forms.splitTransfer.mode = 'combine'" :class="['flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors', forms.splitTransfer.mode === 'combine' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300']">
            Combine (Many → 1)
          </button>
        </div>

        <!-- Split mode: one source → many destinations -->
        <div v-if="forms.splitTransfer.mode === 'split'">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Source vessel</label>
            <select v-model="forms.splitTransfer.sourceBatchLocationId" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">— Select —</option>
              <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
                {{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Destinations (resulting volume at each vessel)</label>
            <div class="space-y-2">
              <div v-for="(dest, idx) in forms.splitTransfer.destinations" :key="idx" class="flex gap-2 items-end">
                <select v-model="dest.vessel_id" class="flex-1 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                  <option :value="null">— Vessel —</option>
                  <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
                </select>
                <input v-model.number="dest.volume" type="number" step="any" min="0" class="w-20 border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Vol">
                <button v-if="forms.splitTransfer.destinations.length > 1" type="button" @click="removeSplitDest(idx)" class="p-2 text-red-500">✕</button>
              </div>
              <button type="button" @click="addSplitDest" class="text-sm text-blue-600 dark:text-blue-400">+ Add destination</button>
            </div>
            <p v-if="splitTransferSourceVolume != null" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Source: {{ splitTransferSourceVolume }} {{ batch.planned_volume_unit }}. Enter resulting volume per destination (can differ due to loss or addition).
            </p>
          </div>
        </div>

        <!-- Combine mode: many sources → one destination -->
        <div v-else-if="forms.splitTransfer.mode === 'combine'">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1">Source vessels (select multiple)</label>
            <div class="space-y-1 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded p-2">
              <label v-for="bl in batchLocations" :key="bl.id" class="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                <input type="checkbox" :value="bl.id" v-model="forms.splitTransfer.sourceBatchLocationIds" class="w-4 h-4">
                <span class="text-sm">{{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Destination vessel</label>
            <select v-model="forms.splitTransfer.destinationVesselId" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">— Select or create new —</option>
              <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <div class="mt-2">
              <label class="block text-sm font-medium mb-1">Resulting volume at destination (optional)</label>
              <input v-model.number="forms.splitTransfer.combineDestinationVolume" type="number" step="any" min="0" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm" placeholder="Leave blank to use sum of sources">
            </div>
            <p v-if="combineSourcesSum != null" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
              Sum of sources: {{ combineSourcesSum }} {{ batch.planned_volume_unit }}
            </p>
          </div>
        </div>
      </div>
    </ModalDialog>

    <!-- Adjust Volume Modal -->
    <ModalDialog 
      :isOpen="modals.adjustVolume"
      title="Adjust Volume"
      confirmText="Save"
      type="confirm"
      @confirm="saveAdjustVolume"
      @cancel="modals.adjustVolume = false"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Vessel</label>
          <input :value="adjustVolumeVesselName" disabled class="w-full border p-2 rounded bg-gray-100 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Volume change (negative for loss/serving)</label>
          <input v-model.number="forms.adjustVolume.volume_change" type="number" step="any" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. -2.5 for 2.5 bbl loss">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Reason</label>
          <input v-model="forms.adjustVolume.reason" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Serving, Trub loss">
        </div>
        <div v-if="adjustVolumeIsTank && Number(forms.adjustVolume.volume_change) < 0" class="rounded border border-amber-200 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/30 p-2 text-xs text-amber-800 dark:text-amber-100">
          This will record a removal at {{ adjustVolumeTankLocationName }} (ledger CONSUME) and lower on-hand there.
        </div>
        <div v-else-if="adjustVolumeIsTank && Number(forms.adjustVolume.volume_change) > 0" class="rounded border border-amber-200 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/30 p-2 text-xs text-amber-800 dark:text-amber-100">
          This will add beer at {{ adjustVolumeTankLocationName }} (ledger RECEIVE) and increase on-hand there.
        </div>
        <p v-if="adjustVolumeNewTotal != null && !adjustVolumeIsTank" class="text-xs" :class="adjustVolumeNewTotal >= 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600'">
          New volume: {{ adjustVolumeNewTotal }} {{ batch.planned_volume_unit }}
        </p>
      </div>
    </ModalDialog>

    <!-- Set Volume Modal -->
    <ModalDialog
      :isOpen="modals.setVolume"
      title="Set Volume (Snapshot)"
      confirmText="Save"
      type="confirm"
      @confirm="saveSetVolume"
      @cancel="modals.setVolume = false"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Measured volume</label>
          <input v-model.number="forms.setVolume.measured_volume" type="number" step="any" min="0" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 7.5">
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium mb-1">Measured at</label>
            <input v-model="forms.setVolume.measured_at" type="datetime-local" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Method</label>
            <input v-model="forms.setVolume.method" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Sight glass, dip, etc.">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Note (optional)</label>
          <input v-model="forms.setVolume.note" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. Month-end setpoint">
        </div>
        <div v-if="setVolumeIsTank" class="rounded border border-amber-200 dark:border-amber-600/60 bg-amber-50 dark:bg-amber-900/30 p-2 text-xs text-amber-800 dark:text-amber-100 space-y-1">
          <div>This will reconcile ledger at {{ setVolumeTankLocationName }} to the entered value. Current on-hand: {{ setVolumeCurrentVolume != null ? setVolumeCurrentVolume : '0' }} bbl.</div>
          <div v-if="setVolumeDelta !== null">Delta to apply: {{ setVolumeDelta >= 0 ? '+' : '' }}{{ setVolumeDelta }} {{ batch.planned_volume_unit || '' }}</div>
        </div>
        <div v-else class="text-xs space-y-1">
          <p>Creates a volume snapshot for this vessel (no ledger change).</p>
          <p v-if="setVolumeDelta !== null" :class="setVolumeDelta >= 0 ? 'text-gray-600 dark:text-gray-400' : 'text-red-600'">
            Resulting delta vs current: {{ setVolumeDelta >= 0 ? '+' : '' }}{{ setVolumeDelta }} {{ batch.planned_volume_unit || '' }}
          </p>
          <p v-if="setVolumeLastSnapshot && !isBackdatedSetVolume" class="text-gray-600 dark:text-gray-400">Last set point: {{ setVolumeLastSnapshot.measured_volume }} {{ batch.planned_volume_unit || '' }} at {{ formatDateTime(setVolumeLastSnapshot.measured_at) }}</p>
          <p v-else-if="isBackdatedSetVolume" class="text-amber-700 dark:text-amber-300">Backdated snapshot will rebuild deltas in order.</p>
        </div>
      </div>
    </ModalDialog>

    <!-- Transfer Modal -->
    <ModalDialog
      :isOpen="modals.transfer"
      title="Record Transfer / Pull"
      confirmText="Save"
      type="confirm"
      @confirm="saveTransfer"
      @cancel="modals.transfer = false"
    >
      <div class="space-y-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium mb-1">Destination location (cold storage)</label>
            <select v-model="forms.transfer.destination_location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">— None —</option>
              <option v-for="loc in transferDestinationLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Serving tanks are excluded. Use Mark Production Complete to send beer to a serving tank.</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Destination vessel (optional)</label>
            <select v-model="forms.transfer.destination_vessel_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">— None —</option>
              <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium mb-1">Volume to move</label>
            <input v-model.number="forms.transfer.volume" type="number" step="any" min="0" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 1.5">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Transfer type</label>
            <input v-model="forms.transfer.transfer_type" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="serving_to_kegs">
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded p-3 space-y-2">
          <label class="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-100">
            <input type="checkbox" v-model="forms.transfer.log_to_ledger">
            <span>Log packaged pull to ledger (Finished Beer)</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium mb-1">Beer item</label>
              <select v-model="forms.transfer.ledger_item_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm">
                <option :value="null">— Select beer item —</option>
                <option v-for="i in items.filter(it => it.category === 'Finished Beer')" :key="i.id" :value="i.id">{{ i.name }}</option>
              </select>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 sm:mt-5">Creates a RECEIVE entry at the destination location.</p>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Note</label>
          <input v-model="forms.transfer.note" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Optional note">
        </div>
      </div>
    </ModalDialog>

    <!-- Addition Modal -->
    <ModalDialog 
      :isOpen="modals.addition"
      title="Log Addition"
      confirmText="Log"
      type="confirm"
      @confirm="saveAddition"
      @cancel="modals.addition = false"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Category</label>
          <select v-model="forms.addition.event_type" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
             <option value="Any">Any</option>
             <option v-for="cat in categories" :key="cat.id" :value="cat.name">
               {{ cat.name }}
             </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Item</label>
          <select v-model="forms.addition.item_id" @change="updateLocationAvailability" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
             <option disabled value="">Select Item</option>
             <option v-for="i in filteredItems" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
          <div v-if="forms.addition.event_type && filteredItems.length === 0" class="text-xs text-red-500 mt-1">
            No items found in this category.
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">From Location</label>
          <select v-model="forms.addition.location_id" @change="updateAdditionAvailability" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
             <option disabled value="">Select Location</option>
             <option v-for="l in selectableLocationsForAddIngredientAndSupply" :key="l.id" :value="l.id">{{ getLocationLabel(l) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Add To</label>
          <select v-model="forms.addition.batch_location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
             <option :value="null">All vessels</option>
             <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
               {{ getVesselName(bl.vessel_id) }} ({{ bl.current_volume }} {{ batch?.planned_volume_unit || 'L' }})
             </option>
          </select>
          <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Choose a specific vessel or apply to all vessels
          </div>
        </div>
        <div>
           <label class="block text-sm font-medium mb-1">Quantity Consumed</label>
           <input v-model.number="forms.addition.quantity" type="number" step="0.01" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
           <div v-if="forms.addition.item_id && forms.addition.location_id" class="text-xs mt-1" :class="isAdditionValid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
             Available: {{ additionAvailableQty }}
           </div>
        </div>
      </div>
    </ModalDialog>

    <!-- Reading Modal -->
    <ModalDialog 
      :isOpen="modals.reading"
      title="Log Reading"
      confirmText="Save"
      type="confirm"
      @confirm="saveReading"
      @cancel="modals.reading = false"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Tank / Vessel <span class="text-red-500">*</span></label>
          <select v-model="forms.reading.batch_location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" required>
            <option disabled :value="null">Select vessel</option>
            <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
              {{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch?.planned_volume_unit || '' }}
            </option>
          </select>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Attach this reading to a specific vessel.</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Type</label>
          <select v-model="forms.reading.reading_type" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="GRAVITY">Gravity (SG/Plato)</option>
            <option value="TEMP">Temperature</option>
            <option value="PH">pH</option>
          </select>
        </div>
        <div>
           <label class="block text-sm font-medium mb-1">Value</label>
           <input v-model="forms.reading.value" type="text" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="e.g. 1.050 or 68">
        </div>
        <div>
           <label class="block text-sm font-medium mb-1">Time</label>
           <input v-model="forms.reading.measured_at" type="datetime-local" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>
    </ModalDialog>


    <!-- Production Complete Modal -->
    <ModalDialog 
      :isOpen="modals.productionComplete" 
      title="Mark Production Complete" 
      confirmText="Mark Complete" 
      type="confirm" 
      @confirm="onProductionCompleteConfirm" 
      @cancel="modals.productionComplete = false"
    >
      <div class="space-y-3 max-h-[70vh] overflow-y-auto">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Choose <strong>Serving</strong> or <strong>Packaged</strong> (keg/case).
        </p>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Destination <span class="text-red-500">*</span></label>
          <div class="flex flex-wrap gap-3">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="serving" class="rounded border-gray-300 dark:border-gray-600">
              <span>Serving</span>
            </label>
            <!-- Storage option commented out - code retained for future use; see changes/storage-option-commented-out.md -->
            <!-- <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="storage" class="rounded border-gray-300 dark:border-gray-600">
              <span>Storage</span>
            </label> -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="packaged_keg" class="rounded border-gray-300 dark:border-gray-600">
              <span>Keg</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="packaged_case" class="rounded border-gray-300 dark:border-gray-600">
              <span>Case</span>
            </label>
          </div>
        </div>
        <div v-if="forms.productionComplete.destChoice && !isPackagingChoice(forms.productionComplete.destChoice)">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Location <span class="text-red-500">*</span></label>
          <select v-model="forms.productionComplete.location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option :value="null">Select location...</option>
            <template v-if="forms.productionComplete.destChoice === 'serving'">
              <option v-for="loc in productionCompleteServingLocations" :key="loc.id" :value="loc.id" :disabled="loc.conflict">
                {{ loc.name }}{{ loc.vesselName ? ` (${loc.vesselName})` : '' }} — {{ loc.currentBeerItemName }}{{ loc.onHand != null && loc.onHand > 0 ? `, ${loc.onHand} bbl` : '' }}
              </option>
            </template>
            <!-- Storage template commented out - code retained for future use -->
            <!-- <template v-if="forms.productionComplete.destChoice === 'storage'">
              <option v-for="loc in productionCompleteStorageLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </template> -->
          </select>
          <p v-if="forms.productionComplete.destChoice === 'serving' && productionCompleteServingLocations.length === 0" class="text-xs text-amber-600 dark:text-amber-400 mt-1">No serving locations. Add a serving tank on Vessels.</p>
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Destination <span class="text-red-500">*</span></label>
          <select v-model="forms.productionComplete.location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option :value="null">Select keg/case storage...</option>
            <option v-for="loc in productionCompleteStorageLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
          </select>
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Format</label>
          <select v-model="forms.productionComplete.formatKey" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option v-for="preset in (forms.productionComplete.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS)" :key="preset.key" :value="preset.key">{{ preset.label }}</option>
          </select>
        </div>
        <div v-if="forms.productionComplete.destChoice === 'packaged_keg'">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Kegs <span class="text-red-500">*</span></label>
          <input v-model.number="forms.productionComplete.numKegs" type="number" min="1" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0">
        </div>
        <div v-if="forms.productionComplete.destChoice === 'packaged_case'">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Cases <span class="text-red-500">*</span></label>
          <input v-model.number="forms.productionComplete.numCases" type="number" min="1" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Vessel <span class="text-red-500">*</span></label>
          <select v-model="forms.productionComplete.batch_location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option :value="null">Select vessel...</option>
            <option v-for="bl in productionCompleteBatchLocations" :key="bl.id" :value="bl.id">
              {{ getVesselName(bl.vessel_id) }}{{ isPackagingChoice(forms.productionComplete.destChoice) && !getVesselLocation(bl) ? ' (needs location)' : '' }}
            </option>
          </select>
        </div>
        <div v-if="!isPackagingChoice(forms.productionComplete.destChoice)">
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Volume (bbl) <span class="text-red-500">*</span></label>
          <input v-model.number="forms.productionComplete.volume_produced" type="number" step="0.01" min="0" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="0.00">
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)">
          <p class="text-sm text-gray-600 dark:text-gray-400">Volume: <strong>{{ computedPackagingVolumeBarrels ?? '—' }}</strong> bbl</p>
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)" class="border border-gray-200 dark:border-gray-600 rounded p-2 space-y-2">
          <div class="flex justify-between items-center">
            <label class="text-sm font-medium text-gray-700 dark:text-gray-200">Materials <span class="text-red-500">*</span></label>
            <button type="button" class="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded" @click="addSupplyLine">+ Add</button>
          </div>
          <div v-for="(line, idx) in forms.productionComplete.supplies" :key="idx" class="flex gap-2 items-center">
            <select v-model="line.item_id" class="flex-1 border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">Item...</option>
              <option v-for="item in packagingItems" :key="item.id" :value="item.id">{{ item.name }}</option>
            </select>
            <input v-model.number="line.quantity" type="number" min="1" class="w-16 border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Qty">
            <select v-model="line.location_id" class="flex-1 border p-2 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option :value="null">Loc...</option>
              <option v-for="loc in selectableLocationsForAddIngredientAndSupply" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
            <button type="button" class="text-red-500 p-1" @click="removeSupplyLine(idx)">×</button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">Date</label>
          <input v-model="forms.productionComplete.completion_date" type="datetime-local" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
        </div>
      </div>
    </ModalDialog>

    <!-- Production complete: confirm when serving location already has beer -->
    <div v-if="productionCompleteConfirmOpen" class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">This location already has beer</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          This serving location already contains <strong>{{ productionCompleteOccupiedItem?.name }}</strong>. Is this the same beer and you want to add volume on top? Or was this a mistake?
        </p>
        <div class="flex flex-wrap gap-2 justify-end">
          <button type="button" class="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium" @click="productionCompleteConfirmSameBeer">Same beer – add on top</button>
          <button type="button" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium" @click="productionCompleteConfirmRemoveFirst">Remove first</button>
          <button type="button" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium" @click="productionCompleteConfirmCancel">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Production complete: confirm when packaging volume exceeds vessel volume -->
    <div v-if="productionCompleteVolumeOverrideConfirmOpen" class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Packaging volume exceeds vessel</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Packaging volume ({{ productionCompleteVolumeExceedData?.volumeBarrels?.toFixed(2) }} bbl) exceeds vessel volume ({{ productionCompleteVolumeExceedData?.vesselVolumeBarrels?.toFixed(2) }} bbl). Continue anyway?
        </p>
        <div class="flex flex-wrap gap-2 justify-end">
          <button type="button" class="px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium" @click="productionCompleteVolumeOverrideConfirm">Override – continue</button>
          <button type="button" class="px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium" @click="productionCompleteVolumeOverrideCancel">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Water Addition Modal -->
    <ModalDialog 
      :isOpen="modals.waterAddition" 
      title="Add Water or Liquid" 
      confirmText="Add" 
      type="confirm" 
      @confirm="saveWaterAddition" 
      @cancel="modals.waterAddition = false"
    >
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1">Type</label>
          <select v-model="forms.waterAddition.addition_type" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="WATER">Water</option>
            <option value="LIQUID">Other Liquid</option>
          </select>
        </div>
        <div v-if="forms.waterAddition.addition_type === 'LIQUID'">
          <label class="block text-sm font-medium mb-1">Liquid Type</label>
          <input 
            v-model="forms.waterAddition.liquid_type" 
            type="text" 
            class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="e.g. Fruit juice, flavoring"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Vessel</label>
          <select v-model="forms.waterAddition.batch_location_id" class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option :value="null">Select vessel...</option>
            <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
              {{ getVesselName(bl.vessel_id) }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Quantity (Gallons)</label>
          <input 
            v-model.number="forms.waterAddition.quantity" 
            type="number" 
            step="0.01" 
            min="0" 
            class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0.00"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Date</label>
          <input 
            v-model="forms.waterAddition.added_at" 
            type="datetime-local" 
            class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Note (optional)</label>
          <textarea 
            v-model="forms.waterAddition.note" 
            rows="2" 
            class="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Optional notes..."
          ></textarea>
        </div>
      </div>
    </ModalDialog>

  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, reactive, watch } from 'vue';
import { useRoute } from 'vue-router';
import { BatchRepository } from '../repositories/BatchRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { BatchAdditionRepository } from '../repositories/BatchAdditionRepository';
import { BatchReadingRepository } from '../repositories/BatchReadingRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { SyncService } from '../services/SyncService';
import { getCurrentBeerAtLocation, getBeerItemForServingLocation } from '../services/ServingOccupancyService';
import { useModal } from '../composables/useModal';
import { useSync } from '../composables/useSync';
import { BatchMilestoneRepository } from '../repositories/BatchMilestoneRepository';
import { MilestoneTemplateRepository, PRODUCTION_COMPLETE_LABEL } from '../repositories/MilestoneTemplateRepository';
import { BatchVolumeAdjustmentRepository } from '../repositories/BatchVolumeAdjustmentRepository';
import { BatchVolumeSnapshotRepository } from '../repositories/BatchVolumeSnapshotRepository';
import { BatchLocationTransferRepository } from '../repositories/BatchLocationTransferRepository';
import { migrateBatchIfNeeded } from '../utils/migrateMilestoneTemplates';
import ModalDialog from '../components/ModalDialog.vue';
import dayjs from 'dayjs';
import { inject } from 'vue';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { useRouter } from 'vue-router';
import { BatchCostService } from '../services/BatchCostService';

// Use provided modal from App.vue if available, otherwise create local instance
const KEG_FORMAT_PRESETS = [
  { key: '1/6 bbl', label: '1/6 bbl', volumePerUnit: 0.1667 },
  { key: '1/2 bbl', label: '1/2 bbl', volumePerUnit: 0.5 }
];
const CASE_FORMAT_PRESETS = [
  { key: '12pk', label: '12pk', volumePerUnit: 0.09 },
  { key: '6pk', label: '6pk', volumePerUnit: 0.045 }
];

const providedModal = inject('modal', null);
let showAlert, showConfirm;

if (providedModal) {
  // Use provided modal functions from App.vue
  showAlert = providedModal.alert;
  showConfirm = providedModal.confirm;
} else {
  // Fallback to local modal instance (shouldn't happen in normal flow)
  const localModal = useModal();
  showAlert = localModal.alert;
  showConfirm = localModal.confirm;
}
const { lastSyncTimestamp } = useSync();
const route = useRoute();
const router = useRouter();
const loading = ref(true);
const activeTab = ref('Timeline');

// Recipe consumption tracking
const recipeConsumption = ref({
  hasRecipe: false,
  totalItems: 0,
  completedItems: 0,
  partialItems: 0,
  itemStatus: [],
  loading: false,
  error: null
});

const batch = ref({});
const batchLocations = ref([]);
const vessels = ref([]);
const additions = ref([]);
const readings = ref([]);
const items = ref([]);
const locations = ref([]);
const categories = ref([]);
const milestones = ref([]);
const volumeSnapshots = ref(new Map());
const transfers = ref([]);
const batchLedgerEntries = ref([]);
const costSummary = ref(null);

const milestoneDefinitions = computed(() => {
  const defs = BatchMilestoneRepository.getDefinitionsForBatch(batch.value);
  if (defs && defs.length > 0) return defs;
  return MilestoneTemplateRepository.DEFAULT_MILESTONES.map((m, i) => ({ ...m, id: m.id || `def-${i}`, sort_order: i }));
});

// Recipe consumption computed properties
const hasRecipe = computed(() => recipeConsumption.value.hasRecipe && !recipeConsumption.value.loading);

const allIngredientsConsumed = computed(() => {
  if (!recipeConsumption.value.hasRecipe || recipeConsumption.value.totalItems === 0) return false;
  return recipeConsumption.value.completedItems === recipeConsumption.value.totalItems;
});

const someIngredientsConsumed = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return false;
  return recipeConsumption.value.completedItems > 0 || recipeConsumption.value.partialItems > 0;
});

const consumptionButtonText = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return '';
  if (recipeConsumption.value.totalItems === 0) return 'No Ingredients';
  if (allIngredientsConsumed.value) return 'All Consumed';
  if (someIngredientsConsumed.value) {
    return `${recipeConsumption.value.completedItems}/${recipeConsumption.value.totalItems} Done`;
  }
  return 'Consume Recipe';
});

const goToConsumeRecipe = () => {
  if (!batch.value?.id || !batch.value?.recipe_id) return;
  router.push(`/batches/${batch.value.id}/consume-recipe/${batch.value.recipe_id}`);
};

const modals = reactive({
  splitTransfer: false,
  adjustVolume: false,
  setVolume: false,
  transfer: false,
  addition: false,
  reading: false,
  status: false,
  productionComplete: false,
  waterAddition: false
});

const forms = reactive({
  splitTransfer: { 
    mode: 'split', 
    sourceBatchLocationId: null, 
    sourceBatchLocationIds: [], 
    destinationVesselId: null,
    combineDestinationVolume: null,
    destinations: [{ vessel_id: null, volume: null }] 
  },
  adjustVolume: { batch_location_id: null, volume_change: null, reason: '' },
  setVolume: { batch_location_id: null, measured_volume: null, measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), method: '', note: '' },
  transfer: { source_batch_location_id: null, destination_location_id: null, destination_vessel_id: null, volume: null, transfer_type: 'transfer', note: '', log_to_ledger: false, ledger_item_id: null },
  addition: { item_id: '', event_type: 'HOP_KETTLE', quantity: 0, location_id: '' },
  reading: { reading_type: 'GRAVITY', value: '', measured_at: '', batch_location_id: null },
  status: { status: 'PLANNED', date: '' },
  productionComplete: {
    destChoice: null,
    batch_location_id: null,
    volume_produced: null,
    completion_date: new Date().toISOString().slice(0, 16),
    location_id: null,
    formatKey: null,
    numKegs: null,
    numCases: null,
    supplies: []
  },
  waterAddition: {
    batch_location_id: null,
    addition_type: 'WATER',
    liquid_type: '',
    quantity: null,
    added_at: new Date().toISOString().slice(0, 16),
    note: ''
  }
});

const additionAvailableQty = ref(0);
const locationAvailability = ref(new Map()); // Map<location_id, quantity>
const productionCompleteServingLocations = ref([]);
const productionCompleteConfirmOpen = ref(false);
const productionCompleteExistingItem = ref(null);
const productionCompleteOccupiedItem = ref(null);
const productionCompleteVolumeOverrideConfirmOpen = ref(false);
const productionCompleteVolumeExceedData = ref(null);
const productionCompleteVolumeOverride = ref(false);
const setVolumeTankOnHand = ref(null);
const isProductionCompleteAlready = computed(() =>
  (batchLedgerEntries.value || []).some(
    (e) => e.type === 'RECEIVE' && (e.data || {}).source === 'production_complete'
  )
);

watch(() => forms.transfer.destination_location_id, (val) => {
  if (val) {
    forms.transfer.log_to_ledger = true;
    if (!forms.transfer.ledger_item_id) {
      forms.transfer.ledger_item_id = getDefaultFinishedBeerItem()?.id || null;
    }
  }
});

const displayTotalVolume = computed(() => {
  if (batch.value.total_theoretical_volume != null) return batch.value.total_theoretical_volume;
  const sum = batchLocations.value.reduce((s, bl) => s + (Number(bl.current_volume) || 0), 0);
  return sum > 0 ? sum : null;
});

function getVesselName(vesselId) {
  if (!vesselId) return null;
  return vessels.value.find(v => v.id === vesselId)?.name;
}
function getVesselNameForReading(reading) {
  if (!reading.batch_location_id) return null;
  const bl = batchLocations.value.find(b => b.id === reading.batch_location_id);
  return bl ? getVesselName(bl.vessel_id) : null;
}
function getVesselNameForBatchLocation(batchLocationId) {
  if (!batchLocationId) return null;
  const bl = batchLocations.value.find(b => b.id === batchLocationId);
  return bl ? getVesselName(bl.vessel_id) : null;
}
function getVesselForBatchLocation(batchLocationId) {
  const bl = batchLocations.value.find(b => b.id === batchLocationId);
  return bl ? vessels.value.find(v => v.id === bl.vessel_id) : null;
}
function getLocationName(locationId) {
  return locations.value.find(l => l.id === locationId)?.name || 'Unknown location';
}

const latestGravity = computed(() => {
  const g = readings.value.find(r => r.reading_type === 'GRAVITY');
  return g ? g.value : null;
});

const latestTemp = computed(() => {
  const t = readings.value.find(r => r.reading_type === 'TEMP');
  return t ? t.value : null;
});

const filteredItems = computed(() => {
  if (!forms.addition.event_type) return [];
  
  // If "Any" is selected, show all items
  if (forms.addition.event_type === 'Any') {
    return items.value;
  }
  
  // Otherwise filter by category
  // Compare lowercase names to be safe, as existing item.category is lowercase string
  // and category.name might be Title Case.
  const selectedCat = forms.addition.event_type.toLowerCase();
  
  return items.value.filter(i => {
    // If item.category matches the selected category name
    return i.category && i.category.toLowerCase() === selectedCat;
  });
});

const isAdditionValid = computed(() => {
  return forms.addition.quantity > 0 && forms.addition.quantity <= additionAvailableQty.value;
});

const setVolumeLastSnapshot = computed(() => {
  if (!forms.setVolume.batch_location_id) return null;
  return getLastSnapshot(forms.setVolume.batch_location_id);
});
const setVolumeIsTank = computed(() => {
  const vessel = forms.setVolume.batch_location_id ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null;
  return !!(vessel?.location_id);
});
const setVolumeTankLocationName = computed(() => {
  const vessel = forms.setVolume.batch_location_id ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null;
  return vessel?.location_id ? getLocationName(vessel.location_id) : '';
});
const setVolumeCurrentVolume = computed(() => {
  const bl = forms.setVolume.batch_location_id ? batchLocations.value.find(b => b.id === forms.setVolume.batch_location_id) : null;
  const vessel = bl ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null;
  if (vessel?.location_id && setVolumeTankOnHand.value != null) return setVolumeTankOnHand.value;
  return bl ? (Number(bl.current_volume) || 0) : null;
});
const setVolumeDelta = computed(() => {
  if (!forms.setVolume.batch_location_id || forms.setVolume.measured_volume == null) return null;
  const current = setVolumeCurrentVolume.value;
  if (current == null) return null;
  return Number(forms.setVolume.measured_volume) - current;
});
const isBackdatedSetVolume = computed(() => {
  if (!forms.setVolume.measured_at || !setVolumeLastSnapshot.value) return false;
  return new Date(forms.setVolume.measured_at).toISOString() < setVolumeLastSnapshot.value.measured_at;
});
const adjustVolumeIsTank = computed(() => {
  const vessel = forms.adjustVolume.batch_location_id ? getVesselForBatchLocation(forms.adjustVolume.batch_location_id) : null;
  return !!(vessel?.location_id);
});
const adjustVolumeTankLocationName = computed(() => {
  const vessel = forms.adjustVolume.batch_location_id ? getVesselForBatchLocation(forms.adjustVolume.batch_location_id) : null;
  return vessel?.location_id ? getLocationName(vessel.location_id) : '';
});

watch(() => forms.setVolume.batch_location_id, async (blId) => {
  const vessel = blId ? getVesselForBatchLocation(blId) : null;
  if (!vessel?.location_id) {
    setVolumeTankOnHand.value = null;
    return;
  }
  try {
    const result = await getBeerItemForServingLocation(vessel.location_id);
    setVolumeTankOnHand.value = result ? result.onHand : null;
  } catch {
    setVolumeTankOnHand.value = null;
  }
}, { immediate: true });

const tankLocationIds = computed(() =>
  new Set((vessels.value || []).filter((v) => v.location_id).map((v) => v.location_id))
);
const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
);
const selectableLocationsForAddIngredientAndSupply = computed(() =>
  (locations.value || []).filter((l) => !l.deleted_at && !nonServingTankLocationIds.value.has(l.id))
);
const productionCompleteStorageLocations = computed(() =>
  (locations.value || []).filter(
    (l) => !l.deleted_at && !tankLocationIds.value.has(l.id) && l.stage !== 'serving'
  )
);
const packagingItems = computed(() => (items.value || []).filter((i) => i.category === 'Packaging'));
const isPackagingChoice = (choice) => choice === 'packaged_keg' || choice === 'packaged_case';
const productionCompleteBatchLocations = computed(() => {
  const choice = forms.productionComplete.destChoice;
  if (isPackagingChoice(choice)) {
    return (batchLocations.value || []).filter((bl) => {
      const v = (vessels.value || []).find((x) => x.id === bl.vessel_id);
      return v?.location_id;
    });
  }
  return batchLocations.value || [];
});
const getVesselLocation = (bl) => {
  const v = (vessels.value || []).find((x) => x.id === bl.vessel_id);
  return v?.location_id;
};
const computedPackagingVolumeBarrels = computed(() => {
  const f = forms.productionComplete;
  if (!isPackagingChoice(f.destChoice)) return null;
  const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS;
  const preset = presets.find((p) => p.key === f.formatKey);
  if (!preset) return null;
  const qty = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0);
  return (qty * preset.volumePerUnit).toFixed(4);
});
const addSupplyLine = () => {
  if (!forms.productionComplete.supplies) forms.productionComplete.supplies = [];
  forms.productionComplete.supplies.push({ item_id: null, quantity: 1, location_id: null });
};
const removeSupplyLine = (idx) => {
  forms.productionComplete.supplies.splice(idx, 1);
};
const transferDestinationLocations = computed(() =>
  (locations.value || []).filter((l) => !l.deleted_at && !tankLocationIds.value.has(l.id))
);
const transferDestinationVessels = computed(() =>
  (vessels.value || []).filter((v) => !v.deleted_at && !v.location_id)
);

const refreshVolumeSnapshots = async () => {
  const map = new Map();
  for (const bl of batchLocations.value) {
    const snaps = await BatchVolumeSnapshotRepository.getByBatchLocationId(bl.id);
    if (snaps?.length) map.set(bl.id, snaps);
  }
  volumeSnapshots.value = map;
};

const refreshTransfers = async () => {
  if (!batch.value?.id) return;
  transfers.value = await BatchLocationTransferRepository.getByBatchId(batch.value.id);
};

const loadRecipeConsumptionStatus = async () => {
  if (!batch.value?.recipe_id) {
    recipeConsumption.value = { hasRecipe: false, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: null };
    return;
  }

  recipeConsumption.value.loading = true;
  recipeConsumption.value.error = null;

  try {
    const recipeItems = await RecipeRepository.getItems(batch.value.recipe_id);
    
    if (!recipeItems || recipeItems.length === 0) {
      recipeConsumption.value = { hasRecipe: true, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: null };
      return;
    }

    const consumes = await LedgerRepository.getEntries({
      batch_id: batch.value.id,
      type: 'CONSUME'
    });

    const consumedByItem = {};
    consumes.forEach(entry => {
      if (!consumedByItem[entry.item_id]) consumedByItem[entry.item_id] = 0;
      consumedByItem[entry.item_id] += Math.abs(entry.quantity);
    });

    const itemStatus = recipeItems.map(item => {
      const required = Number(item.quantity) || 0;
      const consumed = consumedByItem[item.item_id] || 0;
      return {
        itemId: item.item_id,
        required,
        consumed,
        isComplete: consumed >= required,
        isPartial: consumed > 0 && consumed < required,
        isOverConsumed: consumed > required
      };
    });

    const totalItems = itemStatus.length;
    const completedItems = itemStatus.filter(s => s.isComplete).length;
    const partialItems = itemStatus.filter(s => s.isPartial).length;

    recipeConsumption.value = {
      hasRecipe: true,
      totalItems,
      completedItems,
      partialItems,
      itemStatus,
      loading: false,
      error: null
    };
  } catch (e) {
    console.error('Error loading recipe consumption status:', e);
    recipeConsumption.value = { hasRecipe: true, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: e.message };
  }
};

const loadData = async () => {
  try {
    const id = route.params.id;
    if (id === 'add') return;
    
    // Check if we are ready
    if (!id) return;

    batch.value = await BatchRepository.getById(id);
    if (!batch.value) {
      console.warn(`Batch ${id} not found locally.`);
      return;
    }
    batch.value = await migrateBatchIfNeeded(batch.value);

    [vessels.value, batchLocations.value, additions.value, readings.value, items.value, locations.value, categories.value, milestones.value] = await Promise.all([
      VesselRepository.getAll(),
      BatchLocationRepository.getByBatchId(id),
      BatchAdditionRepository.getByBatchId(id),
      BatchReadingRepository.getByBatchId(id),
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      CategoryRepository.getAll(),
      BatchMilestoneRepository.getByBatchId(id)
    ]);
    batchLedgerEntries.value = await LedgerRepository.getEntries({ batch_id: id });
    await refreshVolumeSnapshots();
    await refreshTransfers();
    await loadRecipeConsumptionStatus();
    
    // Always recalculate batch cost to ensure it's current (fixes stale costs from previous manual ingredient additions)
    try {
      costSummary.value = await BatchCostService.computeAndStore(batch.value.id);
      batch.value = await BatchRepository.getById(id);
    } catch (err) {
      console.warn('Failed to recalculate batch cost:', err);
      // Fall back to existing cost summary if available
      costSummary.value = batch.value.cost_summary || null;
    }

    // Backfill legacy: batch had single vessel_id, no batch_locations yet
    if (batch.value.vessel_id && batchLocations.value.length === 0) {
      const vol = batch.value.planned_volume ?? batch.value.current_volume ?? 0;
      await BatchLocationRepository.create({
        parent_batch_id: id,
        vessel_id: batch.value.vessel_id,
        current_volume: Number(vol) || 0
      });
      await BatchRepository.update(id, {
        total_theoretical_volume: Number(vol) || 0
      });
      batch.value = await BatchRepository.getById(id);
      batchLocations.value = await BatchLocationRepository.getByBatchId(id);
      await refreshVolumeSnapshots();
    }

    // Legacy Support: If milestones are empty but batch has status, backfill
    const defs = BatchMilestoneRepository.getDefinitionsForBatch(batch.value);
    if (milestones.value.length === 0 && batch.value.status && batch.value.status !== 'PLANNED' && defs && defs.length > 0) {
      console.log('Backfilling milestones for legacy batch...');
      const now = new Date().toISOString();
      const s = batch.value.status;
      const promises = [];
      if (['BREWED', 'FERMENTING', 'CONDITIONING', 'PACKAGING', 'PACKAGED', 'CLOSED'].includes(s) && defs[0]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[0].id, batch.value.brewed_at || now));
      }
      if (['FERMENTING', 'CONDITIONING', 'PACKAGING', 'PACKAGED', 'CLOSED'].includes(s) && defs[2]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[2].id, now));
      }
      if (['PACKAGED', 'CLOSED'].includes(s) && defs[8]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[8].id, batch.value.packaged_at || now));
      }
      if (promises.length > 0) {
        await Promise.all(promises);
        milestones.value = await BatchMilestoneRepository.getByBatchId(id);
      }
    }
  } catch (e) {
    console.error(e);
    showAlert('Error', 'Failed to load batch data: ' + e.message, 'danger');
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

// Watch for sync updates to refresh data
watch(lastSyncTimestamp, () => {
  loadData();
});

watch(() => [forms.productionComplete.numKegs, forms.productionComplete.destChoice], ([numKegs, destChoice]) => {
  if (destChoice === 'packaged_keg' && numKegs != null && numKegs > 0 && forms.productionComplete.supplies?.length === 1) {
    const line = forms.productionComplete.supplies[0];
    if (line?.item_id && (items.value || []).some((i) => i.id === line.item_id && i.category === 'Packaging' && /keg/i.test(i.name || ''))) {
      line.quantity = numKegs;
    }
  }
});

watch(() => forms.productionComplete.destChoice, (newVal, oldVal) => {
  if (oldVal !== undefined && newVal !== oldVal) {
    forms.productionComplete.location_id = null;
    forms.productionComplete.formatKey = newVal === 'packaged_keg' ? (KEG_FORMAT_PRESETS[0]?.key || '1/6 bbl') : (CASE_FORMAT_PRESETS[0]?.key || '12pk');
    forms.productionComplete.supplies = [];
    if (isPackagingChoice(newVal) && forms.productionComplete.batch_location_id) {
      const bl = (batchLocations.value || []).find((b) => b.id === forms.productionComplete.batch_location_id);
      const v = bl ? (vessels.value || []).find((x) => x.id === bl.vessel_id) : null;
      if (!v?.location_id) forms.productionComplete.batch_location_id = null;
    }
  }
  if (newVal === 'packaged_keg' && (!forms.productionComplete.supplies || forms.productionComplete.supplies.length === 0)) {
    const formatKey = forms.productionComplete.formatKey || '1/6 bbl';
    const pkgItem = (items.value || []).find((i) => i.category === 'Packaging' && i.name?.toLowerCase().includes('keg') && i.name?.includes(formatKey.split(' ')[0]));
    const fallback = (items.value || []).find((i) => i.category === 'Packaging' && /keg/i.test(i.name || ''));
    forms.productionComplete.supplies = [{ item_id: (pkgItem || fallback)?.id || null, quantity: forms.productionComplete.numKegs || 1, location_id: null }];
  }
});

// --- Milestones ---
const isMilestoneCompleted = (defId) => {
  const m = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId);
  return m && m.completed;
};

const getMilestoneDate = (defId) => {
  const m = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId);
  return m ? m.occurred_at : null;
};

const getMilestoneStatusClass = (defId) => {
  if (isMilestoneCompleted(defId)) {
    return 'bg-green-500 border-green-500 text-white';
  }
  if (isNextMilestone(defId)) {
    return 'bg-white dark:bg-gray-800 border-blue-500 text-blue-500 ring-4 ring-blue-50';
  }
  return 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500 text-transparent';
};

const isProductionCompleteDef = (def) => def && (def.label === PRODUCTION_COMPLETE_LABEL || def.is_system === true);

const isNextMilestone = (defId) => {
  const defs = milestoneDefinitions.value;
  const next = defs.find(d => !isMilestoneCompleted(d.id));
  return next && next.id === defId;
};

// Status = last completed milestone's label
const computedStatus = computed(() => {
  const defs = milestoneDefinitions.value;
  const completed = milestones.value.filter(m => m.completed);
  if (completed.length === 0) return 'PLANNED';

  let lastByOrder = null;
  let maxOrder = -1;
  for (const m of completed) {
    const def = defs.find(d => d.id === (m.milestone_definition_id || m.milestone_type));
    if (def && (def.sort_order ?? 0) > maxOrder) {
      maxOrder = def.sort_order ?? 0;
      lastByOrder = def.label;
    }
  }
  return lastByOrder || batch.value?.status || 'PLANNED';
});

const toggleMilestone = async (defId) => {
  const existing = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId);
  const originalMilestones = JSON.parse(JSON.stringify(milestones.value));

  try {
    if (existing && existing.completed) {
      await BatchMilestoneRepository.update(existing.id, { completed: false });
    } else {
      await BatchMilestoneRepository.ensure(batch.value.id, defId, new Date().toISOString());
    }

    milestones.value = await BatchMilestoneRepository.getByBatchId(batch.value.id);
    const newStatus = computedStatus.value;
    if (newStatus !== batch.value.status) {
      await BatchRepository.update(batch.value.id, { status: newStatus });
      batch.value = await BatchRepository.getById(batch.value.id);
    }
    SyncService.sync();
  } catch (e) {
    console.error("Milestone toggle failed", e);
    milestones.value = originalMilestones;
    showAlert('Error', 'Failed to update milestone.', 'danger');
  }
};

// --- Timeline Events Feed ---
const allHistoryEvents = computed(() => {
  const events = [];
  
  // Readings
  readings.value.forEach(r => {
    events.push({
      id: `reading-${r.id}`,
      date: r.measured_at,
      title: `${r.reading_type} Reading`,
      subtitle: `${r.value}${getVesselNameForReading(r) ? ' · ' + getVesselNameForReading(r) : ''}`,
      icon: r.reading_type === 'TEMP' ? '🌡️' : (r.reading_type === 'PH' ? '🧪' : '💧'),
      type: 'READING'
    });
  });
  
  // Additions
  additions.value.forEach(a => {
    const vesselName = a.batch_location_id ? getVesselNameForBatchLocation(a.batch_location_id) : null;
    const vesselLabel = vesselName ? ` · ${vesselName}` : ' · All vessels';
    const isWaterOrLiquid = a.event_type === 'WATER_ADDITION' || a.event_type === 'LIQUID_ADDITION';
    events.push({
      id: `add-${a.id}`,
      date: a.added_at,
      title: `Added ${getAdditionDisplayName(a)}`,
      subtitle: isWaterOrLiquid ? `${a.quantity} gal${vesselLabel}` : `${a.quantity} · ${getItemName(a.item_id)}${vesselLabel}`,
      icon: isWaterOrLiquid ? '💧' : '🌾',
      type: 'ADDITION'
    });
  });

  // Volume snapshots
  volumeSnapshots.value.forEach((snaps, blId) => {
    snaps.forEach((s) => {
      events.push({
        id: `snap-${s.id}`,
        date: s.measured_at,
        title: 'Set Volume',
        subtitle: `${s.measured_volume} ${batch.value?.planned_volume_unit || ''} · ${getVesselNameForBatchLocation(blId)}${s.method ? ` · ${s.method}` : ''}`,
        icon: '🎯',
        type: 'SNAPSHOT'
      });
    });
  });

  // Transfers
  transfers.value.forEach((t) => {
    const destParts = [];
    if (t.destination_vessel_id) destParts.push(getVesselName(t.destination_vessel_id));
    if (t.destination_location_id) destParts.push(getLocationName(t.destination_location_id));
    events.push({
      id: `xfer-${t.id}`,
      date: t.created_at,
      title: `Transfer ${t.volume} ${batch.value?.planned_volume_unit || ''}`,
      subtitle: `${getVesselNameForBatchLocation(t.source_batch_location_id)} → ${destParts.join(' / ') || 'Destination'}`,
      icon: '🔀',
      type: 'TRANSFER'
    });
  });

  // Ledger CONSUME (recipe consumption, manual additions)
  batchLedgerEntries.value.filter(e => e.type === 'CONSUME').forEach((entry) => {
    const itemName = entry.item_name || getItemName(entry.item_id);
    const qty = Math.abs(entry.quantity);
    const subtitle = [itemName, qty].filter(Boolean).join(' · ') + (entry.note ? ` · ${entry.note}` : '');
    events.push({
      id: `ledger-${entry.id}`,
      date: entry.created_at,
      title: 'Ingredient consumed',
      subtitle,
      icon: '🌾',
      type: 'CONSUME'
    });
  });
  
  // Sort descending
  return events.sort((a, b) => new Date(b.date) - new Date(a.date));
});

// --- Status ---
const openStatusModal = () => {
  forms.status.status = batch.value.status || 'PLANNED';
  forms.status.date = dayjs().format('YYYY-MM-DDTHH:mm');
  modals.status = true;
};

const saveStatus = async () => {
  try {
    const { status, date } = forms.status;
    const defs = milestoneDefinitions.value;
    if (!defs || defs.length === 0) return;

    const now = (date ? new Date(date) : new Date()).toISOString();
    const statusToCount = { PLANNED: 0, BREWED: 1, FERMENTING: 3, CONDITIONING: 7, PACKAGING: 8, PACKAGED: 9, CLOSED: defs.length };
    const count = statusToCount[status] ?? 0;
    if (status === 'PLANNED') {
      const all = await BatchMilestoneRepository.getByBatchId(batch.value.id);
      for (const m of all.filter(m => m.completed)) {
        await BatchMilestoneRepository.update(m.id, { completed: false });
      }
    } else {
    for (let i = 0; i < count && i < defs.length; i++) {
      const ts = (i === 0 && status === 'BREWED' && date) ? new Date(date).toISOString() : now;
      await BatchMilestoneRepository.ensure(batch.value.id, defs[i].id, ts);
    }
    }

    milestones.value = await BatchMilestoneRepository.getByBatchId(batch.value.id);
    const newStatus = computedStatus.value;
    await BatchRepository.update(batch.value.id, { status: newStatus });
    batch.value = await BatchRepository.getById(batch.value.id);
    modals.status = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Split / Transfer ---
const splitTransferSourceVolume = computed(() => {
  if (!forms.splitTransfer.sourceBatchLocationId) return null;
  const bl = batchLocations.value.find(b => b.id === forms.splitTransfer.sourceBatchLocationId);
  return bl ? (Number(bl.current_volume) || 0) : null;
});
const splitTransferDestSum = computed(() => {
  return forms.splitTransfer.destinations.reduce((s, d) => s + (Number(d.volume) || 0), 0);
});
const combineSourcesSum = computed(() => {
  return forms.splitTransfer.sourceBatchLocationIds.reduce((s, id) => {
    const bl = batchLocations.value.find(b => b.id === id);
    return s + (bl ? (Number(bl.current_volume) || 0) : 0);
  }, 0);
});
function addSplitDest() {
  forms.splitTransfer.destinations.push({ vessel_id: null, volume: null });
}
function removeSplitDest(idx) {
  if (forms.splitTransfer.destinations.length <= 1) return;
  forms.splitTransfer.destinations.splice(idx, 1);
}
const openSplitTransferModal = () => {
  forms.splitTransfer.mode = 'split';
  forms.splitTransfer.sourceBatchLocationId = batchLocations.value.length ? batchLocations.value[0].id : null;
  forms.splitTransfer.sourceBatchLocationIds = [];
  forms.splitTransfer.destinationVesselId = null;
  forms.splitTransfer.combineDestinationVolume = null;
  forms.splitTransfer.destinations = [{ vessel_id: null, volume: null }];
  modals.splitTransfer = true;
};
const saveSplitTransfer = async () => {
  try {
    if (forms.splitTransfer.mode === 'split') {
      const srcId = forms.splitTransfer.sourceBatchLocationId;
      const dests = forms.splitTransfer.destinations.filter(d => d.vessel_id && (d.volume != null && d.volume > 0));
      if (!srcId || dests.length === 0) {
        showAlert('Validation', 'Select source vessel and at least one destination with volume.', 'danger');
        return;
      }
      await BatchLocationRepository.transferSplit({
        sourceBatchLocationId: srcId,
        destinations: dests.map(d => ({ vessel_id: d.vessel_id, volume: Number(d.volume) || 0 }))
      });
    } else if (forms.splitTransfer.mode === 'combine') {
      const srcIds = forms.splitTransfer.sourceBatchLocationIds;
      const destVesselId = forms.splitTransfer.destinationVesselId;
      if (!srcIds || srcIds.length === 0) {
        showAlert('Validation', 'Select at least one source vessel.', 'danger');
        return;
      }
      if (!destVesselId) {
        showAlert('Validation', 'Select a destination vessel.', 'danger');
        return;
      }
      await BatchLocationRepository.combineSplits({
        sourceBatchLocationIds: srcIds,
        destinationVesselId: destVesselId,
        destinationVolume: forms.splitTransfer.combineDestinationVolume != null && forms.splitTransfer.combineDestinationVolume !== '' ? forms.splitTransfer.combineDestinationVolume : undefined
      });
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
    modals.splitTransfer = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Adjust Volume ---
const adjustVolumeVesselName = computed(() => {
  if (!forms.adjustVolume.batch_location_id) return '';
  const bl = batchLocations.value.find(b => b.id === forms.adjustVolume.batch_location_id);
  return bl ? getVesselName(bl.vessel_id) : '';
});
const adjustVolumeNewTotal = computed(() => {
  if (!forms.adjustVolume.batch_location_id || forms.adjustVolume.volume_change == null) return null;
  const bl = batchLocations.value.find(b => b.id === forms.adjustVolume.batch_location_id);
  if (!bl) return null;
  return (Number(bl.current_volume) || 0) + (Number(forms.adjustVolume.volume_change) || 0);
});
const openAdjustVolumeModal = (batchLocationId) => {
  forms.adjustVolume = { batch_location_id: batchLocationId, volume_change: null, reason: '' };
  modals.adjustVolume = true;
};
const saveAdjustVolume = async () => {
  try {
    const { batch_location_id, volume_change, reason } = forms.adjustVolume;
    if (!batch_location_id || volume_change == null) {
      showAlert('Validation', 'Volume change is required.', 'danger');
      return;
    }
    const bl = batchLocations.value.find(b => b.id === batch_location_id);
    if (!bl) {
      showAlert('Error', 'Batch location not found.', 'danger');
      return;
    }
    const vessel = getVesselForBatchLocation(batch_location_id);
    const isTank = !!(vessel?.location_id);
    const numChange = Number(volume_change);

    if (isTank) {
      const occupancy = await getCurrentBeerAtLocation(vessel.location_id);
      if (occupancy.conflict) {
        showAlert('Error', 'This serving tank has more than one beer. Resolve on the Serving page first.', 'danger');
        return;
      }
      let beerItem = occupancy.item || null;
      if (!beerItem && numChange > 0) {
        beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value);
      }
      if (!beerItem && numChange < 0) {
        showAlert('Error', 'No beer at this location to reduce. Add beer first (e.g. Mark Production Complete).', 'danger');
        return;
      }
      const vesselName = getVesselName(bl.vessel_id) || 'Vessel';
      if (numChange < 0) {
        await LedgerRepository.addEntry({
          type: 'CONSUME',
          item_id: beerItem.id,
          location_id: vessel.location_id,
          quantity: numChange,
          batch_id: batch.value.id,
          removal_purpose: 'serving',
          operation_type: 'serving_pour',
          consumption_form: 'cellar',
          note: reason ? `${reason} (${vesselName})` : `Adjust volume: ${vesselName}`
        });
      } else if (numChange > 0) {
        await LedgerRepository.addEntry({
          type: 'RECEIVE',
          item_id: beerItem.id,
          location_id: vessel.location_id,
          quantity: numChange,
          batch_id: batch.value.id,
          note: reason ? `${reason} (${vesselName})` : `Adjust volume: ${vesselName}`,
          data: { source: 'adjust_volume_tank' }
        });
      }
      await BatchVolumeAdjustmentRepository.create({
        batch_location_id,
        volume_change: numChange,
        reason: reason || (numChange < 0 ? 'Serving removal (tank)' : 'Adjustment (tank)')
      });
    } else {
      const newVol = (Number(bl.current_volume) || 0) + numChange;
      if (newVol < 0) {
        showAlert('Validation', 'Volume cannot be negative.', 'danger');
        return;
      }
      await BatchLocationRepository.update(batch_location_id, { current_volume: newVol });
      await BatchVolumeAdjustmentRepository.create({
        batch_location_id,
        volume_change: numChange,
        reason: reason || 'Manual adjustment'
      });
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
    modals.adjustVolume = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

const getLastSnapshot = (batchLocationId) => {
  const snaps = volumeSnapshots.value.get(batchLocationId);
  if (!snaps || snaps.length === 0) return null;
  return snaps[snaps.length - 1];
};

const openSetVolumeModal = (batchLocationId) => {
  const bl = batchLocations.value.find(b => b.id === batchLocationId);
  const vessel = bl ? getVesselForBatchLocation(batchLocationId) : null;
  const last = getLastSnapshot(batchLocationId);
  forms.setVolume = {
    batch_location_id: batchLocationId,
    measured_volume: bl?.current_volume ?? last?.measured_volume ?? null,
    measured_at: dayjs().format('YYYY-MM-DDTHH:mm'),
    method: last?.method || '',
    note: ''
  };
  if (vessel?.location_id) {
    getBeerItemForServingLocation(vessel.location_id)
      .then((res) => {
        if (res) {
          forms.setVolume.measured_volume = res.onHand;
          setVolumeTankOnHand.value = res.onHand;
        }
      })
      .catch(() => {});
  }
  modals.setVolume = true;
};

const saveSetVolume = async () => {
  try {
    const { batch_location_id, measured_volume, measured_at, method, note } = forms.setVolume;
    if (!batch_location_id || measured_volume == null) {
      showAlert('Validation', 'Measured volume is required.', 'danger');
      return;
    }
    const bl = batchLocations.value.find(b => b.id === batch_location_id);
    if (!bl) {
      showAlert('Error', 'Batch location not found.', 'danger');
      return;
    }
    const vessel = getVesselForBatchLocation(batch_location_id);
    const isTank = !!(vessel?.location_id);
    const newVol = Number(measured_volume);

    if (isTank) {
      const occupancy = await getCurrentBeerAtLocation(vessel.location_id);
      if (occupancy.conflict) {
        showAlert('Error', 'This serving tank has more than one beer. Resolve on the Serving page first.', 'danger');
        return;
      }
      const onHand = setVolumeTankOnHand.value != null ? setVolumeTankOnHand.value : (occupancy.item ? occupancy.onHand : 0);
      const delta = newVol - onHand;
      let beerItem = occupancy.item || null;
      if (!beerItem && delta > 0) beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value);
      if (!beerItem && delta < 0) {
        showAlert('Error', 'No beer at this location to reduce. Add beer first (e.g. Mark Production Complete).', 'danger');
        return;
      }
      if (beerItem && delta !== 0) {
        const vesselName = getVesselName(bl.vessel_id) || 'Vessel';
        const noteText = `Set volume reconcile (measured ${newVol} bbl) — ${vesselName}`;
        if (delta < 0) {
          await LedgerRepository.addEntry({
            type: 'CONSUME',
            item_id: beerItem.id,
            location_id: vessel.location_id,
            quantity: delta,
            batch_id: batch.value.id,
            removal_purpose: 'serving',
            consumption_form: 'cellar',
            note: noteText,
            data: { source: 'set_volume_reconcile' }
          });
        } else {
          await LedgerRepository.addEntry({
            type: 'RECEIVE',
            item_id: beerItem.id,
            location_id: vessel.location_id,
            quantity: delta,
            batch_id: batch.value.id,
            note: noteText,
            data: { source: 'set_volume_reconcile' }
          });
        }
      }
    } else {
      const iso = measured_at ? new Date(measured_at).toISOString() : new Date().toISOString();
      await BatchVolumeSnapshotRepository.recordSnapshot({
        batch_location_id,
        measured_volume: newVol,
        measured_at: iso,
        method: method || null,
        note: note || null
      });
      batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
      await refreshVolumeSnapshots();
    }

    if (isTank) {
      batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
    }
    modals.setVolume = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

const openTransferModal = (batchLocationId) => {
  forms.transfer = {
    source_batch_location_id: batchLocationId,
    destination_location_id: null,
    destination_vessel_id: null,
    volume: null,
    transfer_type: 'transfer',
    note: '',
    log_to_ledger: false,
    ledger_item_id: getDefaultFinishedBeerItem()?.id || null
  };
  modals.transfer = true;
};

const saveTransfer = async () => {
  try {
    const { source_batch_location_id, destination_location_id, destination_vessel_id, volume, transfer_type, note, log_to_ledger, ledger_item_id } = forms.transfer;
    if (!source_batch_location_id) { showAlert('Validation', 'Select a source vessel.', 'danger'); return; }
    if (!destination_location_id && !destination_vessel_id) { showAlert('Validation', 'Select a destination location or vessel.', 'danger'); return; }
    const vol = Number(volume);
    if (!vol || vol <= 0) { showAlert('Validation', 'Volume must be greater than zero.', 'danger'); return; }
    const source = batchLocations.value.find(b => b.id === source_batch_location_id);
    if (!source) { showAlert('Error', 'Source vessel not found.', 'danger'); return; }
    const newVol = (Number(source.current_volume) || 0) - vol;
    if (newVol < 0) { showAlert('Validation', 'Cannot move more than available volume.', 'danger'); return; }
  if (destination_location_id && (!log_to_ledger || !ledger_item_id)) {
    showAlert('Validation', 'To move beer into storage, also create the Finished Beer RECEIVE entry.', 'danger');
    return;
  }
    await BatchLocationTransferRepository.recordTransfer({
      source_batch_location_id,
      destination_location_id: destination_location_id || null,
      destination_vessel_id: destination_vessel_id || null,
      volume: vol,
      transfer_type: transfer_type || 'transfer',
      note: note || null
    });
    if (log_to_ledger && ledger_item_id && destination_location_id) {
      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: ledger_item_id,
        location_id: destination_location_id,
        quantity: vol,
        batch_id: batch.value.id,
        operation_type: 'serving_transfer',
        note: note || 'Transfer from serving'
      });
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
    await refreshVolumeSnapshots();
    await refreshTransfers();
    modals.transfer = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Readings (per vessel or batch-level) ---
const openReadingModal = () => {
  const firstBl = batchLocations.value.length > 0 ? batchLocations.value[0] : null;
  forms.reading = { reading_type: 'GRAVITY', value: '', measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), batch_id: batch.value.id, batch_location_id: firstBl?.id || null };
  modals.reading = true;
};
const openReadingModalForSplit = (batchLocationId) => {
  forms.reading = { reading_type: 'GRAVITY', value: '', measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), batch_id: batch.value.id, batch_location_id: batchLocationId };
  modals.reading = true;
};

// --- Additions ---
const openAdditionModal = () => {
  // Default to "Any" to show all items
  forms.addition = { item_id: '', event_type: 'Any', quantity: 0, location_id: '', batch_id: batch.value.id, batch_location_id: null };
  additionAvailableQty.value = 0;
  locationAvailability.value = new Map();
  modals.addition = true;
};

const updateAdditionAvailability = async () => {
  if (forms.addition.item_id && forms.addition.location_id) {
    additionAvailableQty.value = await LedgerRepository.getOnhand(forms.addition.item_id, forms.addition.location_id);
  } else {
    additionAvailableQty.value = 0;
  }
};

const updateLocationAvailability = async () => {
  if (!forms.addition.item_id) {
    locationAvailability.value = new Map();
    return;
  }
  
  // Fetch availability for this item at all locations
  const availMap = new Map();
  await Promise.all(
    locations.value.map(async (loc) => {
      const qty = await LedgerRepository.getOnhand(forms.addition.item_id, loc.id);
      availMap.set(loc.id, qty);
    })
  );
  locationAvailability.value = availMap;
  
  // Update the selected location's availability too
  if (forms.addition.location_id) {
    additionAvailableQty.value = availMap.get(forms.addition.location_id) || 0;
  }
};

const getLocationLabel = (location) => {
  const avail = locationAvailability.value.get(location.id);
  if (avail !== undefined && forms.addition.item_id) {
    return `${location.name} (${avail} available)`;
  }
  return location.name;
};
const getDefaultFinishedBeerItem = () => items.value.find(i => i.category === 'Finished Beer' && i.name === 'Finished Beer') || items.value.find(i => i.category === 'Finished Beer');

const saveAddition = async () => {
  try {
    if (!forms.addition.item_id || !forms.addition.location_id) {
      return showAlert('Validation Error', 'Please select an item and location.', 'danger');
    }
    if (!isAdditionValid.value) {
      return showAlert('Validation Error', 'Invalid quantity. Check availability.', 'danger');
    }

    // Debug logging
    console.log('Attempting to save addition:', JSON.parse(JSON.stringify(forms.addition)));
    
    await BatchAdditionRepository.add(forms.addition);
    additions.value = await BatchAdditionRepository.getByBatchId(batch.value.id);
    modals.addition = false;
    SyncService.sync();
  } catch (e) {
    console.error('Save addition failed:', e);
    showAlert('Error', e.message, 'danger');
  }
};

const undoAddition = async (addition) => {
  showConfirm('Undo Addition', `Reverse consumption of ${addition.quantity} ${getItemName(addition.item_id)}?`, async () => {
    try {
      // Find the ledger entry associated with this addition
      // Since we didn't store ledger_id on addition explicitly in previous schema, we search by context
      // Or we just create a reversal entry manually here since we know the context.
      // Better: find the CONSUME entry for this batch/item/time
      
      const entries = await LedgerRepository.getEntries({ 
        item_id: addition.item_id, 
        batch_id: batch.value.id,
        type: 'CONSUME'
      });
      
      // Fuzzy match time or quantity? 
      // Ideally we stored the link. But for now, let's reverse by creating a generic reversal
      // or find the exact entry if possible.
      // Since BatchAdditionRepository.add created a ledger entry with specific timestamp, let's try to match it.
      // Actually, BatchAdditionRepository.add uses `newAddition.added_at` for creation.
      
      const targetEntry = entries.find(e => 
        e.quantity === -addition.quantity && 
        Math.abs(new Date(e.created_at) - new Date(addition.added_at)) < 2000 // 2 sec tolerance
      );

      if (targetEntry) {
        await LedgerRepository.reverseEntry(targetEntry, 'Undo Batch Addition');
        // Note: We don't delete the BatchAddition record itself, effectively keeping it as a log but with stock reversed?
        // Or should we mark the addition as 'reversed'?
        // For simple MVP: Reverse stock, maybe update addition status if we had one.
        // Let's just reverse stock.
        showAlert('Success', 'Inventory restored.');
        SyncService.sync();
      } else {
        // Fallback: Create a manual correction entry
        await LedgerRepository.addEntry({
          type: 'CORRECTION', // or REVERSAL
          item_id: addition.item_id,
          location_id: addition.location_id,
          batch_id: batch.value.id,
          quantity: addition.quantity, // Add back
          note: 'Undo Addition (Manual Match)'
        });
        showAlert('Success', 'Inventory restored (Manual Correction).');
        SyncService.sync();
      }
    } catch (e) {
      showAlert('Error', e.message, 'danger');
    }
  }, 'danger', 'Undo');
};

// --- Readings (save) ---
const saveReading = async () => {
  try {
    if (!forms.reading.batch_location_id) {
      showAlert('Validation', 'Select a vessel for this reading.', 'danger');
      return;
    }
    const readingPayload = {
      batch_id: batch.value.id,
      reading_type: forms.reading.reading_type,
      value: forms.reading.value,
      measured_at: new Date(forms.reading.measured_at).toISOString(),
      batch_location_id: forms.reading.batch_location_id
    };
    await BatchReadingRepository.add(readingPayload);
    const split = batchLocations.value.find(b => b.id === forms.reading.batch_location_id);
    if (split) {
      const updates = {};
      if (forms.reading.reading_type === 'GRAVITY') updates.current_gravity = forms.reading.value;
      if (forms.reading.reading_type === 'TEMP') updates.current_temp = forms.reading.value;
      if (forms.reading.reading_type === 'PH') updates.current_ph = forms.reading.value;
      if (Object.keys(updates).length) {
        await BatchLocationRepository.update(forms.reading.batch_location_id, updates);
        batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
      }
    }
    readings.value = await BatchReadingRepository.getByBatchId(batch.value.id);
    modals.reading = false;
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Production Complete ---
const openProductionCompleteModal = async () => {
  if (isProductionCompleteAlready.value) {
    showAlert('Batch is already complete', 'This batch has already been marked production complete.', 'primary');
    return;
  }
  const firstBl = batchLocations.value[0] || null;
  if (firstBl) {
    forms.productionComplete.batch_location_id = firstBl.id;
  }
  forms.productionComplete.volume_produced = firstBl?.current_volume ?? displayTotalVolume.value ?? null;
  forms.productionComplete.completion_date = new Date().toISOString().slice(0, 16);
  forms.productionComplete.destChoice = null;
  forms.productionComplete.location_id = null;
  forms.productionComplete.formatKey = KEG_FORMAT_PRESETS[0]?.key || '1/6 bbl';
  forms.productionComplete.numKegs = null;
  forms.productionComplete.numCases = null;
  forms.productionComplete.supplies = [];

  const isServingType = (v) => (v.type || '').toUpperCase() === 'SERVING';
  const servingVessels = (vessels.value || []).filter(
    (v) => v.location_id && !v.deleted_at && isServingType(v)
  );
  const locationMap = new Map((locations.value || []).map((l) => [l.id, l]));
  const seenLocationIds = new Set();
  const servingLocs = [];
  for (const loc of locations.value || []) {
    if (loc.deleted_at || loc.stage !== 'serving') continue;
    if (seenLocationIds.has(loc.id)) continue;
    seenLocationIds.add(loc.id);
    const linkedVessel = servingVessels.find((v) => v.location_id === loc.id);
    const occupancy = await getCurrentBeerAtLocation(loc.id);
    let currentBeerItemName = 'Empty';
    let conflict = false;
    let currentBeerItem = null;
    let onHand = null;
    if (occupancy.conflict) {
      currentBeerItemName = 'Multiple beers – resolve on Serving';
      conflict = true;
    } else if (occupancy.item) {
      currentBeerItemName = occupancy.item.name;
      currentBeerItem = occupancy.item;
      onHand = occupancy.onHand;
    }
    servingLocs.push({
      id: loc.id,
      name: loc.name || 'Location',
      vesselName: linkedVessel?.name ?? null,
      onHand,
      currentBeerItemName,
      conflict,
      currentBeerItem
    });
  }
  for (const v of servingVessels) {
    const loc = locationMap.get(v.location_id);
    if (!loc || seenLocationIds.has(v.location_id)) continue;
    seenLocationIds.add(v.location_id);
    const occupancy = await getCurrentBeerAtLocation(v.location_id);
    let currentBeerItemName = 'Empty';
    let conflict = false;
    let currentBeerItem = null;
    let onHand = null;
    if (occupancy.conflict) {
      currentBeerItemName = 'Multiple beers – resolve on Serving';
      conflict = true;
    } else if (occupancy.item) {
      currentBeerItemName = occupancy.item.name;
      currentBeerItem = occupancy.item;
      onHand = occupancy.onHand;
    }
    servingLocs.push({
      id: v.location_id,
      name: loc?.name || 'Location',
      vesselName: v.name || 'Vessel',
      onHand,
      currentBeerItemName,
      conflict,
      currentBeerItem
    });
  }
  productionCompleteServingLocations.value = servingLocs;

  const selectedBl = firstBl;
  const selectedVessel = selectedBl ? vessels.value.find((v) => v.id === selectedBl.vessel_id) : null;
  const defaultChoice =
    selectedVessel?.location_id && servingLocs.some((l) => l.id === selectedVessel.location_id)
      ? 'serving'
      : null;
  const defaultLocationId =
    defaultChoice === 'serving' && selectedVessel?.location_id ? selectedVessel.location_id : null;
  forms.productionComplete.destChoice = defaultChoice;
  forms.productionComplete.location_id = defaultLocationId;
  productionCompleteExistingItem.value = null;
  productionCompleteConfirmOpen.value = false;

  modals.productionComplete = true;
};

const onProductionCompleteConfirm = async () => {
  if (!forms.productionComplete.destChoice || !forms.productionComplete.location_id) {
    saveProductionComplete();
    return;
  }
  if (forms.productionComplete.destChoice !== 'serving') {
    saveProductionComplete();
    return;
  }
  const locId = forms.productionComplete.location_id;
  const occupancy = await getCurrentBeerAtLocation(locId);
  if (occupancy.empty) {
    saveProductionComplete();
    return;
  }
  if (occupancy.conflict) {
    showAlert('Cannot use this location', 'This serving location has more than one beer. Resolve inventory on the Serving page, then try again.', 'danger');
    return;
  }
  productionCompleteOccupiedItem.value = occupancy.item;
  productionCompleteConfirmOpen.value = true;
};

const productionCompleteConfirmSameBeer = () => {
  productionCompleteExistingItem.value = productionCompleteOccupiedItem.value;
  productionCompleteConfirmOpen.value = false;
  productionCompleteOccupiedItem.value = null;
  saveProductionComplete();
};

const productionCompleteConfirmRemoveFirst = () => {
  productionCompleteConfirmOpen.value = false;
  productionCompleteOccupiedItem.value = null;
  showAlert('Remove beer first', 'Zero out or remove the beer at this location from the Serving page, then try again.', 'primary');
};

const productionCompleteConfirmCancel = () => {
  productionCompleteConfirmOpen.value = false;
  productionCompleteOccupiedItem.value = null;
};

const productionCompleteVolumeOverrideConfirm = () => {
  productionCompleteVolumeOverride.value = true;
  productionCompleteVolumeOverrideConfirmOpen.value = false;
  saveProductionComplete();
};

const productionCompleteVolumeOverrideCancel = () => {
  productionCompleteVolumeOverrideConfirmOpen.value = false;
  productionCompleteVolumeExceedData.value = null;
};

const saveProductionComplete = async () => {
  try {
    const f = forms.productionComplete;
    if (!f.destChoice) {
      showAlert('Validation Error', 'Please choose Serving or Packaged.', 'danger');
      return;
    }
    if (!f.location_id) {
      showAlert('Validation Error', 'Please select a destination location.', 'danger');
      return;
    }
    if (!f.batch_location_id) {
      showAlert('Error', 'Please select a vessel', 'danger');
      return;
    }

    const isPackaging = isPackagingChoice(f.destChoice);
    let volumeBarrels;
    if (isPackaging) {
      const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS;
      const preset = presets.find((p) => p.key === f.formatKey);
      const qty = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0);
      if (!preset || qty <= 0) {
        showAlert('Validation Error', f.destChoice === 'packaged_keg' ? 'Please enter number of kegs.' : 'Please enter number of cases.', 'danger');
        return;
      }
      volumeBarrels = qty * preset.volumePerUnit;
      const supplies = f.supplies || [];
      const validSupplies = supplies.filter((s) => s.item_id && s.location_id && s.quantity > 0);
      if (validSupplies.length === 0) {
        showAlert('Validation Error', 'Add at least one packaging material (e.g. empty kegs).', 'danger');
        return;
      }
      for (const line of validSupplies) {
        const onhand = await LedgerRepository.getOnhand(line.item_id, line.location_id);
        if (onhand < line.quantity) {
          const itemName = (items.value || []).find((i) => i.id === line.item_id)?.name || 'Item';
          showAlert('Validation Error', `Insufficient ${itemName}. Available: ${onhand}, needed: ${line.quantity}`, 'danger');
          return;
        }
      }
    } else {
      if (!f.volume_produced || f.volume_produced <= 0) {
        showAlert('Error', 'Please enter volume produced', 'danger');
        return;
      }
      volumeBarrels = f.volume_produced;
    }

    const completionDate = new Date(f.completion_date).toISOString();

    const batchEntries = await LedgerRepository.getEntries({ batch_id: batch.value.id });
    const alreadyComplete = batchEntries.some(
      (e) => e.type === 'RECEIVE' && (e.data || {}).source === 'production_complete'
    );
    if (alreadyComplete) {
      showAlert('Error', 'This batch has already been marked production complete.', 'danger');
      return;
    }

    let beerItem = productionCompleteExistingItem.value;
    if (!beerItem) {
      try {
        beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value);
      } catch (e) {
        showAlert('Error', e.message || 'Could not resolve Finished Beer item.', 'danger');
        return;
      }
    }
    if (!beerItem) {
      showAlert('Error', 'Finished Beer item not found.', 'danger');
      return;
    }
    productionCompleteExistingItem.value = null;

    if (isPackaging) {
      const batchLocation = (batchLocations.value || []).find((bl) => bl.id === f.batch_location_id);
      const vessel = batchLocation ? (vessels.value || []).find((v) => v.id === batchLocation.vessel_id) : null;
      if (!vessel?.location_id) {
        showAlert('Validation Error', 'Packaging requires a vessel with a bound location. Edit the vessel on Vessels page.', 'danger');
        return;
      }
      // Volume vs vessel capacity check (with manual override)
      const unit = batch.value.planned_volume_unit || 'bbl';
      const vesselVol = Number(batchLocation?.current_volume) || 0;
      const vesselVolumeBarrels = unit === 'bbl' ? vesselVol : unit === 'gal' ? vesselVol / 31 : vesselVol / 117.35;
      if (!productionCompleteVolumeOverride.value && vesselVolumeBarrels > 0 && volumeBarrels > vesselVolumeBarrels) {
        productionCompleteVolumeExceedData.value = { volumeBarrels, vesselVolumeBarrels, unit };
        productionCompleteVolumeOverrideConfirmOpen.value = true;
        return;
      }
      productionCompleteVolumeOverride.value = false;
      productionCompleteVolumeExceedData.value = null;
      const destLocationId = f.location_id;
      const operationType = f.destChoice === 'packaged_keg' ? 'racking' : 'bottling';
      const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS;
      const preset = presets.find((p) => p.key === f.formatKey);
      const numUnits = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0);
      const packagedBeerItem = await ItemRepository.getOrCreatePackagedBeerItem(beerItem, preset.key, preset.volumePerUnit);

      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: beerItem.id,
        location_id: vessel.location_id,
        batch_id: batch.value.id,
        quantity: volumeBarrels,
        created_at: completionDate,
        note: `Production complete: ${volumeBarrels} bbl (bulk)`,
        operation_type: 'production_complete',
        data: { source: 'production_complete' }
      });

      await LedgerRepository.transfer({
        itemId: beerItem.id,
        fromLocationId: vessel.location_id,
        toLocationId: destLocationId,
        quantity: volumeBarrels,
        note: `${operationType}: bulk to packaging`,
        operationType,
        batchId: batch.value.id,
        created_at: completionDate
      });

      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: beerItem.id,
        location_id: destLocationId,
        batch_id: batch.value.id,
        quantity: -volumeBarrels,
        created_at: completionDate,
        note: `Packaging: bulk to ${numUnits} ${preset.key}`,
        operation_type: operationType
      });

      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: packagedBeerItem.id,
        location_id: destLocationId,
        batch_id: batch.value.id,
        quantity: numUnits,
        created_at: completionDate,
        note: `Packaging: ${numUnits} ${preset.key}`,
        operation_type: operationType
      });

      for (const line of (f.supplies || []).filter((s) => s.item_id && s.location_id && s.quantity > 0)) {
        await LedgerRepository.addEntry({
          type: 'CONSUME',
          item_id: line.item_id,
          location_id: line.location_id,
          batch_id: batch.value.id,
          quantity: -Math.abs(line.quantity),
          created_at: completionDate,
          note: 'Packaging materials',
          operation_type: 'packaging_supply'
        });
      }
    } else {
      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: beerItem.id,
        location_id: f.location_id,
        batch_id: batch.value.id,
        quantity: volumeBarrels,
        created_at: completionDate,
        note: `Production complete: ${volumeBarrels} bbl`,
        operation_type: 'production_complete',
        data: { source: 'production_complete' }
      });
    }

    const defs = milestoneDefinitions.value;
    const lastDef = defs && defs.length > 0
      ? defs.reduce((a, b) => ((a.sort_order ?? 0) >= (b.sort_order ?? 0) ? a : b))
      : null;
    const lastDefId = lastDef ? lastDef.id : null;
    const volDisplay = isPackaging ? volumeBarrels : f.volume_produced;
    const milestoneData = {
      volume_produced: volDisplay,
      production_location_id: f.location_id,
      production_batch_location_id: f.batch_location_id
    };
    const existing = lastDefId ? milestones.value.find(m => m.milestone_definition_id === lastDefId) : null;

    if (existing) {
      await BatchMilestoneRepository.update(existing.id, {
        occurred_at: completionDate,
        note: `Production Complete: ${volDisplay} barrels`,
        data: { ...(existing.data || {}), ...milestoneData }
      });
    } else if (lastDefId) {
      await BatchMilestoneRepository.create({
        batch_id: batch.value.id,
        milestone_definition_id: lastDefId,
        milestone_type: 'FG_CONFIRMED',
        occurred_at: completionDate,
        note: `Production Complete: ${volDisplay} barrels`,
        data: milestoneData
      });
    }

    await BatchLocationRepository.delete(f.batch_location_id);
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id);
    milestones.value = await BatchMilestoneRepository.getByBatchId(batch.value.id);
    batchLedgerEntries.value = await LedgerRepository.getEntries({ batch_id: batch.value.id });
    items.value = await ItemRepository.getAll();
    modals.productionComplete = false;
    showAlert('Success', 'Production marked complete. Source vessel cleared.', 'success');
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Water Addition ---
const openWaterAdditionModal = () => {
  if (batchLocations.value.length === 1) {
    forms.waterAddition.batch_location_id = batchLocations.value[0].id;
  }
  forms.waterAddition.added_at = new Date().toISOString().slice(0, 16);
  modals.waterAddition = true;
};

const saveWaterAddition = async () => {
  try {
    if (!forms.waterAddition.batch_location_id) {
      showAlert('Error', 'Please select a vessel', 'danger');
      return;
    }
    if (!forms.waterAddition.quantity || forms.waterAddition.quantity <= 0) {
      showAlert('Error', 'Please enter quantity', 'danger');
      return;
    }
    if (forms.waterAddition.addition_type === 'LIQUID' && !forms.waterAddition.liquid_type) {
      showAlert('Error', 'Please specify liquid type', 'danger');
      return;
    }

    const eventType = forms.waterAddition.addition_type === 'WATER' ? 'WATER_ADDITION' : 'LIQUID_ADDITION';

    await BatchAdditionRepository.add({
      batch_id: batch.value.id,
      batch_location_id: forms.waterAddition.batch_location_id,
      event_type: eventType,
      quantity: forms.waterAddition.quantity,
      added_at: new Date(forms.waterAddition.added_at).toISOString(),
      note: forms.waterAddition.note || (forms.waterAddition.addition_type === 'LIQUID' ? `Liquid type: ${forms.waterAddition.liquid_type}` : 'Water addition'),
      liquid_type: forms.waterAddition.addition_type === 'LIQUID' ? forms.waterAddition.liquid_type : null,
      // Don't create ledger entry - water additions don't consume inventory
      item_id: null,
      location_id: null
    });

    additions.value = await BatchAdditionRepository.getByBatchId(batch.value.id);
    modals.waterAddition = false;
    showAlert('Success', 'Water/liquid addition recorded', 'success');
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

// --- Helpers ---
const getItemName = (id) => items.value.find(i => i.id === id)?.name || 'Unknown Item';
/** Display name for batch history: Water, liquid type, or item name (ingredient additions). */
const getAdditionDisplayName = (a) => {
  if (a.event_type === 'WATER_ADDITION') return 'Water';
  if (a.event_type === 'LIQUID_ADDITION') return (a.liquid_type && String(a.liquid_type).trim()) || 'Other Liquid';
  return getItemName(a.item_id);
};
const formatDate = (d) => d ? dayjs(d).format('MMM D, YYYY') : '-';
const formatDateTime = (d) => d ? dayjs(d).format('MMM D, HH:mm') : '-';
const getStatusClass = (status) => {
  const map = {
    PLANNED: 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100',
    'Knocked Out': 'bg-yellow-100 text-yellow-800',
    'Pitched': 'bg-yellow-100 text-yellow-800',
    'Fermentation Started': 'bg-purple-100 text-purple-800',
    'FG Confirmed': 'bg-blue-100 text-blue-800',
    'Cold Crash': 'bg-blue-100 text-blue-800',
    'Transferred': 'bg-blue-100 text-blue-800',
    'Serving': 'bg-blue-100 text-blue-800',
    'Packaging Started': 'bg-blue-100 text-blue-800',
    'Packaging Completed': 'bg-green-100 text-green-800',
    'Released': 'bg-green-100 text-green-800',
    'Batch Closed': 'bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-800'
  };
  return map[status] || 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100';
};
</script>
