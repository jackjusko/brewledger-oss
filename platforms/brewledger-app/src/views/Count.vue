<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Count</h1>
    
    <div class="space-y-3">
      <p class="text-sm text-gray-600 dark:text-gray-300">Select location to count</p>
      
      <div class="grid gap-2">
        <button v-for="loc in locations" :key="loc.id" @click="startSession(loc.id)" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:border-green-300 text-left">
          <div class="flex items-center gap-2">
             <div class="w-8 h-8 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-md flex items-center justify-center text-base">
               📍
             </div>
             <span class="font-bold text-sm text-gray-800 dark:text-gray-100">{{ loc.name }}</span>
          </div>
          <span class="text-green-600 dark:text-green-400 font-bold text-sm">Start →</span>
        </button>
      </div>
      
      <div v-if="locations.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm">
        No locations defined
      </div>
    </div>
    
    <ModalDialog 
      :isOpen="modal.isOpen" 
      :title="modal.title" 
      :message="modal.message" 
      :type="modal.type" 
      :variant="modal.variant"
      :confirmText="modal.confirmText"
      @confirm="modal.onConfirm" 
      @cancel="modal.isOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { LocationRepository } from '../repositories/LocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { CountSessionRepository } from '../repositories/CountSessionRepository';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const router = useRouter();
const allLocations = ref([]);
const vessels = ref([]);

const nonServingTankLocationIds = computed(() =>
  new Set(
    (vessels.value || [])
      .filter((v) => v.location_id && (v.type || '').toUpperCase() !== 'SERVING')
      .map((v) => v.location_id)
  )
);

const locations = computed(() =>
  (allLocations.value || []).filter((l) => !l.deleted_at && !nonServingTankLocationIds.value.has(l.id))
);

onMounted(async () => {
  const [locsList, vesselsList] = await Promise.all([
    LocationRepository.getAll(),
    VesselRepository.getAll()
  ]);
  allLocations.value = locsList || [];
  vessels.value = vesselsList || [];
});

const startSession = async (locationId) => {
  // Check for existing open session
  const openSession = await CountSessionRepository.getOpenSession(locationId);
  if (openSession) {
    showConfirm('Resume Session', 'Resume existing open count session for this location?', () => {
      router.push(`/count/${locationId}`);
    }, 'primary', 'Resume');
    return;
  }

  // Create new session
  await CountSessionRepository.create({ location_id: locationId });
  router.push(`/count/${locationId}`);
};
</script>
