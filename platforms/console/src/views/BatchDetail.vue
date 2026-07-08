<template>
  <div class="desktop-container pb-10">
    <!-- Breadcrumb -->
    <nav class="mb-6" aria-label="Breadcrumb">
      <router-link to="/batches" class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <i class="ri-arrow-left-line" aria-hidden="true"></i>
        Batches
      </router-link>
    </nav>

    <div v-if="loading" class="card p-12 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent mb-3"></div>
      <p class="text-neutral-500 dark:text-neutral-400 text-sm">Loading batch...</p>
    </div>

    <div v-else-if="batchNotFound" class="card p-12 text-center">
      <p class="text-neutral-600 dark:text-neutral-400 mb-4">Batch not found.</p>
      <router-link to="/batches" class="btn btn-primary">Back to Batches</router-link>
    </div>

    <template v-else-if="batch">
      <!-- Hero: batch name, meta, status -->
      <header class="mb-8">
        <div class="flex flex-wrap items-baseline justify-between gap-4">
          <div class="min-w-0">
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-50 heading-refined truncate">{{ batch.name }}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-neutral-600 dark:text-neutral-400">
              <span>{{ formatDate(batch.batch_date) }}</span>
              <span v-if="displayTotalVolume != null" class="font-mono font-medium text-neutral-700 dark:text-stone-300">
                {{ displayTotalVolume }} {{ batch.planned_volume_unit || '' }}
              </span>
            </div>
          </div>
          <span class="badge shrink-0" :class="getStatusClass(computedStatus)">{{ computedStatus }}</span>
        </div>
      </header>

      <!-- Actions toolbar: primary + secondary -->
      <div class="flex flex-wrap items-center gap-2 mb-6">
        <button @click="openReadingModal" class="btn btn-primary inline-flex items-center gap-2">
          <i class="ri-bar-chart-box-line" aria-hidden="true"></i>
          Log Reading
        </button>
        <button @click="openAdditionModal" class="btn btn-secondary">Add Ingredient</button>
        <button @click="openWaterAdditionModal" class="btn btn-secondary">Add Water / Liquid</button>
        <button @click="openProductionCompleteModal" class="btn btn-success">
          Mark Production Complete
        </button>
        <!-- Recipe consumption button -->
        <template v-if="hasRecipe">
          <button 
            @click="goToConsumeRecipe"
            :disabled="allIngredientsConsumed"
            :title="consumptionTooltip"
            class="btn btn-secondary inline-flex items-center gap-2"
            :class="{ 'opacity-60 cursor-not-allowed': allIngredientsConsumed }"
          >
            <i class="ri-restaurant-line" aria-hidden="true"></i>
            {{ consumptionButtonText }}
          </button>
          <span 
            v-if="recipeConsumption.totalItems > 0"
            class="text-xs px-2 py-1 rounded border"
            :class="consumptionBadgeClass"
          >
            {{ recipeConsumption.completedItems }} of {{ recipeConsumption.totalItems }} consumed
          </span>
        </template>
      </div>

      <!-- Left: Batch Cost + Vessels (same width) | Right: Timeline / History (more space) -->
      <div class="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <!-- Left column: Cost + Vessels stacked, same horizontal size -->
        <div class="xl:col-span-2 flex flex-col gap-6">
          <div class="card">
            <div class="card-header">
              <h2 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Batch Cost</h2>
            </div>
            <div class="card-body">
              <div class="flex items-baseline gap-2 mb-3">
                <span class="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                  {{ costSummary ? formatCurrency(costSummary.total) : '—' }}
                </span>
              </div>
              <div class="space-y-1 text-sm text-neutral-600 dark:text-stone-300">
                <div class="flex justify-between">
                  <span>Materials</span>
                  <span>{{ costSummary ? formatCurrency(costSummary.materials) : '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Packaging</span>
                  <span>{{ costSummary ? formatCurrency(costSummary.packaging) : '—' }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Other</span>
                  <span>{{ costSummary ? formatCurrency(costSummary.other) : '—' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Vessels card -->
          <div class="card overflow-hidden flex-1 min-h-0 flex flex-col">
          <div class="card-header flex items-center justify-between">
            <h2 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Vessels</h2>
            <button @click="openSplitTransferModal" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors">
              Split / Transfer
            </button>
          </div>
          <div class="card-body p-0 flex-1 min-h-0 overflow-hidden flex flex-col">
            <div v-if="batchLocations.length === 0" class="p-8 text-center text-neutral-500 dark:text-neutral-400 text-sm border-t border-neutral-200 dark:border-neutral-700">
              No vessels assigned. Use Split / Transfer to assign vessels.
            </div>
            <div v-else class="flex-1 min-h-0 overflow-hidden">
              <table class="data-table w-full table-fixed">
                <thead>
                  <tr>
                    <th class="w-[28%]">Vessel</th>
                    <th class="w-[18%]">Volume</th>
                    <th class="w-[12%]">Gravity</th>
                    <th class="w-[10%]">Temp</th>
                    <th class="w-[10%]">pH</th>
                    <th class="w-[22%] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="split in batchLocations" :key="split.id">
                    <td class="min-w-0">
                      <span class="font-semibold text-neutral-900 dark:text-stone-100 truncate block">{{ getVesselName(split.vessel_id) || 'Vessel' }}</span>
                      <span v-if="split.status" class="block text-xs text-neutral-500 dark:text-neutral-400 truncate">{{ split.status }}</span>
                    </td>
                    <td class="font-mono text-neutral-900 dark:text-stone-100 min-w-0">
                      <span class="truncate block">{{ split.current_volume != null ? split.current_volume : '—' }} {{ batch.planned_volume_unit || '' }}</span>
                      <div v-if="getLastSnapshot(split.id)" class="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                        Set {{ getLastSnapshot(split.id).measured_volume }} @ {{ formatDateTime(getLastSnapshot(split.id).measured_at) }}
                      </div>
                    </td>
                    <td class="font-mono font-medium min-w-0">{{ split.current_gravity ?? '—' }}</td>
                    <td class="font-mono font-medium min-w-0">{{ split.current_temp != null ? split.current_temp + '°' : '—' }}</td>
                    <td class="font-mono font-medium min-w-0">{{ split.current_ph ?? '—' }}</td>
                    <td class="text-right min-w-0">
                      <div class="relative inline-block" @click.stop>
                        <button
                          type="button"
                          @click.stop="toggleVesselActions(split.id)"
                          class="btn btn-secondary text-xs px-2 py-1 rounded inline-flex items-center gap-1"
                          :aria-expanded="vesselActionsOpenId === split.id"
                          aria-haspopup="true"
                        >
                          Actions <i class="ri-arrow-down-s-line text-sm" aria-hidden="true"></i>
                        </button>
                        <div
                          v-if="vesselActionsOpenId === split.id"
                          class="absolute right-0 top-full mt-1 z-20 py-1 min-w-[10rem] rounded-lg shadow-lg border border-neutral-200 dark:border-stone-600 bg-white dark:bg-neutral-800"
                        >
                          <button type="button" class="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-stone-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-t-lg" @click="vesselActionsOpenId = null; openSetVolumeModal(split.id)">Set volume</button>
                          <button type="button" class="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-stone-200 hover:bg-neutral-100 dark:hover:bg-neutral-700" @click="vesselActionsOpenId = null; openAdjustVolumeModal(split.id)">Adjust</button>
                          <button type="button" class="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-stone-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-b-lg" @click="vesselActionsOpenId = null; openReadingModalForSplit(split.id)">Log</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </div>

        <!-- Right column: Timeline & History tabs (more space) -->
        <div class="xl:col-span-3 card overflow-hidden flex flex-col min-h-[320px]">
          <div role="tablist" aria-label="Batch timeline and history" class="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/50">
            <button
              v-for="tab in ['Timeline', 'History']"
              :key="tab"
              role="tab"
              :aria-selected="activeTab === tab"
              :id="`batch-tab-${tab.toLowerCase()}`"
              :aria-controls="`batch-panel-${tab.toLowerCase()}`"
              @click="activeTab = tab"
              :class="['flex-1 px-4 py-3 text-sm font-medium transition-colors', activeTab === tab ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400 bg-transparent -mb-px' : 'text-neutral-500 dark:text-neutral-400 border-b-2 border-transparent hover:text-neutral-700 dark:hover:text-neutral-300']"
            >
              {{ tab }}
            </button>
          </div>
          <div class="card-body flex-1 min-h-0 overflow-auto">
            <!-- Timeline -->
            <div v-if="activeTab === 'Timeline'" id="batch-panel-timeline" role="tabpanel" aria-labelledby="batch-tab-timeline" class="space-y-0">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Milestones</h3>
              <div class="relative pl-6">
                <div class="absolute left-[7px] top-2 bottom-2 w-0.5 bg-neutral-200 dark:bg-stone-800 rounded-full"></div>
                <div v-for="(def, idx) in milestoneDefinitions" :key="def.id" class="relative flex items-start gap-3 pb-5 last:pb-0">
                  <button
                    type="button"
                    class="relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all bg-white dark:bg-neutral-800"
                    :class="getMilestoneStatusClass(def.id)"
                    :aria-label="isProductionCompleteDef(def) ? 'Mark production complete' : (isMilestoneCompleted(def.id) ? 'Uncomplete milestone' : 'Complete milestone')"
                    @click.stop="isProductionCompleteDef(def) ? openProductionCompleteModal() : toggleMilestone(def.id)"
                  >
                    <span v-if="isMilestoneCompleted(def.id)" class="text-sm font-bold">✓</span>
                  </button>
                  <div class="flex-1 min-w-0 pt-0.5" :class="{ 'cursor-pointer': isProductionCompleteDef(def) }" @click="isProductionCompleteDef(def) && openProductionCompleteModal()">
                    <div class="flex flex-wrap items-center justify-between gap-2">
                      <span class="font-semibold text-neutral-900 dark:text-stone-100 text-sm" :class="{ 'text-neutral-400 dark:text-neutral-500': !isMilestoneCompleted(def.id) && !isNextMilestone(def.id) }">
                        {{ def.label }}
                      </span>
                      <span v-if="isMilestoneCompleted(def.id)" class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        {{ formatDateTime(getMilestoneDate(def.id)) }}
                      </span>
                    </div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">{{ def.description }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- History -->
            <div v-if="activeTab === 'History'" id="batch-panel-history" role="tabpanel" aria-labelledby="batch-tab-history" class="space-y-0">
              <div v-if="allHistoryEvents.length === 0" class="py-8 text-center text-neutral-500 dark:text-neutral-400 text-sm">
                No events logged yet.
              </div>
              <div v-else class="overflow-x-auto">
                <table class="data-table text-sm">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Event</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="event in allHistoryEvents" :key="event.id">
                      <td class="whitespace-nowrap text-neutral-500 dark:text-neutral-400 font-mono text-xs">
                        {{ formatDateTime(event.date) }}
                      </td>
                      <td>
                        <span class="inline-flex items-center gap-1.5 font-medium text-neutral-900 dark:text-stone-100">
                          <span aria-hidden="true">{{ event.icon }}</span>
                          {{ event.title }}
                        </span>
                      </td>
                      <td class="text-neutral-500 dark:text-neutral-400 text-xs max-w-[12rem] truncate" :title="event.subtitle">
                        {{ event.subtitle }}
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

    <!-- Modals -->
    <ModalDialog :isOpen="modals.splitTransfer" title="Split / Transfer / Combine" confirmText="Apply" type="confirm" @confirm="saveSplitTransfer" @cancel="modals.splitTransfer = false">
      <div class="space-y-4">
        <div class="flex gap-2 border-b border-neutral-200 dark:border-stone-600 pb-3">
          <button @click="forms.splitTransfer.mode = 'split'" :class="['flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors', forms.splitTransfer.mode === 'split' ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300']">Split (1 → Many)</button>
          <button @click="forms.splitTransfer.mode = 'combine'" :class="['flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors', forms.splitTransfer.mode === 'combine' ? 'bg-primary-600 text-white' : 'bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300']">Combine (Many → 1)</button>
        </div>
        <div v-if="forms.splitTransfer.mode === 'split'">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Source vessel</label>
            <select v-model="forms.splitTransfer.sourceBatchLocationId" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">— Select —</option>
              <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">{{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destinations (resulting volume at each vessel)</label>
            <div class="space-y-2">
              <div v-for="(dest, idx) in forms.splitTransfer.destinations" :key="idx" class="flex gap-2 items-end">
                <select v-model="dest.vessel_id" class="flex-1 border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm">
                  <option :value="null">— Vessel —</option>
                  <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
                </select>
                <input v-model.number="dest.volume" type="number" step="any" min="0" class="w-24 border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm" placeholder="Vol">
                <button v-if="forms.splitTransfer.destinations.length > 1" type="button" @click="removeSplitDest(idx)" class="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded">✕</button>
              </div>
              <button type="button" @click="addSplitDest" class="text-sm text-primary-600 dark:text-primary-400 font-medium">+ Add destination</button>
            </div>
            <p v-if="splitTransferSourceVolume != null" class="mt-2 text-xs text-neutral-600 dark:text-neutral-400">Source: {{ splitTransferSourceVolume }} {{ batch.planned_volume_unit }}. Enter resulting volume per destination (can differ due to loss or addition).</p>
          </div>
        </div>
        <div v-else-if="forms.splitTransfer.mode === 'combine'">
          <div class="mb-3">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Source vessels (select multiple)</label>
            <div class="space-y-1 max-h-40 overflow-y-auto border border-neutral-200 dark:border-stone-600 rounded-lg p-2">
              <label v-for="bl in batchLocations" :key="bl.id" class="flex items-center gap-2 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded cursor-pointer">
                <input type="checkbox" :value="bl.id" v-model="forms.splitTransfer.sourceBatchLocationIds" class="w-4 h-4 rounded border-neutral-300 dark:border-stone-500 bg-white dark:bg-stone-800 text-primary-600">
                <span class="text-sm">{{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}</span>
              </label>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destination vessel</label>
            <select v-model="forms.splitTransfer.destinationVesselId" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">— Select or create new —</option>
              <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <div class="mt-2">
              <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Resulting volume at destination (optional)</label>
              <input v-model.number="forms.splitTransfer.combineDestinationVolume" type="number" step="any" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm" placeholder="Leave blank to use sum of sources">
            </div>
            <p v-if="combineSourcesSum != null" class="mt-2 text-xs text-neutral-600 dark:text-neutral-400">Sum of sources: {{ combineSourcesSum }} {{ batch.planned_volume_unit }}</p>
          </div>
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.adjustVolume" title="Adjust Volume" confirmText="Save" type="confirm" @confirm="saveAdjustVolume" @cancel="modals.adjustVolume = false">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Vessel</label>
          <input :value="adjustVolumeVesselName" disabled class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-neutral-400 text-sm">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Volume change (negative for loss/serving)</label>
          <input v-model.number="forms.adjustVolume.volume_change" type="number" step="any" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. -2.5">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Reason</label>
          <input v-model="forms.adjustVolume.reason" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. Serving, Trub loss">
        </div>
        <div v-if="adjustVolumeIsTank && Number(forms.adjustVolume.volume_change) < 0" class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-neutral-700 dark:text-stone-200">
          This will record a <strong>removal</strong> from <strong>{{ adjustVolumeTankLocationName }}</strong> (ledger CONSUME) and reduce on-hand there.
        </div>
        <div v-else-if="adjustVolumeIsTank && Number(forms.adjustVolume.volume_change) > 0" class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-neutral-700 dark:text-stone-200">
          This will add to ledger at <strong>{{ adjustVolumeTankLocationName }}</strong> (RECEIVE) and increase on-hand there.
        </div>
        <p v-if="adjustVolumeNewTotal != null && !adjustVolumeIsTank" class="text-xs" :class="adjustVolumeNewTotal >= 0 ? 'text-neutral-600 dark:text-neutral-400' : 'text-danger-600 dark:text-danger-400'">New volume: {{ adjustVolumeNewTotal }} {{ batch.planned_volume_unit }}</p>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.setVolume" title="Set Volume (Snapshot)" confirmText="Save" type="confirm" @confirm="saveSetVolume" @cancel="modals.setVolume = false">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Measured volume</label>
          <input v-model.number="forms.setVolume.measured_volume" type="number" step="any" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. 7.5">
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Measured at</label>
            <input v-model="forms.setVolume.measured_at" type="datetime-local" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Method</label>
            <input v-model="forms.setVolume.method" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="Sight glass, weighback, etc.">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Note (optional)</label>
          <input v-model="forms.setVolume.note" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. Start of month setpoint">
        </div>
        <div v-if="setVolumeIsTank" class="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-neutral-700 dark:text-stone-200">
          This will reconcile ledger at <strong>{{ setVolumeTankLocationName }}</strong> to the entered value. Current on-hand: <strong>{{ setVolumeCurrentVolume != null ? setVolumeCurrentVolume.toFixed(2) : '0' }}</strong> bbl.
        </div>
        <div v-else class="text-xs text-neutral-500 dark:text-neutral-400 p-2">Updates vessel volume only (no ledger change).</div>
        <div class="text-xs space-y-1 p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60">
          <div v-if="setVolumeDelta !== null" :class="setVolumeDelta >= 0 ? 'text-neutral-700 dark:text-stone-200' : 'text-danger-600 dark:text-danger-400'">
            Resulting delta vs current: {{ setVolumeDelta >= 0 ? '+' : '' }}{{ setVolumeDelta }} {{ batch.planned_volume_unit || '' }}
          </div>
          <div v-if="!setVolumeIsTank && isBackdatedSetVolume" class="text-warning-600 dark:text-warning-400">
            This timestamp is older than the last set point. Backdated snapshots will rebuild deltas chronologically.
          </div>
          <div v-else-if="!setVolumeIsTank && setVolumeLastSnapshot" class="text-neutral-600 dark:text-neutral-400">
            Last set point: {{ setVolumeLastSnapshot.measured_volume }} {{ batch.planned_volume_unit || '' }} at {{ formatDateTime(setVolumeLastSnapshot.measured_at) }}
          </div>
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.transfer" title="Record Transfer / Pull" confirmText="Save" type="confirm" @confirm="saveTransfer" @cancel="modals.transfer = false">
      <div class="space-y-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destination location (cold storage)</label>
            <select v-model="forms.transfer.destination_location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">— None —</option>
              <option v-for="loc in transferDestinationLocations" :key="loc.id" :value="loc.id">{{ loc.name }}</option>
            </select>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Serving tanks are not listed; use Mark Production Complete to send beer to a tank.</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destination vessel (optional)</label>
            <select v-model="forms.transfer.destination_vessel_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">— None —</option>
              <option v-for="v in transferDestinationVessels" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Serving tanks (linked to a location) are excluded. Use Mark Production Complete to send beer to a serving tank.</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Volume to move</label>
            <input v-model.number="forms.transfer.volume" type="number" step="any" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. 1.5">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Transfer type</label>
            <input v-model="forms.transfer.transfer_type" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="serving_to_kegs, serving_to_distribution">
          </div>
        </div>
        <div class="bg-neutral-50 dark:bg-stone-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg p-3 space-y-2">
          <label class="flex items-center gap-2 text-sm text-neutral-800 dark:text-stone-100">
            <input type="checkbox" v-model="forms.transfer.log_to_ledger">
            <span>Log packaged pull to ledger (Finished Beer) — required when sending to storage</span>
          </label>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label class="block text-xs font-medium mb-1 text-neutral-600 dark:text-stone-300">Beer item</label>
              <select v-model="forms.transfer.ledger_item_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm">
                <option :value="null">— Select beer item —</option>
                <option v-for="i in items.filter(it => it.category === 'Finished Beer')" :key="i.id" :value="i.id">{{ i.name }}</option>
              </select>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-5">Creates a RECEIVE entry at the destination location using this item.</p>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Note</label>
          <input v-model="forms.transfer.note" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="Optional note">
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.addition" title="Log Addition" confirmText="Log" type="confirm" @confirm="saveAddition" @cancel="modals.addition = false">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Category</label>
          <select v-model="forms.addition.event_type" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option value="Any">Any</option>
            <option v-for="cat in categories" :key="cat.id" :value="cat.name">{{ cat.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Item</label>
          <select v-model="forms.addition.item_id" @change="updateLocationAvailability" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option disabled value="">Select Item</option>
            <option v-for="i in filteredItems" :key="i.id" :value="i.id">{{ i.name }}</option>
          </select>
          <div v-if="forms.addition.event_type && filteredItems.length === 0" class="text-xs text-danger-500 mt-1">No items found in this category.</div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">From Location</label>
          <select v-model="forms.addition.location_id" @change="updateAdditionAvailability" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option disabled value="">Select Location</option>
            <option v-for="l in selectableLocationsForAddIngredientAndSupply" :key="l.id" :value="l.id">{{ getLocationLabel(l) }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Add To</label>
          <select v-model="forms.addition.batch_location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option :value="null">All vessels</option>
            <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">{{ getVesselName(bl.vessel_id) }} ({{ bl.current_volume }} {{ batch?.planned_volume_unit || 'L' }})</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Quantity Consumed</label>
          <input v-model.number="forms.addition.quantity" type="number" step="0.01" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
          <div v-if="forms.addition.item_id && forms.addition.location_id" class="text-xs mt-1" :class="isAdditionValid ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'">Available: {{ additionAvailableQty }}</div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Unit Cost</label>
          <input v-model.number="forms.addition.unit_cost" type="number" step="0.01" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="Defaults to last receive or item cost">
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.reading" title="Log Reading" confirmText="Save" type="confirm" @confirm="saveReading" @cancel="modals.reading = false">
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Tank / Vessel <span class="text-danger-500">*</span></label>
          <select v-model="forms.reading.batch_location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" required>
            <option disabled :value="null">Select vessel</option>
            <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
              {{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch?.planned_volume_unit || '' }}
            </option>
          </select>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Attach this reading to a specific vessel.</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Type</label>
          <select v-model="forms.reading.reading_type" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option value="GRAVITY">Gravity (SG/Plato)</option>
            <option value="TEMP">Temperature</option>
            <option value="PH">pH</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Value</label>
          <input v-model="forms.reading.value" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. 1.050 or 68">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Time</label>
          <input v-model="forms.reading.measured_at" type="datetime-local" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
        </div>
      </div>
    </ModalDialog>

    <ModalDialog :isOpen="modals.productionComplete" title="Mark Production Complete" confirmText="Mark Complete" type="confirm" maxWidth="max-w-4xl" @confirm="onProductionCompleteConfirm" @cancel="modals.productionComplete = false">
      <div class="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-2">
          This records production for TTB. Choose <strong>Serving</strong> (on tap) or <strong>Packaged</strong> (keg/case).
        </p>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destination <span class="text-danger-500">*</span></label>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="serving" class="rounded border-neutral-300 dark:border-stone-600">
              <span>Serving</span>
            </label>
            <!-- Storage option commented out - code retained for future use; see changes/storage-option-commented-out.md -->
            <!-- <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="storage" class="rounded border-neutral-300 dark:border-stone-600">
              <span>Storage</span>
            </label> -->
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="packaged_keg" class="rounded border-neutral-300 dark:border-stone-600">
              <span>Packaged (keg)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="forms.productionComplete.destChoice" value="packaged_case" class="rounded border-neutral-300 dark:border-stone-600">
              <span>Packaged (case)</span>
            </label>
          </div>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Serving = on tap. Packaged = keg or case with materials.</p>
        </div>
        <div v-if="forms.productionComplete.destChoice && !isPackagingChoice(forms.productionComplete.destChoice)">
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Location <span class="text-danger-500">*</span></label>
          <select v-model="forms.productionComplete.location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option :value="null">Select location...</option>
            <optgroup v-if="forms.productionComplete.destChoice === 'serving'" label="Serving (on tap)">
              <option v-for="loc in productionCompleteServingLocations" :key="loc.id" :value="loc.id" :disabled="loc.conflict">
                {{ loc.name }}{{ loc.vesselName ? ` (${loc.vesselName})` : '' }} — {{ loc.currentBeerItemName }}{{ loc.onHand != null && loc.onHand > 0 ? `, ${loc.onHand} bbl` : '' }}
              </option>
            </optgroup>
            <!-- Storage optgroup commented out - code retained for future use -->
            <!-- <optgroup v-if="forms.productionComplete.destChoice === 'storage'" label="Storage (cellar/keg/case)">
              <option v-for="loc in productionCompleteStorageLocations" :key="loc.id" :value="loc.id">
                {{ loc.name }} ({{ getLocationStageLabel(loc) }})
              </option>
            </optgroup> -->
          </select>
          <p v-if="!forms.productionComplete.destChoice" class="text-xs text-amber-600 dark:text-amber-400 mt-1">Please choose Serving or Packaged and select a location.</p>
          <p v-else-if="forms.productionComplete.destChoice === 'serving' && productionCompleteServingLocations.length === 0" class="text-xs text-amber-600 dark:text-amber-400 mt-1">No serving locations or tanks available. Add a serving tank on <router-link to="/vessels" class="underline">Vessels</router-link> (Serving Tank type + link a location) or add a location with stage Serving.</p>
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)" class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Destination location <span class="text-danger-500">*</span></label>
            <select v-model="forms.productionComplete.location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">Select keg/case storage...</option>
              <option v-for="loc in productionCompleteStorageLocations" :key="loc.id" :value="loc.id">
                {{ loc.name }} ({{ getLocationStageLabel(loc) }})
              </option>
            </select>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Where packaged beer will be stored.</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Format</label>
            <select v-model="forms.productionComplete.formatKey" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option v-for="preset in (forms.productionComplete.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS)" :key="preset.key" :value="preset.key">
                {{ preset.label }} ({{ preset.volumePerUnit }} bbl/ea)
              </option>
            </select>
          </div>
          <div v-if="forms.productionComplete.destChoice === 'packaged_keg'">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Number of kegs <span class="text-danger-500">*</span></label>
            <input v-model.number="forms.productionComplete.numKegs" type="number" min="1" step="1" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Volume = kegs × format size</p>
          </div>
          <div v-else-if="forms.productionComplete.destChoice === 'packaged_case'">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Number of cases <span class="text-danger-500">*</span></label>
            <input v-model.number="forms.productionComplete.numCases" type="number" min="1" step="1" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="0">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Volume = cases × format size</p>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Vessel (in this batch) <span class="text-danger-500">*</span></label>
            <select v-model="forms.productionComplete.batch_location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
              <option :value="null">Select vessel...</option>
              <option v-for="bl in productionCompleteBatchLocations" :key="bl.id" :value="bl.id">
                {{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}{{ getVesselLocationHint(bl) }}
              </option>
            </select>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{{ isPackagingChoice(forms.productionComplete.destChoice) ? 'Packaging requires a vessel with a bound location (fermenter/brite).' : 'Which vessel\'s volume you\'re recording.' }}</p>
          </div>
          <div v-if="!isPackagingChoice(forms.productionComplete.destChoice)">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Volume Produced (Barrels) <span class="text-danger-500">*</span></label>
            <input v-model.number="forms.productionComplete.volume_produced" type="number" step="0.01" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="0.00">
            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Volume of beer produced (for TTB Line 2)</p>
          </div>
          <div v-else-if="isPackagingChoice(forms.productionComplete.destChoice)">
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Volume</label>
            <p class="text-sm text-neutral-600 dark:text-neutral-400 pt-7"><strong>{{ computedPackagingVolumeBarrels ?? '—' }}</strong> bbl (auto-calculated)</p>
          </div>
        </div>
        <div v-if="isPackagingChoice(forms.productionComplete.destChoice)" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="lg:col-span-2 border border-neutral-200 dark:border-stone-600 rounded-lg p-4 space-y-3">
            <div class="flex items-center justify-between">
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300">Packaging materials <span class="text-danger-500">*</span></label>
              <button type="button" class="text-xs btn btn-secondary py-1 px-2" @click="addSupplyLine">Add material</button>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">Record empty kegs, cans, caps, carriers, etc. consumed.</p>
            <div v-for="(line, idx) in forms.productionComplete.supplies" :key="idx" class="flex gap-2 items-end">
              <select v-model="line.item_id" class="flex-1 border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm">
                <option :value="null">Select item...</option>
                <option v-for="item in packagingItems" :key="item.id" :value="item.id">{{ item.name }}</option>
              </select>
              <input v-model.number="line.quantity" type="number" min="1" step="1" class="w-20 border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm" placeholder="Qty">
              <select v-model="line.location_id" class="flex-1 border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm">
                <option :value="null">Location...</option>
                <option v-for="loc in selectableLocationsForAddIngredientAndSupply" :key="loc.id" :value="loc.id">
                  {{ loc.name }}{{ line.item_id ? ` (${getSupplyLineAvailability(line.item_id, loc.id) ?? '?'} avail)` : '' }}
                </option>
              </select>
              <button type="button" class="text-danger-500 hover:text-danger-600 p-1" @click="removeSupplyLine(idx)" title="Remove">×</button>
            </div>
            <p v-if="supplyLineValidationError" class="text-xs text-amber-600 dark:text-amber-400">{{ supplyLineValidationError }}</p>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Completion Date</label>
            <input v-model="forms.productionComplete.completion_date" type="datetime-local" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
          </div>
        </div>
        <div v-else>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Completion Date</label>
          <input v-model="forms.productionComplete.completion_date" type="datetime-local" class="w-full max-w-xs border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
        </div>
      </div>
    </ModalDialog>

    <!-- Production complete: confirm when serving location already has beer -->
    <div v-if="productionCompleteConfirmOpen" class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-stone-100 mb-2">This location already has beer</h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          This serving location already contains <strong>{{ productionCompleteOccupiedItem?.name }}</strong>. Is this the same beer and you want to add volume on top? Or was this a mistake?
        </p>
        <div class="flex flex-wrap gap-2 justify-end">
          <button type="button" class="btn btn-primary" @click="productionCompleteConfirmSameBeer">Same beer – add on top</button>
          <button type="button" class="btn btn-secondary" @click="productionCompleteConfirmRemoveFirst">Remove first</button>
          <button type="button" class="btn btn-secondary" @click="productionCompleteConfirmCancel">Cancel</button>
        </div>
      </div>
    </div>

    <!-- Production complete: confirm when packaging volume exceeds vessel volume -->
    <div v-if="productionCompleteVolumeOverrideConfirmOpen" class="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-neutral-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <h3 class="text-lg font-semibold text-neutral-900 dark:text-stone-100 mb-2">Packaging volume exceeds vessel</h3>
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Packaging volume ({{ productionCompleteVolumeExceedData?.volumeBarrels?.toFixed(2) }} bbl) exceeds vessel volume ({{ productionCompleteVolumeExceedData?.vesselVolumeBarrels?.toFixed(2) }} bbl). Continue anyway?
        </p>
        <div class="flex flex-wrap gap-2 justify-end">
          <button type="button" class="btn btn-primary" @click="productionCompleteVolumeOverrideConfirm">Override – continue</button>
          <button type="button" class="btn btn-secondary" @click="productionCompleteVolumeOverrideCancel">Cancel</button>
        </div>
      </div>
    </div>

    <ModalDialog :isOpen="modals.waterAddition" title="Add Water or Other Liquids" confirmText="Add" type="confirm" @confirm="saveWaterAddition" @cancel="modals.waterAddition = false">
      <div class="space-y-3">
        <p class="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
          Record post-fermentation water or liquid additions. This is tracked separately for TTB Line 3.
        </p>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Addition Type</label>
          <select v-model="forms.waterAddition.addition_type" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option value="WATER">Water</option>
            <option value="LIQUID">Other Liquid</option>
          </select>
        </div>
        <div v-if="forms.waterAddition.addition_type === 'LIQUID'">
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Liquid Type</label>
          <input v-model="forms.waterAddition.liquid_type" type="text" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="e.g. Fruit juice, flavoring">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Vessel</label>
          <select v-model="forms.waterAddition.batch_location_id" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
            <option :value="null">Select vessel...</option>
            <option v-for="bl in batchLocations" :key="bl.id" :value="bl.id">
              {{ getVesselName(bl.vessel_id) }} — {{ bl.current_volume }} {{ batch.planned_volume_unit }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Quantity (Gallons)</label>
          <input v-model.number="forms.waterAddition.quantity" type="number" step="0.01" min="0" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="0.00">
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Will be converted to barrels for TTB reporting</p>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Date Added</label>
          <input v-model="forms.waterAddition.added_at" type="datetime-local" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100">
        </div>
        <div>
          <label class="block text-sm font-medium mb-1 text-neutral-700 dark:text-stone-300">Notes</label>
          <textarea v-model="forms.waterAddition.note" rows="2" class="w-full border border-neutral-300 dark:border-stone-600 p-2 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" placeholder="Optional notes..."></textarea>
        </div>
      </div>
    </ModalDialog>

  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, reactive, watch, inject, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BatchRepository } from '../repositories/BatchRepository'
import { BatchLocationRepository } from '../repositories/BatchLocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { BatchAdditionRepository } from '../repositories/BatchAdditionRepository'
import { BatchReadingRepository } from '../repositories/BatchReadingRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository, LOCATION_STAGE_LABELS } from '../repositories/LocationRepository'
import { CategoryRepository } from '../repositories/CategoryRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { SyncService } from '../services/SyncService'
import { useModal } from '../composables/useModal'
import { useSync, incrementSyncTrigger } from '../composables/useSync'
import { BatchMilestoneRepository } from '../repositories/BatchMilestoneRepository'
import { MilestoneTemplateRepository, PRODUCTION_COMPLETE_LABEL } from '../repositories/MilestoneTemplateRepository'
import { BatchVolumeAdjustmentRepository } from '../repositories/BatchVolumeAdjustmentRepository'
import { BatchVolumeSnapshotRepository } from '../repositories/BatchVolumeSnapshotRepository'
import { BatchLocationTransferRepository } from '../repositories/BatchLocationTransferRepository'
import { migrateBatchIfNeeded } from '../utils/migrateMilestoneTemplates'
import { BatchCostService } from '../services/BatchCostService'
import { getCurrentBeerAtLocation, getBeerItemForServingLocation } from '../services/ServingOccupancyService'
import { RecipeRepository } from '../repositories/RecipeRepository'
import ModalDialog from '../components/ModalDialog.vue'
import dayjs from 'dayjs'

const KEG_FORMAT_PRESETS = [
  { key: '1/6 bbl', label: '1/6 bbl', volumePerUnit: 0.1667, packagingItemName: 'Empty 1/6th bbl keg' },
  { key: '1/2 bbl', label: '1/2 bbl', volumePerUnit: 0.5, packagingItemName: 'Empty 1/2 bbl keg' }
]
const CASE_FORMAT_PRESETS = [
  { key: '12pk', label: '12pk', volumePerUnit: 0.09, packagingItemName: null },
  { key: '6pk', label: '6pk', volumePerUnit: 0.045, packagingItemName: null }
]

const providedModal = inject('modal', null)
const showAlert = providedModal ? providedModal.alert : (title, message) => window.alert(`${title}: ${message}`)
const showConfirm = providedModal ? providedModal.confirm : (title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm() }
const { syncTrigger } = useSync()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const activeTab = ref('Timeline')
const vesselActionsOpenId = ref(null)

function toggleVesselActions(splitId) {
  if (vesselActionsOpenId.value === splitId) {
    vesselActionsOpenId.value = null
    return
  }
  vesselActionsOpenId.value = splitId
  nextTick(() => {
    const close = () => {
      vesselActionsOpenId.value = null
      document.removeEventListener('click', close)
    }
    setTimeout(() => document.addEventListener('click', close), 0)
  })
}

const batch = ref(null)
const batchLocations = ref([])
const volumeSnapshots = ref(new Map())
const transfers = ref([])
const batchNotFound = ref(false)
const vessels = ref([])
const additions = ref([])
const readings = ref([])
const items = ref([])
const locations = ref([])
const categories = ref([])
const milestones = ref([])
const costSummary = ref(null)
const batchLedgerEntries = ref([])

// Recipe consumption tracking
const recipeConsumption = ref({
  hasRecipe: false,
  totalItems: 0,
  completedItems: 0,
  partialItems: 0,
  itemStatus: [],
  loading: false,
  error: null
})

const milestoneDefinitions = computed(() => {
  const defs = BatchMilestoneRepository.getDefinitionsForBatch(batch.value)
  if (defs && defs.length > 0) return defs
  return MilestoneTemplateRepository.DEFAULT_MILESTONES.map((m, i) => ({ ...m, id: m.id || `def-${i}`, sort_order: i }))
})

const modals = reactive({
  splitTransfer: false,
  adjustVolume: false,
  setVolume: false,
  transfer: false,
  addition: false,
  reading: false,
  productionComplete: false,
  waterAddition: false
})
const productionCompleteConfirmOpen = ref(false)
const productionCompleteExistingItem = ref(null)

const forms = reactive({
  splitTransfer: { mode: 'split', sourceBatchLocationId: null, sourceBatchLocationIds: [], destinationVesselId: null, combineDestinationVolume: null, destinations: [{ vessel_id: null, volume: null }] },
  adjustVolume: { batch_location_id: null, volume_change: null, reason: '' },
  setVolume: { batch_location_id: null, measured_volume: null, measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), method: '', note: '' },
  transfer: { source_batch_location_id: null, destination_location_id: null, destination_vessel_id: null, volume: null, transfer_type: 'transfer', note: '' },
  addition: { item_id: '', event_type: 'HOP_KETTLE', quantity: 0, location_id: '', unit_cost: null },
  reading: { reading_type: 'GRAVITY', value: '', measured_at: '', batch_location_id: null },
  productionComplete: { destChoice: null, batch_location_id: null, volume_produced: null, completion_date: new Date().toISOString().slice(0, 16), location_id: null, formatKey: null, numKegs: null, numCases: null, supplies: [] },
  waterAddition: { batch_location_id: null, addition_type: 'WATER', liquid_type: '', quantity: null, added_at: new Date().toISOString().slice(0, 16), note: '' }
})

const additionAvailableQty = ref(0)
const locationAvailability = ref(new Map())

watch(() => forms.transfer.destination_location_id, (val) => {
  if (val) {
    forms.transfer.log_to_ledger = true
    if (!forms.transfer.ledger_item_id) {
      forms.transfer.ledger_item_id = getDefaultFinishedBeerItem()?.id || null
    }
  }
})

watch(() => forms.productionComplete.destChoice, (newVal, oldVal) => {
  if (oldVal != null && newVal !== oldVal) {
    forms.productionComplete.location_id = null
    forms.productionComplete.formatKey = newVal === 'packaged_keg' ? (KEG_FORMAT_PRESETS[0]?.key || '1/6 bbl') : (CASE_FORMAT_PRESETS[0]?.key || '12pk')
    forms.productionComplete.supplies = []
    if (isPackagingChoice(newVal) && forms.productionComplete.batch_location_id) {
      const bl = batchLocations.value.find((b) => b.id === forms.productionComplete.batch_location_id)
      const v = bl ? vessels.value.find((x) => x.id === bl.vessel_id) : null
      if (!v?.location_id) forms.productionComplete.batch_location_id = null
    }
  }
  if (newVal === 'packaged_keg' && (!forms.productionComplete.supplies || forms.productionComplete.supplies.length === 0)) {
    const formatKey = forms.productionComplete.formatKey || '1/6 bbl'
    const pkgItem = items.value.find((i) => i.category === 'Packaging' && i.name.toLowerCase().includes('keg') && i.name.includes(formatKey.split(' ')[0]))
    const fallback = items.value.find((i) => i.category === 'Packaging' && /keg/i.test(i.name))
    forms.productionComplete.supplies = [{ item_id: (pkgItem || fallback)?.id || null, quantity: forms.productionComplete.numKegs || 1, location_id: null }]
  }
  if (newVal === 'packaged_case' && (!forms.productionComplete.supplies || forms.productionComplete.supplies.length === 0)) {
    forms.productionComplete.supplies = []
  }
})

watch(() => [forms.productionComplete.numKegs, forms.productionComplete.destChoice], ([numKegs, destChoice]) => {
  if (destChoice === 'packaged_keg' && numKegs != null && numKegs > 0 && forms.productionComplete.supplies?.length === 1) {
    const line = forms.productionComplete.supplies[0]
    if (line?.item_id && items.value.some((i) => i.id === line.item_id && i.category === 'Packaging' && /keg/i.test(i.name || ''))) {
      line.quantity = numKegs
    }
  }
})

watch([() => modals.productionComplete, () => forms.productionComplete.supplies], async ([isOpen, supplies]) => {
  if (!isOpen || !supplies?.length) { supplyLineAvailability.value = new Map(); return }
  const map = new Map()
  const itemIds = [...new Set((supplies || []).map((s) => s.item_id).filter(Boolean))]
  const locs = selectableLocationsForAddIngredientAndSupply.value || []
  for (const itemId of itemIds) {
    for (const loc of locs) {
      const qty = await LedgerRepository.getOnhand(itemId, loc.id)
      map.set(`${itemId}:${loc.id}`, qty)
    }
  }
  supplyLineAvailability.value = map
}, { deep: true })


const displayTotalVolume = computed(() => {
  if (batch.value.total_theoretical_volume != null) return batch.value.total_theoretical_volume
  const sum = batchLocations.value.reduce((s, bl) => s + (Number(bl.current_volume) || 0), 0)
  return sum > 0 ? sum : null
})

const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '—'
  const currencyCode = costSummary.value?.currency || 'USD'
  return `${currencyCode} ${Number(value).toFixed(2)}`
}

function getVesselName(vesselId) {
  if (!vesselId) return null
  return vessels.value.find(v => v.id === vesselId)?.name
}
const servingLocations = computed(() => locations.value.map(l => ({
  ...l,
  label: l.stage ? `${l.name} (${l.stage === 'serving' ? 'serving' : l.stage})` : l.name
})))

const tankLocationIds = computed(() => new Set((vessels.value || []).filter(v => v.location_id).map(v => v.location_id)))

const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
)

const selectableLocationsForAddIngredientAndSupply = computed(() =>
  (locations.value || []).filter((l) => !l.deleted_at && !nonServingTankLocationIds.value.has(l.id))
)

const packagingItems = computed(() => items.value.filter(i => i.category === 'Packaging'))

const isPackagingChoice = (choice) => choice === 'packaged_keg' || choice === 'packaged_case'

const productionCompleteBatchLocations = computed(() => {
  const choice = forms.productionComplete.destChoice
  if (isPackagingChoice(choice)) {
    return batchLocations.value.filter((bl) => {
      const v = vessels.value.find((x) => x.id === bl.vessel_id)
      return v?.location_id
    })
  }
  return batchLocations.value
})

const getVesselLocationHint = (bl) => {
  const v = vessels.value.find((x) => x.id === bl.vessel_id)
  return v?.location_id ? ' ✓' : ' (needs location)'
}

const computedPackagingVolumeBarrels = computed(() => {
  const f = forms.productionComplete
  if (!isPackagingChoice(f.destChoice)) return null
  const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS
  const preset = presets.find((p) => p.key === f.formatKey)
  if (!preset) return null
  const qty = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0)
  return (qty * preset.volumePerUnit).toFixed(4)
})

const supplyLineAvailability = ref(new Map())
const supplyLineValidationError = computed(() => {
  const supplies = forms.productionComplete.supplies || []
  for (const line of supplies) {
    if (!line.item_id || !line.location_id || !line.quantity || line.quantity <= 0) continue
    const onhand = supplyLineAvailability.value.get(`${line.item_id}:${line.location_id}`)
    if (onhand != null && onhand < line.quantity) {
      const itemName = items.value.find((i) => i.id === line.item_id)?.name || 'Item'
      return `Insufficient ${itemName} at selected location. Available: ${onhand}, needed: ${line.quantity}`
    }
  }
  return null
})

const addSupplyLine = () => {
  if (!forms.productionComplete.supplies) forms.productionComplete.supplies = []
  forms.productionComplete.supplies.push({ item_id: null, quantity: 1, location_id: null })
}

const removeSupplyLine = (idx) => {
  forms.productionComplete.supplies.splice(idx, 1)
}

const getSupplyLineAvailability = (itemId, locId) => {
  if (!itemId || !locId) return null
  return supplyLineAvailability.value.get(`${itemId}:${locId}`)
}

const transferDestinationLocations = computed(() =>
  (locations.value || []).filter(l => !l.deleted_at && !tankLocationIds.value.has(l.id))
)

// Exclude serving tanks; fermenters/brites (with or without location_id) can receive batch transfers
const transferDestinationVessels = computed(() =>
  (vessels.value || []).filter(v => !v.deleted_at && (v.type || '').toUpperCase() !== 'SERVING')
)

function getVesselType(vesselId) {
  if (!vesselId) return null
  return vessels.value.find(v => v.id === vesselId)?.type || null
}
function getVesselNameForReading(reading) {
  if (!reading.batch_location_id) return null
  const bl = batchLocations.value.find(b => b.id === reading.batch_location_id)
  return bl ? getVesselName(bl.vessel_id) : null
}
function getVesselNameForBatchLocation(batchLocationId) {
  if (!batchLocationId) return null
  const bl = batchLocations.value.find(b => b.id === batchLocationId)
  return bl ? getVesselName(bl.vessel_id) : null
}
function getVesselLocationLabel(batchLocationId) {
  const bl = batchLocations.value.find(b => b.id === batchLocationId)
  const vessel = bl ? vessels.value.find(v => v.id === bl.vessel_id) : null
  const locName = vessel?.location_name || (vessel?.location_id ? getLocationName(vessel.location_id) : null)
  return locName || vessel?.type || null
}
function getVesselForBatchLocation(batchLocationId) {
  const bl = batchLocations.value.find(b => b.id === batchLocationId)
  return bl ? vessels.value.find(v => v.id === bl.vessel_id) : null
}
function getDefaultFinishedBeerItem() {
  return items.value.find(i => i.category === 'Finished Beer')
}

const loadRecipeConsumptionStatus = async () => {
  if (!batch.value?.recipe_id) {
    recipeConsumption.value = { hasRecipe: false, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: null }
    return
  }

  recipeConsumption.value.loading = true
  recipeConsumption.value.error = null

  try {
    const recipeItems = await RecipeRepository.getItems(batch.value.recipe_id)
    
    if (!recipeItems || recipeItems.length === 0) {
      recipeConsumption.value = { hasRecipe: true, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: null }
      return
    }

    const consumes = await LedgerRepository.getEntries({
      batch_id: batch.value.id,
      type: 'CONSUME'
    })

    const consumedByItem = {}
    consumes.forEach(entry => {
      if (!consumedByItem[entry.item_id]) consumedByItem[entry.item_id] = 0
      consumedByItem[entry.item_id] += Math.abs(entry.quantity)
    })

    const itemStatus = recipeItems.map(item => {
      const required = Number(item.quantity) || 0
      const consumed = consumedByItem[item.item_id] || 0
      return {
        itemId: item.item_id,
        required,
        consumed,
        isComplete: consumed >= required,
        isPartial: consumed > 0 && consumed < required,
        isOverConsumed: consumed > required
      }
    })

    const totalItems = itemStatus.length
    const completedItems = itemStatus.filter(s => s.isComplete).length
    const partialItems = itemStatus.filter(s => s.isPartial).length

    recipeConsumption.value = {
      hasRecipe: true,
      totalItems,
      completedItems,
      partialItems,
      itemStatus,
      loading: false,
      error: null
    }
  } catch (e) {
    console.error('Error loading recipe consumption status:', e)
    recipeConsumption.value = { hasRecipe: true, totalItems: 0, completedItems: 0, partialItems: 0, itemStatus: [], loading: false, error: e.message }
  }
}

const filteredItems = computed(() => {
  if (!forms.addition.event_type) return []
  if (forms.addition.event_type === 'Any') return items.value
  const selectedCat = forms.addition.event_type.toLowerCase()
  return items.value.filter(i => i.category && i.category.toLowerCase() === selectedCat)
})

const isAdditionValid = computed(() => {
  return forms.addition.quantity > 0 && forms.addition.quantity <= additionAvailableQty.value
})

// Recipe consumption computed properties
const hasRecipe = computed(() => recipeConsumption.value.hasRecipe && !recipeConsumption.value.loading)

const allIngredientsConsumed = computed(() => {
  if (!recipeConsumption.value.hasRecipe || recipeConsumption.value.totalItems === 0) return false
  return recipeConsumption.value.completedItems === recipeConsumption.value.totalItems
})

const someIngredientsConsumed = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return false
  return recipeConsumption.value.completedItems > 0 || recipeConsumption.value.partialItems > 0
})

const consumptionButtonText = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return ''
  if (recipeConsumption.value.totalItems === 0) return 'No Ingredients'
  if (allIngredientsConsumed.value) return 'All Ingredients Consumed'
  if (someIngredientsConsumed.value) {
    return `Continue Consumption - ${recipeConsumption.value.completedItems} of ${recipeConsumption.value.totalItems} done`
  }
  return 'Consume Recipe Ingredients'
})

const consumptionBadgeClass = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return ''
  if (allIngredientsConsumed.value) return 'bg-success-100 text-success-700 border-success-200'
  if (someIngredientsConsumed.value) return 'bg-warning-100 text-warning-700 border-warning-200'
  return 'bg-neutral-100 text-neutral-600 border-neutral-200'
})

