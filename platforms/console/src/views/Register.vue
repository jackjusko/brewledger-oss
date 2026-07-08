<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-stone-950">
    <!-- Brand Header -->
    <div class="mb-6 text-center">
      <img src="/logo.png" alt="BrewLedger" class="w-20 h-20 object-contain mx-auto mb-3" />
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">BrewLedger Console</h1>
      <p class="text-neutral-600 dark:text-stone-400">Create organization</p>
    </div>

    <!-- Registration Card -->
    <div class="w-full max-w-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-stone-700 rounded-lg shadow-sm">
      <!-- Card Header -->
      <div class="p-4 border-b border-neutral-100 dark:border-stone-700">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-50">Create Organization</h2>
      </div>

      <!-- Form -->
      <div class="p-4">
        <form @submit.prevent="register" class="space-y-4">
          <!-- Error Alert -->
          <div v-if="error" class="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-700 rounded-md p-3 text-danger-700 dark:text-danger-300 text-sm">
            {{ error }}
          </div>

          <!-- Organization Name -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Organization Name</label>
            <input 
              v-model="orgName" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-stone-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-success-500 focus:border-success-500 outline-none"
              placeholder="e.g. My Brewery" 
            />
          </div>

          <!-- Admin Name -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Admin Name</label>
            <input 
              v-model="adminName" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-stone-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-success-500 focus:border-success-500 outline-none"
              placeholder="e.g. John Smith" 
            />
          </div>

          <!-- Email Address -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Admin Email</label>
            <input 
              v-model="email" 
              type="email" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-stone-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-success-500 focus:border-success-500 outline-none"
              placeholder="admin@brewery.com" 
            />
          </div>

          <!-- Password -->
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Password</label>
              <span v-if="password" class="text-xs px-1.5 py-0.5 rounded" :class="isPasswordValid ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400' : 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'">
                {{ passwordStrength }}
              </span>
            </div>
            <input 
              v-model="password" 
              type="password" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-stone-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-success-500 focus:border-success-500 outline-none"
              placeholder="••••••••" 
            />
          </div>

          <!-- Confirm Password -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Confirm Password</label>
            <input 
              v-model="confirmPassword" 
              type="password" 
              required 
              class="w-full px-3 py-2 border border-neutral-200 dark:border-stone-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-stone-500 focus:ring-1 focus:ring-success-500 focus:border-success-500 outline-none"
              placeholder="••••••••" 
            />
            <div v-if="passwordMismatch" class="text-danger-600 dark:text-danger-400 text-sm">
              Passwords do not match
            </div>
          </div>

          <!-- Submit Button -->
          <button 
            type="submit" 
            :disabled="loading || passwordMismatch" 
            class="w-full bg-success-600 hover:bg-success-700 text-white py-2.5 rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Creating...
            </span>
            <span v-else>Create Organization</span>
          </button>
        </form>

        <!-- Login Link -->
        <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-stone-700 text-center">
          <p class="text-sm text-neutral-600 dark:text-stone-400 mb-2">Already have an organization?</p>
          <router-link to="/login" class="text-success-600 dark:text-success-400 font-medium hover:text-success-700 dark:hover:text-success-300">
            Sign in
          </router-link>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="mt-6 text-center">
      <p class="text-xs text-neutral-400 dark:text-stone-500">© 2024 BrewLedger Console</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { AuthService } from '../services/AuthService';
import { useSession } from '../composables/useSession';
import { SyncService } from '../services/SyncService';
import { API_BASE_URL } from '../config';

const router = useRouter();
const { setSession } = useSession();
const orgName = ref('');
const adminName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const passwordMismatch = computed(() => {
  return password.value && confirmPassword.value && password.value !== confirmPassword.value;
});

const passwordStrength = computed(() => {
  if (!password.value) return null;
  if (password.value.length < 8) return 'Weak (min 8 chars)';
  if (!/[A-Z]/.test(password.value)) return 'Weak (needs uppercase)';
  if (!/[0-9]/.test(password.value)) return 'Weak (needs number)';
  return 'Strong';
});

const isPasswordValid = computed(() => {
  return password.value.length >= 8 && /[A-Z]/.test(password.value) && /[0-9]/.test(password.value);
});

const register = async () => {
  if (passwordMismatch.value) {
    error.value = 'Passwords do not match';
    return;
  }
  
  if (!isPasswordValid.value) {
    error.value = 'Password does not meet requirements';
    return;
  }

  loading.value = true;
  error.value = '';
  
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/register-org`, {
      orgName: orgName.value,
      adminName: adminName.value,
      email: email.value,
      password: password.value
    });

    const { token, orgId, userId, userName, role, trialEndsAt, subscriptionPlan, subscriptionStatus } = res.data;
    
    await setSession({
      token,
      orgId,
      userId,
      orgName: orgName.value,
      userName,
      role,
      trialEndsAt,
      subscriptionPlan,
      subscriptionStatus,
      lastSeq: 0,
      deviceId: await AuthService.getDeviceId()
    });

    // Immediate sync so new org data (Finished Beer category/item, etc.) is in IndexedDB before dashboard
    if (!SyncService.syncIntervalId) {
      await SyncService.startSyncLoop();
    } else {
      await SyncService.sync();
    }

    router.push('/dashboard');
  } catch (e) {
    error.value = e.response?.data?.error || 'Registration failed';
  } finally {
    loading.value = false;
  }
};
</script>
