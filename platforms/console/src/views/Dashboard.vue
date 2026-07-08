<template>
  <div class="desktop-container">
    <!-- Logged-in user & brewery (dashboard only) – prominent welcome -->
    <div v-if="session?.orgName || session?.userName" class="mb-6 rounded-xl border border-neutral-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 px-5 py-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <div class="flex items-baseline gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-stone-400">Logged in as</span>
        <span class="font-semibold text-neutral-900 dark:text-stone-100">{{ session?.userName || '—' }}</span>
      </div>
      <div v-if="session?.orgName" class="flex items-baseline gap-2">
        <span class="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-stone-400">Brewery</span>
        <span class="font-semibold text-neutral-900 dark:text-stone-100">{{ session.orgName }}</span>
      </div>
    </div>

    <!-- Error: show first so it's visible -->
    <div v-if="error" class="console-error-banner mb-6">
      <i class="ri-error-warning-line" aria-hidden="true"></i>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-danger-900 dark:text-danger-100 text-sm">Error loading data</p>
        <p class="text-xs text-danger-700 dark:text-danger-300 mt-0.5">{{ error }}</p>
      </div>
      <button type="button" @click="loadData" class="btn btn-primary text-sm shrink-0">Retry</button>
    </div>

    <!-- Prominent tour banner: new-user CTA, permanently dismissible -->
    <div
      v-if="showTourBanner"
      class="mb-6 rounded-xl border-2 border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-950/60 p-5 flex items-center justify-between gap-4 shadow-sm"
    >
      <div class="flex items-center gap-4 flex-1 min-w-0">
        <div class="w-12 h-12 rounded-xl bg-primary-200 dark:bg-primary-800 flex items-center justify-center shrink-0">
          <i class="ri-guide-line text-2xl text-primary-600 dark:text-primary-300" aria-hidden="true"></i>
        </div>
        <div class="min-w-0">
          <p class="font-bold text-primary-900 dark:text-primary-100 text-base">New here? Take a quick tour to learn the basics</p>
          <p class="text-sm text-primary-700 dark:text-primary-300 mt-0.5">See locations, inventory, batches, and TTB in a few steps.</p>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <button
          type="button"
          class="btn btn-primary text-sm font-semibold px-5 py-2.5"
          @click="tutorial.reset(); tutorial.start()"
        >
          Take the tour
        </button>
        <button
          type="button"
          class="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 hover:underline"
          @click="dismissBanner"
        >
          Don't show again
        </button>
      </div>
    </div>

    <!-- Trial banner: X days remaining – clickable, goes to Settings → Billing -->
    <router-link
      v-if="trialDaysRemaining !== null && trialDaysRemaining >= 0 && isTrialing"
      to="/settings?tab=billing"
      class="mb-6 rounded-xl border border-neutral-200 dark:border-stone-600 bg-neutral-50 dark:bg-stone-800/50 p-4 flex items-center justify-between gap-4 no-underline text-inherit hover:bg-neutral-100/80 dark:hover:bg-stone-800 transition-colors cursor-pointer block"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-lg bg-neutral-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
          <i class="ri-time-line text-xl text-neutral-600 dark:text-stone-400" aria-hidden="true"></i>
        </div>
        <div>
          <p class="font-bold text-neutral-900 dark:text-stone-100 text-sm">{{ trialDaysRemaining }} Days Left in Trial</p>
          <p class="text-xs text-neutral-600 dark:text-stone-400 mt-0.5">Upgrade to keep access</p>
        </div>
      </div>
      <span class="btn btn-secondary text-sm shrink-0 pointer-events-none">Upgrade</span>
    </router-link>

    <!-- Quick Actions -->
    <div class="card mb-6">
      <div class="card-header flex items-center justify-between gap-4">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Quick actions</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Jump to common workflows</p>
        </div>
        <button
          v-if="tutorial && !tutorial.isActive?.value"
          type="button"
          class="btn btn-primary text-sm font-semibold inline-flex items-center gap-2"
          @click="tutorial.reset(); tutorial.start()"
        >
          <i class="ri-guide-line" aria-hidden="true"></i>
          Take the tour
        </button>
      </div>
      <div class="card-body flex flex-wrap gap-3">
        <router-link
          v-for="action in quickActions"
          :key="action.path"
          :to="action.path"
          class="btn btn-secondary text-sm inline-flex items-center gap-2"
        >
          <i :class="action.icon" aria-hidden="true"></i>
          {{ action.label }}
        </router-link>
      </div>
    </div>

    <!-- Stats Grid (Low Stock first – drives daily decisions) -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-6">
      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-warning">
            <i class="ri-error-warning-line" aria-hidden="true"></i>
          </div>
          <span class="stat-trend down" aria-label="attention needed">{{ lowStockCount }}</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-1 heading-refined">Low Stock</h3>
        <div class="stat-card-meta">
          <span class="text-neutral-600 dark:text-stone-400">Items breaching par levels</span>
          <router-link to="/par-levels" class="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline">Manage</router-link>
        </div>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-primary">
            <i class="ri-money-dollar-circle-line" aria-hidden="true"></i>
          </div>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-1 heading-refined">{{ totalInventoryValue != null ? formatCurrency(totalInventoryValue) : '—' }}</h3>
        <div class="stat-card-meta">
          <span class="text-neutral-600 dark:text-stone-400">Total inventory value</span>
          <router-link to="/inventory" class="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline">View inventory</router-link>
        </div>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-primary">
            <i class="ri-archive-drawer-line" aria-hidden="true"></i>
          </div>
          <span class="stat-trend up" aria-label="stable inventory">Live</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-1 heading-refined">{{ totalItems }}</h3>
        <div class="stat-card-meta">
          <span class="text-neutral-600 dark:text-stone-400">Total items</span>
          <span class="meta-pill"><i class="ri-database-2-line" aria-hidden="true"></i>{{ totalLocations }} locs</span>
        </div>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-success">
            <i class="ri-flask-line" aria-hidden="true"></i>
          </div>
          <span class="stat-trend up" aria-label="active batches">{{ activeBatchesCount }}</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-1 heading-refined">Active Batches</h3>
        <div class="stat-card-meta">
          <span class="text-neutral-600 dark:text-stone-400">In progress</span>
          <router-link to="/batches" class="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline">Open list</router-link>
        </div>
      </div>

      <div class="stat-card stat-card-util">
        <div class="flex items-center justify-between mb-3">
          <div class="stat-card-icon stat-card-icon-neutral">
            <i class="ri-map-pin-line" aria-hidden="true"></i>
          </div>
          <span class="stat-trend up" aria-label="locations">{{ totalLocations }}</span>
        </div>
        <h3 class="text-2xl font-bold text-neutral-900 dark:text-stone-100 mb-1 heading-refined">Locations</h3>
        <div class="stat-card-meta">
          <span class="text-neutral-600 dark:text-stone-400">Configured storage/sites</span>
          <router-link to="/inventory" class="text-amber-600 dark:text-amber-400 font-semibold text-xs hover:underline">View inventory</router-link>
        </div>
      </div>
    </div>

    <!-- Operations snapshots (Vessel Overview first – drives daily decisions) -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Vessel Overview -->
      <div class="card overflow-hidden">
        <div class="card-header flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Vessel overview</h3>
            <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">What's in each tank</p>
          </div>
          <router-link to="/vessels" class="text-amber-600 dark:text-amber-400 hover:underline text-sm font-semibold">Manage</router-link>
        </div>
        <div class="card-body p-0">
          <div v-if="loading" class="console-empty">
            <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400">Loading...</p>
          </div>
          <div v-else-if="vesselOverview.length === 0" class="console-empty">
            <i class="ri-database-2-line console-empty-icon" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400">No vessels with active volume</p>
          </div>
          <div v-else class="compact-list max-h-[24rem] overflow-y-auto">
            <div
              v-for="vessel in vesselOverview"
              :key="vessel.id"
              class="compact-list-row"
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-neutral-900 dark:text-stone-100 truncate text-sm">{{ vessel.vesselName }}</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5">
                  <i class="ri-flask-line text-[11px]" aria-hidden="true"></i>
                  {{ vessel.batchName || 'Unassigned batch' }}
                </p>
              </div>
              <div class="text-right ml-4 shrink-0">
                <p class="font-bold text-neutral-900 dark:text-stone-100 text-sm">{{ vessel.volumeDisplay }}</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400">{{ vessel.status || '—' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Serving summary + TTB -->
      <div class="space-y-4">
        <div class="card overflow-hidden">
          <div class="card-header flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Serving summary</h3>
              <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Brewed and packaged</p>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                class="filter-pill text-xs py-1.5 px-2.5"
                :class="{ 'is-active': selectedRange === '30d' }"
                @click="selectedRange = '30d'"
              >
                30 days
              </button>
              <button
                type="button"
                class="filter-pill text-xs py-1.5 px-2.5"
                :class="{ 'is-active': selectedRange === '90d' }"
                @click="selectedRange = '90d'"
              >
                90 days
              </button>
              <span v-if="servingSource" class="meta-pill text-xs"><i class="ri-database-2-line" aria-hidden="true"></i>{{ servingSource }}</span>
            </div>
          </div>
          <div class="card-body">
            <div v-if="servingLoading" class="text-sm text-neutral-500 dark:text-stone-400">Loading...</div>
            <div v-else-if="servingError" class="text-sm text-danger-600 dark:text-danger-400">{{ servingError }}</div>
            <div v-else>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="p-3 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Brewed (total)</p>
                  <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ formatNumber(servingTotals.brewed) }} bbl</p>
                </div>
                <div class="p-3 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Packaged on hand</p>
                  <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ formatNumber(servingTotals.packaged) }} bbl</p>
                </div>
                <div class="p-3 rounded-lg border border-neutral-200 dark:border-stone-700 bg-neutral-50 dark:bg-stone-900/40">
                  <p class="text-xs text-neutral-500 dark:text-stone-400">Bulk on hand</p>
                  <p class="text-lg font-bold text-neutral-900 dark:text-stone-100">{{ formatNumber(servingTotals.bulk) }} bbl</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card overflow-hidden">
          <div class="card-header flex items-center justify-between">
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">TTB compliance</h3>
              <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Form 5130.9 · {{ currentPeriodLabel }} ({{ currentPeriodRangeLabel }})</p>
              <p class="text-xs font-medium text-amber-600 dark:text-amber-400 mt-1">Due by {{ ttbDueDateLabel }}</p>
            </div>
            <router-link to="/reports/ttb-form" class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors">Open TTB form</router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- Top Inventory -->
      <div class="card overflow-hidden">
        <div class="card-header flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Top Inventory</h3>
            <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Highest on-hand items</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="meta-pill"><i class="ri-list-unordered" aria-hidden="true"></i>{{ inventoryItems.length }} items</span>
            <router-link to="/inventory" class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors shrink-0">
              View all <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
            </router-link>
          </div>
        </div>
        <div class="card-body p-0">
          <div v-if="loading" class="console-empty">
            <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400">Loading...</p>
          </div>
          <div v-else-if="inventoryItems.length === 0" class="console-empty">
            <i class="ri-archive-drawer-line console-empty-icon" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400">No inventory items</p>
          </div>
          <div v-else class="compact-list max-h-[28rem] overflow-y-auto">
            <div
              v-for="item in inventoryItems.slice(0, 12)"
              :key="item.id"
              class="compact-list-row group cursor-pointer"
              role="button"
              tabindex="0"
              @click="router.push('/inventory')"
              @keydown.enter="router.push('/inventory')"
              @keydown.space.prevent="router.push('/inventory')"
            >
              <div class="flex-1 min-w-0">
                <p class="font-semibold text-neutral-900 dark:text-stone-100 truncate text-sm group-hover:text-amber-600 dark:group-hover:text-amber-400">{{ item.name }}</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5 flex items-center gap-1.5">
                  <span class="meta-pill"><i class="ri-stack-line" aria-hidden="true"></i>{{ item.category || 'Uncategorized' }}</span>
                </p>
              </div>
              <div class="text-right ml-4 shrink-0">
                <p class="font-bold text-neutral-900 dark:text-stone-100 text-sm">{{ item.totalOnhand }} {{ item.unit || '' }}</p>
              <p v-if="item.estimatedValue != null" class="text-xs text-neutral-500 dark:text-stone-400">Est value: {{ formatCurrency(item.estimatedValue, item.currency) }}</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400 flex items-center gap-1 justify-end">
                  <i class="ri-map-pin-line text-[11px]" aria-hidden="true"></i>
                  {{ item.locationName || 'Multiple' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="card overflow-hidden">
        <div class="card-header flex items-center justify-between gap-4">
          <div>
            <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Low Stock Alerts</h3>
            <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Breaches by item/location</p>
          </div>
          <div v-if="lowStockItems.length > 0" class="flex items-center gap-2 shrink-0">
            <span class="meta-pill"><i class="ri-error-warning-line" aria-hidden="true"></i>{{ lowStockItems.length }}</span>
            <router-link to="/par-levels" class="text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 text-sm font-semibold inline-flex items-center gap-1.5 transition-colors">
              Manage <i class="ri-arrow-right-line text-sm" aria-hidden="true"></i>
            </router-link>
          </div>
        </div>
        <div class="card-body p-0">
          <div v-if="loading" class="console-empty">
            <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400">Loading...</p>
          </div>
          <div v-else-if="lowStockItems.length === 0" class="console-empty">
            <i class="ri-checkbox-circle-line console-empty-icon text-success-500 dark:text-success-400" aria-hidden="true"></i>
            <p class="text-sm text-neutral-500 dark:text-stone-400 font-medium mb-2">All stock levels are healthy</p>
            <router-link to="/par-levels" class="text-amber-600 dark:text-amber-400 hover:underline text-sm font-semibold">Manage par levels</router-link>
          </div>
          <div v-else class="divide-y divide-neutral-200 dark:divide-stone-700 max-h-[28rem] overflow-y-auto">
            <div
              v-for="item in lowStockItems"
              :key="`${item.id}-${item.isGlobal ? 'global' : item.locationName}`"
              class="flex items-center justify-between px-4 py-3 border-l-4 border-warning-500 bg-warning-50/50 dark:bg-warning-900/10 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="font-bold text-neutral-900 dark:text-stone-100 text-sm">{{ item.name }}</p>
                <p class="text-xs text-neutral-600 dark:text-stone-400 mt-0.5 flex items-center gap-1.5">
                  <i v-if="item.isGlobal" class="ri-global-line text-xs" aria-hidden="true"></i>
                  <i v-else class="ri-map-pin-line text-xs" aria-hidden="true"></i>
                  {{ item.locationName }}
                </p>
              </div>
              <div class="text-right ml-4 shrink-0">
                <p class="font-bold text-warning-600 dark:text-warning-400 text-sm">{{ item.currentQty }} {{ item.unit || '' }}</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400">Min: {{ item.minQty }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="card overflow-hidden mb-6">
      <div class="card-header flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Recent activity</h3>
          <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">Latest ledger entries</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            class="filter-pill text-xs py-1.5 px-2.5"
            :class="{ 'is-active': selectedRange === '30d' }"
            @click="selectedRange = '30d'"
          >
            30 days
          </button>
          <button
            type="button"
            class="filter-pill text-xs py-1.5 px-2.5"
            :class="{ 'is-active': selectedRange === '90d' }"
            @click="selectedRange = '90d'"
          >
            90 days
          </button>
          <router-link to="/ledger" class="text-amber-600 dark:text-amber-400 hover:underline text-sm font-semibold">Open ledger</router-link>
        </div>
      </div>
      <div class="card-body p-0">
        <div v-if="loading" class="console-empty">
          <i class="ri-loader-4-line console-empty-icon animate-spin" aria-hidden="true"></i>
          <p class="text-sm text-neutral-500 dark:text-stone-400">Loading...</p>
        </div>
        <div v-else-if="recentEntries.length === 0" class="console-empty">
          <i class="ri-book-open-line console-empty-icon" aria-hidden="true"></i>
          <p class="text-sm text-neutral-500 dark:text-stone-400">No recent entries</p>
        </div>
        <div v-else class="divide-y divide-neutral-200 dark:divide-stone-700">
          <div v-for="entry in recentEntries" :key="entry.id" class="px-4 py-3 flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
              <p class="text-sm truncate">
                <span :class="getTypeClass(entry.type)" class="badge text-[11px] shrink-0">{{ entry.type?.replace('_', ' ') || '—' }}</span>
                <span class="font-semibold text-neutral-900 dark:text-stone-100 ml-2">{{ entry.item_name || 'Item' }}</span>
              </p>
              <p class="text-xs text-neutral-500 dark:text-stone-400 mt-0.5">
                {{ entry.location_name || 'No location' }} · {{ formatDate(entry.created_at) }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <span
                class="font-mono font-bold text-sm"
                :class="entry.quantity > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
              >
                {{ entry.quantity > 0 ? '+' : '' }}{{ entry.quantity }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, inject } from 'vue'

const tutorial = inject('tutorial', null)
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ParLevelRepository } from '../repositories/ParLevelRepository'
import { BatchRepository } from '../repositories/BatchRepository'
import { BatchMilestoneRepository } from '../repositories/BatchMilestoneRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { BatchLocationRepository } from '../repositories/BatchLocationRepository'
import { ServingReportsService } from '../services/ServingReportsService'
import { useSync } from '../composables/useSync'
import { SyncService } from '../services/SyncService'
import { AuthService } from '../services/AuthService'
const loading = ref(true)
const session = ref(null)
const trialDaysRemaining = ref(null)
const isTrialing = ref(false)
const loadingData = ref(false) // Prevent concurrent loads
const inventoryItems = ref([])
const lowStockItems = ref([])
const totalItems = ref(0)
const totalLocations = ref(0)
const lowStockCount = ref(0)
const activeBatchesCount = ref(0)
const error = ref(null)
const { syncTrigger } = useSync()
const selectedRange = ref('30d')
const vesselOverview = ref([])
const servingReport = ref(null)
const servingSource = ref(null)
const servingLoading = ref(false)
const servingError = ref(null)
const recentEntries = ref([])
const bannerDismissed = ref(false)

const BANNER_DISMISSED_KEY_PREFIX = 'tutorial_tour_banner_dismissed_'

function isBannerDismissed() {
  const s = session.value
  if (!s?.orgId || !s?.userId) return false
  try {
    return localStorage.getItem(`${BANNER_DISMISSED_KEY_PREFIX}${s.orgId}_${s.userId}`) === '1'
  } catch {
    return false
  }
}

function dismissBanner() {
  const s = session.value
  if (!s?.orgId || !s?.userId) return
  try {
    localStorage.setItem(`${BANNER_DISMISSED_KEY_PREFIX}${s.orgId}_${s.userId}`, '1')
  } catch (e) {
    console.warn('Tour banner dismiss save failed', e)
  }
  bannerDismissed.value = true
}

const showTourBanner = computed(() => {
  return tutorial && !tutorial.isActive?.value && !bannerDismissed.value
})

const currentPeriodLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date())
const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
const currentMonthEnd = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
// TTB Form 5130.9 must be filed by the 15th day after the end of the reporting period
const ttbDueDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15)
const ttbDueDateLabel = ttbDueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })

