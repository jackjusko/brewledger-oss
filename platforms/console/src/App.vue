<template>
  <div class="min-h-screen bg-neutral-50 dark:bg-stone-950">
    <!-- Landing page: no sidebar, full-width promotional content -->
    <template v-if="$route.meta.isLanding">
      <router-view />
    </template>
    <!-- Tools: standalone tools section (BBL converter, CSV search, etc.) -->
    <template v-else-if="$route.meta.isTools">
      <div class="tools-layout ledger-beer min-h-screen flex flex-col">
        <header class="tools-header ledger-header border-b-2 shadow-sm">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-14 sm:h-16">
              <router-link to="/tools" class="flex items-center gap-2.5 group rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 dark:focus-visible:ring-amber-600">
                <img src="/logo.png" alt="BrewLedger" class="w-9 h-9 sm:w-10 sm:h-10 object-contain" />
                <div class="border-l border-stone-200 dark:border-stone-600 pl-2.5">
                  <span class="font-black text-sm sm:text-base tracking-tight text-stone-900 dark:text-stone-100 block">BREWLEDGER</span>
                  <span class="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Tools</span>
                </div>
              </router-link>
              <nav class="hidden sm:flex items-center gap-1 lg:gap-2" aria-label="Tools">
                <router-link to="/tools" class="px-3 py-2 text-sm font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-700 dark:hover:text-amber-400 transition">All tools</router-link>
                <router-link to="/tools/bbl-to-case" class="px-3 py-2 text-sm font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-700 dark:hover:text-amber-400 transition">BBL to Case</router-link>
                <router-link to="/tools/csv-search" class="px-3 py-2 text-sm font-medium rounded-lg text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-amber-700 dark:hover:text-amber-400 transition">CSV Search</router-link>
              </nav>
              <div class="flex items-center gap-2">
                <router-link to="/" class="hidden xs:inline text-xs font-bold text-stone-600 dark:text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition">BrewLedger →</router-link>
                <button
                  @click="toggleTheme"
                  class="p-2 rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                  :title="theme === 'dark' ? 'Light mode' : 'Dark mode'"
                >
                  <span v-if="theme === 'dark'">☀️</span>
                  <span v-else>🌙</span>
                </button>
              </div>
            </div>
            <div class="sm:hidden flex flex-wrap items-center gap-1 pb-3 -mt-1 border-t border-stone-100 dark:border-stone-800 pt-2">
              <router-link to="/tools" class="px-2 py-1.5 text-xs font-medium rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">All tools</router-link>
              <span class="text-stone-300 dark:text-stone-600">·</span>
              <router-link to="/tools/bbl-to-case" class="px-2 py-1.5 text-xs font-medium rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">BBL to Case</router-link>
              <span class="text-stone-300 dark:text-stone-600">·</span>
              <router-link to="/tools/csv-search" class="px-2 py-1.5 text-xs font-medium rounded text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800">CSV Search</router-link>
            </div>
          </div>
        </header>
        <main class="tools-main flex-1 w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
        <footer class="tools-footer ledger-footer border-t-2 mt-auto">
          <div class="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <router-link to="/tools" class="font-semibold text-stone-900 dark:text-stone-100 hover:text-amber-700 dark:hover:text-amber-400">Tools</router-link>
              </div>
              <div class="text-sm text-stone-500 dark:text-stone-500">
                <router-link to="/" class="font-medium text-stone-700 dark:text-stone-300 hover:text-amber-700 dark:hover:text-amber-400">BrewLedger</router-link>
                <span class="mx-1">·</span>
                <span>© {{ new Date().getFullYear() }} BrewLedger</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </template>
    <!-- Unauthenticated app pages (login, register, forgot-password, reset): no sidebar or top bar -->
    <template v-else-if="$route.meta.requiresAuth === false">
      <router-view />
    </template>
    <!-- Desktop Layout with Sidebar for authenticated app routes -->
    <div v-else class="sidebar-layout">
      <!-- Sidebar Navigation -->
      <aside class="console-sidebar">
        <div class="console-sidebar-inner">
          <!-- Logo -->
          <div class="console-sidebar-logo">
            <img src="/logo.png" alt="BrewLedger" class="w-10 h-10 object-contain" />
            <div class="min-w-0">
              <h1 class="text-base font-bold text-neutral-900 dark:text-neutral-50 heading-refined truncate">BrewLedger</h1>
              <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">Console</p>
            </div>
          </div>

          <!-- Navigation (grouped) -->
          <nav class="console-sidebar-nav flex-1">
            <div v-for="group in navGroups" :key="group.label" class="console-sidebar-group">
              <h3 class="console-sidebar-group-title">{{ group.label }}</h3>
              <ul class="console-sidebar-list">
                <li v-for="item in group.items" :key="item.path">
                  <router-link
                    :to="item.path"
                    class="console-sidebar-link"
                    :class="{ 'console-sidebar-link-active': isNavItemActive(item) }"
                  >
                    <i :class="item.icon" aria-hidden="true"></i>
                    <span class="console-sidebar-link-text">{{ item.name }}</span>
                  </router-link>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="overflow-y-auto bg-neutral-50 dark:bg-stone-950">
        <!-- Top Bar -->
        <header class="console-header">
          <div class="console-header-inner">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 heading-refined mb-1">{{ currentPageTitle }}</h2>
                <p class="text-sm text-neutral-500 dark:text-stone-400">{{ currentPageDescription }}</p>
              </div>
              <div class="flex items-center gap-4">
                <!-- Sync Status -->
                <div class="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-stone-800 border border-neutral-200 dark:border-stone-700 shadow-sm">
                  <span v-if="isSyncing" class="w-2.5 h-2.5 bg-primary-500 rounded-full animate-pulse shadow-sm"></span>
                  <span v-else-if="syncError" class="w-2.5 h-2.5 bg-danger-500 rounded-full shadow-sm"></span>
                  <span v-else class="w-2.5 h-2.5 bg-success-500 rounded-full shadow-sm"></span>
                  <span class="text-xs font-medium text-neutral-600 dark:text-stone-400">
                    {{ isSyncing ? 'Syncing...' : syncError ? 'Sync Error' : 'Synced' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <div class="console-main">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </main>

      <!-- Tutorial (console only, when active and session exists) -->
      <TutorialShell
        v-if="session && !$route.meta.isLanding"
        :is-active="tutorialIsActive"
        :current-step-progress="tutorialCurrentStepProgress"
        :can-advance="tutorialCanAdvance"
        :progress-summary="tutorialProgressSummary"
        :system-check-passed="tutorialSystemCheckPassed"
        :next-route="tutorialNextRoute"
        :prev-route="tutorialPrevRoute"
        :resume-route="tutorialResumeRoute"
        @got-it="handleTutorialGotIt"
        @skip="handleTutorialSkip"
        @exit="tutorial.exit"
        @run-check="handleTutorialRunCheck"
        @back="tutorial.goToPrevStep"
      />
    </div>

    <!-- Global Modal (alert/confirm from useModal, used by BatchDetail etc.) -->
    <ModalDialog
      v-if="!$route.meta.isLanding"
      :isOpen="modal.isOpen"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :variant="modal.variant"
      :confirmText="modal.confirmText"
      @confirm="modal.onConfirm && modal.onConfirm()"
      @cancel="modal.isOpen = false"
    />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useHead } from '@vueuse/head'
import { useSession } from './composables/useSession'
import { SyncService } from './services/SyncService'
import { SITE_BASE_URL } from './config'
import ModalDialog from './components/ModalDialog.vue'
import TutorialShell from './components/tutorial/TutorialShell.vue'
import { useModal } from './composables/useModal'
import { useTutorial, runSystemCheck } from './composables/useTutorial'

const { modal, confirm, alert } = useModal()
provide('modal', { confirm, alert })

// Theme logic
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

// Navigation: grouped for sidebar, flat list for page title/description
const navGroups = [
  { label: 'Overview', items: [{ name: 'Dashboard', path: '/dashboard', icon: 'ri-dashboard-3-line' }] },
  {
    label: 'Inventory',
    items: [
      { name: 'Inventory', path: '/inventory', icon: 'ri-archive-drawer-line' },
      { name: 'Receive', path: '/receive', icon: 'ri-download-2-line' },
      { name: 'Consume', path: '/consume', icon: 'ri-delete-bin-line' },
      { name: 'Transfer', path: '/transfer', icon: 'ri-arrow-left-right-line' },
      { name: 'Locations', path: '/locations', icon: 'ri-map-pin-line' },
      { name: 'Beers', path: '/beers', icon: 'ri-beer-line' },
      { name: 'Items', path: '/items', icon: 'ri-price-tag-3-line' },
      { name: 'Par Levels', path: '/par-levels', icon: 'ri-bar-chart-grouped-line' },
    ],
  },
  {
    label: 'Production',
    items: [
      { name: 'Recipes', path: '/recipes', icon: 'ri-book-2-line' },
      { name: 'Batches', path: '/batches', icon: 'ri-flask-line' },
      { name: 'Vessels', path: '/vessels', icon: 'ri-database-2-line' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { name: 'Ledger', path: '/ledger', icon: 'ri-book-open-line' },
      { name: 'Serving', path: '/serving', icon: 'ri-cup-line' },
      { name: 'Removals', path: '/removals', icon: 'ri-truck-line' },
      { name: 'Losses', path: '/losses', icon: 'ri-error-warning-line' },
    ],
  },
  // {
  //   label: 'Distribution',
  //   items: [
  //     { name: 'Integrations', path: '/integrations', icon: 'ri-plug-line' },
  //     { name: 'Sales Order', path: '/sales-order', icon: 'ri-draft-line' },
  //   ],
  // },
  {
    label: 'Reports',
    items: [
      { name: 'Reports', path: '/reports', icon: 'ri-file-text-line' },
    ],
  },
  { label: 'Settings', items: [{ name: 'Settings', path: '/settings', icon: 'ri-settings-3-line' }] },
]
const navItems = navGroups.flatMap((g) => g.items)

function isNavItemActive(item) {
  const p = route.path
  if (p === item.path) return true
  if (item.path === '/dashboard') return false
  return p.startsWith(item.path + '/')
}

// Session management
const { session, refreshSession } = useSession()
const orgId = computed(() => session.value?.orgId)
const userId = computed(() => session.value?.userId)
const tutorial = useTutorial(orgId, userId)
provide('tutorial', tutorial)

// Unwrap refs for TutorialShell props (child expects plain values, not Ref objects)
const tutorialIsActive = computed(() => tutorial.isActive.value)
const tutorialCurrentStepProgress = computed(() => tutorial.currentStepProgress.value)
const tutorialCanAdvance = computed(() => tutorial.canAdvance.value)
const tutorialProgressSummary = computed(() => tutorial.progressSummary.value)
const tutorialSystemCheckPassed = computed(() => tutorial.progress.value?.systemCheckPassed ?? false)
const tutorialNextRoute = computed(() => tutorial.nextRoute.value)
const tutorialPrevRoute = computed(() => tutorial.prevRoute.value)
const tutorialResumeRoute = computed(() => tutorial.resumeRoute.value)

function handleTutorialRunCheck() {
  if (runSystemCheck()) tutorial.passSystemCheck()
}
function handleTutorialGotIt() {
  const progress = tutorial.currentStepProgress.value
  if (progress?.step?.requiredCheck === 'system_check') tutorial.passSystemCheck()
  tutorial.goToNextStep()
}
function handleTutorialSkip() {
  tutorial.skipCurrentStep()
}

import { useSync } from './composables/useSync'

// Sync status
const { isSyncing } = useSync()
const syncError = computed(() => SyncService.error)

// Initialize theme synchronously to prevent flash
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') || 'light'
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark')
  }
}

