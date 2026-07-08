<template>
  <div v-if="isAuthPage" class="min-h-screen bg-white dark:bg-neutral-900">
    <!-- Auth pages render full screen without header/footer -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
  <div v-else class="h-screen min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col overflow-hidden safe-area-padding">
    <!-- Mobile App Header (always visible) -->
    <header class="flex-shrink-0 sticky top-0 z-30 w-full border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div class="px-2">
        <div class="flex items-center justify-between h-14">
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3">
            <img src="/logo.png" alt="BrewLedger" class="w-12 h-12 object-contain" />
            <div>
              <h1 class="text-lg font-bold text-neutral-900 dark:text-neutral-50" v-if="session">{{ session.orgName }}</h1>
              <p class="text-xs text-neutral-500 dark:text-neutral-400" v-if="session">{{ session.userName }}</p>
            </div>
          </div>
          
          <!-- Mobile Header Actions -->
          <div class="flex items-center gap-2">
            <!-- Theme Toggle -->
            <button 
              @click="toggleTheme" 
              class="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center"
              :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            >
              <span v-if="theme === 'dark'" class="text-lg">🌙</span>
              <span v-else class="text-lg">☀️</span>
            </button>
            
            <!-- Settings -->
            <router-link to="/settings" class="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors flex items-center justify-center">
              <span class="text-lg">⚙️</span>
            </router-link>
          </div>
        </div>
      </div>
    </header>
    
    <!-- Main Content (min-h-0 allows flex child to shrink and scroll) -->
    <main ref="mainContent" class="flex-1 min-h-0 overflow-y-auto pb-24">
      <div class="px-2 py-3">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
    
    <!-- Mobile Bottom Navigation -->
    <BottomNav />
    
    <!-- Global Modal -->
    <ModalDialog
      :is-open="modal.isOpen"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :variant="modal.variant"
      :confirm-text="modal.confirmText"
      @confirm="modal.onConfirm"
      @cancel="modal.isOpen = false"
    />
  </div>
</template>

<script setup>
import BottomNav from './components/BottomNav.vue';
import ModalDialog from './components/ModalDialog.vue';
import { useModal } from './composables/useModal';
import { provide, computed, ref, watch, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { runMilestoneTemplatesMigration } from './utils/migrateMilestoneTemplates';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

// Theme logic
import { useTheme } from './composables/useTheme';
const { theme, toggleTheme } = useTheme();

// Session logic
import { useSession } from './composables/useSession';
const { session, refreshSession } = useSession();

const { modal, confirm, alert } = useModal();
const route = useRoute();
const router = useRouter();
const mainContent = ref(null);

const APP_SCHEME = 'brewledger';
let portalReturnUrlOpenHandle = null;

// Check if navigation should be shown
const isAuthPage = computed(() => {
  return ['/login', '/register'].includes(route.path);
});

const showNav = computed(() => {
  return !isAuthPage.value;
});

// Watch route changes for scrolling
watch(() => route.path, () => {
  mainContent.value?.scrollTo({ top: 0, behavior: 'smooth' });
});

// Run milestone templates migration when app loads (for logged-in users)
watch(session, async (s) => {
  if (s?.orgId) {
    try {
      await runMilestoneTemplatesMigration();
    } catch (e) {
      console.warn('Milestone migration:', e);
    }
  }
}, { immediate: true });

// Handle billing portal return deep link (native): close in-app browser, go to settings, refresh session
async function handlePortalReturnDeepLink(url) {
  if (!url || !url.startsWith(`${APP_SCHEME}://settings`)) return false;
  try {
    await Browser.close();
    if (route.path !== '/settings') router.push('/settings');
    await refreshSession();
  } catch (_) {}
  return true;
}

onMounted(async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      const { url } = await App.getLaunchUrl();
      if (url && url.startsWith(`${APP_SCHEME}://settings`)) {
        await handlePortalReturnDeepLink(url);
        return;
      }
    } catch (_) {}
    portalReturnUrlOpenHandle = await App.addListener('appUrlOpen', async (event) => {
      await handlePortalReturnDeepLink(event.url);
    });
  }
});

onUnmounted(async () => {
  if (portalReturnUrlOpenHandle) {
    await portalReturnUrlOpenHandle.remove();
    portalReturnUrlOpenHandle = null;
  }
});

// Provide modal helpers to all components
provide('modal', { confirm, alert });
</script>

<style scoped>
/* Route transition animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile-safe area handling */
.safe-area-padding {
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-top: env(safe-area-inset-top, 0px);
}

/* Improve touch targets and prevent text selection on interactive elements */
button, 
a, 
input, 
select, 
textarea {
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

/* Better scrolling on iOS */
main {
  -webkit-overflow-scrolling: touch;
}
</style>
