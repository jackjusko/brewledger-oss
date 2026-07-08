<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-neutral-50 dark:bg-neutral-950">
    <div class="mb-6 text-center">
      <img src="/logo.png" alt="BrewLedger" class="w-20 h-20 object-contain mx-auto mb-3" />
      <h1 class="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">Reset password</h1>
      <p class="text-neutral-600 dark:text-neutral-400">Enter your email to receive a reset link</p>
    </div>

    <div class="w-full max-w-sm bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-sm">
      <div class="p-4 border-b border-neutral-100 dark:border-neutral-700">
        <h2 class="text-lg font-bold text-neutral-900 dark:text-neutral-50">Forgot password</h2>
      </div>
      <div class="p-4">
        <form @submit.prevent="submit" class="space-y-4">
          <div v-if="error" class="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-700 rounded-md p-3 text-danger-700 dark:text-danger-300 text-sm">
            {{ error }}
          </div>
          <div v-if="success" class="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-700 rounded-md p-3 text-success-700 dark:text-success-300 text-sm">
            {{ success }}
          </div>
          <div class="space-y-2">
            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300">Email</label>
            <input
              v-model="email"
              type="email"
              required
              class="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 outline-none"
              placeholder="you@brewery.com"
            />
          </div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-md font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="flex items-center justify-center gap-2">
              <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Sending...
            </span>
            <span v-else>Send reset link</span>
          </button>
        </form>
        <div class="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-700 text-center">
          <router-link to="/login" class="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 text-sm">
            Back to sign in
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { AuthService } from '../services/AuthService';

const email = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);

const submit = async () => {
  loading.value = true;
  error.value = '';
  success.value = '';
  try {
    await AuthService.requestPasswordReset(email.value);
    success.value = 'If an account exists for that email, you will receive a reset link shortly.';
  } catch (e) {
    error.value = e.response?.data?.error || 'Something went wrong. Try again.';
  } finally {
    loading.value = false;
  }
};
</script>