const consumptionTooltip = computed(() => {
  if (!recipeConsumption.value.hasRecipe) return ''
  if (allIngredientsConsumed.value) return 'All recipe ingredients have been consumed'
  if (recipeConsumption.value.totalItems === 0) return 'Recipe has no ingredients defined'
  
  const remaining = recipeConsumption.value.itemStatus.filter(s => !s.isComplete)
  if (remaining.length === 0) return ''
  
  const remainingText = remaining.map(r => {
    const itemName = getItemName(r.itemId)
    return `${itemName} (${r.consumed}/${r.required})`
  }).join(', ')
  
  return `Remaining: ${remainingText}`
})

const goToConsumeRecipe = () => {
  if (!batch.value?.id || !batch.value?.recipe_id) return
  router.push(`/batches/${batch.value.id}/consume-recipe/${batch.value.recipe_id}`)
}

const refreshVolumeSnapshots = async () => {
  const map = new Map()
  for (const bl of batchLocations.value) {
    const snaps = await BatchVolumeSnapshotRepository.getByBatchLocationId(bl.id)
    if (snaps?.length) map.set(bl.id, snaps)
  }
  volumeSnapshots.value = map
}

const refreshTransfers = async () => {
  if (!batch.value?.id) return
  transfers.value = await BatchLocationTransferRepository.getByBatchId(batch.value.id)
}