// Milestone templates migration
import { runMilestoneTemplatesMigration } from './utils/migrateMilestoneTemplates'

// Initialize theme and session
onMounted(async () => {
  if (theme.value === 'dark') {
    document.documentElement.classList.add('dark')
  }
  
  // Refresh session and start sync if authenticated
  await refreshSession()
  if (session.value) {
    try {
      await runMilestoneTemplatesMigration()
    } catch (e) {
      console.warn('Milestone migration:', e)
    }
    if (!SyncService.isSyncing) {
      SyncService.startSyncLoop()
    }
  }
})

// Route-based page titles
const route = useRoute()
const currentPageTitle = computed(() => {
  const item = navItems.find(item => item.path === route.path)
  if (item) return item.name
  // Use route meta title for sub-routes (e.g. /reports/ttb-form) - strip " - BrewLedger" for display
  const metaTitle = route.meta?.title
  if (metaTitle && typeof metaTitle === 'string') {
    return metaTitle.replace(/\s*-\s*BrewLedger\s*$/i, '').trim() || 'Reports'
  }
  return 'Dashboard'
})

const currentPageDescription = computed(() => {
  const descriptions = {
    '/dashboard': 'Overview and key metrics',
    '/inventory': 'Manage stock and items',
    '/receive': 'Record received inventory into a location',
    '/locations': 'Manage storage locations and TTB stage',
    '/locations/add': 'Create a new location',
    '/beers': 'Manage finished beer products (items in Finished Beer category)',
    '/items': 'Manage ingredients and finished beer items',
    '/items/add': 'Add a new item',
    '/par-levels': 'Set minimum stock levels by item and location',
    '/recipes': 'Define recipes with ingredients; assign to batches and sync to Beers',
    '/recipes/add': 'Create a new recipe',
    '/batches': 'Track brewing batches, vessels, and milestones',
    '/ledger': 'Transaction history and audit trail',
    '/removals': 'Record beer removals for TTB reporting',
    '/losses': 'Record inventory losses and theft for TTB reporting',
    '/integrations': 'Connect QuickBooks and other integrations',
    '/sales-order': 'Create sales orders with optional QuickBooks Invoice sync',
    '/reports': 'Generate and view reports',
    '/reports/ttb-form': 'Generate TTB Form 5130.9 from tracked operations',
    '/ai-assistant': 'Get help with brewery management',
    '/settings': 'System configuration',
    '/batches/add': 'Create a new batch',
    '/milestone-templates': 'Manage milestone checklists for batches'
  }
  if (descriptions[route.path]) return descriptions[route.path]
  if (route.path.startsWith('/locations/') && route.path.endsWith('/edit')) return 'Edit location details'
  if (route.path.startsWith('/items/') && route.path.endsWith('/edit')) return 'Edit item'
  if (route.path.startsWith('/batches/') && route.path !== '/batches' && route.path !== '/batches/add') return 'Batch details and vessels'
  if (route.path.startsWith('/recipes/') && route.path !== '/recipes' && route.path !== '/recipes/add') return 'Edit recipe'
  return 'Management console'
})

