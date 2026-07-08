<template>
  <div class="animate-fade-in space-y-3">

    <!-- Trial Banner -->
    <div v-if="trialDaysRemaining !== null && trialDaysRemaining >= 0 && isTrialing" class="animate-slide-up">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
             <span class="text-lg">⏳</span>
          </div>
          <div>
            <div class="font-bold text-body-sm text-blue-900 dark:text-blue-100">{{ trialDaysRemaining }} Days Left in Trial</div>
            <div class="text-body-xs text-blue-700 dark:text-blue-300">Upgrade to keep access</div>
          </div>
        </div>
        <router-link to="/settings" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md text-body-sm flex items-center gap-1 whitespace-nowrap">
          <span>Upgrade</span>
          <span class="text-sm">→</span>
        </router-link>
      </div>
    </div>

    <!-- Alert Banner -->
    <div v-if="lowStockCount > 0" class="animate-slide-up">
      <div class="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-lg p-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-md bg-danger-100 dark:bg-danger-900/40 flex items-center justify-center flex-shrink-0">
            <span class="text-lg text-danger-600 dark:text-danger-400">⚠️</span>
          </div>
          <div>
            <div class="font-bold text-body-sm text-danger-900 dark:text-danger-100">Low Stock: {{ lowStockCount }} item{{ lowStockCount !== 1 ? 's' : '' }}</div>
            <div class="text-body-xs text-danger-700 dark:text-danger-300">Below par level</div>
          </div>
        </div>
        <router-link to="/reorder" class="px-3 py-1.5 bg-danger-600 hover:bg-danger-700 text-white font-bold rounded-md text-body-sm flex items-center gap-1 whitespace-nowrap">
          <span>Review</span>
          <span class="text-sm">→</span>
        </router-link>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-body-md font-bold text-neutral-900 dark:text-neutral-50">Quick Actions</h2>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <router-link to="/receive" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <span class="text-lg">📥</span>
            </div>
            <div>
              <div class="font-bold text-body-sm">Receive</div>
              <div class="text-body-xs text-neutral-600 dark:text-neutral-400">Add stock</div>
            </div>
          </div>
        </router-link>

        <router-link to="/consume" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
              <span class="text-lg">➖</span>
            </div>
            <div>
              <div class="font-bold text-body-sm">Consume</div>
              <div class="text-body-xs text-neutral-600 dark:text-neutral-400">Log usage</div>
            </div>
          </div>
        </router-link>

        <router-link to="/transfer" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 flex items-center justify-center">
              <span class="text-lg">⇄</span>
            </div>
            <div>
              <div class="font-bold text-body-sm">Transfer</div>
              <div class="text-body-xs text-neutral-600 dark:text-neutral-400">Move items</div>
            </div>
          </div>
        </router-link>

        <router-link to="/count" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-md bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 flex items-center justify-center">
              <span class="text-lg">🔢</span>
            </div>
            <div>
              <div class="font-bold text-body-sm">Count</div>
              <div class="text-body-xs text-neutral-600 dark:text-neutral-400">Audit</div>
            </div>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Operations Grid -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-body-md font-bold text-neutral-900 dark:text-neutral-50">Operations</h2>
      </div>
      <div class="grid grid-cols-2 gap-1.5">
        <router-link to="/batches" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-7 h-7 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <span class="text-base">🍺</span>
            </div>
            <div class="font-bold text-body-sm">Batches</div>
          </div>
          <div class="text-body-xs text-neutral-600 dark:text-neutral-400 mb-2">Manage brews & production</div>
          <div class="pt-1.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <span class="text-body-xs text-neutral-500 dark:text-neutral-400">View all</span>
            <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
          </div>
        </router-link>

        <router-link to="/recipes" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-7 h-7 rounded-md bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 flex items-center justify-center">
              <span class="text-base">�</span>
            </div>
            <div class="font-bold text-body-sm">Recipes</div>
          </div>
          <div class="text-body-xs text-neutral-600 dark:text-neutral-400 mb-2">Formulas & specifications</div>
          <div class="pt-1.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <span class="text-body-xs text-neutral-500 dark:text-neutral-400">View catalog</span>
            <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
          </div>
        </router-link>

        <router-link to="/inventory" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-7 h-7 rounded-md bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 flex items-center justify-center">
              <span class="text-base">📦</span>
            </div>
            <div class="font-bold text-body-sm">Inventory</div>
          </div>
          <div class="text-body-xs text-neutral-600 dark:text-neutral-400 mb-2">Stock levels & locations</div>
          <div class="pt-1.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <span class="text-body-xs text-neutral-500 dark:text-neutral-400">View all</span>
            <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
          </div>
        </router-link>

        <router-link to="/ledger" class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2 mb-1.5">
            <div class="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-center">
              <span class="text-base">�</span>
            </div>
            <div class="font-bold text-body-sm">Ledger</div>
          </div>
          <div class="text-body-xs text-neutral-600 dark:text-neutral-400 mb-2">Transaction history</div>
          <div class="pt-1.5 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between">
            <span class="text-body-xs text-neutral-500 dark:text-neutral-400">View log</span>
            <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Management Tools -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h2 class="text-body-md font-bold text-neutral-900 dark:text-neutral-50">Management</h2>
      </div>
      <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg divide-y divide-neutral-100 dark:divide-neutral-700">
        <router-link to="/beers" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <span class="text-sm">🍻</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Beers</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Finished products</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/items" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <span class="text-sm">📦</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Items</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Ingredients & materials</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/locations" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-success-50 dark:bg-success-900/30 text-success-600 dark:text-success-400 flex items-center justify-center">
              <span class="text-sm">�</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Locations</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Storage areas</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/vessels" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-warning-50 dark:bg-warning-900/30 text-warning-600 dark:text-warning-400 flex items-center justify-center">
              <span class="text-sm">⚗️</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Vessels</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Tanks & equipment</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/serving" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span class="text-sm">🍺</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Serving</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Taps & draft management</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/remove-beer" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center">
              <span class="text-sm">🚚</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Remove Beer</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Log removals & losses</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>

        <router-link to="/export" class="flex items-center justify-between p-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400 flex items-center justify-center">
              <span class="text-sm">�</span>
            </div>
            <div>
              <div class="font-bold text-body-sm text-neutral-900 dark:text-neutral-50">Export</div>
              <div class="text-body-xs text-neutral-500 dark:text-neutral-400">Reports & analytics</div>
            </div>
          </div>
          <span class="text-neutral-400 dark:text-neutral-500 text-sm">→</span>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { AuthService } from '../services/AuthService';