const loadData = async () => {
  try {
    const id = route.params.id
    if (!id || id === 'add') return

    batchNotFound.value = false
    let b = await BatchRepository.getById(id)
    if (!b) {
      console.warn(`Batch ${id} not found locally.`)
      batchNotFound.value = true
      return
    }
    batch.value = await migrateBatchIfNeeded(b)

    const [vesselsList, locationsList, additionsList, readingsList, itemsList, locsList, catsList, milestonesList] = await Promise.all([
      VesselRepository.getAll(),
      BatchLocationRepository.getByBatchId(id),
      BatchAdditionRepository.getByBatchId(id),
      BatchReadingRepository.getByBatchId(id),
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      CategoryRepository.getAll(),
      BatchMilestoneRepository.getByBatchId(id)
    ])

    vessels.value = vesselsList
    batchLocations.value = locationsList
    additions.value = additionsList
    readings.value = readingsList
    items.value = itemsList
    locations.value = locsList
    categories.value = catsList
    milestones.value = milestonesList
    batchLedgerEntries.value = await LedgerRepository.getEntries({ batch_id: id })
    await refreshVolumeSnapshots()
    await refreshTransfers()
    await loadRecipeConsumptionStatus()
    // Always recalculate batch cost to ensure it's current (fixes stale costs from previous manual ingredient additions)
    try {
      costSummary.value = await BatchCostService.computeAndStore(batch.value.id)
      batch.value = await BatchRepository.getById(batch.value.id)
    } catch (err) {
      console.warn('Failed to recalculate batch cost:', err)
      // Fall back to existing cost summary if available
      costSummary.value = batch.value.cost_summary || null
    }

    if (batch.value.vessel_id && batchLocations.value.length === 0) {
      const vol = batch.value.planned_volume ?? batch.value.current_volume ?? 0
      await BatchLocationRepository.create({
        parent_batch_id: id,
        vessel_id: batch.value.vessel_id,
        current_volume: Number(vol) || 0
      })
      await BatchRepository.update(id, { total_theoretical_volume: Number(vol) || 0 })
      batch.value = await BatchRepository.getById(id)
      batchLocations.value = await BatchLocationRepository.getByBatchId(id)
      await refreshVolumeSnapshots()
    }

    const defs = BatchMilestoneRepository.getDefinitionsForBatch(batch.value)
    if (milestones.value.length === 0 && batch.value.status && batch.value.status !== 'PLANNED' && defs?.length > 0) {
      const now = new Date().toISOString()
      const s = batch.value.status
      const promises = []
      if (['BREWED', 'FERMENTING', 'CONDITIONING', 'PACKAGING', 'PACKAGED', 'CLOSED'].includes(s) && defs[0]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[0].id, batch.value.brewed_at || now))
      }
      if (['FERMENTING', 'CONDITIONING', 'PACKAGING', 'PACKAGED', 'CLOSED'].includes(s) && defs[2]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[2].id, now))
      }
      if (['PACKAGED', 'CLOSED'].includes(s) && defs[8]) {
        promises.push(BatchMilestoneRepository.ensure(id, defs[8].id, batch.value.packaged_at || now))
      }
      if (promises.length > 0) {
        await Promise.all(promises)
        milestones.value = await BatchMilestoneRepository.getByBatchId(id)
      }
    }
  } catch (e) {
    console.error(e)
    showAlert('Error', 'Failed to load batch data: ' + e.message, 'danger')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
onActivated(loadData)
watch(syncTrigger, loadData)
watch(() => route.params.id, (newId) => {
  if (newId && newId !== 'add') {
    loading.value = true
    batchNotFound.value = false
    batch.value = null
    loadData()
  }
})

const refreshCostSummary = async () => {
  if (!batch.value) return
  // Always recalculate to ensure fresh cost data
  try {
    costSummary.value = await BatchCostService.computeAndStore(batch.value.id)
    batch.value = await BatchRepository.getById(batch.value.id)
  } catch (err) {
    console.warn('Failed to refresh batch cost:', err)
    // Fall back to existing cost summary if available
    const latest = await BatchRepository.getById(batch.value.id)
    if (latest) {
      batch.value = latest
      costSummary.value = latest.cost_summary || null
    }
  }
}

const isMilestoneCompleted = (defId) => {
  const m = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId)
  return m && m.completed
}
const getMilestoneDate = (defId) => {
  const m = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId)
  return m ? m.occurred_at : null
}
const getMilestoneStatusClass = (defId) => {
  if (isMilestoneCompleted(defId)) return 'bg-success-500 border-success-500 text-white'
  if (isNextMilestone(defId)) return 'bg-white dark:bg-neutral-800 border-primary-500 text-primary-500 ring-4 ring-primary-50 dark:ring-primary-900/30'
  return 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-500 text-transparent'
}
const isNextMilestone = (defId) => {
  const defs = milestoneDefinitions.value
  const next = defs.find(d => !isMilestoneCompleted(d.id))
  return next && next.id === defId
}