// SEO: Per-route title and canonical tag for Google indexing
const pageTitles = {
  '/': 'BrewLedger',
  '/login': 'Log In | BrewLedger',
  '/register': 'Register | BrewLedger',
  '/dashboard': 'Dashboard | BrewLedger',
  '/inventory': 'Inventory | BrewLedger',
  '/receive': 'Receive | BrewLedger',
  '/locations': 'Locations | BrewLedger',
  '/locations/add': 'Add Location | BrewLedger',
  '/locations/:id/edit': 'Edit Location | BrewLedger',
  '/items': 'Items | BrewLedger',
  '/items/add': 'Add Item | BrewLedger',
  '/items/:id/edit': 'Edit Item | BrewLedger',
  '/par-levels': 'Par Levels | BrewLedger',
  '/recipes': 'Recipes | BrewLedger',
  '/recipes/add': 'New Recipe | BrewLedger',
  '/batches': 'Batches | BrewLedger',
  '/ledger': 'Ledger | BrewLedger',
  '/removals': 'Beer Removals | BrewLedger',
  '/losses': 'Losses & Theft | BrewLedger',
  '/integrations': 'Integrations | BrewLedger',
  '/sales-order': 'Sales Order | BrewLedger',
  '/reports': 'Reports | BrewLedger',
  '/reports/ttb-form': 'TTB Form 5130.9 | BrewLedger',
  '/ai-assistant': 'AI Assistant | BrewLedger',
  '/settings': 'Settings | BrewLedger'
}

