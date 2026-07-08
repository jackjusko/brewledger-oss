<template>
  <div class="p-4 pb-24 space-y-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">Milestone Templates</h1>
    <p class="text-sm text-gray-600 dark:text-gray-400">Manage milestone checklists that can be assigned to batches when creating them.</p>

    <div class="space-y-3">
      <router-link to="/milestone-templates/add" class="block w-full p-4 bg-purple-600 text-white rounded-xl font-bold text-center hover:bg-purple-700">
        + Create Template
      </router-link>

      <div v-if="loading" class="py-8 text-center text-gray-500 dark:text-gray-400">Loading...</div>
      <div v-else-if="templates.length === 0" class="py-8 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
        No templates yet. Create one to get started.
      </div>
      <div v-else class="space-y-2">
        <div
          v-for="t in templates"
          :key="t.id"
          class="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center"
        >
          <div>
            <div class="font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
              {{ t.name }}
              <span v-if="t.is_default" class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Org default</span>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">{{ (t.milestones || []).length }} milestones</div>
          </div>
          <div class="flex gap-2">
            <button
              v-if="!t.is_default"
              @click="setAsDefault(t)"
              class="px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
            >
              Set as default
            </button>
            <router-link :to="`/milestone-templates/${t.id}/edit`" class="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
              Edit
            </router-link>
            <button
              v-if="templates.length > 1"
              @click="deleteTemplate(t)"
              class="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { MilestoneTemplateRepository } from '../repositories/MilestoneTemplateRepository';
import { SyncService } from '../services/SyncService';
import { inject } from 'vue';

const router = useRouter();
const providedModal = inject('modal', null);
const showConfirm = providedModal?.confirm ?? ((title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm?.(); });
const showAlert = providedModal?.alert ?? ((title, message) => window.alert(`${title}: ${message}`));

const loading = ref(true);
const templates = ref([]);

const loadData = async () => {
  loading.value = true;
  templates.value = await MilestoneTemplateRepository.getAll();
  loading.value = false;
};

const setAsDefault = async (t) => {
  try {
    await MilestoneTemplateRepository.setAsDefault(t.id);
    await loadData();
    SyncService.sync();
    showAlert('Default updated', `"${t.name}" is now the org default for new batches.`, 'success');
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

const deleteTemplate = (t) => {
  showConfirm(
    'Delete Template',
    `Delete "${t.name}"? Batches using this template will keep their milestones.`,
    async () => {
      try {
        await MilestoneTemplateRepository.delete(t.id);
        await loadData();
        SyncService.sync();
      } catch (e) {
        showAlert('Error', e.message, 'danger');
      }
    },
    'danger',
    'Delete'
  );
};

onMounted(loadData);
</script>
