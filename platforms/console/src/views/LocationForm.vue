<template>
  <div class="desktop-container space-y-6">
    <nav class="mb-2" aria-label="Breadcrumb">
      <router-link to="/locations" class="inline-flex items-center gap-2 text-sm text-neutral-500 dark:text-stone-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
        <i class="ri-arrow-left-line" aria-hidden="true"></i>
        Locations
      </router-link>
    </nav>

    <div class="bg-white dark:bg-stone-800 p-6 rounded-xl border border-neutral-200 dark:border-stone-700 space-y-5">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-neutral-500 dark:text-stone-400">{{ isEdit ? 'Update name or TTB stage' : 'Create a location to track inventory' }}</p>
          <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{{ isEdit ? 'Edit Location' : 'Add Location' }}</h1>
        </div>
        <span v-if="isEdit" class="px-3 py-1 rounded-full text-sm bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300 border border-neutral-200 dark:border-stone-700">
          Editing
        </span>
      </div>

      <p class="text-sm text-neutral-500 dark:text-stone-400">
        A location is just a spot in your facility where things are kept. Give it a name so you can track inventory there.
      </p>

      <form @submit.prevent="save" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">Name</label>
            <input
              v-model="form.name"
              required
              :disabled="loading"
              class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="e.g. Cold Room"
            />
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">Will this location hold any finished beer products?</label>
            <p class="text-sm text-neutral-500 dark:text-stone-400 mb-2">Yes if any full kegs, cases, etc. will be stored here; No if it's just raw materials. If you're not sure or you may store finished beer products there in the future, pick Yes.</p>
            <div class="flex gap-4 mt-2">
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="holdsBeer" :value="true" :disabled="loading" class="rounded-full border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500" />
                <span class="text-sm text-neutral-700 dark:text-stone-300">Yes</span>
              </label>
              <label class="inline-flex items-center gap-2 cursor-pointer">
                <input type="radio" v-model="holdsBeer" :value="false" :disabled="loading" class="rounded-full border-neutral-300 dark:border-neutral-600 text-primary-600 focus:ring-primary-500" />
                <span class="text-sm text-neutral-700 dark:text-stone-300">No</span>
              </label>
            </div>
          </div>
        </div>

        <div v-if="holdsBeer === true" class="space-y-4">
          <div class="p-4 rounded-lg bg-neutral-50 dark:bg-stone-900/50 border border-neutral-200 dark:border-stone-700">
            <p class="text-sm font-medium text-neutral-800 dark:text-stone-200 mb-2">TTB Stage — what this is</p>
            <p class="text-sm text-neutral-600 dark:text-stone-400">
              This is for your TTB-required record keeping. The TTB requires brewers to report where beer is stored by category. We use this to fill out your Form 5130.9 correctly.
            </p>
            <p class="text-sm font-medium text-neutral-800 dark:text-stone-200 mt-3 mb-1">What to put</p>
            <p class="text-sm text-neutral-600 dark:text-stone-400">
              Select the category that best matches where beer is stored at this location. If you're not sure, choose Cellar (bulk). Items can still go in this location and work normally—this only affects how we report inventory for TTB.
            </p>
            <p class="text-xs text-neutral-500 dark:text-stone-400 mt-2">
              Stage is used for inventory at rest (TTB Lines 1 and 33). For movements (transfers, removals), the operation type determines the TTB column.
            </p>
          </div>
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-stone-300 mb-2">TTB Stage</label>
            <select
              v-model="form.stage"
              :disabled="loading"
              class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option v-for="stage in stageOptions" :key="stage.value" :value="stage.value">
                {{ stage.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex gap-3">
          <button type="submit" class="btn btn-primary" :disabled="saving || loading">{{ saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Location' }}</button>
          <button type="button" class="btn btn-secondary" @click="$router.back()">Cancel</button>
        </div>
      </form>
    </div>

    <div v-if="isEdit" class="bg-white dark:bg-stone-800 p-6 rounded-xl border border-neutral-200 dark:border-stone-700">
      <h2 class="text-lg font-bold text-danger-600 dark:text-danger-400 mb-3">Delete Location</h2>
      <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">This will clear inventory at this location by creating CONSUME entries.</p>
      <button @click="remove" :disabled="saving || loading" class="px-4 py-2 text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed">Delete Location</button>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LocationRepository, DEFAULT_STAGE, LOCATION_STAGES, LOCATION_STAGE_LABELS } from '../repositories/LocationRepository'

const route = useRoute()
const router = useRouter()

const providedModal = inject('modal', null)
const showConfirm = providedModal?.confirm ?? ((title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm?.() })
const showAlert = providedModal?.alert ?? ((title, message) => window.alert(`${title}: ${message}`))

const isEdit = computed(() => !!route.params.id)
const saving = ref(false)
const loading = ref(false)
const holdsBeer = ref(null)

const form = ref({
  name: '',
  stage: DEFAULT_STAGE
})

const stageOptions = LOCATION_STAGES.map((value) => ({
  value,
  label: LOCATION_STAGE_LABELS[value] || value
}))

const load = async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const loc = await LocationRepository.getById(route.params.id)
    if (loc) {
      const safeStage = LOCATION_STAGES.includes(loc.stage) ? loc.stage : DEFAULT_STAGE
      form.value = { name: loc.name, stage: safeStage }
      holdsBeer.value = true
    } else {
      showAlert('Not found', 'Location could not be loaded')
      router.push('/locations')
    }
  } finally {
    loading.value = false
  }
}

onMounted(load)

const cleanStage = (stage) => (LOCATION_STAGES.includes(stage) ? stage : DEFAULT_STAGE)

const save = async () => {
  const trimmedName = (form.value.name || '').trim()
  if (!trimmedName) {
    showAlert('Validation', 'Location name is required')
    return
  }
  if (!isEdit.value && holdsBeer.value === null) {
    showAlert('Validation', 'Please answer whether this location will hold finished beer products.')
    return
  }
  const stage = holdsBeer.value === false ? DEFAULT_STAGE : cleanStage(form.value.stage)
  const payload = {
    name: trimmedName,
    stage
  }
  saving.value = true
  try {
    if (isEdit.value) {
      await LocationRepository.update(route.params.id, payload)
    } else {
      await LocationRepository.create(payload)
    }
    router.push('/locations')
  } catch (e) {
    showAlert('Error', e.message || 'Failed to save location')
  } finally {
    saving.value = false
  }
}

const remove = () => {
  showConfirm(
    'Delete Location',
    'Are you sure? This will remove all items from this location (set quantity to zero).',
    async () => {
      try {
        await LocationRepository.delete(route.params.id)
        router.push('/locations')
      } catch (e) {
        showAlert('Error', e.message || 'Failed to delete location')
      }
    }
  )
}
</script>