// SEO: title, meta description, and canonical.
const seoDescriptions = {
  '/tools': 'Free brewery tools for production managers: BBL to case converter, CSV search, and more. No login required.',
  '/tools/bbl-to-case': 'Production pack-out calculator: BBL to cases, kegs, 6-packs, 19.2oz stovepipes, 750ml bottles. Yield % slider, batch split, materials & revenue estimates.',
  '/tools/csv-search': 'Load a CSV from URL or upload a file to view and search it.'
}

useHead(computed(() => {
  const path = route.path
  const title = route.meta.title || pageTitles[path] || `${currentPageTitle.value} | BrewLedger`
  const canonicalUrl = SITE_BASE_URL ? `${SITE_BASE_URL}${path}` : null
  const description = seoDescriptions[path]
  return {
    title,
    ...(description ? {
      meta: [
        { name: 'description', content: description },
        { property: 'og:title', content: title },
        { property: 'og:description', content: description }
      ]
    } : {}),
    link: canonicalUrl ? [{ rel: 'canonical', href: canonicalUrl }] : []
  }
}))
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

/* Blog layout transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Sidebar active state handled by .console-sidebar-link-active in style.css */

/* The Ledger: serif headlines in blog layout only */
.blog-layout :deep(.ledger-headline) {
  font-family: 'Playfair Display', Georgia, serif;
}
</style>

