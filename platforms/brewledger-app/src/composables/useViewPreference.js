import { ref, onMounted, watch, computed } from 'vue';

// Shared state
const viewPreference = ref('detailed');
let watchInitialized = false;
let mountedInitialized = false;

const applyViewPreference = (newPreference) => {
  // This function can be used to apply any view-specific logic if needed
  // Currently just updates the reactive state
};

const toggleViewPreference = () => {
  viewPreference.value = viewPreference.value === 'detailed' ? 'compressed' : 'detailed';
};

export function useViewPreference() {
  // Initialize view preference from localStorage (once)
  if (!mountedInitialized) {
    onMounted(() => {
      const savedPreference = localStorage.getItem('inventoryView');
      
      if (savedPreference === 'detailed' || savedPreference === 'compressed') {
        viewPreference.value = savedPreference;
      } else {
        // Default to detailed view if no saved preference
        viewPreference.value = 'detailed';
      }
      
      applyViewPreference(viewPreference.value);
    });
    mountedInitialized = true;
  }

  // Watch view preference changes and persist to localStorage (once)
  if (!watchInitialized) {
    watch(viewPreference, (newPreference) => {
      applyViewPreference(newPreference);
      localStorage.setItem('inventoryView', newPreference);
    });
    watchInitialized = true;
  }

  const isCompressed = computed(() => viewPreference.value === 'compressed');
  const isDetailed = computed(() => viewPreference.value === 'detailed');

  return {
    viewPreference,
    toggleViewPreference,
    applyViewPreference,
    isCompressed,
    isDetailed
  };
}