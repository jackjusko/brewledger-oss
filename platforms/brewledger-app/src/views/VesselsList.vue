<template>
  <div class="p-3 pb-20">
    <div class="flex justify-between items-center mb-3">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Vessels</h1>
      <button @click="openModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-sm">
        + New
      </button>
    </div>
    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">See what’s in each tank and the current volume.</p>

    <div class="flex flex-wrap gap-2 mb-3">
      <button
        v-for="opt in vesselFilterOptions"
        :key="opt.value"
        @click="vesselFilter = opt.value"
        :class="[
          'px-3 py-1.5 rounded-md text-sm font-medium',
          vesselFilter === opt.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        ]"
      >
        {{ opt.label }}
      </button>
    </div>

    <div v-if="loading" class="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">Loading...</div>

    <div v-else-if="vessels.length === 0" class="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-md border border-dashed border-gray-300 dark:border-gray-500">
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-1">No vessels found</p>
      <p class="text-xs text-gray-400 dark:text-gray-300">Add fermenters, brite tanks, etc.</p>
    </div>

    <div v-else class="grid gap-3">
      <div v-for="card in displayedVesselCards" :key="card.id" class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="flex items-start justify-between gap-2">
          <div>
            <div class="font-semibold text-gray-900 dark:text-gray-50">{{ card.name || 'Vessel' }}</div>
            <span class="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mt-1">
              {{ card.type || '—' }}
            </span>
          </div>
        </div>
        <div class="mt-2 text-sm">
          <div class="font-medium text-gray-900 dark:text-gray-100">{{ card.batchName }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ card.batchStatusLabel }}</div>
        </div>
        <div class="mt-3 flex items-center justify-between text-sm">
          <div class="font-mono text-gray-900 dark:text-gray-100">{{ card.volumeLabel }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">{{ card.lastLabel }}</div>
        </div>
        <div v-if="card.locationName" class="mt-2 text-xs text-gray-500 dark:text-gray-400">
          📍 {{ card.locationName }}
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <template v-if="card.hasBatch">
            <router-link :to="`/batches/${card.batchId}`" class="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md text-sm font-medium">
              Open batch
            </router-link>
            <router-link :to="`/batches/${card.batchId}`" class="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium">
              Set volume
            </router-link>
          </template>
          <span v-else class="text-xs text-gray-500 dark:text-gray-400">No batch assigned</span>
          <button @click="openModal(vessels.find(v => v.id === card.id))" class="px-3 py-1.5 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium">
            Edit
          </button>
          <button @click="deleteVessel(card.id)" class="px-3 py-1.5 text-red-600 dark:text-red-400 hover:underline text-sm font-medium">
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div class="bg-white dark:bg-gray-800 rounded-md w-full max-w-sm p-4">
        <h2 class="text-base font-bold mb-3 text-gray-900 dark:text-gray-50">{{ isEditing ? 'Edit vessel' : 'New vessel' }}</h2>
        
        <form @submit.prevent="saveVessel">
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Name</label>
            <input v-model="form.name" type="text" required class="w-full border border-gray-300 dark:border-gray-500 rounded-md p-2 focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" placeholder="e.g. FV-01">
          </div>

          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Type</label>
            <select v-model="form.type" required class="w-full border border-gray-300 dark:border-gray-500 rounded-md p-2 focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm">
              <option value="FERMENTER">Fermenter</option>
              <option value="UNITANK">Unitank</option>
              <option value="BRITE">Brite Tank</option>
              <option value="SERVING">Serving Tank</option>
              <option value="BARREL">Barrel</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div class="mb-4">
            <template v-if="form.id && form.location_id">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Location</label>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ formServingLocationName || '—' }} {{ form.type === 'SERVING' ? '(serving)' : '(cellar)' }}</p>
            </template>
            <template v-else-if="!form.id">
              <p class="text-xs text-gray-500 dark:text-gray-400">A location will be created with this name and linked to the vessel ({{ form.type === 'SERVING' ? 'serving' : 'cellar' }} stage).</p>
            </template>
          </div>

          <div class="flex justify-end gap-2">
            <button type="button" @click="closeModal" class="px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-md text-sm">
              Cancel
            </button>
            <button type="submit" class="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm">
              {{ isEditing ? 'Save changes' : 'Create vessel' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onActivated, computed, watch } from 'vue';
import { VesselRepository } from '../repositories/VesselRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { BatchRepository } from '../repositories/BatchRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { BatchVolumeSnapshotRepository } from '../repositories/BatchVolumeSnapshotRepository';
import { SyncService } from '../services/SyncService';
import { getCurrentBeerAtLocation } from '../services/ServingOccupancyService';

const vessels = ref([]);
const locations = ref([]);
const vesselCards = ref([]);
const loading = ref(true);
const showModal = ref(false);
const form = ref({ id: null, name: '', type: 'FERMENTER', location_id: null });
const vesselFilter = ref('all');

const vesselFilterOptions = [
  { value: 'all', label: 'All' },
  { value: 'serving', label: 'Serving' },
  { value: 'brite', label: 'Brite' },
  { value: 'fermenter', label: 'Fermenters' }
];

const VESSEL_TYPE_ORDER = ['FERMENTER', 'UNITANK', 'BRITE', 'SERVING', 'BARREL', 'OTHER'];
const vesselTypeSortKey = (type) => {
  const i = VESSEL_TYPE_ORDER.indexOf((type || '').toUpperCase());
  return i >= 0 ? i : 999;
};

const displayedVesselCards = computed(() => {
  let list = vesselCards.value;
  if (vesselFilter.value !== 'all') {
    list = list.filter((c) => (c.type || '').toLowerCase().includes(vesselFilter.value));
  }
  return [...list].sort((a, b) => {
    const byType = vesselTypeSortKey(a.type) - vesselTypeSortKey(b.type);
    return byType !== 0 ? byType : (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
  });
});

const isEditing = computed(() => !!form.value.id);

const formServingLocationName = computed(() => {
  if (!form.value.location_id) return null;
  const loc = locations.value.find((l) => l.id === form.value.location_id);
  return loc?.name ?? null;
});

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const loadVessels = async () => {
  loading.value = true;
  try {
    const [vesselList, locs, batches] = await Promise.all([
      VesselRepository.getAll(),
      LocationRepository.getAll(),
      BatchRepository.getAll()
    ]);
    vessels.value = vesselList.filter((v) => !v.deleted_at);
    locations.value = locs;

    const activeBatches = (batches || []).filter((b) => !b.deleted_at);
    const batchIds = activeBatches.map((b) => b.id);
    const splits = batchIds.length ? await BatchLocationRepository.getByBatchIds(batchIds) : [];
    const batchMap = new Map(activeBatches.map((b) => [b.id, b]));
    const locationMap = new Map((locs || []).map((l) => [l.id, l]));

    const snapsMap = new Map();
    await Promise.all(
      splits.map(async (s) => {
        const snaps = await BatchVolumeSnapshotRepository.getByBatchLocationId(s.id);
        if (snaps && snaps.length) snapsMap.set(s.id, snaps[snaps.length - 1]);
      })
    );

    const rowByVesselId = new Map();
    for (const s of splits) {
      if (s.deleted_at) continue;
      const vessel = vessels.value.find((v) => v.id === s.vessel_id);
      const batch = batchMap.get(s.parent_batch_id);
      const lastSnap = snapsMap.get(s.id);
      const unit = batch?.planned_volume_unit || 'bbl';
      rowByVesselId.set(s.vessel_id, {
        vesselId: s.vessel_id,
        batchId: batch?.id,
        batchName: batch?.name || 'Batch',
        batchStatus: batch?.status,
        hasBatch: true,
        currentVolume: batch ? (Number(s.current_volume) ?? null) : null,
        unit,
        lastSnapshot: lastSnap ? { measured_volume: lastSnap.measured_volume, timeLabel: formatTime(lastSnap.measured_at) } : null,
        locationName: vessel && vessel.location_id ? locationMap.get(vessel.location_id)?.name : null
      });
    }

    const cardsWithTankOnHand = [];
    for (const v of vessels.value) {
      const row = rowByVesselId.get(v.id);
      const locationName = v.location_id ? locationMap.get(v.location_id)?.name : (row?.locationName || null);
      let batchName, batchStatusLabel, volumeLabel, hasBatch, batchId;
      if (v.location_id && v.type === 'SERVING') {
        const occupancy = await getCurrentBeerAtLocation(v.location_id);
        if (occupancy.conflict) {
          batchName = 'Multiple beers – resolve on Serving page';
          batchStatusLabel = '';
          volumeLabel = '—';
          hasBatch = false;
          batchId = row?.batchId ?? null;
        } else if (occupancy.item) {
          batchName = occupancy.item.name;
          batchStatusLabel = row?.batchStatus ? `Status: ${row.batchStatus}` : '';
          volumeLabel = occupancy.onHand != null ? `${occupancy.onHand} bbl` : '0 bbl';
          hasBatch = !!row?.batchId;
          batchId = row?.batchId ?? null;
        } else {
          batchName = 'Empty';
          batchStatusLabel = '';
          volumeLabel = '0 bbl';
          hasBatch = false;
          batchId = null;
        }
      } else if (row) {
        batchName = row.batchName;
        batchStatusLabel = row.batchStatus ? `Status: ${row.batchStatus}` : 'No batch assigned';
        volumeLabel = row.currentVolume != null ? `${row.currentVolume} ${row.unit}` : '—';
        hasBatch = true;
        batchId = row.batchId;
      } else {
        batchName = 'No batch assigned';
        batchStatusLabel = 'No batch assigned';
        volumeLabel = '—';
        hasBatch = false;
        batchId = null;
      }
      cardsWithTankOnHand.push({
        id: v.id,
        name: v.name,
        type: v.type,
        batchName,
        batchStatusLabel: batchStatusLabel || (hasBatch ? 'No batch assigned' : ''),
        volumeLabel,
        lastLabel: row?.lastSnapshot?.timeLabel || 'No set point',
        locationName,
        hasBatch,
        batchId
      });
    }
    vesselCards.value = cardsWithTankOnHand;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

// No need to clear location_id when type changes - all vessel types can have location

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
  try {
    if (isEditing.value) {
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
    await loadVessels();
    closeModal();
    SyncService.sync();
  } catch (e) {
    alert('Failed to save: ' + e.message);
  }
};

const deleteVessel = async (id) => {
  if (!confirm('Are you sure? This cannot be undone.')) return;
  try {
    await VesselRepository.delete(id);
    await loadVessels();
    SyncService.sync();
  } catch (e) {
    alert('Failed to delete: ' + e.message);
  }
};

onMounted(async () => {
  await loadVessels();
  locations.value = await LocationRepository.getAll();
});
onActivated(loadVessels);
</script>
