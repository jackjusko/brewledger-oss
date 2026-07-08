<template>
  <div class="desktop-container">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">{{ isEdit ? 'Edit Template' : 'New Template' }}</h1>
    </div>

    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-6">
        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Template Name</label>
          <input v-model="form.name" type="text" required class="w-full max-w-md px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500" placeholder="e.g. Default">
        </div>

        <div>
          <div class="flex justify-between items-center mb-4">
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-300">Milestones</label>
            <button type="button" @click="addMilestone" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline">+ Add</button>
          </div>
          <div class="space-y-4">
            <div
              v-for="(m, idx) in form.milestones"
              :key="m.id"
              class="p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-700 flex gap-4 items-start"
            >
              <span class="text-neutral-400 dark:text-neutral-500 text-sm mt-2 shrink-0">{{ idx + 1 }}.</span>
              <div class="flex-1 space-y-2">
                <template v-if="isSystemMilestone(m)">
                  <div class="text-sm font-medium text-neutral-700 dark:text-neutral-200">{{ m.label }}</div>
                  <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ m.description || '—' }}</div>
                  <span class="inline-block text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">Required for TTB</span>
                </template>
                <template v-else>
                  <input v-model="m.label" type="text" required class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100" placeholder="Label">
                  <input v-model="m.description" type="text" class="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100 text-sm" placeholder="Description (optional)">
                </template>
              </div>
              <div v-if="!isSystemMilestone(m)" class="flex gap-1 shrink-0">
                <button v-if="idx > 0" type="button" @click="moveUp(idx)" class="px-2 py-1 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400">↑</button>
                <button v-if="idx < form.milestones.length - 1" type="button" @click="moveDown(idx)" class="px-2 py-1 text-neutral-500 hover:text-primary-600 dark:hover:text-primary-400">↓</button>
                <button v-if="form.milestones.length > 1" type="button" @click="removeMilestone(idx)" class="px-2 py-1 text-danger-500 hover:text-danger-700 dark:hover:text-danger-400">✕</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-4">
        <button type="button" @click="$router.back()" class="px-6 py-3 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl font-bold">
          Cancel
        </button>
        <button type="submit" class="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold">
          {{ isEdit ? 'Save' : 'Create' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MilestoneTemplateRepository, PRODUCTION_COMPLETE_LABEL, FORCED_LAST_MILESTONE } from '../repositories/MilestoneTemplateRepository'
import { SyncService } from '../services/SyncService'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => !!route.params.id && route.params.id !== 'add')

const isSystemMilestone = (m) => m && (m.is_system === true || m.label === PRODUCTION_COMPLETE_LABEL)

const normalizeMilestones = (list) => {
  const source = Array.isArray(list) ? list : []
  const forcedSource = source.find(isSystemMilestone)
  const userMilestones = source
    .filter(m => !isSystemMilestone(m))
    .map((m, i) => ({
      id: m.id || uuidv4(),
      label: m.label || '',
      description: m.description || '',
      sort_order: m.sort_order ?? i
    }))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const forced = forcedSource
    ? {
        ...forcedSource,
        id: forcedSource.id || uuidv4(),
        label: PRODUCTION_COMPLETE_LABEL,
        description: (forcedSource.description || FORCED_LAST_MILESTONE.description) ?? '',
        is_system: true
      }
    : { id: uuidv4(), ...FORCED_LAST_MILESTONE }

  return [...userMilestones, { ...forced, sort_order: userMilestones.length }]
}

const form = reactive({
  name: '',
  milestones: [
    { id: uuidv4(), label: '', description: '', sort_order: 0 },
    { id: uuidv4(), ...FORCED_LAST_MILESTONE, sort_order: 1 }
  ]
})

const addMilestone = () => {
  const insertIndex = form.milestones.findIndex(isSystemMilestone)
  const newMilestone = {
    id: uuidv4(),
    label: '',
    description: '',
    sort_order: form.milestones.length
  }

  if (insertIndex === -1) {
    form.milestones.push(newMilestone)
  } else {
    // Always insert before the forced Production Complete milestone
    form.milestones.splice(insertIndex, 0, newMilestone)
  }
}

const removeMilestone = (idx) => {
  if (isSystemMilestone(form.milestones[idx])) return
  form.milestones.splice(idx, 1)
}

const moveUp = (idx) => {
  if (idx <= 0 || isSystemMilestone(form.milestones[idx])) return
  [form.milestones[idx - 1], form.milestones[idx]] = [form.milestones[idx], form.milestones[idx - 1]]
}

const moveDown = (idx) => {
  if (idx >= form.milestones.length - 1 || isSystemMilestone(form.milestones[idx])) return
  if (isSystemMilestone(form.milestones[idx + 1])) return
  [form.milestones[idx], form.milestones[idx + 1]] = [form.milestones[idx + 1], form.milestones[idx]]
}

onMounted(async () => {
  if (isEdit.value) {
    const t = await MilestoneTemplateRepository.getById(route.params.id)
    if (t) {
      form.name = t.name || ''
      form.milestones = normalizeMilestones(t.milestones || [])
    }
  }
})

const save = async () => {
  const userWithLabel = form.milestones.filter(m => m.label?.trim() && !isSystemMilestone(m))
  if (userWithLabel.length === 0) {
    window.alert('Add at least one milestone with a label (besides the required "Production Complete").')
    return
  }
  const milestones = form.milestones
    .filter(m => m.label?.trim())
    .map((m, i) => ({ id: m.id, label: m.label.trim(), description: (m.description || '').trim(), sort_order: i, is_system: m.is_system || false }))

  try {
    if (isEdit.value) {
      await MilestoneTemplateRepository.update(route.params.id, { name: form.name.trim(), milestones })
    } else {
      await MilestoneTemplateRepository.create({ name: form.name.trim(), milestones })
    }
    await SyncService.sync()
    router.replace('/milestone-templates')
  } catch (e) {
    window.alert('Failed to save: ' + e.message)
  }
}
</script>
