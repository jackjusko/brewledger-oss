<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Vessels</h4>
        <p>See what’s in each tank and the current volume.</p>
      </div>
      <div class="console-toolbar-actions">
        <button class="btn btn-primary" @click="openModal">
          <i class="ri-add-line" aria-hidden="true"></i>
          New vessel
        </button>
        <button class="filter-pill" :class="{ 'is-active': filter === 'all' }" @click="filter = 'all'">
          <i class="ri-list-check-2" aria-hidden="true"></i>
          All
        </button>
        <button class="filter-pill" :class="{ 'is-active': filter === 'serving' }" @click="filter = 'serving'">
          <i class="ri-cup-line" aria-hidden="true"></i>
          Serving
        </button>
        <button class="filter-pill" :class="{ 'is-active': filter === 'brite' }" @click="filter = 'brite'">
          <i class="ri-contrast-drop-line" aria-hidden="true"></i>
          Brite
        </button>
        <button class="filter-pill" :class="{ 'is-active': filter === 'fermenter' }" @click="filter = 'fermenter'">
          <i class="ri-flask-line" aria-hidden="true"></i>
          Fermenters
        </button>
      </div>
    </div>

    <div class="card mb-6">
      <div class="card-header flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Vessel occupancy</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400">Each vessel with its current batch, volume, and last set point.</p>
        </div>
        <button class="btn btn-secondary text-sm" @click="refresh" :disabled="loading">
          <span v-if="loading">Refreshing…</span>
          <span v-else>Refresh</span>
        </button>
      </div>
      <div v-if="loading" class="p-6 text-sm text-neutral-600 dark:text-stone-300">
        Loading vessels…
      </div>
      <div v-else class="p-4 grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">
        <div v-for="card in vesselCards" :key="card.id" class="border border-neutral-200 dark:border-stone-700 rounded-lg p-4 bg-white dark:bg-stone-900 shadow-sm">
          <div class="flex items-start justify-between gap-3">
            <div>
              <div class="font-semibold text-neutral-900 dark:text-stone-100">{{ card.name || 'Vessel' }}</div>
            </div>
            <span class="badge">{{ card.type || '—' }}</span>
          </div>
          <div class="mt-2 text-sm">
            <div class="font-medium text-neutral-900 dark:text-stone-100">{{ card.batchName }}</div>
            <div class="text-xs text-neutral-500 dark:text-stone-400">{{ card.batchStatusLabel }}</div>
          </div>
          <div class="mt-3 flex items-center justify-between text-sm">
            <div class="font-mono text-neutral-900 dark:text-stone-100">{{ card.volumeLabel }}</div>
            <div class="text-xs text-neutral-500 dark:text-stone-400">{{ card.lastLabel }}</div>
          </div>
          <div class="mt-2 text-xs text-neutral-500 dark:text-stone-400 flex items-center gap-1">
            <i class="ri-map-pin-2-line" aria-hidden="true"></i>
            <span>{{ card.locationName || '—' }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="card-header flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Vessel overview</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400">Batch + volume by vessel, with last set point.</p>
        </div>
        <button class="btn btn-secondary text-sm" @click="refresh" :disabled="loading">
          <span v-if="loading">Refreshing…</span>
          <span v-else>Refresh</span>
        </button>
      </div>
      <div v-if="loading" class="p-6 text-sm text-neutral-600 dark:text-stone-300">
        Loading vessels…
      </div>
      <div v-else class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th>Vessel</th>
              <th>Type</th>
              <th>Batch</th>
              <th>Current volume</th>
              <th>Last set</th>
              <th>Location</th>
              <th class="w-40 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>
                <div class="font-semibold text-neutral-900 dark:text-stone-100">{{ row.vesselName || 'Vessel' }}</div>
              </td>
              <td class="text-sm text-neutral-700 dark:text-stone-300">{{ row.vesselType || '—' }}</td>
              <td>
                <div class="font-medium text-neutral-900 dark:text-stone-100">{{ row.batchName || 'Unassigned' }}</div>
                <div class="text-xs text-neutral-500 dark:text-stone-400" v-if="row.batchStatus">Status: {{ row.batchStatus }}</div>
              </td>
              <td class="font-mono text-neutral-900 dark:text-stone-100">
                {{ row.currentVolume != null ? row.currentVolume : '—' }} {{ row.unit }}
              </td>
              <td class="text-sm">
                <div v-if="row.lastSnapshot">
                  <div class="font-mono text-neutral-900 dark:text-stone-100">{{ row.lastSnapshot.measured_volume }} {{ row.unit }}</div>
                  <div class="text-xs text-neutral-500 dark:text-stone-400">{{ row.lastSnapshot.timeLabel }}</div>
                </div>
                <span v-else class="text-neutral-500 dark:text-stone-400 text-xs">No set point</span>
              </td>
              <td class="text-sm text-neutral-700 dark:text-stone-300">
                {{ row.locationName || '—' }}
              </td>
              <td class="text-right">
                <div v-if="row.hasBatch" class="flex justify-end gap-2">
                  <router-link :to="`/batches/${row.batchId}`" class="btn btn-secondary btn-sm">Open batch</router-link>
                  <router-link :to="`/batches/${row.batchId}`" class="btn btn-primary btn-sm">Set volume</router-link>
                </div>
                <div v-else class="text-xs text-neutral-500 dark:text-stone-400 text-right">No batch assigned</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="showModal" class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div class="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-md p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-neutral-900 dark:text-stone-100">{{ form.id ? 'Edit vessel' : 'New vessel' }}</h3>
          <button class="text-neutral-500 hover:text-neutral-700" @click="closeModal"><i class="ri-close-line"></i></button>
        </div>
        <form @submit.prevent="saveVessel" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Name</label>
            <input v-model="form.name" type="text" required class="input w-full" placeholder="e.g. FV-01">
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Type</label>
            <select v-model="form.type" class="input w-full" required>
              <option value="FERMENTER">Fermenter</option>
              <option value="UNITANK">Unitank</option>
              <option value="BRITE">Brite Tank</option>
              <option value="SERVING">Serving Tank</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <template v-if="form.id && form.location_id">
              <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Location</label>
              <p class="text-sm text-neutral-600 dark:text-stone-400">{{ formServingLocationName || '—' }} {{ form.type === 'SERVING' ? '(serving)' : '(cellar)' }}</p>
            </template>
            <template v-else-if="!form.id">
              <p class="text-xs text-neutral-500 dark:text-stone-400">A location will be created with this name and linked to the vessel ({{ form.type === 'SERVING' ? 'serving' : 'cellar' }} stage).</p>
            </template>
          </div>
          <div class="flex justify-end gap-2">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="saving">Cancel</button>
            <button type="submit" class="btn btn-primary" :disabled="saving">
              <span v-if="saving">Saving…</span>
              <span v-else>{{ form.id ? 'Save changes' : 'Create vessel' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onActivated, ref } from 'vue';
import dayjs from 'dayjs';
import { BatchRepository } from '../repositories/BatchRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { BatchVolumeSnapshotRepository } from '../repositories/BatchVolumeSnapshotRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { SyncService } from '../services/SyncService';
import { getCurrentBeerAtLocation } from '../services/ServingOccupancyService';

const loading = ref(true);
const filter = ref('all');
const rows = ref([]);
const allVessels = ref([]);
const locations = ref([]);
const showModal = ref(false);
const saving = ref(false);
const form = ref({ id: null, name: '', type: 'FERMENTER', location_id: null });

const VESSEL_TYPE_ORDER = ['FERMENTER', 'UNITANK', 'BRITE', 'SERVING', 'BARREL', 'OTHER'];

const vesselTypeSortKey = (type) => {
  const i = VESSEL_TYPE_ORDER.indexOf((type || '').toUpperCase());
  return i >= 0 ? i : 999;
};

const servingLocationOptions = computed(() => {
  return locations.value.filter((l) => (l.stage === 'cellar' || l.stage === 'serving') && !l.deleted_at);
});

const formServingLocationName = computed(() => {
  if (!form.value.location_id) return null;
  const loc = locations.value.find((l) => l.id === form.value.location_id);
  return loc?.name ?? null;
});

const formatTime = (iso) => {
  if (!iso) return '';
  return dayjs(iso).format('MMM D, YYYY h:mm A');
};

const refresh = async () => {
  loading.value = true;
  try {
    const [vessels, batches, locs] = await Promise.all([
      VesselRepository.getAll(),
      BatchRepository.getAll(),
      LocationRepository.getAll()
    ]);
    locations.value = locs;
    const activeBatches = batches.filter((b) => !b.deleted_at);
    const batchIds = activeBatches.map((b) => b.id);
    const splits = batchIds.length ? await BatchLocationRepository.getByBatchIds(batchIds) : [];
    allVessels.value = vessels.filter((v) => !v.deleted_at);
    const snapsMap = new Map();
    await Promise.all(
      splits.map(async (s) => {
        const snaps = await BatchVolumeSnapshotRepository.getByBatchLocationId(s.id);
        if (snaps && snaps.length) snapsMap.set(s.id, snaps[snaps.length - 1]);
      })
    );
    const vesselMap = new Map(vessels.filter(v => !v.deleted_at).map((v) => [v.id, v]));
    const batchMap = new Map(activeBatches.map((b) => [b.id, b]));
    const locationMap = new Map(locs.map((l) => [l.id, l]));

    rows.value = splits
      .filter((s) => !s.deleted_at)
      .map((s) => {
        const vessel = vesselMap.get(s.vessel_id);
        const batch = batchMap.get(s.parent_batch_id);
        const lastSnap = snapsMap.get(s.id);
        const locationName = vessel?.location_name || locationMap.get(vessel?.location_id)?.name || null;
        const hasBatch = batch?.id !== null && batch?.id !== undefined;
        return {
          id: s.id,
          vesselId: s.vessel_id,
          vesselName: vessel?.name,
          vesselType: vessel?.type,
          hasBatch,
          batchId: hasBatch ? batch.id : null,
          batchName: batch?.name,
          batchStatus: batch?.status,
          currentVolume: hasBatch ? s.current_volume : null,
          unit: hasBatch ? batch?.planned_volume_unit || '' : '',
          lastSnapshot:
            hasBatch && lastSnap
              ? { measured_volume: lastSnap.measured_volume, timeLabel: formatTime(lastSnap.measured_at) }
              : null,
          locationName
        };
      });
    const assigned = new Set(rows.value.map((r) => r.vesselId));
    const emptyRows = allVessels.value
      .filter((v) => !assigned.has(v.id))
      .map((v) => ({
        id: v.id,
        vesselId: v.id,
        vesselName: v.name,
        vesselType: v.type,
        hasBatch: false,
        batchId: null,
        batchName: 'Empty',
        batchStatus: null,
        currentVolume: null,
        unit: '',
        lastSnapshot: null,
        locationName: v.location_name || locationMap.get(v.location_id)?.name || null
      }));
    rows.value = [...rows.value, ...emptyRows];

    // Serving tanks: show inventory at linked location (not batch). Override batchName/currentVolume from ledger.
    for (const row of rows.value) {
      const vessel = vesselMap.get(row.vesselId);
      if (!vessel?.location_id || vessel?.type !== 'SERVING') continue;
      const occupancy = await getCurrentBeerAtLocation(vessel.location_id);
      if (occupancy.conflict) {
        row.batchName = 'Multiple beers – resolve on Serving page';
        row.batchStatus = null;
        row.currentVolume = null;
        row.unit = 'bbl';
      } else if (occupancy.item) {
        row.batchName = occupancy.item.name;
        row.batchStatus = null;
        row.currentVolume = occupancy.onHand;
        row.unit = 'bbl';
      } else {
        row.batchName = 'Empty';
        row.batchStatus = null;
        row.currentVolume = 0;
        row.unit = 'bbl';
      }
    }
  } finally {
    loading.value = false;
  }
};

const filteredRows = computed(() => {
  let list = filter.value === 'all'
    ? rows.value
    : rows.value.filter((r) => (r.vesselType || '').toLowerCase().includes(filter.value));
  return [...list].sort((a, b) => {
    const byType = vesselTypeSortKey(a.vesselType) - vesselTypeSortKey(b.vesselType);
    return byType !== 0 ? byType : (a.vesselName || '').localeCompare(b.vesselName || '', undefined, { sensitivity: 'base' });
  });
});

const vesselCards = computed(() => {
  const byVessel = new Map(rows.value.map((r) => [r.vesselId, r]));
  let cards = allVessels.value.map((v) => {
    const row = byVessel.get(v.id);
    const batchName = row?.batchName || 'Empty';
    return {
      id: v.id,
      name: v.name,
      type: v.type,
      batchName,
      batchStatusLabel: row?.batchStatus ? `Status: ${row.batchStatus}` : 'No batch assigned',
      volumeLabel: row?.currentVolume != null ? `${row.currentVolume} ${row.unit}` : '—',
      lastLabel: row?.lastSnapshot?.timeLabel || 'No set point',
      locationName: row?.locationName || v.location_name || null
    };
  });
  if (filter.value !== 'all') {
    cards = cards.filter((c) => (c.type || '').toLowerCase().includes(filter.value));
  }
  return cards.sort((a, b) => {
    const byType = vesselTypeSortKey(a.type) - vesselTypeSortKey(b.type);
    return byType !== 0 ? byType : (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
});

const openModal = (vessel = null) => {
  if (vessel) {
    form.value = { id: vessel.id, name: vessel.name || '', type: vessel.type || 'FERMENTER', location_id: vessel.location_id || null };
  } else {
    form.value = { id: null, name: '', type: 'FERMENTER', location_id: null };
  }
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
};

const saveVessel = async () => {
  if (!form.value.name) return;
  saving.value = true;
  try {
    if (form.value.id) {
      const payload = {
        name: form.value.name,
        type: form.value.type,
        location_id: form.value.location_id ?? null
      };
      await VesselRepository.update(form.value.id, payload);
    } else {
      // Create location for all vessel types (fermenters/brites need location for packaging flow)
      const stage = form.value.type === 'SERVING' ? 'serving' : 'cellar';
      const newLocation = await LocationRepository.create({
        name: form.value.name.trim(),
        stage
      });
      await VesselRepository.create({
        name: form.value.name,
        type: form.value.type,
        location_id: newLocation.id
      });
    }
    await refresh();
    closeModal();
    SyncService.sync();
  } catch (e) {
    alert(e.message || 'Failed to save vessel.');
  } finally {
    saving.value = false;
  }
};

onMounted(refresh);
onActivated(refresh);
</script>
