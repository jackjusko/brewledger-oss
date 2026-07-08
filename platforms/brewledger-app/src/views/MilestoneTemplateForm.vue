<template>
  <div class="p-4 pb-24 space-y-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">{{ isEdit ? 'Edit Template' : 'New Template' }}</h1>

    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">Template Name</label>
          <input v-model="form.name" type="text" required class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none" placeholder="e.g. Default">
        </div>

        <div>
          <div class="flex justify-between items-center mb-2">
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-200">Milestones</label>
            <button type="button" @click="addMilestone" class="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">+ Add</button>
          </div>
          <div class="space-y-3">
            <div
              v-for="(m, idx) in form.milestones"
              :key="m.id"
              class="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 flex gap-2 items-start"
            >
              <span class="text-gray-400 dark:text-gray-500 text-sm mt-2 shrink-0">{{ idx + 1 }}.</span>
              <div class="flex-1 space-y-2">
                <template v-if="isSystemMilestone(m)">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-200">{{ m.label }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ m.description || '—' }}</div>
                  <span class="inline-block text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">Required for TTB</span>
                </template>
                <template v-else>
                  <input v-model="m.label" type="text" required class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-sm" placeholder="Label">
                  <input v-model="m.description" type="text" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white text-xs" placeholder="Description (optional)">
                </template>
              </div>
              <div v-if="!isSystemMilestone(m)" class="flex gap-1 shrink-0">
                <button v-if="idx > 0" type="button" @click="moveUp(idx)" class="p-2 text-gray-500 hover:text-blue-600">↑</button>
                <button v-if="idx < form.milestones.length - 1" type="button" @click="moveDown(idx)" class="p-2 text-gray-500 hover:text-blue-600">↓</button>
                <button v-if="form.milestones.length > 1" type="button" @click="removeMilestone(idx)" class="p-2 text-red-500 hover:text-red-700">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="$router.back()" class="px-6 py-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl font-bold">
          Cancel
        </button>
        <button type="submit" class="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold">
          {{ isEdit ? 'Save' : 'Create' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { MilestoneTemplateRepository, PRODUCTION_COMPLETE_LABEL, FORCED_LAST_MILESTONE } from '../repositories/MilestoneTemplateRepository';
import { SyncService } from '../services/SyncService';
import { v4 as uuidv4 } from 'uuid';

const route = useRoute();
const router = useRouter();
const isEdit = computed(() => !!route.params.id && route.params.id !== 'add');

const isSystemMilestone = (m) => m && (m.is_system === true || m.label === PRODUCTION_COMPLETE_LABEL);

const form = reactive({
  name: '',
  milestones: [
    { id: uuidv4(), label: '', description: '', sort_order: 0 },
    { id: uuidv4(), ...FORCED_LAST_MILESTONE, sort_order: 1 }
  ]
});

const addMilestone = () => {
  form.milestones.push({
    id: uuidv4(),
    label: '',
    description: '',
    sort_order: form.milestones.length
  });
};

const removeMilestone = (idx) => {
  if (isSystemMilestone(form.milestones[idx])) return;
  form.milestones.splice(idx, 1);
};

const moveUp = (idx) => {
  if (idx <= 0 || isSystemMilestone(form.milestones[idx])) return;
  [form.milestones[idx - 1], form.milestones[idx]] = [form.milestones[idx], form.milestones[idx - 1]];
};

const moveDown = (idx) => {
  if (idx >= form.milestones.length - 1 || isSystemMilestone(form.milestones[idx])) return;
  [form.milestones[idx], form.milestones[idx + 1]] = [form.milestones[idx + 1], form.milestones[idx]];
};

onMounted(async () => {
  if (isEdit.value) {
    const t = await MilestoneTemplateRepository.getById(route.params.id);
    if (t) {
      form.name = t.name || '';
      form.milestones = (t.milestones || []).map((m, i) => ({
        id: m.id || uuidv4(),
        label: m.label || '',
        description: m.description || '',
        sort_order: m.sort_order ?? i
      }));
      if (form.milestones.length === 0) form.milestones = [{ id: uuidv4(), label: '', description: '', sort_order: 0 }];
    }
  }
});

const save = async () => {
  const userWithLabel = form.milestones.filter(m => m.label?.trim() && !isSystemMilestone(m));
  if (userWithLabel.length === 0) {
    alert('Add at least one milestone with a label (besides the required "Production Complete").');
    return;
  }
  const milestones = form.milestones
    .filter(m => m.label?.trim())
    .map((m, i) => ({ id: m.id, label: m.label.trim(), description: (m.description || '').trim(), sort_order: i, is_system: m.is_system || false }));

  try {
    if (isEdit.value) {
      await MilestoneTemplateRepository.update(route.params.id, { name: form.name.trim(), milestones });
    } else {
      await MilestoneTemplateRepository.create({ name: form.name.trim(), milestones });
    }
    await SyncService.sync();
    router.replace('/milestone-templates');
  } catch (e) {
    alert('Failed to save: ' + e.message);
  }
};
</script>
