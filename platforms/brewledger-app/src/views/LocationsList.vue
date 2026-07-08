<template>
  <div class="p-3 pb-20 space-y-3">
    <div class="flex justify-between items-center">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Locations</h1>
      <router-link to="/locations/add" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md font-bold text-sm flex items-center gap-1">
        <span>+</span> Add
      </router-link>
    </div>

    <div class="grid gap-2">
      <div v-for="loc in locations" :key="loc.id" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md flex items-center justify-center text-base">
            📍
          </div>
          <h3 class="font-bold text-sm text-gray-800 dark:text-gray-100">{{ loc.name }}</h3>
        </div>
        <div>
          <router-link :to="`/locations/${loc.id}/edit`" class="text-gray-400 dark:text-gray-300 hover:text-blue-600 px-2 py-1 rounded text-sm font-medium">
            Edit
          </router-link>
        </div>
      </div>
      
      <div v-if="locations.length === 0" class="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
        No locations defined
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';

const allLocations = ref([]);
const vessels = ref([]);

// Exclude locations bound to non-serving tanks (fermenters, brites, unitanks).
// Show: standalone locations + serving locations (bound to SERVING vessels).
const locations = computed(() => {
  const nonServingTankLocationIds = new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  );
  return (allLocations.value || []).filter((loc) => !nonServingTankLocationIds.has(loc.id));
});

onMounted(async () => {
  const [locList, vesselList] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll()
  ]);
  allLocations.value = locList;
  vessels.value = vesselList;
});
</script>
