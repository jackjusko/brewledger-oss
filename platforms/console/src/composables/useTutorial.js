import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  TUTORIAL_STORAGE_KEY_PREFIX,
  TUTORIAL_STEPS,
  getStepForRoute,
  getStepById,
  getNextRoute,
  getPrevRoute,
  getPrevStepId,
  getResumeRoute,
} from '../services/tutorial/tutorialSteps'

const defaultProgress = () => ({
  completed: [],
  skipped: [],
  systemCheckPassed: false,
  startedAt: null,
})

function storageKey(orgId, userId) {
  if (!orgId || !userId) return null
  return `${TUTORIAL_STORAGE_KEY_PREFIX}${orgId}_${userId}`
}

function loadProgress(orgId, userId) {
  const key = storageKey(orgId, userId)
  if (!key) return defaultProgress()
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultProgress()
    const parsed = JSON.parse(raw)
    return {
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [],
      systemCheckPassed: !!parsed.systemCheckPassed,
      startedAt: parsed.startedAt || null,
    }
  } catch {
    return defaultProgress()
  }
}

function saveProgress(orgId, userId, progress) {
  const key = storageKey(orgId, userId)
  if (!key) return
  try {
    localStorage.setItem(key, JSON.stringify(progress))
  } catch (e) {
    console.warn('Tutorial progress save failed', e)
  }
}

/** Run a quick check that localStorage (and optionally basic features) work. */
export function runSystemCheck() {
  try {
    const testKey = 'tutorial_check_' + Date.now()
    localStorage.setItem(testKey, '1')
    const ok = localStorage.getItem(testKey) === '1'
    localStorage.removeItem(testKey)
    return ok
  } catch {
    return false
  }
}

export function useTutorial(orgIdRef, userIdRef) {
  const route = useRoute()
  const router = useRouter()

  const isActive = ref(false)
  const progress = ref(defaultProgress())

  function getIds() {
    const o = typeof orgIdRef === 'function' ? orgIdRef() : orgIdRef?.value
    const u = typeof userIdRef === 'function' ? userIdRef() : userIdRef?.value
    return { orgId: o, userId: u }
  }

  function persist() {
    const { orgId, userId } = getIds()
    if (orgId && userId) {
      progress.value = { ...progress.value }
      saveProgress(orgId, userId, progress.value)
    }
  }

  function load() {
    const { orgId, userId } = getIds()
    if (orgId && userId) {
      progress.value = loadProgress(orgId, userId)
    } else {
      progress.value = defaultProgress()
    }
  }

  const currentStep = computed(() => {
    const path = (route.path && String(route.path).replace(/\/+$/, '')) || '/'
    const query = route.query || {}
    const completed = progress.value.completed || []
    const skipped = progress.value.skipped || []
    return getStepForRoute(path, query, completed, skipped)
  })

  const currentStepProgress = computed(() => {
    const step = currentStep.value
    if (!step) return null
    const completed = progress.value.completed.includes(step.id)
    const skipped = progress.value.skipped.includes(step.id)
    return { step, completed, skipped }
  })

  const canAdvance = computed(() => {
    const step = currentStep.value
    if (!step) return true
    if (step.requiredCheck === 'system_check') {
      return progress.value.systemCheckPassed
    }
    return true
  })

  const validStepIds = new Set(TUTORIAL_STEPS.map((s) => s.id))

  const progressSummary = computed(() => {
    const total = TUTORIAL_STEPS.length
    const completed = (progress.value.completed || []).filter((id) => validStepIds.has(id))
    const skipped = (progress.value.skipped || []).filter((id) => validStepIds.has(id))
    const done = completed.length + skipped.length
    const percent = total ? Math.min(100, Math.round((done / total) * 100)) : 0
    return { total, completed: completed.length, skipped: skipped.length, done, percent }
  })

  const nextRoute = computed(() => {
    const p = currentStepProgress.value
    if (!p || (!p.completed && !p.skipped)) return null
    return getNextRoute(p.step.id)
  })

  /** When current route doesn't match any step, use this to show "Continue tour" so the shell never disappears. */
  const resumeRoute = computed(() => {
    const completed = progress.value.completed || []
    const skipped = progress.value.skipped || []
    return getResumeRoute(completed, skipped)
  })

  const prevRoute = computed(() => {
    const step = currentStep.value
    if (!step) return null
    return getPrevRoute(step.id)
  })

  function start() {
    isActive.value = true
    progress.value.startedAt = progress.value.startedAt || new Date().toISOString()
    persist()
  }

  function exit() {
    isActive.value = false
    persist()
  }

  function markStepComplete(stepId) {
    if (!progress.value.completed.includes(stepId)) {
      progress.value.completed = [...progress.value.completed, stepId]
      persist()
    }
  }

  function markSkipped(stepId) {
    if (!progress.value.skipped.includes(stepId)) {
      progress.value.skipped = [...progress.value.skipped, stepId]
      persist()
    }
  }

  function passSystemCheck() {
    progress.value.systemCheckPassed = true
    persist()
  }

  function reset() {
    progress.value = defaultProgress()
    persist()
  }

  function finishTour() {
    reset()
    exit()
  }

  function goToNextStep() {
    const step = currentStep.value
    if (!step) return
    markStepComplete(step.id)
    const nextPath = getNextRoute(step.id)
    if (nextPath) {
      router.push(nextPath)
    } else {
      // Last step (ttb_form): end tour and reset state so next "Take the tour" starts fresh
      finishTour()
    }
  }

  function skipCurrentStep() {
    const step = currentStep.value
    if (!step) return
    markSkipped(step.id)
    const nextPath = getNextRoute(step.id)
    if (nextPath) {
      router.push(nextPath)
    } else {
      finishTour()
    }
  }

  function uncompleteStep(stepId) {
    progress.value.completed = (progress.value.completed || []).filter((id) => id !== stepId)
    progress.value.skipped = (progress.value.skipped || []).filter((id) => id !== stepId)
    persist()
  }

  function goToPrevStep() {
    const step = currentStep.value
    if (!step) return
    const prevStepId = getPrevStepId(step.id)
    const prevPath = getPrevRoute(step.id)
    if (prevStepId && prevPath) {
      uncompleteStep(prevStepId)
      router.push(prevPath)
    }
  }

  load()

  watch(
    () => [getIds().orgId, getIds().userId],
    () => load()
  )

  return {
    isActive,
    progress: computed(() => progress.value),
    currentStep,
    currentStepProgress,
    canAdvance,
    progressSummary,
    nextRoute,
    prevRoute,
    resumeRoute,
    start,
    exit,
    markStepComplete,
    markSkipped,
    passSystemCheck,
    reset,
    goToNextStep,
    goToPrevStep,
    skipCurrentStep,
    load,
  }
}
