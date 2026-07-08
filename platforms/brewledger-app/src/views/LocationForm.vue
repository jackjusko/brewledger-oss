<template>
  <div class="p-3 pb-20">
    <h1 class="text-xl font-bold mb-3 text-gray-900 dark:text-gray-50">{{ isEdit ? 'Edit location' : 'Add location' }}</h1>

    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
      A location is just a spot in your facility where things are kept. Give it a name so you can track inventory there.
    </p>

    <form @submit.prevent="save" class="space-y-3">
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Name</label>
        <input v-model="form.name" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Will this location hold any finished beer products?</label>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">Yes if any full kegs, cases, etc. will be stored here; No if it's just raw materials. If you're not sure or you may store finished beer products there in the future, pick Yes.</p>
        <div class="flex gap-4 mt-2">
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="holdsBeer" :value="true" class="rounded-full border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Yes</span>
          </label>
          <label class="inline-flex items-center gap-2 cursor-pointer">
            <input type="radio" v-model="holdsBeer" :value="false" class="rounded-full border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">No</span>
          </label>
        </div>
      </div>

      <div v-if="holdsBeer === true" class="space-y-3">
        <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">TTB Stage — what this is</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            This is for your TTB-required record keeping. The TTB requires brewers to report where beer is stored by category. We use this to fill out your Form 5130.9 correctly.
          </p>
          <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-2 mb-1">What to put</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Select the category that best matches where beer is stored at this location. If you're not sure, choose Cellar (bulk). Items can still go in this location and work normally—this only affects how we report inventory for TTB.
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Stage is used for inventory at rest (TTB Lines 1 and 33). For movements (transfers, removals), the operation type determines the TTB column.
          </p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">TTB Stage</label>
          <select v-model="form.stage" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 dark:text-white text-sm">
            <option v-for="stage in stageOptions" :key="stage.value" :value="stage.value">
              {{ stage.label }}
            </option>
          </select>
        </div>
      </div>

      <div class="pt-2 flex gap-2">
        <button type="submit" class="flex-1 bg-blue-600 text-white py-2 rounded-md font-bold text-sm">Save</button>
        <button type="button" @click="$router.back()" class="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md text-sm">Cancel</button>
      </div>

      <div v-if="isEdit" class="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button type="button" @click="remove" class="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-md font-bold text-sm">Delete location</button>
      </div>
    </form>
    
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
import { useRoute, useRouter } from 'vue-router';
import { LocationRepository } from '../repositories/LocationRepository';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';
import { DEFAULT_STAGE, LOCATION_STAGES, LOCATION_STAGE_LABELS } from '../repositories/LocationRepository';

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id);

const holdsBeer = ref(null);
const form = ref({
  name: '',
  stage: DEFAULT_STAGE
});

const stageOptions = LOCATION_STAGES.map((value) => ({
  value,
  label: LOCATION_STAGE_LABELS[value] || value
}));

const cleanStage = (stage) => (LOCATION_STAGES.includes(stage) ? stage : DEFAULT_STAGE);

onMounted(async () => {
  if (isEdit.value) {
    const loc = await LocationRepository.getById(route.params.id);
    if (loc) {
      form.value = { name: loc.name, stage: loc.stage || DEFAULT_STAGE };
      holdsBeer.value = true;
    }
  }
});

const save = async () => {
  try {
    const trimmedName = (form.value.name || '').trim();
    if (!trimmedName) {
      showAlert('Validation', 'Location name is required', 'warning');
      return;
    }
    if (!isEdit.value && holdsBeer.value === null) {
      showAlert('Validation', 'Please answer whether this location will hold finished beer products.', 'warning');
      return;
    }
    const stage = holdsBeer.value === false ? DEFAULT_STAGE : cleanStage(form.value.stage);
    const payload = { name: trimmedName, stage };
    if (isEdit.value) {
      await LocationRepository.update(route.params.id, payload);
    } else {
      await LocationRepository.create(payload);
    }
    router.back();
  } catch (e) {
    showAlert('Error', e.message, 'warning');
  }
};

const remove = async () => {
  showConfirm('Delete Location', 'Are you sure? This will remove all items from this location (set quantity to zero).', async () => {
    try {
      await LocationRepository.delete(route.params.id);
      router.back();
    } catch (e) {
      showAlert('Error', e.message, 'danger');
    }
  }, 'danger', 'Delete & Clear Inventory');
};
</script>
