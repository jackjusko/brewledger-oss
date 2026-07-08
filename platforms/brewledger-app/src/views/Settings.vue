<template>
  <div class="p-3 pb-20 space-y-3">
    <h1 class="text-xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>

    <div class="space-y-3">
      <!-- Appearance -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">🎨</span> Appearance
        </h2>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600 dark:text-gray-300">Theme</span>
          <button @click="toggleTheme" class="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200 dark:bg-gray-700" :class="theme === 'dark' ? 'bg-blue-600' : ''">
            <span class="sr-only">Toggle theme</span>
            <span class="inline-block h-3 w-3 transform rounded-full bg-white" :class="theme === 'dark' ? 'translate-x-5' : 'translate-x-1'"></span>
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
          Switch between light and dark mode
        </p>
      </div>

      <!-- User / Org Info -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">🏢</span> Organization
        </h2>
        <div v-if="session" class="space-y-2">
          <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">Name</span>
            <span class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ session.orgName }}</span>
          </div>
          <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">User ID</span>
            <span class="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{{ session.userId }}</span>
          </div>
          <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">Device</span>
            <span class="font-mono text-xs text-gray-400 dark:text-gray-300">{{ session.deviceId }}</span>
          </div>
        </div>
        <div v-else class="text-xs text-gray-500 dark:text-gray-400 italic">Not logged in</div>
      </div>

      <!-- Subscription Info -->
    <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
      <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
        <span class="text-base">💳</span> Subscription (Organization)
      </h2>
      
      <!-- Trial Expired Banner -->
      <div v-if="isTrialExpired" class="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-3 py-2 rounded-md mb-3 text-sm border border-red-100 dark:border-red-800">
        <strong class="font-bold block mb-1">Subscription Expired</strong>
        <span>Your access is restricted. Manage your subscription on the desktop app to restore full access.</span>
      </div>

      <div v-if="session" class="space-y-2">
          <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">Plan</span>
            <span class="font-medium text-sm text-gray-900 dark:text-gray-50">{{ (session.subscriptionPlan === 'subscription' ? 'Subscription' : session.subscriptionPlan) || 'Subscription' }}</span>
          </div>
          <div class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">Status</span>
            <span class="font-medium text-sm capitalize" 
              :class="{
                'text-green-600': session.subscriptionStatus === 'active',
                'text-blue-600': session.subscriptionStatus === 'trialing',
                'text-gray-600': !session.subscriptionStatus
              }">
              {{ session.subscriptionStatus || 'Trial (Legacy)' }}
            </span>
          </div>
          <div v-if="session.trialEndsAt && (session.subscriptionStatus === 'trialing' || !session.subscriptionStatus)" class="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5">
            <span class="text-xs text-gray-500 dark:text-gray-400">Trial Ends</span>
            <span class="font-mono text-xs text-gray-600 dark:text-gray-300">
              {{ new Date(session.trialEndsAt).toLocaleDateString() }}
              <span v-if="new Date() > new Date(session.trialEndsAt)" class="text-red-500 font-bold ml-1">(Expired)</span>
            </span>
          </div>
          <div class="mt-3 p-3 rounded-md bg-neutral-50 dark:bg-neutral-800 border border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-700 dark:text-gray-300 mb-2">Billing is managed on the desktop app.</p>
            <a :href="consoleBillingUrl" target="_blank" rel="noopener noreferrer" class="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Open BrewLedger Console to manage subscription →
            </a>
          </div>
        </div>
      </div>

      <!-- Sync Status -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">🔄</span> Synchronization
        </h2>
        
        <div class="flex items-center justify-between mb-2">
          <span class="text-sm text-gray-600 dark:text-gray-300">Status</span>
          <div v-if="loading" class="text-blue-600 dark:text-blue-400 font-bold text-sm flex items-center gap-1">
            <span class="animate-spin">↻</span> Syncing...
          </div>
          <div v-else-if="SyncService.error" class="text-red-600 dark:text-red-400 font-bold text-sm">Error</div>
          <div v-else class="text-green-600 dark:text-green-400 font-bold text-sm flex items-center gap-1">
            <span>✓</span> Up to date
          </div>
        </div>
        
        <div class="bg-gray-50 dark:bg-gray-900 rounded-md p-2 mb-2 flex justify-between items-center">
          <span class="text-xs font-medium text-gray-600 dark:text-gray-300">Pending changes</span>
          <span class="bg-white dark:bg-gray-800 px-2 py-0.5 rounded font-bold text-sm" :class="pendingCount > 0 ? 'text-orange-500' : 'text-gray-400 dark:text-gray-300'">{{ pendingCount }}</span>
        </div>

        <div v-if="SyncService.error" class="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-md text-xs mb-2">
          {{ SyncService.error }}
        </div>

        <button @click="forceSync" :disabled="!session" class="w-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 py-2 rounded-md font-bold text-sm hover:bg-blue-100 disabled:opacity-50">
            Sync now
          </button>
      </div>

      <!-- User Invitation -->
      <div v-if="session && session.role === 'admin'" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">👥</span> Invite user (admin only)
        </h2>
        <div class="space-y-2">
          <input v-model="inviteName" placeholder="Full name" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm" />
          <input v-model="inviteEmail" placeholder="Email address" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm" />
          <input v-model="invitePassword" placeholder="Temporary password" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm" />
          <input v-model="inviteConfirmPassword" placeholder="Confirm password" class="w-full p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm" />
          <div v-if="invitePasswordMismatch" class="text-red-500 text-xs">Passwords do not match</div>
          <button @click="invite" :disabled="invitePasswordMismatch || !inviteName" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-bold text-sm disabled:opacity-50">Create user</button>
        </div>
      </div>

      <!-- Configuration Links -->
      <div class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">⚙️</span> Configuration
        </h2>
        <div class="space-y-1.5">
          <button @click="openCategoriesModal" class="w-full text-left p-2 rounded-md hover:bg-gray-50 flex justify-between items-center">
            <span class="font-medium text-sm text-gray-700 dark:text-gray-200">Manage categories</span>
            <span class="text-gray-300">→</span>
          </button>
          <router-link to="/milestone-templates" class="w-full text-left p-2 rounded-md hover:bg-gray-50 flex justify-between items-center">
            <span class="font-medium text-sm text-gray-700 dark:text-gray-200">Milestone templates</span>
            <span class="text-gray-300">→</span>
          </router-link>
          <router-link to="/vessels" class="w-full text-left p-2 rounded-md hover:bg-gray-50 flex justify-between items-center">
            <span class="font-medium text-sm text-gray-700 dark:text-gray-200">Manage vessels</span>
            <span class="text-gray-300">→</span>
          </router-link>
          <router-link to="/export" class="w-full text-left p-2 rounded-md hover:bg-gray-50 flex justify-between items-center">
            <span class="font-medium text-sm text-gray-700 dark:text-gray-200">Export data (CSV)</span>
            <span class="text-gray-300">→</span>
          </router-link>
        </div>
      </div>

      <!-- Delete account -->
      <div v-if="session" class="bg-white dark:bg-gray-800 p-3 rounded-lg border border-red-200 dark:border-red-800">
        <h2 class="font-bold text-sm text-gray-900 dark:text-gray-50 mb-2 flex items-center gap-1.5">
          <span class="text-base">🗑️</span> Delete account
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Permanently delete your account. This will remove your access to BrewLedger. Organization data may remain for other users.
        </p>
        <button
          @click="promptDeleteAccount"
          :disabled="deleteAccountLoading"
          class="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-md font-bold text-sm hover:bg-red-100 border border-red-100 dark:border-red-700 disabled:opacity-50"
        >
          {{ deleteAccountLoading ? 'Deleting…' : 'Delete my account' }}
        </button>
      </div>

      <!-- Logout -->
      <div v-if="session" class="pt-1">
        <button @click="logout" class="w-full bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-2 rounded-md font-bold text-sm hover:bg-red-100 border border-red-100 dark:border-red-700">
          Log out
        </button>
        <p class="text-xs text-gray-400 dark:text-gray-300 mt-2 text-center">
          Version 1.0.0 • Local data retained
        </p>
      </div>
    </div>
    
    <ModalDialog 
      :isOpen="modal.isOpen" 
      :title="modal.title" 
      :message="modal.message" 
      :type="modal.type" 
      :variant="modal.variant"
      :confirmText="modal.confirmText"
      @confirm="modal.onConfirm" 
      @cancel="modal.isOpen = false" 
    />

    <!-- Category Management Modal -->
    <ModalDialog 
      :isOpen="showCategories" 
      title="Manage categories" 
      type="confirm" 
      confirmText="Done"
      :showCancel="false"
      @confirm="showCategories = false" 
      @cancel="showCategories = false"
    >
      <div class="space-y-3">
        <div class="flex gap-2">
          <input v-model="newCategory" type="text" placeholder="New category name" class="flex-1 border border-gray-300 dark:border-gray-500 p-2 rounded-md focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" @keyup.enter="addCategory">
          <button @click="addCategory" class="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-md font-bold text-sm">Add</button>
        </div>
        
        <div class="max-h-48 overflow-y-auto space-y-1.5 pr-1">
           <div v-for="cat in categories" :key="cat.id" class="flex justify-between items-center bg-gray-50 dark:bg-gray-900 p-2 rounded-md border border-gray-200 dark:border-gray-700">
             <span class="font-medium text-sm text-gray-700 dark:text-gray-200">{{ cat.name }}</span>
             <button v-if="cat.name !== 'Other'" @click="deleteCategory(cat.id, cat.name)" class="text-red-400 hover:text-red-600 text-sm">×</button>
             <span v-else class="text-gray-400 dark:text-gray-300 text-xs px-1.5 italic bg-gray-200 dark:bg-gray-700 rounded">System</span>
           </div>
           <div v-if="categories.length === 0" class="text-gray-400 dark:text-gray-300 text-center italic py-3 text-sm">No categories found</div>
        </div>
      </div>
    </ModalDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import { db } from '../db';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { SyncRepository } from '../repositories/SyncRepository';