const isProductionCompleteDef = (def) => def && (def.label === PRODUCTION_COMPLETE_LABEL || def.is_system === true)

const computedStatus = computed(() => {
  const defs = milestoneDefinitions.value
  const completed = milestones.value.filter(m => m.completed)
  if (completed.length === 0) return 'PLANNED'
  let lastByOrder = null
  let maxOrder = -1
  for (const m of completed) {
    const def = defs.find(d => d.id === (m.milestone_definition_id || m.milestone_type))
    if (def && (def.sort_order ?? 0) > maxOrder) {
      maxOrder = def.sort_order ?? 0
      lastByOrder = def.label
    }
  }
  return lastByOrder || batch.value?.status || 'PLANNED'
})

const toggleMilestone = async (defId) => {
  const existing = milestones.value.find(m => (m.milestone_definition_id || m.milestone_type) === defId)
  const originalMilestones = JSON.parse(JSON.stringify(milestones.value))
  try {
    if (existing && existing.completed) {
      await BatchMilestoneRepository.update(existing.id, { completed: false })
    } else {
      await BatchMilestoneRepository.ensure(batch.value.id, defId, new Date().toISOString())
    }
    milestones.value = await BatchMilestoneRepository.getByBatchId(batch.value.id)
    const newStatus = computedStatus.value
    if (newStatus !== batch.value.status) {
      await BatchRepository.update(batch.value.id, { status: newStatus })
      batch.value = await BatchRepository.getById(batch.value.id)
    }
    SyncService.sync()
  } catch (e) {
    console.error('Milestone toggle failed', e)
    milestones.value = originalMilestones
    showAlert('Error', 'Failed to update milestone.', 'danger')
  }
}

