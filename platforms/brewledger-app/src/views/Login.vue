<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4">
    <!-- Brand Header -->
    <div class="mb-6 text-center">
      <img src="/logo.png" alt="BrewLedger" class="w-16 h-16 object-contain mx-auto mb-3" />
      <h1 class="text-heading-md text-neutral-900 dark:text-neutral-50 font-bold mb-1">BrewLedger</h1>
      <p class="text-body-sm text-neutral-600 dark:text-neutral-400">Sign in to continue</p>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm">
      <!-- Card Header -->
      <div class="p-4 border-b border-neutral-100 dark:border-neutral-700">
        <h2 class="text-body-md font-bold text-neutral-900 dark:text-neutral-50">Sign In</h2>
      </div>

      <!-- Form -->
      <div class="p-4">
        <form @submit.prevent="login" class="space-y-4">
          <!-- Error Alert -->
          <div v-if="error" class="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-700 rounded-md p-3 text-danger-700 dark:text-danger-300 text-body-sm">
            {{ error }}
          </div>

          <!-- Email Field -->
          <div class="space-y-2">
            <label class="block text-body-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="you@brewery.com" 
            />
          </div>

          <!-- Password Field -->
          <div class="space-y-2">
            <label class="block text-body-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
            <input 
              v-model="password" 
              type="password" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="••••••••" 
            />
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="loading" 
            class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-md font-bold text-body-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Signing In...
            </span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <!-- Registration Link -->
        <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 text-center">
          <p class="text-body-sm text-neutral-600 dark:text-neutral-400 mb-2">No account?</p>
          <router-link to="/register" class="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300">
            Create organization
          </router-link>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-6 text-center">
      <p class="text-body-xs text-neutral-400 dark:text-neutral-500">© 2024 BrewLedger</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { seedData } from '../utils/seed';
import { useSession } from '../composables/useSession';
import { API_BASE_URL } from '../config';

const router = useRouter();
const { setSession } = useSession();
const email = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

const login = async () => {
  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: email.value,
      password: password.value
    });

    const { token, orgId, userId, orgName, userName, role, trialEndsAt, subscriptionPlan, subscriptionStatus } = res.data;
    
    // Store session
    await setSession({
      token,
      orgId,
      userId,
      orgName,
      userName,
      role,
      trialEndsAt,
      subscriptionPlan,
      subscriptionStatus,
      lastSeq: 0, // Reset sync cursor on fresh login? Or maybe keep if same user? For MVP safe to reset or need logic.
      // Ideally we check if we already have this user locally.
      // But for MVP, let's assume lastSeq 0 is fine, server handles overlap/idempotency.
      deviceId: await AuthService.getDeviceId()
    });

    // Trigger sync
    SyncService.sync();

    router.push('/');
  } catch (e) {
    error.value = e.response?.data?.error || 'Login failed';
  } finally {
    loading.value = false;
  }
};

const demoMode = async () => {
  await seedData();
  router.push('/');
};
</script>
