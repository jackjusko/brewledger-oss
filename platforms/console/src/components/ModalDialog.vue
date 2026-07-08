<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-stone-800 rounded-lg shadow-xl w-full overflow-hidden transform transition-all animate-fade-in-up" :class="maxWidth || 'max-w-md'">
      <div class="p-6">
        <h3 v-if="title" class="text-xl font-bold mb-3 text-neutral-900 dark:text-neutral-50">{{ title }}</h3>
        <p v-if="message" class="text-neutral-600 dark:text-stone-300 text-lg leading-relaxed">{{ message }}</p>
        <slot></slot>
      </div>
      <div class="bg-neutral-50 dark:bg-stone-900 px-6 py-4 flex justify-end gap-3">
        <button
          v-if="type === 'confirm'"
          @click="$emit('cancel')"
          class="px-6 py-3 bg-white dark:bg-stone-800 border border-neutral-300 dark:border-stone-600 rounded-lg text-neutral-700 dark:text-neutral-200 font-medium hover:bg-neutral-50 dark:hover:bg-stone-700 text-lg"
        >
          Cancel
        </button>
        <button
          @click="$emit('confirm')"
          :class="[
            'px-6 py-3 rounded-lg text-white font-bold text-lg shadow-sm',
            variant === 'danger' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-primary-600 hover:bg-primary-700'
          ]"
        >
          {{ confirmText || 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: String,
  message: String,
  maxWidth: { type: String, default: '' }, // e.g. 'max-w-4xl' for larger modals
  type: {
    type: String,
    default: 'alert' // 'alert' or 'confirm'
  },
  variant: {
    type: String,
    default: 'primary' // 'primary' or 'danger'
  },
  confirmText: String
});

defineEmits(['confirm', 'cancel']);
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.animate-fade-in-up {
  animation: fade-in-up 0.2s ease-out;
}
</style>