const allHistoryEvents = computed(() => {
  const events = []
  readings.value.forEach(r => {
    events.push({ id: `reading-${r.id}`, date: r.measured_at, title: `${r.reading_type} Reading`, subtitle: `${r.value}${getVesselNameForReading(r) ? ' · ' + getVesselNameForReading(r) : ''}`, icon: r.reading_type === 'TEMP' ? '🌡️' : (r.reading_type === 'PH' ? '🧪' : '💧'), type: 'READING' })
  })
  additions.value.forEach(a => {
    const vesselName = a.batch_location_id ? getVesselNameForBatchLocation(a.batch_location_id) : null
    const vesselLabel = vesselName ? ` · ${vesselName}` : ' · All vessels'
    const isWaterOrLiquid = a.event_type === 'WATER_ADDITION' || a.event_type === 'LIQUID_ADDITION'
    const subtitle = isWaterOrLiquid
      ? `${a.quantity} ${batch.value?.planned_volume_unit || 'L'}${vesselLabel}`
      : `${a.quantity} · ${a.event_type}${vesselLabel}`
    events.push({ id: `add-${a.id}`, date: a.added_at, title: `Added ${getAdditionDisplayName(a)}`, subtitle, icon: isWaterOrLiquid ? '💧' : '🌾', type: 'ADDITION' })
  })
  volumeSnapshots.value.forEach((snaps, blId) => {
    snaps.forEach((s) => {
      const locLabel = getVesselLocationLabel(blId)
      events.push({
        id: `snap-${s.id}`,
        date: s.measured_at,
        title: 'Set Volume',
        subtitle: `${s.measured_volume} ${batch.value?.planned_volume_unit || ''} · ${getVesselNameForBatchLocation(blId)}${locLabel ? ` · ${locLabel}` : ''}${s.method ? ` · ${s.method}` : ''}`,
        icon: '🎯',
        type: 'SNAPSHOT'
      })
    })
  })
  transfers.value.forEach((t) => {
    const destParts = []
    if (t.destination_vessel_id) destParts.push(getVesselName(t.destination_vessel_id))
    if (t.destination_location_id) destParts.push(getLocationName(t.destination_location_id))
    const sourceLoc = getVesselLocationLabel(t.source_batch_location_id)
    events.push({
      id: `xfer-${t.id}`,
      date: t.created_at,
      title: `Transfer ${t.volume} ${batch.value?.planned_volume_unit || ''}`,
      subtitle: `${getVesselNameForBatchLocation(t.source_batch_location_id)}${sourceLoc ? ` (${sourceLoc})` : ''} → ${destParts.join(' / ') || 'Destination'}`,
      icon: '🔀',
      type: 'TRANSFER'
    })
  })
  batchLedgerEntries.value.filter(e => e.type === 'CONSUME').forEach((entry) => {
    const itemName = entry.item_name || getItemName(entry.item_id)
    const qty = Math.abs(entry.quantity)
    const subtitle = [itemName, qty].filter(Boolean).join(' · ') + (entry.note ? ` · ${entry.note}` : '')
    events.push({
      id: `ledger-${entry.id}`,
      date: entry.created_at,
      title: 'Ingredient consumed',
      subtitle,
      icon: '🌾',
      type: 'CONSUME'
    })
  })
  return events.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const splitTransferSourceVolume = computed(() => {
  if (!forms.splitTransfer.sourceBatchLocationId) return null
  const bl = batchLocations.value.find(b => b.id === forms.splitTransfer.sourceBatchLocationId)
  return bl ? (Number(bl.current_volume) || 0) : null
})
const splitTransferDestSum = computed(() => {
  return forms.splitTransfer.destinations.reduce((s, d) => s + (Number(d.volume) || 0), 0)
})
const combineSourcesSum = computed(() => {
  return forms.splitTransfer.sourceBatchLocationIds.reduce((s, id) => {
    const bl = batchLocations.value.find(b => b.id === id)
    return s + (bl ? (Number(bl.current_volume) || 0) : 0)
  }, 0)
})
function addSplitDest() { forms.splitTransfer.destinations.push({ vessel_id: null, volume: null }) }
function removeSplitDest(idx) {
  if (forms.splitTransfer.destinations.length <= 1) return
  forms.splitTransfer.destinations.splice(idx, 1)
}
const openSplitTransferModal = () => {
  forms.splitTransfer.mode = 'split'
  forms.splitTransfer.sourceBatchLocationId = batchLocations.value.length ? batchLocations.value[0].id : null
  forms.splitTransfer.sourceBatchLocationIds = []
  forms.splitTransfer.destinationVesselId = null
  forms.splitTransfer.combineDestinationVolume = null
  forms.splitTransfer.destinations = [{ vessel_id: null, volume: null }]
  modals.splitTransfer = true
}
const saveSplitTransfer = async () => {
  try {
    if (forms.splitTransfer.mode === 'split') {
      const srcId = forms.splitTransfer.sourceBatchLocationId
      const dests = forms.splitTransfer.destinations.filter(d => d.vessel_id && (d.volume != null && d.volume > 0))
      if (!srcId || dests.length === 0) {
        showAlert('Validation', 'Select source vessel and at least one destination with volume.', 'danger')
        return
      }
      await BatchLocationRepository.transferSplit({ sourceBatchLocationId: srcId, destinations: dests.map(d => ({ vessel_id: d.vessel_id, volume: Number(d.volume) || 0 })) })
    } else if (forms.splitTransfer.mode === 'combine') {
      const srcIds = forms.splitTransfer.sourceBatchLocationIds
      const destVesselId = forms.splitTransfer.destinationVesselId
      if (!srcIds?.length) { showAlert('Validation', 'Select at least one source vessel.', 'danger'); return }
      if (!destVesselId) { showAlert('Validation', 'Select a destination vessel.', 'danger'); return }
      await BatchLocationRepository.combineSplits({ sourceBatchLocationIds: srcIds, destinationVesselId: destVesselId })
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
    modals.splitTransfer = false
    SyncService.sync()
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

const adjustVolumeVesselName = computed(() => {
  if (!forms.adjustVolume.batch_location_id) return ''
  const bl = batchLocations.value.find(b => b.id === forms.adjustVolume.batch_location_id)
  return bl ? getVesselName(bl.vessel_id) : ''
})
const adjustVolumeNewTotal = computed(() => {
  if (!forms.adjustVolume.batch_location_id || forms.adjustVolume.volume_change == null) return null
  const bl = batchLocations.value.find(b => b.id === forms.adjustVolume.batch_location_id)
  if (!bl) return null
  return (Number(bl.current_volume) || 0) + (Number(forms.adjustVolume.volume_change) || 0)
})
const openAdjustVolumeModal = (batchLocationId) => {
  forms.adjustVolume = {
    batch_location_id: batchLocationId,
    volume_change: null,
    reason: ''
  }
  modals.adjustVolume = true
}
const saveAdjustVolume = async () => {
  try {
    const { batch_location_id, volume_change, reason } = forms.adjustVolume
    if (!batch_location_id || volume_change == null) { showAlert('Validation', 'Volume change is required.', 'danger'); return }
    const bl = batchLocations.value.find(b => b.id === batch_location_id)
    if (!bl) { showAlert('Error', 'Batch location not found.', 'danger'); return }
    const vessel = getVesselForBatchLocation(batch_location_id)
    const isTank = !!(vessel?.location_id)
    const numChange = Number(volume_change)

    if (isTank) {
      const occupancy = await getCurrentBeerAtLocation(vessel.location_id)
      if (occupancy.conflict) {
        showAlert('Error', 'This tank has more than one beer. Resolve on the Serving page so only one beer has quantity here.', 'danger')
        return
      }
      let beerItem = occupancy.item || null
      if (!beerItem && numChange > 0) {
        beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value)
      }
      if (!beerItem && numChange < 0) {
        showAlert('Error', 'No beer at this location to reduce. Add beer first (e.g. Mark Production Complete).', 'danger')
        return
      }
      if (!beerItem) return
      const vesselName = getVesselName(bl.vessel_id) || 'Vessel'
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
        })
      } else if (numChange > 0) {
        await LedgerRepository.addEntry({
          type: 'RECEIVE',
          item_id: beerItem.id,
          location_id: vessel.location_id,
          quantity: numChange,
          batch_id: batch.value.id,
          note: reason ? `${reason} (${vesselName})` : `Adjust volume: ${vesselName}`,
          data: { source: 'adjust_volume_tank' }
        })
      }
      await BatchVolumeAdjustmentRepository.create({ batch_location_id, volume_change: numChange, reason: reason || (numChange < 0 ? 'Serving removal (tank)' : 'Adjustment (tank)') })
    } else {
      const newVol = (Number(bl.current_volume) || 0) + numChange
      if (newVol < 0) { showAlert('Validation', 'Volume cannot be negative.', 'danger'); return }
      await BatchLocationRepository.update(batch_location_id, { current_volume: newVol })
      await BatchVolumeAdjustmentRepository.create({ batch_location_id, volume_change: numChange, reason: reason || 'Manual adjustment' })
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
    modals.adjustVolume = false
    SyncService.sync()
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

const getLastSnapshot = (batchLocationId) => {
  const snaps = volumeSnapshots.value.get(batchLocationId)
  if (!snaps || snaps.length === 0) return null
  return snaps[snaps.length - 1]
}
const setVolumeLastSnapshot = computed(() => {
  if (!forms.setVolume.batch_location_id) return null
  return getLastSnapshot(forms.setVolume.batch_location_id)
})

const setVolumeTankOnHand = ref(null)
watch(() => forms.setVolume.batch_location_id, async (blId) => {
  const vessel = blId ? getVesselForBatchLocation(blId) : null
  if (!vessel?.location_id) { setVolumeTankOnHand.value = null; return }
  try {
    const result = await getBeerItemForServingLocation(vessel.location_id)
    setVolumeTankOnHand.value = result ? result.onHand : null
  } catch (_) { setVolumeTankOnHand.value = null }
}, { immediate: true })

const setVolumeCurrentVolume = computed(() => {
  const bl = forms.setVolume.batch_location_id ? batchLocations.value.find(b => b.id === forms.setVolume.batch_location_id) : null
  const vessel = bl ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null
  if (vessel?.location_id && setVolumeTankOnHand.value != null) return setVolumeTankOnHand.value
  return bl ? (Number(bl.current_volume) || 0) : null
})

const setVolumeDelta = computed(() => {
  if (!forms.setVolume.batch_location_id || forms.setVolume.measured_volume == null) return null
  const current = setVolumeCurrentVolume.value
  if (current == null) return null
  return Number(forms.setVolume.measured_volume) - current
})

const setVolumeIsTank = computed(() => {
  const vessel = forms.setVolume.batch_location_id ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null
  return !!(vessel?.location_id)
})

const setVolumeTankLocationName = computed(() => {
  const vessel = forms.setVolume.batch_location_id ? getVesselForBatchLocation(forms.setVolume.batch_location_id) : null
  return vessel?.location_id ? getLocationName(vessel.location_id) : ''
})

const adjustVolumeIsTank = computed(() => {
  const vessel = forms.adjustVolume.batch_location_id ? getVesselForBatchLocation(forms.adjustVolume.batch_location_id) : null
  return !!(vessel?.location_id)
})

const adjustVolumeTankLocationName = computed(() => {
  const vessel = forms.adjustVolume.batch_location_id ? getVesselForBatchLocation(forms.adjustVolume.batch_location_id) : null
  return vessel?.location_id ? getLocationName(vessel.location_id) : ''
})
const isBackdatedSetVolume = computed(() => {
  if (!forms.setVolume.measured_at || !setVolumeLastSnapshot.value) return false
  return new Date(forms.setVolume.measured_at).toISOString() < setVolumeLastSnapshot.value.measured_at
})

const openSetVolumeModal = async (batchLocationId) => {
  const bl = batchLocations.value.find(b => b.id === batchLocationId)
  const vessel = bl ? getVesselForBatchLocation(batchLocationId) : null
  const last = getLastSnapshot(batchLocationId)
  let initialVol = bl?.current_volume ?? last?.measured_volume ?? null
  if (vessel?.location_id) {
    try {
      const result = await getBeerItemForServingLocation(vessel.location_id)
      if (result) initialVol = result.onHand
    } catch (_) {}
  }
  forms.setVolume = {
    batch_location_id: batchLocationId,
    measured_volume: initialVol,
    measured_at: dayjs().format('YYYY-MM-DDTHH:mm'),
    method: last?.method || '',
    note: ''
  }
  modals.setVolume = true
}

const saveSetVolume = async () => {
  try {
    const { batch_location_id, measured_volume, measured_at, method, note } = forms.setVolume
    if (!batch_location_id || measured_volume == null) { showAlert('Validation', 'Measured volume is required.', 'danger'); return }
    const bl = batchLocations.value.find(b => b.id === batch_location_id)
    if (!bl) { showAlert('Error', 'Batch location not found.', 'danger'); return }
    const vessel = getVesselForBatchLocation(batch_location_id)
    const isTank = !!(vessel?.location_id)
    const newVol = Number(measured_volume)

    if (isTank) {
      const occupancy = await getCurrentBeerAtLocation(vessel.location_id)
      if (occupancy.conflict) {
        showAlert('Error', 'This tank has more than one beer. Resolve on the Serving page so only one beer has quantity here.', 'danger')
        return
      }
      const onHand = setVolumeTankOnHand.value != null ? setVolumeTankOnHand.value : (occupancy.item ? occupancy.onHand : 0)
      const delta = newVol - onHand
      let beerItem = occupancy.item || null
      if (!beerItem && delta > 0) beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value)
      if (!beerItem && delta < 0) {
        showAlert('Error', 'No beer at this location to reduce. Add beer first (e.g. Mark Production Complete).', 'danger')
        return
      }
      if (beerItem && delta !== 0) {
        const vesselName = getVesselName(bl.vessel_id) || 'Vessel'
        const noteText = `Set volume reconcile (measured ${newVol} bbl) — ${vesselName}`
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
          })
        } else {
          await LedgerRepository.addEntry({
            type: 'RECEIVE',
            item_id: beerItem.id,
            location_id: vessel.location_id,
            quantity: delta,
            batch_id: batch.value.id,
            note: noteText,
            data: { source: 'set_volume_reconcile' }
          })
        }
      }
    } else {
      const iso = measured_at ? new Date(measured_at).toISOString() : new Date().toISOString()
      await BatchVolumeSnapshotRepository.recordSnapshot({
        batch_location_id,
        measured_volume: newVol,
        measured_at: iso,
        method: method || null,
        note: note || null
      })
      batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
      await refreshVolumeSnapshots()
    }

    if (isTank) {
      batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
    }
    modals.setVolume = false
    SyncService.sync()
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

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
  }
  modals.transfer = true
}