import { SyncService } from '../services/SyncService';
import { ParLevelRepository } from '../repositories/ParLevelRepository';

const lowStockCount = ref(0);
const session = ref(null);
const trialDaysRemaining = ref(null);
const isTrialing = ref(false);

onMounted(async () => {
  session.value = await AuthService.getSession();

  // Calculate Trial Days
  if (session.value) {
      if (session.value.subscriptionStatus === 'trialing' && session.value.trialEndsAt) {
          isTrialing.value = true;
          const end = new Date(session.value.trialEndsAt);
          const now = new Date();
          if (now > end) {
              trialDaysRemaining.value = 0;
              // Ideally the user should be redirected or locked out if status is not updated,
              // but status update is handled by backend sync.
              // We just ensure we don't show negative days here.
          } else {
              const diffTime = end - now;
              trialDaysRemaining.value = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          }
      } else if (!session.value.subscriptionStatus) {
         // Fallback for legacy accounts without explicit status
         if (session.value.trialEndsAt) {
            isTrialing.value = true;
             const end = new Date(session.value.trialEndsAt);
             const now = new Date();

             if (now > end) {
                 trialDaysRemaining.value = 0;
             } else {
                 const diffTime = end - now;
                 trialDaysRemaining.value = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
             }
         }
      }
  }

  // Check Par Levels for Low Stock (individual + global)
  const parLevels = await ParLevelRepository.getAll();
  const allOnhand = await LedgerRepository.getAllOnhand();
  const allItems = await ItemRepository.getAll();
  const allLocations = await LocationRepository.getAll();

  const breachedItemIds = new Set();
  for (const par of parLevels) {
    if (!par.min_qty || par.min_qty <= 0) continue;

    const itemExists = allItems.find(i => i.id === par.item_id);
    if (!itemExists) continue;

    const isGlobal = par.location_id == null || par.location_id === '';
    let currentQty;

    if (isGlobal) {
      currentQty = allOnhand
        .filter(o => o.item_id === par.item_id)
        .reduce((sum, o) => sum + o.quantity, 0);
    } else {
      const locationExists = allLocations.find(l => l.id === par.location_id);
      if (!locationExists) continue;
      const entry = allOnhand.find(o => o.item_id === par.item_id && o.location_id === par.location_id);
      currentQty = entry ? entry.quantity : 0;
    }

    if (currentQty < par.min_qty) {
      breachedItemIds.add(par.item_id);
    }
  }
  lowStockCount.value = breachedItemIds.size;

  // Start background sync if logged in
  if (session.value) {
    SyncService.startSyncLoop();
  }
});
</script>
