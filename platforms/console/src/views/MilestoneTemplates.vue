<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Milestone templates</h4>
        <p class="text-sm text-neutral-600 dark:text-stone-400 mt-0.5">
          Define checkpoints or stages for your batches—knockout, fermentation, cold crash, packaging, and so on. Create templates that match your process, then assign them to batches so you can track where each batch is in the workflow.
        </p>
      </div>
      <div class="console-toolbar-actions">
        <router-link to="/milestone-templates/add" class="btn btn-primary inline-flex items-center gap-2 shrink-0">
          <i class="ri-add-line" aria-hidden="true"></i>
          Create Template
        </router-link>
      </div>
    </div>

    <div class="space-y-6">
      <div
        v-if="feedback"
        class="flex items-center justify-between gap-4 p-4 rounded-xl border"
        :class="feedback.type === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border-success-200 dark:border-success-700' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 border-danger-200 dark:border-danger-700'"
      >
        <span>{{ feedback.text }}</span>
        <button
          type="button"
          @click="feedback = null"
          class="shrink-0 p-1 rounded-lg opacity-70 hover:opacity-100 transition"
          :class="feedback.type === 'success' ? 'hover:bg-success-100 dark:hover:bg-success-900/40' : 'hover:bg-danger-100 dark:hover:bg-danger-900/40'"
          aria-label="Dismiss"
        >
          ✕
        </button>
      </div>

      <div v-if="loading" class="py-12 text-center text-neutral-500 dark:text-stone-400">Loading...</div>
      <div v-else-if="templates.length === 0" class="py-12 text-center text-neutral-500 dark:text-stone-400 bg-neutral-50 dark:bg-stone-900/50 rounded-xl border border-neutral-200 dark:border-stone-700">
        No templates yet. Create one to get started.
      </div>
      <div v-else class="grid gap-4">
        <div
          v-for="t in templates"
          :key="t.id"
          class="p-6 bg-white dark:bg-stone-800 rounded-xl border border-neutral-200 dark:border-stone-700 flex justify-between items-center"
        >
          <div>
            <div class="font-bold text-neutral-900 dark:text-stone-100 text-lg flex items-center gap-2">
              {{ t.name }}
              <span v-if="t.is_default" class="px-2 py-0.5 text-xs font-medium rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">Org default</span>
            </div>
            <div class="text-sm text-neutral-500 dark:text-stone-400">{{ (t.milestones || []).length }} milestones</div>
          </div>
          <div class="flex gap-3">
            <button
              v-if="!t.is_default"
              @click="setAsDefault(t)"
              class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg"
            >
              Set as default
            </button>
            <router-link :to="`/milestone-templates/${t.id}/edit`" class="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
              Edit
            </router-link>
            <button
              v-if="templates.length > 1"
              @click="deleteTemplate(t)"
              class="px-4 py-2 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg"
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
import { ref, onMounted, watch } from 'vue'
import { MilestoneTemplateRepository } from '../repositories/MilestoneTemplateRepository'
import { SyncService } from '../services/SyncService'
import { useSync } from '../composables/useSync'

const loading = ref(true)
const templates = ref([])
const feedback = ref(null)
let feedbackTimeout = null
const { syncTrigger } = useSync()

const showFeedback = (type, text, autoClearMs = 4000) => {
  if (feedbackTimeout) clearTimeout(feedbackTimeout)
  feedback.value = { type, text }
  feedbackTimeout = setTimeout(() => {
    feedback.value = null
    feedbackTimeout = null
  }, autoClearMs)
}

const loadData = async () => {
  loading.value = true
  templates.value = await MilestoneTemplateRepository.getAll()
  loading.value = false
}

const setAsDefault = async (t) => {
  try {
    await MilestoneTemplateRepository.setAsDefault(t.id)
    await loadData()
    SyncService.sync()
    showFeedback('success', `"${t.name}" is now the org default for new batches.`)
  } catch (e) {
    showFeedback('error', 'Error: ' + e.message, 6000)
  }
}

const deleteTemplate = (t) => {
  if (!window.confirm(`Delete "${t.name}"? Batches using this template will keep their milestones.`)) return
  MilestoneTemplateRepository.delete(t.id).then(() => {
    loadData()
    SyncService.sync()
  }).catch(e => {
    window.alert('Error: ' + e.message)
  })
}

onMounted(loadData)

watch(syncTrigger, () => {
  loadData()
})
</script>