const saveTransfer = async () => {
  try {
    const { source_batch_location_id, destination_location_id, destination_vessel_id, volume, transfer_type, note, log_to_ledger, ledger_item_id } = forms.transfer
    if (!source_batch_location_id) { showAlert('Validation', 'Select a source vessel.', 'danger'); return }
    if (!destination_location_id && !destination_vessel_id) { showAlert('Validation', 'Select a destination location or vessel.', 'danger'); return }
    const vol = Number(volume)
    if (!vol || vol <= 0) { showAlert('Validation', 'Volume must be greater than zero.', 'danger'); return }
    const source = batchLocations.value.find(b => b.id === source_batch_location_id)
    if (!source) { showAlert('Error', 'Source vessel not found.', 'danger'); return }
    const newVol = (Number(source.current_volume) || 0) - vol
    if (newVol < 0) { showAlert('Validation', 'Cannot move more than available volume.', 'danger'); return }
    if (destination_location_id && (!log_to_ledger || !ledger_item_id)) {
      showAlert('Validation', 'To move beer into packaged storage, also create the matching Finished Beer RECEIVE entry.', 'danger')
      return
    }
    await BatchLocationTransferRepository.recordTransfer({
      source_batch_location_id,
      destination_location_id: destination_location_id || null,
      destination_vessel_id: destination_vessel_id || null,
      volume: vol,
      transfer_type: transfer_type || 'transfer',
      note: note || null
    })
    if (log_to_ledger && ledger_item_id && destination_location_id) {
      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: ledger_item_id,
        location_id: destination_location_id,
        quantity: vol,
        batch_id: batch.value.id,
        operation_type: 'serving_transfer',
        note: note || 'Transfer from serving'
      })
    }
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
    await refreshVolumeSnapshots()
    await refreshTransfers()
    modals.transfer = false
    SyncService.sync()
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

