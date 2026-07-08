<template>
  <div v-if="step" class="tutorial-step-card" role="region" :aria-label="step.title">
    <div class="tutorial-step-header">
      <h3 class="tutorial-step-title">{{ step.title }}</h3>
      <button
        type="button"
        class="tutorial-step-close"
        @click="$emit('exit')"
        aria-label="Exit tutorial"
      >
        <i class="ri-close-line" aria-hidden="true"></i>
      </button>
    </div>
    <p class="tutorial-step-body">{{ step.body }}</p>
    <details v-if="step.whyCare" class="tutorial-step-why">
      <summary class="tutorial-step-why-summary">Why brewers care</summary>
      <p class="tutorial-step-why-text">{{ step.whyCare }}</p>
    </details>
    <div v-if="step.mobileCallout" class="tutorial-step-mobile rounded-lg bg-neutral-100 dark:bg-neutral-800 p-3 mt-3 text-sm text-neutral-600 dark:text-neutral-400">
      <i class="ri-smartphone-line mr-2" aria-hidden="true"></i>
      {{ step.mobileCallout }}
    </div>
    <div class="tutorial-step-actions mt-4 flex flex-wrap gap-3">
      <button
        v-if="prevRoute"
        type="button"
        class="btn btn-secondary text-sm inline-flex items-center gap-1.5"
        @click="$emit('back')"
      >
        <i class="ri-arrow-left-line" aria-hidden="true"></i>
        Back
      </button>
      <button
        v-if="step.requiredCheck === 'system_check' && !systemCheckPassed"
        type="button"
        class="btn btn-secondary text-sm"
        @click="$emit('run-check')"
      >
        Run quick check
      </button>
      <button
        v-if="step.requiredCheck === 'system_check'"
        type="button"
        class="btn btn-primary text-sm"
        :disabled="!canAdvance"
        @click="$emit('got-it')"
      >
        {{ canAdvance ? 'Start' : 'Run quick check first' }}
      </button>
      <template v-else>
        <button
          type="button"
          class="btn btn-primary text-sm"
          @click="$emit('got-it')"
        >
          {{ step.actionLabel }}
        </button>
        <button
          v-if="!step.hideSkip"
          type="button"
          class="btn btn-secondary text-sm"
          @click="$emit('skip')"
        >
          Skip for now
        </button>
      </template>
    </div>
  </div>
</template>

<script setup>
defineProps({
  step: { type: Object, default: null },
  canAdvance: { type: Boolean, default: true },
  systemCheckPassed: { type: Boolean, default: false },
  prevRoute: { type: String, default: null },
})

defineEmits(['got-it', 'skip', 'exit', 'run-check', 'back'])
</script>

<style scoped>
.tutorial-step-card {
  background: white;
  border: 1px solid var(--neutral-200, #e5e5e5);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
}
.dark .tutorial-step-card {
  background: var(--neutral-800);
  border-color: var(--neutral-700);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}
.tutorial-step-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.tutorial-step-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--neutral-900);
  margin: 0;
}
.dark .tutorial-step-title {
  color: var(--neutral-100);
}
.tutorial-step-close {
  padding: 0.25rem;
  color: var(--neutral-500);
  border-radius: 6px;
  transition: color 0.2s, background 0.2s;
}
.tutorial-step-close:hover {
  color: var(--neutral-700);
  background: var(--neutral-100);
}
.dark .tutorial-step-close:hover {
  color: var(--neutral-300);
  background: var(--neutral-700);
}
.tutorial-step-body {
  font-size: 0.9375rem;
  line-height: 1.5;
  color: var(--neutral-700);
  margin: 0;
}
.dark .tutorial-step-body {
  color: var(--neutral-300);
}
.tutorial-step-why {
  margin-top: 0.75rem;
  font-size: 0.875rem;
}
.tutorial-step-why-summary {
  cursor: pointer;
  color: var(--primary-600);
  font-weight: 500;
}
.tutorial-step-why-summary:hover {
  text-decoration: underline;
}
.tutorial-step-why-text {
  margin: 0.5rem 0 0;
  color: var(--neutral-600);
}
.dark .tutorial-step-why-text {
  color: var(--neutral-400);
}
</style>