<style>
/* Blog layout: craft-beer aesthetic (not scoped so children inherit) */
/* Light theme: clean warm neutrals, clear hierarchy and contrast */
.ledger-beer {
  --ledger-bone: #F8F6F1;
  --ledger-parchment: #FFFEFB;
  --ledger-stout: #2C1810;
  --ledger-charcoal: #44403C;
  --ledger-ink: #1C1917;
  --ledger-amber: #B45309;
  --ledger-amber-light: #D97706;
  --ledger-cta-write-btn-bg: var(--ledger-amber);
  --ledger-hops: #4D7C0F;
  --ledger-border: #E8E4DD;
  --ledger-coaster: #D4CFC4;
  --ledger-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  --ledger-card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  background-color: var(--ledger-bone);
  position: relative;
}

.ledger-beer::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
}

.dark .ledger-beer {
  --ledger-bone: #1C1917;
  --ledger-parchment: #292524;
  --ledger-stout: #0C0A09;
  --ledger-charcoal: #A8A29E;
  --ledger-ink: #FAFAF9;
  --ledger-border: #44403C;
  --ledger-coaster: #57534E;
  --ledger-card-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  --ledger-card-shadow-hover: 0 4px 12px rgba(0, 0, 0, 0.25);
  --ledger-cta-write-btn-bg: var(--ledger-amber);
  background-color: var(--ledger-bone);
}

.ledger-header {
  background-color: var(--ledger-parchment);
  border-color: var(--ledger-border);
}

.ledger-beer .ledger-header {
  box-shadow: 0 1px 0 var(--ledger-border);
}

.ledger-footer {
  background-color: var(--ledger-parchment);
  border-color: var(--ledger-border);
}

.ledger-beer .ledger-footer {
  box-shadow: 0 -1px 0 var(--ledger-border);
}
</style>