const openReadingModal = () => {
  const firstBl = batchLocations.value.length > 0 ? batchLocations.value[0] : null
  forms.reading = { reading_type: 'GRAVITY', value: '', measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), batch_id: batch.value.id, batch_location_id: firstBl?.id || null }
  modals.reading = true
}
const openReadingModalForSplit = (batchLocationId) => {
  forms.reading = { reading_type: 'GRAVITY', value: '', measured_at: dayjs().format('YYYY-MM-DDTHH:mm'), batch_id: batch.value.id, batch_location_id: batchLocationId }
  modals.reading = true
}

const openAdditionModal = () => {
  forms.addition = { item_id: '', event_type: 'Any', quantity: 0, location_id: '', batch_id: batch.value.id, batch_location_id: null, unit_cost: null }
  additionAvailableQty.value = 0
  locationAvailability.value = new Map()
  modals.addition = true
}
const updateAdditionAvailability = async () => {
  if (forms.addition.item_id && forms.addition.location_id) {
    additionAvailableQty.value = await LedgerRepository.getOnhand(forms.addition.item_id, forms.addition.location_id)
  } else {
    additionAvailableQty.value = 0
  }
}
const updateLocationAvailability = async () => {
  if (!forms.addition.item_id) { locationAvailability.value = new Map(); return }
  const availMap = new Map()
  await Promise.all(locations.value.map(async (loc) => {
    const qty = await LedgerRepository.getOnhand(forms.addition.item_id, loc.id)
    availMap.set(loc.id, qty)
  }))
  locationAvailability.value = availMap
  if (forms.addition.location_id) additionAvailableQty.value = availMap.get(forms.addition.location_id) || 0
  const selectedItem = items.value.find(i => i.id === forms.addition.item_id)
  if (selectedItem && (forms.addition.unit_cost === null || forms.addition.unit_cost === undefined)) {
    forms.addition.unit_cost = selectedItem.default_unit_cost ?? null
  }
}
const getLocationLabel = (location) => {
  const avail = locationAvailability.value.get(location.id)
  if (avail !== undefined && forms.addition.item_id) return `${location.name} (${avail} available)`
  return location.name
}
const getLocationName = (locationId) => locations.value.find(l => l.id === locationId)?.name || 'Unknown location'
const getLocationStageLabel = (loc) => (loc?.stage && LOCATION_STAGE_LABELS[loc.stage]) ? LOCATION_STAGE_LABELS[loc.stage] : (loc?.stage || '')
const saveAddition = async () => {
  try {
    if (!forms.addition.item_id || !forms.addition.location_id) {
      showAlert('Validation Error', 'Please select an item and location.', 'danger')
      return
    }
    if (!isAdditionValid.value) {
      showAlert('Validation Error', 'Invalid quantity. Check availability.', 'danger')
      return
    }
    await BatchAdditionRepository.add(forms.addition)
    additions.value = await BatchAdditionRepository.getByBatchId(batch.value.id)
    await refreshCostSummary()
    modals.addition = false
    SyncService.sync()
  } catch (e) {
    console.error('Save addition failed:', e)
    showAlert('Error', e.message, 'danger')
  }
}

const saveReading = async () => {
  try {
    if (!forms.reading.batch_location_id) {
      showAlert('Validation', 'Select a vessel for this reading.', 'danger')
      return
    }
    const readingPayload = {
      batch_id: batch.value.id,
      reading_type: forms.reading.reading_type,
      value: forms.reading.value,
      measured_at: new Date(forms.reading.measured_at).toISOString(),
      batch_location_id: forms.reading.batch_location_id
    }
    await BatchReadingRepository.add(readingPayload)
    const split = batchLocations.value.find(b => b.id === forms.reading.batch_location_id)
    if (split) {
      const updates = {}
      if (forms.reading.reading_type === 'GRAVITY') updates.current_gravity = forms.reading.value
      if (forms.reading.reading_type === 'TEMP') updates.current_temp = forms.reading.value
      if (forms.reading.reading_type === 'PH') updates.current_ph = forms.reading.value
      if (Object.keys(updates).length) {
        await BatchLocationRepository.update(forms.reading.batch_location_id, updates)
        batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
      }
    }
    readings.value = await BatchReadingRepository.getByBatchId(batch.value.id)
    modals.reading = false
    SyncService.sync()
  } catch (e) {
    showAlert('Error', e.message, 'danger')
  }
}

const productionCompleteServingLocations = ref([])
const productionCompleteStorageLocations = ref([])

const openProductionCompleteModal = async () => {
  const firstBl = batchLocations.value.length > 0 ? batchLocations.value[0] : null
  const allVesselsWithLocation = vessels.value.filter((v) => v.location_id && !v.deleted_at)
  const tankLocationIds = new Set(allVesselsWithLocation.map((v) => v.location_id))
  const genericLocationIds = new Set(locations.value.filter((l) => !tankLocationIds.has(l.id)).map((l) => l.id))
  const isServingType = (v) => (v.type || '').toUpperCase() === 'SERVING'
  const servingVessels = allVesselsWithLocation.filter(isServingType)
  const servingLocs = []
  for (const loc of locations.value) {
    if (loc.deleted_at) continue
    if (loc.stage === 'serving') {
      const linkedVessel = servingVessels.find((v) => v.location_id === loc.id)
      const occupancy = await getCurrentBeerAtLocation(loc.id)
      let currentBeerItemName = 'Empty'
      let conflict = false
      let currentBeerItem = null
      let onHand = null
      if (occupancy.conflict) {
        currentBeerItemName = 'Multiple beers – resolve on Serving page'
        conflict = true
      } else if (occupancy.item) {
        currentBeerItemName = occupancy.item.name
        currentBeerItem = occupancy.item
        onHand = occupancy.onHand
      }
      servingLocs.push({
        ...loc,
        vesselName: linkedVessel?.name ?? null,
        onHand,
        currentBeerItemName,
        conflict,
        currentBeerItem
      })
    }
  }
  const seenLocationIds = new Set(servingLocs.map((l) => l.id))
  for (const v of servingVessels) {
    const loc = locations.value.find((l) => l.id === v.location_id)
    if (!loc || seenLocationIds.has(loc.id)) continue
    seenLocationIds.add(loc.id)
    const occupancy = await getCurrentBeerAtLocation(v.location_id)
    let currentBeerItemName = 'Empty'
    let conflict = false
    let currentBeerItem = null
    let onHand = null
    if (occupancy.conflict) {
      currentBeerItemName = 'Multiple beers – resolve on Serving page'
      conflict = true
    } else if (occupancy.item) {
      currentBeerItemName = occupancy.item.name
      currentBeerItem = occupancy.item
      onHand = occupancy.onHand
    }
    servingLocs.push({ ...loc, vesselName: v.name, onHand, currentBeerItemName, conflict, currentBeerItem })
  }
  productionCompleteServingLocations.value = servingLocs
  productionCompleteStorageLocations.value = locations.value.filter(
    (l) => !l.deleted_at && genericLocationIds.has(l.id) && l.stage !== 'serving'
  )
  const selectedBl = firstBl
  const selectedVessel = selectedBl ? vessels.value.find((v) => v.id === selectedBl.vessel_id) : null
  const defaultChoice = selectedVessel?.location_id ? 'serving' : null
  const defaultLocationId = defaultChoice === 'serving' && selectedVessel?.location_id ? selectedVessel.location_id : null
  forms.productionComplete = {
    destChoice: defaultChoice,
    batch_location_id: firstBl?.id || null,
    volume_produced: firstBl?.current_volume ?? displayTotalVolume.value ?? null,
    completion_date: new Date().toISOString().slice(0, 16),
    location_id: defaultLocationId,
    formatKey: KEG_FORMAT_PRESETS[0]?.key || '1/6 bbl',
    numKegs: null,
    numCases: null,
    supplies: []
  }
  productionCompleteExistingItem.value = null
  productionCompleteConfirmOpen.value = false
  modals.productionComplete = true
}

const openWaterAdditionModal = () => {
  const firstLocation = batchLocations.value.length > 0 ? batchLocations.value[0] : null
  forms.waterAddition = {
    batch_location_id: firstLocation?.id || null,
    addition_type: 'WATER',
    liquid_type: '',
    quantity: null,
    added_at: new Date().toISOString().slice(0, 16),
    note: ''
  }
  modals.waterAddition = true
}

