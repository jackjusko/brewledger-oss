<template>
  <nav class="fixed pb-[env(safe-area-inset-bottom)] bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe-area flex justify-around items-center z-50">
    <router-link to="/" v-if="!isTrialExpired" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/'), 'text-gray-400 dark:text-gray-500': !isActive('/') }">
      <span class="text-xl mb-0.5">🍺</span>
      <span class="text-[10px] font-medium">Brew</span>
    </router-link>

    <router-link to="/receive" v-if="!isTrialExpired" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/receive'), 'text-gray-400 dark:text-gray-500': !isActive('/receive') }">
      <span class="text-xl mb-0.5">📥</span>
      <span class="text-[10px] font-medium">Receive</span>
    </router-link>

    <router-link to="/consume" v-if="!isTrialExpired" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/consume'), 'text-gray-400 dark:text-gray-500': !isActive('/consume') }">
      <span class="text-xl mb-0.5">📤</span>
      <span class="text-[10px] font-medium">Consume</span>
    </router-link>

    <router-link to="/count" v-if="!isTrialExpired" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/count'), 'text-gray-400 dark:text-gray-500': !isActive('/count') }">
      <span class="text-xl mb-0.5">🔢</span>
      <span class="text-[10px] font-medium">Count</span>
    </router-link>

    <router-link to="/batches" v-if="!isTrialExpired" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/batches'), 'text-gray-400 dark:text-gray-500': !isActive('/batches') }">
      <span class="text-xl mb-0.5">🧪</span>
      <span class="text-[10px] font-medium">Batches</span>
    </router-link>

    <router-link to="/settings" class="p-2 flex flex-col items-center" :class="{ 'text-blue-600 dark:text-blue-400': isActive('/settings'), 'text-gray-400 dark:text-gray-500': !isActive('/settings') }">
      <span class="text-xl mb-0.5">⚙️</span>
      <span class="text-[10px] font-medium">Settings</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useSession } from '../composables/useSession';
import { computed } from 'vue';

const route = useRoute();
const { session } = useSession();

const isActive = (path) => {
  return route.path.startsWith(path);
};

const isTrialExpired = computed(() => {
   if (!session.value) return false;
   if (session.value.subscriptionStatus === 'active') return false;
   if (session.value.subscriptionStatus === 'cancelled') return true;

   if (session.value.trialEndsAt) {
       return new Date() > new Date(session.value.trialEndsAt);
   }
   return false;
});
</script>

<style scoped>
/* Smooth active state transitions */
.active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Prevent text selection on navigation */
nav {
  user-select: none;
  -webkit-user-select: none;
}
</style>
