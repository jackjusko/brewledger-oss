<template>
  <div class="desktop-container">
    <!-- Subscription Status Banner -->
    <div v-if="subscriptionStatus && (subscriptionStatus.isExpired || subscriptionStatus.isCancelled)" class="mb-8 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-xl p-6">
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
          <i class="ri-error-warning-line text-xl text-warning-600 dark:text-warning-400" aria-hidden="true"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2">
            {{ subscriptionStatus.isExpired ? 'Trial Expired' : 'Subscription Cancelled' }}
          </h3>
          <p class="text-neutral-600 dark:text-stone-400 mb-4">
            {{ subscriptionStatus.isExpired 
              ? 'Your free trial has expired. Please upgrade to continue using BrewLedger Console.'
              : 'Your subscription has been cancelled. Please reactivate to continue using all features.' }}
          </p>
          <button @click="setActiveTab('billing')" class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors font-medium">
            Manage Subscription
          </button>
        </div>
      </div>
    </div>

    <!-- Settings Navigation -->
    <div class="flex gap-8 mb-8">
      <!-- Sidebar Navigation -->
      <div class="w-64 flex-shrink-0">
        <nav class="space-y-1">
          <button
            v-for="tab in settingsTabs"
            :key="tab.id"
            @click="setActiveTab(tab.id)"
            class="w-full text-left px-4 py-3 rounded-lg transition-colors"
            :class="activeTab === tab.id
              ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border-l-4 border-amber-500'
              : 'text-neutral-700 dark:text-stone-300 hover:bg-neutral-100 dark:hover:bg-stone-800'"
          >
            <div class="flex items-center gap-3">
              <i :class="tab.iconClass" class="text-lg" aria-hidden="true"></i>
              <span class="font-medium">{{ tab.name }}</span>
            </div>
          </button>
        </nav>
      </div>

      <!-- Settings Content -->
      <div class="flex-1">
        <!-- General Settings -->
        <div v-if="activeTab === 'general'" class="space-y-8">
          <!-- Subscription Info -->
          <div v-if="subscriptionStatus" class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Subscription</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-stone-100">Current Plan</p>
                  <p class="text-sm text-neutral-600 dark:text-stone-400">{{ subscriptionStatus.plan }}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-medium" :class="{
                  'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300': subscriptionStatus.status === 'active',
                  'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300': subscriptionStatus.status === 'trialing' || subscriptionStatus.status === 'past_due',
                  'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300': subscriptionStatus.isCancelled || subscriptionStatus.isExpired
                }">
                  {{ subscriptionStatus.status === 'active' ? 'Active' : subscriptionStatus.status === 'trialing' ? 'Trial' : subscriptionStatus.status === 'past_due' ? 'Past due' : 'Inactive' }}
                </span>
              </div>
              <div v-if="subscriptionStatus.trialEndsAt && subscriptionStatus.status !== 'active'" class="pt-4 border-t border-neutral-200 dark:border-stone-700">
                <p class="text-sm text-neutral-600 dark:text-stone-400">
                  {{ subscriptionStatus.isExpired 
                    ? `Trial expired on ${new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}`
                    : `Trial ends on ${new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}` }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">General Settings</h3>
            <div class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">Organization Name</label>
                <input
                  type="text"
                  class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
                  placeholder="Enter organization name"
                  :value="session?.orgName || ''"
                  readonly
                />
                <p class="text-sm text-neutral-500 dark:text-stone-400 mt-1">Organization name is managed by the backend</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Tour</h3>
            <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">Run the step-by-step tour to learn how to use BrewLedger. This will restart the tour from the beginning if you’ve already started it.</p>
            <button
              v-if="tutorial"
              type="button"
              class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium text-sm inline-flex items-center gap-2 transition-colors"
              @click="startTour"
            >
              <i class="ri-guide-line" aria-hidden="true"></i>
              Start tour
            </button>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Display Preferences</h3>
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-stone-100">Dark Mode</p>
                  <p class="text-sm text-neutral-600 dark:text-stone-400">Switch between light and dark themes</p>
                </div>
                <button
                  @click="toggleTheme"
                  class="px-4 py-2 bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-stone-700 transition-colors font-medium"
                >
                  {{ theme === 'dark' ? 'Switch to Light' : 'Switch to Dark' }}
                </button>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Logout</h3>
            <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">Sign out of your account. You can sign back in anytime.</p>
            <button
              type="button"
              @click="handleLogout"
              class="px-4 py-2 bg-neutral-100 dark:bg-stone-800 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-stone-700 border border-neutral-300 dark:border-stone-600 transition-colors font-medium inline-flex items-center gap-2"
            >
              <i class="ri-logout-box-r-line" aria-hidden="true"></i>
              Log out
            </button>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Password</h3>
            <div class="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p class="font-medium text-neutral-900 dark:text-stone-100">Reset password</p>
                <p class="text-sm text-neutral-600 dark:text-stone-400">Receive an email with a link to set a new password.</p>
              </div>
              <router-link
                to="/forgot-password"
                class="px-4 py-2 border border-neutral-300 dark:border-stone-600 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-stone-700 transition-colors font-medium inline-flex items-center gap-2"
              >
                <i class="ri-lock-password-line" aria-hidden="true"></i>
                Send reset link
              </router-link>
            </div>
          </div>

          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700 border-danger-200 dark:border-danger-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Delete account</h3>
            <p class="text-sm text-neutral-600 dark:text-stone-400 mb-4">
              Permanently delete your account. This will remove your access to BrewLedger. Organization data may remain for other users. This action cannot be undone.
            </p>
            <button
              type="button"
              @click="promptDeleteAccount"
              :disabled="deleteAccountLoading"
              class="px-4 py-2 bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300 rounded-lg hover:bg-danger-200 dark:hover:bg-danger-800 border border-danger-200 dark:border-danger-700 transition-colors font-medium disabled:opacity-50"
            >
              {{ deleteAccountLoading ? 'Deleting…' : 'Delete my account' }}
            </button>
          </div>
        </div>

        <!-- Billing -->
        <div v-if="activeTab === 'billing'" class="space-y-8">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">Subscription & Billing</h3>

            <!-- Error banner -->
            <div v-if="billingError" class="mb-4 p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700">
              <p class="font-medium text-danger-900 dark:text-danger-100 text-sm">Error</p>
              <p class="text-sm text-danger-700 dark:text-danger-300 mt-0.5">{{ billingError }}</p>
            </div>
            <!-- Success message -->
            <div v-if="billingSuccess" class="mb-4 p-4 rounded-lg bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-700">
              <p class="font-medium text-success-900 dark:text-success-100 text-sm">Success</p>
              <p class="text-sm text-success-700 dark:text-success-300 mt-0.5">Your subscription is active.</p>
            </div>

            <!-- Status card -->
            <div v-if="subscriptionStatus" class="space-y-4 mb-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-neutral-900 dark:text-stone-100">Current Plan</p>
                  <p class="text-sm text-neutral-600 dark:text-stone-400">{{ subscriptionStatus.plan }}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm font-medium" :class="{
                  'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300': subscriptionStatus.status === 'active',
                  'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300': subscriptionStatus.status === 'trialing',
                  'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300': subscriptionStatus.status === 'past_due',
                  'bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300': subscriptionStatus.isCancelled || subscriptionStatus.isExpired
                }">
                  {{ subscriptionStatus.status === 'active' ? 'Active' : subscriptionStatus.status === 'trialing' ? 'Trial' : subscriptionStatus.status === 'past_due' ? 'Past due' : (subscriptionStatus.isCancelled ? 'Cancelled' : 'Inactive') }}
                </span>
              </div>
              <div v-if="subscriptionStatus.trialEndsAt && subscriptionStatus.status !== 'active'" class="pt-4 border-t border-neutral-200 dark:border-stone-700">
                <p class="text-sm text-neutral-600 dark:text-stone-400">
                  {{ subscriptionStatus.isExpired
                    ? `Trial expired on ${new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}`
                    : `Trial ends on ${new Date(subscriptionStatus.trialEndsAt).toLocaleDateString()}` }}
                </p>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap gap-4">
              <template v-if="!isPaidSubscriber">
                <p class="text-sm text-neutral-600 dark:text-stone-400 w-full mb-2">Subscribe to get full access to batch tracking, inventory, and the desktop console.</p>
                <button
                  @click="startCheckout"
                  :disabled="billingLoading || !session?.token"
                  class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors font-medium"
                >
                  {{ subscriptionStatus?.status === 'trialing' && !subscriptionStatus?.isExpired ? `Get started ($49.99/mo)` : 'Subscribe — $49.99/mo' }}
                </button>
              </template>
              <button
                v-if="hasStripeCustomer"
                @click="openPortal"
                :disabled="billingLoading || !session?.token"
                class="px-4 py-2 border border-neutral-300 dark:border-stone-600 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-stone-700 disabled:opacity-50 transition-colors font-medium"
              >
                {{ isPaidSubscriber ? 'Manage subscription' : 'Billing history' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Brewery Information -->
        <div v-if="activeTab === 'brewery'" class="space-y-8">
          <BreweryInfoForm />
        </div>

        <!-- Locations (TTB stage) -->
        <div v-if="activeTab === 'locations'" class="space-y-8">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-2">Location stages for TTB reporting</h3>
            <p class="text-sm text-neutral-600 dark:text-stone-400 mb-6">
              Assign each location to a TTB reporting category (Cellar, Serving, Racking Keg, Bottling Bulk, or Case).
              This tells BrewLedger which column (b–e) to use on your <strong>TTB Form 5130.9</strong> (Monthly/Quarterly Report of Operations),
              so inventory and removals are reported correctly to the TTB.
            </p>
            <div class="overflow-x-auto">
              <table class="data-table w-full">
                <thead>
                  <tr>
                    <th>Location Name</th>
                    <th>TTB Stage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="loc in locationsList" :key="loc.id" class="border-b border-neutral-200 dark:border-stone-700">
                    <td class="font-medium text-neutral-900 dark:text-stone-100">{{ loc.name }}</td>
                    <td>
                      <select
                        :value="loc.stage || 'cellar'"
                        @change="onLocationStageChange(loc.id, $event.target.value)"
                        class="px-3 py-1.5 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100 text-sm"
                      >
                        <option value="cellar">Cellar Bulk (b)</option>
                        <option value="serving">Serving (Taproom bulk · b)</option>
                        <option value="racking_keg">Racking Keg (c)</option>
                        <option value="bottling_bulk">Bottling Bulk (d)</option>
                        <option value="case">Case (e)</option>
                      </select>
                    </td>
                  </tr>
                  <tr v-if="!locationsList.length">
                    <td colspan="2" class="py-6 text-center text-neutral-500 dark:text-stone-400 text-sm">No locations</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Milestone Templates -->
        <div v-if="activeTab === 'milestones'" class="space-y-8">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-2">Milestone Templates</h3>
            <p class="text-sm text-neutral-600 dark:text-stone-400 mb-6">
              Define checkpoints or stages for your batches—knockout, fermentation, cold crash, packaging, and so on. Create templates that match your process, then assign them to batches so you can track where each batch is in the workflow.
            </p>
            <router-link to="/milestone-templates" class="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors font-medium">
              Manage Templates
            </router-link>
          </div>
        </div>

        <!-- User Management -->
        <div v-if="activeTab === 'users'" class="space-y-8">
          <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
            <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-6">User Accounts</h3>

            <!-- Non-admin: read-only message -->
            <div v-if="!isAdmin" class="py-4 text-neutral-600 dark:text-stone-400">
              Only organization admins can view and manage users.
            </div>

            <!-- Admin: user list and add form -->
            <template v-else>
              <div v-if="usersLoading" class="py-6 text-center text-neutral-500 dark:text-stone-400">Loading users…</div>
              <div v-else-if="usersError" class="p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700">
                <p class="text-danger-700 dark:text-danger-300">{{ usersError }}</p>
                <button type="button" @click="loadUsers" class="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline">Retry</button>
              </div>
              <div v-else class="overflow-x-auto">
                <table class="data-table w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="user in usersList" :key="user.id">
                      <td class="font-medium text-neutral-900 dark:text-stone-100">{{ user.name || '—' }}</td>
                      <td class="text-neutral-600 dark:text-stone-400">{{ user.email }}</td>
                    </tr>
                    <tr v-if="!usersList.length">
                      <td colspan="2" class="py-6 text-center text-neutral-500 dark:text-stone-400">No users yet. Add one below.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Add user form (admin only) -->
              <div class="mt-6 pt-6 border-t border-neutral-200 dark:border-stone-700">
                <h4 class="text-lg font-semibold text-neutral-900 dark:text-stone-100 mb-4">Add new user</h4>
                <div v-if="inviteError" class="mb-4 p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 text-danger-700 dark:text-danger-300 text-sm">{{ inviteError }}</div>
                <div class="grid gap-4 max-w-md">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Full name</label>
                    <input v-model="inviteName" type="text" placeholder="Full name" class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Email address</label>
                    <input v-model="inviteEmail" type="email" placeholder="Email address" class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Temporary password</label>
                    <input v-model="invitePassword" type="password" placeholder="Temporary password" class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Confirm password</label>
                    <input v-model="inviteConfirmPassword" type="password" placeholder="Confirm password" class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100" />
                    <p v-if="invitePasswordMismatch" class="mt-1 text-sm text-danger-600 dark:text-danger-400">Passwords do not match</p>
                  </div>
                  <button
                    type="button"
                    @click="inviteUser"
                    :disabled="inviteLoading || invitePasswordMismatch || !inviteName?.trim() || !inviteEmail?.trim() || !invitePassword"
                    class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 disabled:opacity-50 transition-colors font-medium"
                  >
                    {{ inviteLoading ? 'Creating…' : 'Create user' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { API_BASE_URL } from '../config'
import { useSession } from '../composables/useSession'
import { SyncService } from '../services/SyncService'
import { AuthService } from '../services/AuthService'
import { clearTokenCache } from '../router'
import { UserService } from '../services/UserService'
import BreweryInfoForm from '../components/BreweryInfoForm.vue'
import { LocationRepository } from '../repositories/LocationRepository'

const route = useRoute()
const router = useRouter()
const { session, setSession, refreshSession, clearSession, isAdmin } = useSession()
const tutorial = inject('tutorial', null)

async function handleLogout() {
  SyncService.stopSyncLoop()
  clearTokenCache()
  await AuthService.logout()
  await clearSession()
  router.push('/')
}

function startTour() {
  if (!tutorial) return
  tutorial.reset()
  tutorial.start()
  router.push('/dashboard')
}
const providedModal = inject('modal', null)
const showAlert = providedModal?.alert ?? ((title, message, variant) => { window.alert(`${title}: ${message}`) })
const showConfirm = providedModal?.confirm ?? ((title, message, onConfirm) => { if (window.confirm(`${title}\n\n${message}`)) onConfirm?.() })

// Delete account
const deleteAccountLoading = ref(false)
function promptDeleteAccount() {
  showConfirm(
    'Delete account',
    'This cannot be undone. All your data access will be removed.',
    deleteAccount,
    'danger',
    'Delete account'
  )
}
async function deleteAccount() {
  deleteAccountLoading.value = true
  try {
    await axios.post(
      `${API_BASE_URL}/auth/delete-account`,
      {},
      { headers: { Authorization: `Bearer ${session.value?.token}` } }
    )
    try { await clearSession() } catch (_) { /* best effort */ }
    window.location.href = '/login'
    return
  } catch (e) {
    if (e.response?.status === 401) {
      try { await clearSession() } catch (_) { /* best effort */ }
      window.location.href = '/login'
    } else {
      showAlert('Error', e.response?.data?.error || 'Failed to delete account', 'danger')
    }
  } finally {
    deleteAccountLoading.value = false
  }
}

// Billing tab state
const billingError = ref(null)
const billingSuccess = ref(false)
const billingLoading = ref(false)
const billingConfirmAttempted = ref(false)
const isPaidSubscriber = computed(() => session.value?.subscriptionStatus === 'active')

// Locations (TTB stage)
const locationsList = ref([])
async function loadLocations() {
  try {
    locationsList.value = await LocationRepository.getAll()
  } catch (e) {
    console.error('Failed to load locations', e)
  }
}
async function onLocationStageChange(locationId, stage) {
  try {
    await LocationRepository.update(locationId, { stage })
    const loc = locationsList.value.find(l => l.id === locationId)
    if (loc) loc.stage = stage
  } catch (e) {
    console.error('Failed to update location stage', e)
  }
}

// Session already from useSession() above

// Subscription status
const subscriptionStatus = computed(() => {
  if (!session.value) return null
  return {
    status: session.value.subscriptionStatus || 'trialing',
    plan: session.value.subscriptionPlan === 'subscription' ? 'Subscription' : (session.value.subscriptionPlan || 'Subscription'),
    trialEndsAt: session.value.trialEndsAt,
    isExpired: session.value.subscriptionStatus !== 'active' && session.value.trialEndsAt && new Date() > new Date(session.value.trialEndsAt),
    isCancelled: session.value.subscriptionStatus === 'cancelled'
  }
})

// Theme management
const theme = ref(localStorage.getItem('theme') || 'light')
const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

// Settings tabs – valid tab ids for URL sync
const settingsTabs = ref([
  { id: 'general', name: 'General', iconClass: 'ri-settings-3-line' },
  { id: 'billing', name: 'Billing', iconClass: 'ri-bank-card-line' },
  { id: 'brewery', name: 'Brewery Information', iconClass: 'ri-building-line' },
  { id: 'locations', name: 'Locations & TTB stage', iconClass: 'ri-map-pin-line' },
  { id: 'milestones', name: 'Milestone Templates', iconClass: 'ri-file-list-3-line' },
  { id: 'users', name: 'User Management', iconClass: 'ri-team-line' },
])
const validTabIds = new Set(settingsTabs.value.map((t) => t.id))

// Initialize activeTab from route query (?tab=brewery) so TTB Form "Update Brewery Information" lands on Brewery tab
function getTabFromRoute() {
  const tab = route.query.tab
  return tab && validTabIds.has(tab) ? tab : 'general'
}
const activeTab = ref(getTabFromRoute())

// Billing: show portal button when user might have Stripe customer (active, past_due, cancelled = had subscription)
const hasStripeCustomer = computed(() => {
  const s = session.value?.subscriptionStatus
  return s === 'active' || s === 'past_due' || s === 'cancelled'
})

async function startCheckout() {
  billingError.value = null
  billingLoading.value = true
  try {
    const returnUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5174'
    const res = await axios.post(
      `${API_BASE_URL}/billing/create-checkout-session`,
      { returnUrl, inAppBrowser: false },
      { headers: { Authorization: `Bearer ${session.value?.token}` } }
    )
    if (res.data?.url) window.location.href = res.data.url
  } catch (e) {
    billingError.value = e.response?.data?.error || 'Failed to start checkout. Please try again.'
  } finally {
    billingLoading.value = false
  }
}

async function openPortal() {
  billingError.value = null
  billingLoading.value = true
  try {
    const returnUrl = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:5174'
    const res = await axios.post(
      `${API_BASE_URL}/billing/create-portal-session`,
      { returnUrl, inAppBrowser: false },
      { headers: { Authorization: `Bearer ${session.value?.token}` } }
    )
    if (res.data?.url) window.location.href = res.data.url
  } catch (e) {
    billingError.value = e.response?.data?.error || 'Failed to open billing portal.'
  } finally {
    billingLoading.value = false
  }
}

async function confirmBillingSession(sessionId) {
  if (!sessionId || !session.value?.token) return
  billingError.value = null
  billingSuccess.value = false
  billingLoading.value = true
  try {
    const res = await axios.post(
      `${API_BASE_URL}/billing/confirm-subscription`,
      { sessionId },
      { headers: { Authorization: `Bearer ${session.value.token}` } }
    )
    if (res.data?.success) {
      const updated = { ...session.value, subscriptionPlan: res.data.plan || 'subscription', subscriptionStatus: 'active' }
      await setSession(updated)
      await refreshSession()
      SyncService.sync()
      billingSuccess.value = true
      router.replace({ path: '/settings', query: { tab: 'billing' } })
    } else {
      billingError.value = res.data?.error || 'Could not confirm subscription.'
      billingConfirmAttempted.value = false
    }
  } catch (e) {
    billingError.value = e.response?.data?.error || 'Failed to confirm subscription. Please try again.'
    billingConfirmAttempted.value = false
  } finally {
    billingLoading.value = false
  }
}

// Initialize theme and load locations/users when on relevant tab (must be after activeTab is declared)
onMounted(async () => {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  }
  if (activeTab.value === 'locations') await loadLocations()
  if (activeTab.value === 'users') await loadUsers()
  // Billing: if we landed with session_id (return from Stripe checkout), confirm subscription
  if (activeTab.value === 'billing' && route.query.session_id && !billingConfirmAttempted.value) {
    billingConfirmAttempted.value = true
    await confirmBillingSession(route.query.session_id)
  }
})
watch(activeTab, (tab) => {
  if (tab === 'locations') loadLocations()
  if (tab === 'users') loadUsers()
  if (tab === 'billing' && route.query.session_id && !billingConfirmAttempted.value) {
    billingConfirmAttempted.value = true
    confirmBillingSession(route.query.session_id)
  }
})

// Keep activeTab in sync when route query changes (e.g. navigating to /settings?tab=brewery)
watch(() => route.query.tab, (newTab) => {
  if (newTab && validTabIds.has(newTab)) activeTab.value = newTab
})

// When landing on billing tab with session_id (e.g. from BillingRedirect), confirm subscription once
watch(() => [route.query.tab, route.query.session_id], ([tab, sessionId]) => {
  if (tab === 'billing' && sessionId && !billingConfirmAttempted.value) {
    billingConfirmAttempted.value = true
    confirmBillingSession(sessionId)
  }
})

// When user clicks a tab, update URL so ?tab=brewery persists on refresh
function setActiveTab(tabId) {
  activeTab.value = tabId
  router.replace({ path: route.path, query: { ...route.query, tab: tabId } })
}

// User Management (admin only)
const usersList = ref([])
const usersLoading = ref(false)
const usersError = ref(null)
const inviteName = ref('')
const inviteEmail = ref('')
const invitePassword = ref('')
const inviteConfirmPassword = ref('')
const inviteError = ref(null)
const inviteLoading = ref(false)

const invitePasswordMismatch = computed(() =>
  !!invitePassword.value && !!inviteConfirmPassword.value && invitePassword.value !== inviteConfirmPassword.value
)

async function loadUsers() {
  if (!isAdmin.value) return
  usersError.value = null
  usersLoading.value = true
  try {
    const data = await UserService.getUsers()
    usersList.value = data.users || []
  } catch (e) {
    usersError.value = e.message || 'Failed to load users'
  } finally {
    usersLoading.value = false
  }
}

async function inviteUser() {
  if (!inviteName.value?.trim() || !inviteEmail.value?.trim() || !invitePassword.value) return
  if (invitePasswordMismatch.value) {
    inviteError.value = 'Passwords do not match'
    return
  }
  inviteError.value = null
  inviteLoading.value = true
  try {
    await UserService.inviteUser({
      name: inviteName.value.trim(),
      email: inviteEmail.value.trim(),
      password: invitePassword.value,
    })
    showAlert('Success', 'User created.', 'primary')
    inviteError.value = null
    inviteName.value = ''
    inviteEmail.value = ''
    invitePassword.value = ''
    inviteConfirmPassword.value = ''
    await loadUsers()
  } catch (e) {
    inviteError.value = e.message || 'Failed to create user'
  } finally {
    inviteLoading.value = false
  }
}
</script>

<style scoped>
.data-table th {
  white-space: nowrap;
}

.data-table td {
  vertical-align: middle;
}
</style>