import { SyncService } from '../services/SyncService';
import { AuthService } from '../services/AuthService';
import { useSession } from '../composables/useSession';
import { seedData } from '../utils/seed';
import { useModal } from '../composables/useModal';
import ModalDialog from '../components/ModalDialog.vue';
import { useTheme } from '../composables/useTheme';
import { API_BASE_URL, CONSOLE_BASE_URL } from '../config';

// Desktop console URL for billing (billing is managed on desktop only)
const consoleBillingUrl = CONSOLE_BASE_URL;

const { modal, confirm: showConfirm, alert: showAlert } = useModal();
const { theme, toggleTheme } = useTheme();
const router = useRouter();
const { session, clearSession, refreshSession } = useSession();

const isTrialExpired = computed(() => {
   if (!session.value) return false;
   if (session.value.subscriptionStatus === 'active') return false;
   if (session.value.subscriptionStatus === 'cancelled') return true;
   
   if (session.value.trialEndsAt) {
       return new Date() > new Date(session.value.trialEndsAt);
   }
   return false;
});

// Sync/Auth State
const pendingCount = ref(0);
const loading = ref(false);
const inviteEmail = ref('');
const inviteName = ref('');
const invitePassword = ref('');
const inviteConfirmPassword = ref('');

const invitePasswordMismatch = computed(() => {
  return invitePassword.value && inviteConfirmPassword.value && invitePassword.value !== inviteConfirmPassword.value;
});

