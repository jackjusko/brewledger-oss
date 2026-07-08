<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-fade-in-up">
      <div class="p-6">
        <h3 v-if="title" class="text-xl font-bold mb-3 text-gray-900 dark:text-gray-50">{{ title }}</h3>
        <p v-if="message" class="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">{{ message }}</p>
        <slot></slot>
      </div>
      <div class="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-end gap-3">
        <button 
          v-if="type === 'confirm'" 
          @click="$emit('cancel')" 
          class="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-50 text-lg"
        >
          Cancel
        </button>
        <button 
          @click="$emit('confirm')" 
          :class="[
            'px-6 py-3 rounded-lg text-white font-bold text-lg shadow-sm',
            variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
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
