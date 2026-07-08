import { ref, onMounted, watch, computed } from 'vue';

// Shared state
const theme = ref('dark');
let watchInitialized = false;
let mountedInitialized = false;

const applyTheme = (newTheme) => {
  const html = document.documentElement;
  if (newTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
};

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light';
};

export function useTheme() {
  // Initialize theme from localStorage and OS preference (once)
  if (!mountedInitialized) {
    onMounted(() => {
      const savedTheme = localStorage.getItem('theme');
      
      if (savedTheme === 'dark' || savedTheme === 'light') {
        theme.value = savedTheme;
      } else {
        // Default to dark theme if no saved preference
        theme.value = 'dark';
      }
      
      applyTheme(theme.value);
    });
    mountedInitialized = true;
  }

  // Watch theme changes and persist to localStorage (once)
  if (!watchInitialized) {
    watch(theme, (newTheme) => {
      applyTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
    watchInitialized = true;
  }

  const isDark = computed(() => theme.value === 'dark');

  return {
    theme,
    toggleTheme,
    applyTheme,
    isDark
  };
}