// Category State
const showCategories = ref(false);
const categories = ref([]);
const newCategory = ref('');

const refresh = async () => {
  // Session is managed by useSession composable, only refresh pending count
  const pending = await SyncRepository.getPendingOps();
  pendingCount.value = pending.length;
};

onMounted(async () => {
  await refresh();
});

const forceSync = async () => {
  loading.value = true;
  await SyncService.sync();
  await refresh();
  loading.value = false;
};

const logout = async () => {
  await clearSession();
  await refresh();
  router.push('/login');
};

// Delete account
const deleteAccountLoading = ref(false);
function promptDeleteAccount() {
  showConfirm(
    'Delete account',
    'This cannot be undone. All your data access will be removed.',
    deleteAccount,
    'danger',
    'Delete account'
  );
}
async function deleteAccount() {
  deleteAccountLoading.value = true;
  try {
    await axios.post(
      `${API_BASE_URL}/auth/delete-account`,
      {},
      { headers: { Authorization: `Bearer ${session.value?.token}` } }
    );
    try { await clearSession(); } catch (_) { /* best effort */ }
    window.location.href = '/login';
    return;
  } catch (e) {
    if (e.response?.status === 401) {
      try { await clearSession(); } catch (_) { /* best effort */ }
      window.location.href = '/login';
    } else {
      showAlert('Error', e.response?.data?.error || 'Failed to delete account', 'danger');
    }
  } finally {
    deleteAccountLoading.value = false;
  }
}

const invite = async () => {
  if (!inviteName.value || !inviteEmail.value || !invitePassword.value) return;
  
  if (invitePasswordMismatch.value) {
    showAlert('Error', 'Passwords do not match', 'danger');
    return;
  }
  
  try {
    await axios.post(`${API_BASE_URL}/auth/invite`, {
      name: inviteName.value,
      email: inviteEmail.value,
      password: invitePassword.value
    }, {
      headers: { Authorization: `Bearer ${session.value.token}` }
    });
    showAlert('Success', 'User created!');
    inviteName.value = '';
    inviteEmail.value = '';
    invitePassword.value = '';
    inviteConfirmPassword.value = '';
  } catch (e) {
    showAlert('Error', e.response?.data?.error || 'Failed', 'danger');
  }
};

// Categories Logic
const openCategoriesModal = async () => {
  await CategoryRepository.ensureStandardCategories();
  await loadCategories();
  showCategories.value = true;
};

const loadCategories = async () => {
  categories.value = await CategoryRepository.getAll();
};

const addCategory = async () => {
  if (!newCategory.value.trim()) return;
  try {
    await CategoryRepository.create({ name: newCategory.value.trim() });
    newCategory.value = '';
    await loadCategories();
    SyncService.sync();
  } catch (e) {
    showAlert('Error', e.message, 'danger');
  }
};

const deleteCategory = async (id, name) => {
  const hasItems = await CategoryRepository.hasItems(name);
  
  if (hasItems) {
    showCategories.value = false;
    showConfirm(
      'Delete Category',  
      `The category "${name}" contains active items. These items will be moved to the "Other" category.`,
      async () => {
        try {
           await CategoryRepository.delete(id, name, true);
           await loadCategories();
           SyncService.sync();
           showCategories.value = true; // Re-open modal
        } catch (e) {
           showAlert('Error', e.message, 'danger');
        }
      },
      'warning',
      'Delete & Move Items'
    );
  } else {
    try {
      await CategoryRepository.delete(id, name, true);
      await loadCategories();
      SyncService.sync();
    } catch (e) {
      showAlert('Error', e.message, 'danger');
    }
  }
};
</script>