const selectedRangeLabel = computed(() => {
  return selectedRange.value === '90d' ? 'Last 90 days' : 'Last 30 days'
})

const formatDateRangeLabel = (start, end) => {
  if (!start || !end) return ''
  const fmt = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(start)} – ${fmt(end)}`
}

const currentPeriodRangeLabel = formatDateRangeLabel(currentMonthStart, currentMonthEnd)

const quickActions = [
  { label: 'Receive', path: '/receive', icon: 'ri-download-2-line' },
  { label: 'Consume', path: '/consume', icon: 'ri-delete-bin-line' },
  { label: 'Transfer', path: '/transfer', icon: 'ri-arrow-left-right-line' },
  { label: 'Removals', path: '/removals', icon: 'ri-truck-line' },
  { label: 'Losses', path: '/losses', icon: 'ri-error-warning-line' },
  { label: 'Ledger', path: '/ledger', icon: 'ri-book-open-line' }
]

const getRangeDates = () => {
  const days = selectedRange.value === '90d' ? 90 : 30
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

const formatCurrency = (value, currency = 'USD') => {
  if (value == null || Number.isNaN(value)) return null
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value))
  } catch (e) {
    return `$${Number(value).toFixed(2)}`
  }
}

const formatNumber = (value) => {
  if (value == null || Number.isNaN(value)) return '0'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const formatDate = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const getTypeClass = (type) => {
  if (!type) return 'bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-300'
  if (type.includes('RECEIVE') || (type.includes('ADJUST') && !type.includes('NEG'))) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  if (type.includes('CONSUME') || type.includes('NEG')) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
  if (type.includes('TRANSFER')) return 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300'
  return 'bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-300'
}

const servingTotals = computed(() => {
  const report = servingReport.value
  if (!report) return { brewed: 0, packaged: 0, bulk: 0 }
  const brewed = (report.brewedByLocation || []).reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const packaged = (report.packagedByLocation || []).reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  const bulk = (report.bulkOnhandByVessel || []).reduce((sum, r) => sum + (Number(r.quantity) || 0), 0)
  return { brewed, packaged, bulk }
})

const totalInventoryValue = computed(() => {
  const items = inventoryItems.value
  if (!items.length) return null
  const sum = items.reduce((acc, item) => acc + (Number(item.estimatedValue) || 0), 0)
  return sum > 0 ? sum : null
})

const loadData = async () => {
  // Prevent concurrent loads
  if (loadingData.value) return
  loadingData.value = true
  loading.value = true
  error.value = null
  servingError.value = null
  servingLoading.value = true
  
  try {
    // Load items and locations
    const [items, locations, allOnhand, parLevels, batches, vessels] = await Promise.all([
      ItemRepository.getAll(),
      LocationRepository.getAll(),
      LedgerRepository.getAllOnhand(),
      ParLevelRepository.getAll(),
      BatchRepository.getAll(),
      VesselRepository.getAll()
    ])

    totalItems.value = items.length
    totalLocations.value = locations.length

    // Process inventory items
    const locationMap = new Map(locations.map(l => [l.id, l.name]))
    inventoryItems.value = items.map(item => {
      const onhandEntries = allOnhand.filter(o => o.item_id === item.id)
      const totalQty = onhandEntries.reduce((sum, e) => sum + e.quantity, 0)
      const mainLocation = onhandEntries.find(e => e.quantity > 0)
      const estimatedValue = item.default_unit_cost != null ? (Number(item.default_unit_cost) || 0) * totalQty : null
      return {
        ...item,
        totalOnhand: totalQty,
        locationName: mainLocation ? locationMap.get(mainLocation.location_id) : null,
        estimatedValue
      }
    }).sort((a, b) => b.totalOnhand - a.totalOnhand)

    // Process low stock items (individual + global)
    const lowStockList = []
    const seenKeys = new Set()
    for (const par of parLevels) {
      if (!par.min_qty || par.min_qty <= 0) continue

      const item = items.find(i => i.id === par.item_id)
      if (!item) continue

      const isGlobal = par.location_id == null || par.location_id === ''
      let currentQty, locationName

      if (isGlobal) {
        currentQty = allOnhand
          .filter(o => o.item_id === par.item_id)
          .reduce((sum, o) => sum + o.quantity, 0)
        locationName = 'All Locations (Global)'
      } else {
        const location = locations.find(l => l.id === par.location_id)
        if (!location) continue
        const entry = allOnhand.find(o => o.item_id === par.item_id && o.location_id === par.location_id)
        currentQty = entry ? entry.quantity : 0
        locationName = location.name
      }

      if (currentQty < par.min_qty) {
        const key = `${par.item_id}-${isGlobal ? 'global' : par.location_id}`
        if (!seenKeys.has(key)) {
          seenKeys.add(key)
          lowStockList.push({
            ...item,
            currentQty,
            minQty: par.min_qty,
            locationName,
            isGlobal
          })
        }
      }
    }
    lowStockItems.value = lowStockList
    lowStockCount.value = lowStockList.length

    // Process active batches (batch is active when last milestone not completed)
    const vesselMap = new Map(vessels.map(v => [v.id, v]))
    const batchesWithMilestones = await Promise.all(
      batches.map(async batch => {
        const milestones = await BatchMilestoneRepository.getByBatchId(batch.id)
        const defs = BatchMilestoneRepository.getDefinitionsForBatch(batch)
        const mergedMilestones = (defs || []).map(def => {
          const m = milestones.find(x => (x.milestone_definition_id || x.milestone_type) === def.id)
          return m ? { ...def, completed: m.completed, occurred_at: m.occurred_at } : { ...def, completed: false, occurred_at: null }
        })
        const lastCompleted = mergedMilestones.filter(m => m.completed).length
        const total = mergedMilestones.length
        const isComplete = total > 0 && lastCompleted >= total
        return {
          ...batch,
          vesselName: batch.vessel_id ? vesselMap.get(batch.vessel_id)?.name : null,
          milestones: mergedMilestones
        }
      })
    )

    const activeBatchesList = batchesWithMilestones.filter(b => {
      const defs = b.milestone_definitions || b.milestones?.map(m => ({ id: m.id }))
      const total = defs?.length || 0
      const completed = b.milestones?.filter(m => m.completed).length || 0
      return total === 0 || completed < total
    })
    activeBatchesCount.value = activeBatchesList.length

    // Vessel overview
    const batchLocations = await BatchLocationRepository.getByBatchIds(batches.map(b => b.id))
    const batchMap = new Map(batches.map(b => [b.id, b]))
    vesselOverview.value = batchLocations
      .filter(bl => bl && Number(bl.current_volume) > 0)
      .map(bl => {
        const vessel = vesselMap.get(bl.vessel_id)
        const batch = batchMap.get(bl.parent_batch_id)
        const volume = Number(bl.current_volume) || 0
        const unit = batch?.planned_volume_unit || 'bbl'
        return {
          id: bl.id,
          vesselName: vessel?.name || 'Unassigned vessel',
          batchName: batch?.name || 'Unassigned batch',
          volume,
          volumeDisplay: `${formatNumber(volume)} ${unit}`,
          status: bl.status || 'Fermenting'
        }
      })
      .sort((a, b) => {
        return b.volume - a.volume
      })
      .slice(0, 12)

    // Serving summary
    const { start, end } = getRangeDates()
    try {
      const report = await ServingReportsService.getReport({ periodStart: start, periodEnd: end })
      servingReport.value = report
      servingSource.value = report?.source || null
    } catch (err) {
      console.error('Error loading serving report:', err)
      servingError.value = err.message || 'Failed to load serving summary'
      servingReport.value = null
    } finally {
      servingLoading.value = false
    }

    // Recent activity
    const entries = await LedgerRepository.getEntries({ startDate: start.toISOString(), endDate: end.toISOString() })
    recentEntries.value = entries.slice(0, 8)

  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = err.message || 'Failed to load dashboard data'
    servingLoading.value = false
  } finally {
    loading.value = false
    loadingData.value = false
  }
}

import { useRouter } from 'vue-router'

const router = useRouter()

const updateTrialFromSession = () => {
  const s = session.value
  if (!s) return
  if (s.subscriptionStatus === 'trialing' && s.trialEndsAt) {
    isTrialing.value = true
    const end = new Date(s.trialEndsAt)
    const now = new Date()
    trialDaysRemaining.value = now > end ? 0 : Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  } else if (!s.subscriptionStatus && s.trialEndsAt) {
    isTrialing.value = true
    const end = new Date(s.trialEndsAt)
    const now = new Date()
    trialDaysRemaining.value = now > end ? 0 : Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  }
}

onMounted(async () => {
  session.value = await AuthService.getSession()
  bannerDismissed.value = isBannerDismissed()
  updateTrialFromSession()
  await loadData()
})

// Reload when sync completes (syncTrigger increments every successful sync)
let reloadTimeout = null
watch(syncTrigger, () => {
  if (reloadTimeout) clearTimeout(reloadTimeout)
  reloadTimeout = setTimeout(() => {
    loadData()
  }, 300)
})

watch(selectedRange, () => {
  loadData()
})

// Cleanup timeout on unmount
onUnmounted(() => {
  if (reloadTimeout) {
    clearTimeout(reloadTimeout)
  }
})
</script>

<style scoped>
.desktop-container {
  max-width: 100%;
}
.dashboard-batch-tile:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}
</style>
