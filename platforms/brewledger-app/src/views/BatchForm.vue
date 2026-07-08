<template>
  <div class="p-4 pb-24 space-y-6">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-50">New Batch</h1>
    
    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-5">
        
        <!-- Basic Info -->
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Batch Name / Number</label>
          <input v-model="form.name" type="text" required class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-lg" placeholder="e.g. #104 - Pale Ale">
        </div>

        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Batch Date</label>
          <input v-model="form.batch_date" type="date" required class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Volume unit</label>
            <input v-model="form.planned_volume_unit" type="text" class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all" placeholder="bbl">
          </div>
          <div class="flex items-end">
            <p class="text-sm text-gray-500 dark:text-gray-400">Total volume = sum of vessel volumes below.</p>
          </div>
        </div>

        <!-- Milestone Template -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Milestone Template</label>
          <div class="relative">
            <select v-model="form.milestone_template_id" class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none">
              <option :value="null">Default (use org default)</option>
              <option v-for="t in milestoneTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">▼</div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-300 mt-2 ml-1">Choose which timeline template this batch will use. Default uses your organization's default template.</p>
        </div>

        <!-- Recipe Selection -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Recipe (Optional)</label>
          <div class="relative">
            <select v-model="form.recipe_id" class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none">
              <option :value="null">-- No Recipe (Manual) --</option>
              <option v-for="r in recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">▼</div>
          </div>
          <p class="text-xs text-gray-400 dark:text-gray-300 mt-2 ml-1">Selecting a recipe will prepare the inventory checklist.</p>
        </div>

        <!-- Brew Readiness Gate -->
        <div v-if="form.recipe_id && checklist.length > 0" class="mt-4 bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100">
          <h3 class="font-bold text-purple-900 mb-3 flex items-center gap-2">
            <span>📋</span> Inventory Readiness
          </h3>
          <div class="space-y-2">
            <div v-for="item in checklist" :key="item.itemId" class="flex justify-between items-center py-2 border-b border-purple-100 last:border-0">
              <div>
                <div class="font-bold text-purple-800">{{ item.name }}</div>
                <div class="text-xs text-purple-600 dark:text-purple-400">
                  Req: {{ item.required }} {{ item.unit }}
                </div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm" :class="item.sufficient ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                  {{ item.sufficient ? 'Available' : 'Missing' }}
                </div>
                <div class="text-xs text-purple-400">
                  Have: {{ item.onHand }}
                </div>
              </div>
            </div>
          </div>
          <div v-if="hasMissingItems" class="mt-3 bg-red-100 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-200 flex items-center gap-2">
            <span>⚠️</span> Warning: Insufficient inventory.
          </div>
        </div>

        <!-- Vessel splits: one or more vessels with volume each -->
        <div class="pt-2 border-t border-gray-100 dark:border-gray-700">
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Vessels &amp; volume</label>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">Assign one vessel (default) or split volume across multiple vessels.</p>
          <div class="space-y-3">
            <div
              v-for="(row, idx) in form.splits"
              :key="idx"
              class="flex gap-2 items-end flex-wrap"
            >
              <div class="flex-1 min-w-[120px]">
                <select
                  v-model="row.vessel_id"
                  class="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option :value="null">-- Vessel --</option>
                  <option v-for="v in vesselsForBatch" :key="v.id" :value="v.id">
                    {{ v.name }} ({{ v.type }})
                  </option>
                </select>
              </div>
              <div class="w-24">
                <input
                  v-model.number="row.current_volume"
                  type="number"
                  step="any"
                  min="0"
                  class="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-purple-500 outline-none"
                  :placeholder="form.planned_volume_unit || 'vol'"
                />
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400 shrink-0">{{ form.planned_volume_unit || '' }}</div>
              <button
                v-if="form.splits.length > 1"
                type="button"
                @click="removeSplit(idx)"
                class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                title="Remove vessel"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              @click="addSplit"
              class="text-sm text-blue-600 dark:text-blue-400 font-medium hover:underline"
            >
              + Add another vessel
            </button>
          </div>
          <p v-if="totalVolume != null" class="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Total: {{ totalVolume }} {{ form.planned_volume_unit }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Serving tanks cannot be assigned here; use Mark Production Complete to send beer to a serving tank.</p>
        </div>
        
        <div>
          <label class="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 uppercase tracking-wide">Initial Status</label>
          <div class="relative">
            <select v-model="form.status" class="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 dark:text-white focus:bg-white focus:ring-2 focus:ring-purple-500 outline-none transition-all appearance-none">
              <option value="PLANNED">Planned</option>
              <option value="BREWED">Brewed (In Progress)</option>
            </select>
            <div class="absolute inset-y-0 right-4 flex items-center pointer-events-none text-gray-500 dark:text-gray-400">▼</div>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-2">
        <button type="button" @click="$router.back()" class="px-6 py-4 text-gray-600 dark:text-gray-300 hover:bg-gray-100 rounded-xl font-bold transition-colors">
          Cancel
        </button>
        <button type="submit" class="flex-1 px-6 py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold shadow-lg transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed" :disabled="saving">
          {{ saving ? 'Creating...' : 'Create Batch' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { BatchRepository } from '../repositories/BatchRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { MilestoneTemplateRepository } from '../repositories/MilestoneTemplateRepository';
import { AuthService } from '../services/AuthService';
import { AllocationRepository } from '../repositories/AllocationRepository';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { SyncService } from '../services/SyncService';
import dayjs from 'dayjs';
import { watch } from 'vue';

const router = useRouter();
const vessels = ref([]);
const recipes = ref([]);
const milestoneTemplates = ref([]);
const checklist = ref([]);
const checklistLoading = ref(false);
const saving = ref(false);

const form = reactive({
  name: '',
  batch_date: dayjs().format('YYYY-MM-DD'),
  recipe_id: null,
  planned_volume_unit: 'bbl',
  status: 'PLANNED',
  milestone_template_id: null,
  splits: [{ vessel_id: null, current_volume: null }]
});

const totalVolume = computed(() => {
  const sum = form.splits.reduce((s, row) => s + (Number(row.current_volume) || 0), 0);
  return sum > 0 ? sum : null;
});

// Exclude serving tanks (vessels with a linked location); new batches cannot be assigned to serving tanks
const vesselsForBatch = computed(() =>
  (vessels.value || []).filter((v) => !v.deleted_at && !v.location_id)
);

function addSplit() {
  form.splits.push({ vessel_id: null, current_volume: null });
}

function removeSplit(idx) {
  if (form.splits.length <= 1) return;
  form.splits.splice(idx, 1);
}

watch(() => form.recipe_id, (newId) => {
  if (newId) {
    const r = recipes.value.find(x => x.id === newId);
    if (r && r.base_volume) {
      form.planned_volume_unit = r.base_volume_unit || form.planned_volume_unit;
      if (form.splits.length === 1 && !form.splits[0].current_volume) {
        form.splits[0].current_volume = r.base_volume;
      }
    }
  }
});

onMounted(async () => {
  vessels.value = await VesselRepository.getAll();
  recipes.value = await RecipeRepository.getAll();
  const session = await AuthService.getSession();
  if (session?.orgId) await MilestoneTemplateRepository.ensureDefaultTemplate(session.orgId);
  milestoneTemplates.value = await MilestoneTemplateRepository.getAll();
});

const save = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    const validSplits = form.splits.filter(s => s.vessel_id && (s.current_volume != null && s.current_volume !== ''));
    const totalTheoreticalVolume = validSplits.reduce((s, sp) => s + (Number(sp.current_volume) || 0), 0);
    if (validSplits.length === 0) {
      alert('Assign at least one vessel with volume.');
      return;
    }
    const newBatch = await BatchRepository.create({
      name: form.name,
      batch_date: form.batch_date,
      planned_volume_unit: form.planned_volume_unit,
      status: form.status,
      milestone_template_id: form.milestone_template_id,
      total_theoretical_volume: totalTheoreticalVolume,
      recipe_id: form.recipe_id || undefined,
      splits: validSplits.map(s => ({ vessel_id: s.vessel_id, current_volume: Number(s.current_volume) || 0 }))
    });
    
    // Create Allocations if Recipe
    if (form.recipe_id && checklist.value.length > 0) {
      for (const item of checklist.value) {
        await AllocationRepository.allocate(
          newBatch.id,
          item.itemId,
          null, // No specific location for allocation yet, or pick default?
          item.required
        );
      }
    }
    
    await SyncService.sync();
    
    if (form.recipe_id) {
      router.replace(`/batches/${newBatch.id}/consume-recipe/${form.recipe_id}`);
    } else {
      router.replace(`/batches/${newBatch.id}`);
    }
  } catch (e) {
    alert('Failed to create batch: ' + e.message);
  } finally {
    saving.value = false;
  }
};
</script>
