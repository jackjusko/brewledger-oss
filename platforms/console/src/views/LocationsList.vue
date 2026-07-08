<template>
  <div class="desktop-container space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-neutral-500 dark:text-stone-400">Storage areas and serving locations</p>
        <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Locations</h1>
      </div>
      <router-link to="/locations/add" class="btn btn-primary inline-flex items-center gap-2">
        <i class="ri-add-line" aria-hidden="true"></i>
        Add Location
      </router-link>
    </div>

    <div v-if="loadError" class="p-3 rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 text-sm">
      Failed to load locations: {{ loadError }}
    </div>

    <div class="bg-white dark:bg-stone-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
      <div class="overflow-x-auto">
        <table class="data-table w-full">
          <thead>
            <tr>
              <th class="w-1/2">Name</th>
              <th>TTB Stage</th>
              <th class="w-28 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="3" class="text-center py-8 text-neutral-500 dark:text-stone-400 text-sm">Loading locations...</td>
            </tr>
            <tr v-else-if="loadError">
              <td colspan="3" class="text-center py-8 text-neutral-500 dark:text-stone-400 text-sm">Unable to load locations. Please retry.</td>
            </tr>
            <template v-else>
              <tr v-for="loc in locations" :key="loc.id">
                <td class="font-medium text-neutral-900 dark:text-neutral-100">{{ loc.name }}</td>
                <td>
                  <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-stone-900/40 text-neutral-800 dark:text-stone-200">
                    <i class="ri-map-pin-2-line text-neutral-500 dark:text-stone-400" aria-hidden="true"></i>
                    {{ stageLabel(loc.stage) }}
                  </span>
                </td>
                <td class="text-right">
                  <router-link :to="`/locations/${loc.id}/edit`" class="text-amber-600 dark:text-amber-400 hover:underline text-sm font-medium">
                    Edit
                  </router-link>
                </td>
              </tr>
              <tr v-if="!locations.length">
                <td colspan="3" class="text-center py-8 text-neutral-500 dark:text-stone-400 text-sm">
                  No locations yet. Create one to start tracking inventory by storage area.
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import { LocationRepository, DEFAULT_STAGE, LOCATION_STAGE_LABELS } from '../repositories/LocationRepository'
import { VesselRepository } from '../repositories/VesselRepository'

const allLocations = ref([])
const vessels = ref([])
const loading = ref(false)
const loadError = ref('')

const stageLabel = (stage) => LOCATION_STAGE_LABELS[stage] || LOCATION_STAGE_LABELS[DEFAULT_STAGE]

// Exclude locations bound to non-serving tanks (fermenters, brites, unitanks).
// Show: standalone locations + serving locations (bound to SERVING vessels).
const locations = computed(() => {
  const nonServingTankLocationIds = new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
  return (allLocations.value || []).filter((loc) => !nonServingTankLocationIds.has(loc.id))
})

const loadLocations = async () => {
  try {
    loading.value = true
    loadError.value = ''
    const [locList, vesselList] = await Promise.all([
      LocationRepository.getAll(),
      VesselRepository.getAll()
    ])
    allLocations.value = locList
    vessels.value = vesselList
  } catch (e) {
    console.error('Failed to load locations', e)
    loadError.value = e?.message || 'Unexpected error'
  } finally {
    loading.value = false
  }
}

onMounted(loadLocations)
</script>
