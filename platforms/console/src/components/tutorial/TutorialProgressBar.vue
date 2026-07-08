<template>
  <div class="tutorial-progress" role="progressbar" :aria-valuenow="summary.done" :aria-valuemin="0" :aria-valuemax="summary.total" aria-label="Tutorial progress">
    <div class="tutorial-progress-bar">
      <div class="tutorial-progress-fill" :style="{ width: summary.percent + '%' }"></div>
    </div>
    <p class="tutorial-progress-text text-sm text-neutral-600 dark:text-neutral-400 mt-1">
      {{ summary.done }} of {{ summary.total }} steps
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  summary: {
    type: Object,
    required: true,
    default: () => ({ total: 0, completed: 0, skipped: 0, done: 0, percent: 0 }),
  },
})

const summary = computed(() => ({
  total: props.summary?.total ?? 0,
  done: props.summary?.done ?? 0,
  percent: props.summary?.percent ?? 0,
}))
</script>

<style scoped>
.tutorial-progress {
  width: 100%;
}
.tutorial-progress-bar {
  height: 6px;
  background: var(--neutral-200, #e5e5e5);
  border-radius: 3px;
  overflow: hidden;
}
.dark .tutorial-progress-bar {
  background: var(--neutral-700, #404040);
}
.tutorial-progress-fill {
  height: 100%;
  background: var(--primary-500, #0ea5e9);
  border-radius: 3px;
  transition: width 0.3s ease;
}
</style>