const saveWaterAddition = async () => {
  try {
    if (!forms.waterAddition.batch_location_id) {
      showAlert('Validation Error', 'Please select a vessel.', 'danger')
      return
    }
    if (!forms.waterAddition.quantity || forms.waterAddition.quantity <= 0) {
      showAlert('Validation Error', 'Please enter a valid quantity.', 'danger')
      return
    }
    if (forms.waterAddition.addition_type === 'LIQUID' && !forms.waterAddition.liquid_type) {
      showAlert('Validation Error', 'Please specify the liquid type.', 'danger')
      return
    }

    // Create batch addition with special event_type for TTB tracking
    const eventType = forms.waterAddition.addition_type === 'WATER' ? 'WATER_ADDITION' : 'LIQUID_ADDITION'
    
    // For water/liquid additions, we don't consume from inventory
    // We just record the addition to the batch
    await BatchAdditionRepository.add({
      batch_id: batch.value.id,
      batch_location_id: forms.waterAddition.batch_location_id,
      event_type: eventType,
      quantity: forms.waterAddition.quantity,
      added_at: new Date(forms.waterAddition.added_at).toISOString(),
      note: forms.waterAddition.note || (forms.waterAddition.addition_type === 'LIQUID' ? `Liquid type: ${forms.waterAddition.liquid_type}` : 'Water addition'),
      // Store TTB metadata
      liquid_type: forms.waterAddition.addition_type === 'LIQUID' ? forms.waterAddition.liquid_type : null,
      // Don't create ledger entry - water additions don't consume inventory
      item_id: null,
      location_id: null
    })

    additions.value = await BatchAdditionRepository.getByBatchId(batch.value.id)
    modals.waterAddition = false
    showAlert('Success', 'Water/liquid addition recorded for TTB reporting.', 'success')
    SyncService.sync()
  } catch (e) {
    console.error('Save water addition failed:', e)
    showAlert('Error', e.message, 'danger')
  }
}

const productionCompleteOccupiedItem = ref(null)
const productionCompleteVolumeOverrideConfirmOpen = ref(false)
const productionCompleteVolumeExceedData = ref(null) // { volumeBarrels, vesselVolumeBarrels, unit }
const productionCompleteVolumeOverride = ref(false)

const onProductionCompleteConfirm = async () => {
  if (!forms.productionComplete.destChoice || !forms.productionComplete.location_id) {
    saveProductionComplete()
    return
  }
  if (forms.productionComplete.destChoice !== 'serving') {
    saveProductionComplete()
    return
  }
  const locId = forms.productionComplete.location_id
  const occupancy = await getCurrentBeerAtLocation(locId)
  if (occupancy.empty) {
    saveProductionComplete()
    return
  }
  if (occupancy.conflict) {
    showAlert('Cannot use this location', 'This serving location has more than one beer. Resolve inventory on the Serving page (set volume or remove beer so only one beer item has quantity here), then try again.', 'danger')
    return
  }
  productionCompleteOccupiedItem.value = occupancy.item
  productionCompleteConfirmOpen.value = true
}

const productionCompleteConfirmSameBeer = () => {
  productionCompleteExistingItem.value = productionCompleteOccupiedItem.value
  productionCompleteConfirmOpen.value = false
  productionCompleteOccupiedItem.value = null
  saveProductionComplete()
}

const productionCompleteConfirmRemoveFirst = () => {
  productionCompleteConfirmOpen.value = false
  productionCompleteOccupiedItem.value = null
  showAlert('Remove beer first', 'Zero out or remove the beer at this location from the Serving page, then try again.', 'primary')
}

const productionCompleteConfirmCancel = () => {
  productionCompleteConfirmOpen.value = false
  productionCompleteOccupiedItem.value = null
}

const productionCompleteVolumeOverrideConfirm = () => {
  productionCompleteVolumeOverride.value = true
  productionCompleteVolumeOverrideConfirmOpen.value = false
  saveProductionComplete()
}

const productionCompleteVolumeOverrideCancel = () => {
  productionCompleteVolumeOverrideConfirmOpen.value = false
  productionCompleteVolumeExceedData.value = null
}

const saveProductionComplete = async () => {
  try {
    const f = forms.productionComplete
    if (!f.destChoice) {
      showAlert('Validation Error', 'Please choose Serving or Packaged.', 'danger')
      return
    }
    if (!f.location_id) {
      showAlert('Validation Error', 'Please select a destination location.', 'danger')
      return
    }
    if (!f.batch_location_id) {
      showAlert('Validation Error', 'Please select a vessel.', 'danger')
      return
    }

    const isPackaging = isPackagingChoice(f.destChoice)
    let volumeBarrels
    if (isPackaging) {
      const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS
      const preset = presets.find((p) => p.key === f.formatKey)
      const qty = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0)
      if (!preset || qty <= 0) {
        showAlert('Validation Error', f.destChoice === 'packaged_keg' ? 'Please enter number of kegs.' : 'Please enter number of cases.', 'danger')
        return
      }
      volumeBarrels = qty * preset.volumePerUnit
      const supplies = f.supplies || []
      const validSupplies = supplies.filter((s) => s.item_id && s.location_id && s.quantity > 0)
      if (validSupplies.length === 0) {
        showAlert('Validation Error', 'Add at least one packaging material (e.g. empty kegs, cans, caps).', 'danger')
        return
      }
      for (const line of validSupplies) {
        const onhand = await LedgerRepository.getOnhand(line.item_id, line.location_id)
        if (onhand < line.quantity) {
          const itemName = items.value.find((i) => i.id === line.item_id)?.name || 'Item'
          showAlert('Validation Error', `Insufficient ${itemName} at selected location. Available: ${onhand}, needed: ${line.quantity}`, 'danger')
          return
        }
      }
    } else {
      if (!f.volume_produced || f.volume_produced <= 0) {
        showAlert('Validation Error', 'Please enter a valid volume produced.', 'danger')
        return
      }
      volumeBarrels = f.volume_produced
    }

    const completionDate = new Date(f.completion_date).toISOString()

    const batchEntries = await LedgerRepository.getEntries({ batch_id: batch.value.id })
    const alreadyComplete = batchEntries.some(e => e.type === 'RECEIVE' && (e.data || {}).source === 'production_complete')
    if (alreadyComplete) {
      showAlert('Error', 'This batch has already been marked production complete.', 'danger')
      return
    }

    let beerItem = productionCompleteExistingItem.value
    if (!beerItem) {
      try {
        beerItem = await ItemRepository.getOrCreateBeerItemForBatch(batch.value)
      } catch (e) {
        showAlert('Error', e.message || 'Could not resolve Finished Beer item.', 'danger')
        return
      }
    }
    if (!beerItem) {
      showAlert('Error', 'Finished Beer item not found.', 'danger')
      return
    }
    productionCompleteExistingItem.value = null

    if (isPackaging) {
      const batchLocation = batchLocations.value.find((bl) => bl.id === f.batch_location_id)
      const vessel = batchLocation ? vessels.value.find((v) => v.id === batchLocation.vessel_id) : null
      if (!vessel?.location_id) {
        showAlert('Validation Error', 'Packaging requires a vessel with a bound location. Edit the vessel on Vessels page.', 'danger')
        return
      }
      // Volume vs vessel capacity check (with manual override)
      const unit = batch.value.planned_volume_unit || 'bbl'
      const vesselVol = Number(batchLocation?.current_volume) || 0
      const vesselVolumeBarrels = unit === 'bbl' ? vesselVol : unit === 'gal' ? vesselVol / 31 : vesselVol / 117.35
      if (!productionCompleteVolumeOverride.value && vesselVolumeBarrels > 0 && volumeBarrels > vesselVolumeBarrels) {
        productionCompleteVolumeExceedData.value = { volumeBarrels, vesselVolumeBarrels, unit }
        productionCompleteVolumeOverrideConfirmOpen.value = true
        return
      }
      productionCompleteVolumeOverride.value = false
      productionCompleteVolumeExceedData.value = null
      const destLocationId = f.location_id
      const operationType = f.destChoice === 'packaged_keg' ? 'racking' : 'bottling'
      const presets = f.destChoice === 'packaged_keg' ? KEG_FORMAT_PRESETS : CASE_FORMAT_PRESETS
      const preset = presets.find((p) => p.key === f.formatKey)
      const numUnits = f.destChoice === 'packaged_keg' ? (f.numKegs ?? 0) : (f.numCases ?? 0)
      const packagedBeerItem = await ItemRepository.getOrCreatePackagedBeerItem(beerItem, preset.key, preset.volumePerUnit)

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
      })

      await LedgerRepository.transfer({
        itemId: beerItem.id,
        fromLocationId: vessel.location_id,
        toLocationId: destLocationId,
        quantity: volumeBarrels,
        note: `${operationType}: bulk to packaging`,
        operationType,
        batchId: batch.value.id,
        created_at: completionDate
      })

      await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: beerItem.id,
        location_id: destLocationId,
        batch_id: batch.value.id,
        quantity: -volumeBarrels,
        created_at: completionDate,
        note: `Packaging: bulk converted to ${numUnits} ${preset.key}`,
        operation_type: operationType
      })

      await LedgerRepository.addEntry({
        type: 'RECEIVE',
        item_id: packagedBeerItem.id,
        location_id: destLocationId,
        batch_id: batch.value.id,
        quantity: numUnits,
        created_at: completionDate,
        note: `Packaging: ${numUnits} ${preset.key}`,
        operation_type: operationType
      })

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
        })
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
      })
    }

    const defs = milestoneDefinitions.value
    const lastDef = defs && defs.length > 0 ? defs.reduce((a, b) => ((a.sort_order ?? 0) >= (b.sort_order ?? 0) ? a : b)) : null
    if (lastDef) {
      await BatchMilestoneRepository.ensure(batch.value.id, lastDef.id, completionDate)
    }
    const volDisplay = isPackaging ? volumeBarrels : f.volume_produced
    const productionNote = `Production Complete: ${volDisplay} ${batch.value.planned_volume_unit || 'barrels'} produced. Location: ${f.location_id || 'N/A'}. Batch Location: ${f.batch_location_id}`
    const milestonesList = await BatchMilestoneRepository.getByBatchId(batch.value.id)
    const lastMilestone = lastDef ? milestonesList.find(m => m.milestone_definition_id === lastDef.id) : null
    if (lastMilestone) {
      await BatchMilestoneRepository.update(lastMilestone.id, {
        note: productionNote,
        volume_produced: volDisplay,
        production_location_id: f.location_id,
        production_batch_location_id: f.batch_location_id
      })
    }

    await BatchLocationRepository.delete(f.batch_location_id)
    batchLocations.value = await BatchLocationRepository.getByBatchId(batch.value.id)
    milestones.value = await BatchMilestoneRepository.getByBatchId(batch.value.id)
    batchLedgerEntries.value = await LedgerRepository.getEntries({ batch_id: batch.value.id })
    costSummary.value = await BatchCostService.computeAndStore(batch.value.id)
    batch.value = await BatchRepository.getById(batch.value.id)
    items.value = await ItemRepository.getAll()
    modals.productionComplete = false
    showAlert('Success', 'Production marked as complete. Source vessel cleared.', 'success')
    incrementSyncTrigger()
    SyncService.sync()
  } catch (e) {
    console.error('Save production complete failed:', e)
    showAlert('Error', e.message, 'danger')
  }
}

const getItemName = (id) => items.value.find(i => i.id === id)?.name || 'Unknown Item'
/** Display name for batch history: Water, liquid type, or item name (ingredient additions). */
const getAdditionDisplayName = (a) => {
  if (a.event_type === 'WATER_ADDITION') return 'water'
  if (a.event_type === 'LIQUID_ADDITION') return (a.liquid_type && String(a.liquid_type).trim()) ? a.liquid_type : 'other liquid'
  return getItemName(a.item_id)
}
const formatDate = (d) => d ? dayjs(d).format('MMM D, YYYY') : '-'
const formatDateTime = (d) => d ? dayjs(d).format('MMM D, HH:mm') : '-'
const getStatusClass = (status) => {
  const map = {
    PLANNED: 'bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-300',
    'Knocked Out': 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    'Pitched': 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400',
    'Fermentation Started': 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400',
    'FG Confirmed': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Cold Crash': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Transferred': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Serving': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Packaging Started': 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-400',
    'Packaging Completed': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    'Released': 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400',
    'Batch Closed': 'bg-neutral-800 dark:bg-neutral-100 text-white dark:text-neutral-800'
  }
  return map[status] || 'bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-300'
}
</script>
