<template>
  <div v-if="isActive" class="tutorial-shell">
    <div class="tutorial-shell-inner">
      <TutorialProgressBar :summary="progressSummary" class="mb-4" />
      <TutorialStepCard
        v-if="showCard && currentStepProgress?.step"
        :step="currentStepProgress.step"
        :can-advance="canAdvance"
        :system-check-passed="systemCheckPassed"
        :prev-route="prevRoute"
        @got-it="onGotIt"
        @skip="onSkip"
        @exit="onExit"
        @run-check="onRunCheck"
        @back="onBack"
      />
      <div v-else-if="nextRoute" class="tutorial-next-hint flex items-center justify-between gap-3 mt-2 flex-wrap">
        <button v-if="prevRoute" type="button" class="btn btn-secondary text-sm inline-flex items-center gap-1.5" @click="onBack">
          <i class="ri-arrow-left-line" aria-hidden="true"></i>
          Back
        </button>
        <span class="text-sm text-neutral-600 dark:text-neutral-400 flex-1 min-w-0">Step done here. Next:</span>
        <button type="button" class="btn btn-primary text-sm" @click="goToNext(nextRoute)">Continue tour</button>
      </div>
      <div v-else-if="resumeRoute" class="tutorial-next-hint flex items-center justify-between gap-3 mt-2 flex-wrap">
        <button v-if="prevRoute" type="button" class="btn btn-secondary text-sm inline-flex items-center gap-1.5" @click="onBack">
          <i class="ri-arrow-left-line" aria-hidden="true"></i>
          Back
        </button>
        <span class="text-sm text-neutral-600 dark:text-neutral-400 flex-1 min-w-0">Continue the tour:</span>
        <button type="button" class="btn btn-primary text-sm" @click="goToNext(resumeRoute)">Continue tour</button>
      </div>
      <div v-else class="tutorial-complete flex flex-col gap-3 mt-2">
        <p class="text-sm text-neutral-600 dark:text-neutral-400">You've completed the tour.</p>
        <button type="button" class="btn btn-primary text-sm" @click="onExit">Close</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import TutorialProgressBar from './TutorialProgressBar.vue'
import TutorialStepCard from './TutorialStepCard.vue'

const router = useRouter()

const props = defineProps({
  isActive: { type: Boolean, default: false },
  currentStepProgress: { type: Object, default: null },
  canAdvance: { type: Boolean, default: true },
  progressSummary: { type: Object, required: true },
  systemCheckPassed: { type: Boolean, default: false },
  nextRoute: { type: String, default: null },
  prevRoute: { type: String, default: null },
  resumeRoute: { type: String, default: null },
})

const emit = defineEmits(['got-it', 'skip', 'exit', 'run-check', 'back'])

const showCard = computed(() => {
  if (!props.currentStepProgress) return false
  const { completed, skipped } = props.currentStepProgress
  return !completed && !skipped
})

function goToNext(path) {
  if (path && typeof path === 'string') router.push(path)
}

function onGotIt() {
  emit('got-it')
}
function onSkip() {
  emit('skip')
}
function onExit() {
  emit('exit')
}
function onRunCheck() {
  emit('run-check')
}
function onBack() {
  emit('back')
}
</script>

<style scoped>
.tutorial-shell {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  z-index: 40;
  pointer-events: auto;
}
.tutorial-shell-inner {
  padding: 1rem;
  border-radius: 12px;
  background: var(--neutral-50);
  border: 1px solid var(--neutral-200);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
}
.dark .tutorial-shell-inner {
  background: var(--neutral-900);
  border-color: var(--neutral-700);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
</style>
