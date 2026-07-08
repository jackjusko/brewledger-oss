<template>
  <div class="desktop-container">
    <form @submit.prevent="save" class="space-y-6">
      <div class="bg-white dark:bg-neutral-800 p-6 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-5">
        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Batch Name / Number</label>
          <input v-model="form.name" type="text" required class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. #104 - Pale Ale" />
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Batch Date</label>
          <input v-model="form.batch_date" type="date" required class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Volume unit</label>
            <input v-model="form.planned_volume_unit" type="text" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="bbl" />
          </div>
          <div class="flex items-end">
            <p class="text-sm text-neutral-500 dark:text-neutral-400">Total volume = sum of vessel volumes below.</p>
          </div>
        </div>

        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Milestone Template</label>
          <select v-model="form.milestone_template_id" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
            <option :value="null">Default (use org default)</option>
            <option v-for="t in milestoneTemplates" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Choose which timeline template this batch will use.</p>
        </div>

        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Recipe (Optional)</label>
          <select v-model="form.recipe_id" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
            <option :value="null">-- No Recipe (Manual) --</option>
            <option v-for="r in recipes" :key="r.id" :value="r.id">{{ r.name }}</option>
          </select>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-2">Selecting a recipe will prepare the inventory checklist.</p>
        </div>

        <div v-if="form.recipe_id && checklist.length > 0" class="mt-4 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-xl border border-primary-100 dark:border-primary-800">
          <h3 class="font-bold text-primary-900 dark:text-primary-100 mb-3 flex items-center gap-2"><i class="ri-file-list-3-line" aria-hidden="true"></i> Inventory Readiness</h3>
          <div class="space-y-2">
            <div v-for="item in checklist" :key="item.itemId" class="flex justify-between items-center py-2 border-b border-primary-100 dark:border-primary-800 last:border-0">
              <div>
                <div class="font-bold text-primary-800 dark:text-primary-200">{{ item.name }}</div>
                <div class="text-xs text-primary-600 dark:text-primary-400">Req: {{ item.required }} {{ item.unit }}</div>
              </div>
              <div class="text-right">
                <div class="font-bold text-sm" :class="item.sufficient ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'">{{ item.sufficient ? 'Available' : 'Missing' }}</div>
                <div class="text-xs text-primary-500 dark:text-primary-400">Have: {{ item.onHand }}</div>
              </div>
            </div>
          </div>
          <div v-if="hasMissingItems" class="mt-3 bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 p-3 rounded-lg text-sm font-medium border border-danger-200 dark:border-danger-700 flex items-center gap-2"><i class="ri-error-warning-line" aria-hidden="true"></i> Warning: Insufficient inventory.</div>
        </div>

        <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700">
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Vessels & volume</label>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-3">Assign one vessel or split volume across multiple vessels.</p>
          <div class="space-y-3">
            <div v-for="(row, idx) in form.splits" :key="idx" class="flex gap-3 items-end flex-wrap">
              <div class="flex-1 min-w-[180px]">
                <select v-model="row.vessel_id" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
                  <option :value="null">-- Vessel --</option>
                  <option v-for="v in vesselsForBatch" :key="v.id" :value="v.id">{{ v.name }} ({{ v.type }})</option>
                </select>
              </div>
              <div class="w-28">
                <input v-model.number="row.current_volume" type="number" step="any" min="0" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none" :placeholder="form.planned_volume_unit || 'vol'" />
              </div>
              <span class="text-sm text-neutral-500 dark:text-neutral-400 shrink-0">{{ form.planned_volume_unit || '' }}</span>
              <button v-if="form.splits.length > 1" type="button" @click="removeSplit(idx)" class="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg" title="Remove vessel">✕</button>
            </div>
            <button type="button" @click="addSplit" class="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline">+ Add another vessel</button>
          </div>
          <p v-if="totalVolume != null" class="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">Total: {{ totalVolume }} {{ form.planned_volume_unit }}</p>
          <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Serving tanks cannot be assigned here; use Mark Production Complete to send beer to a serving tank.</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-neutral-700 dark:text-neutral-200 mb-2">Initial Status</label>
          <select v-model="form.status" class="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="PLANNED">Planned</option>
            <option value="BREWED">Brewed (In Progress)</option>
          </select>
        </div>
      </div>

      <div class="flex justify-end gap-3">
        <button type="button" @click="$router.back()" class="px-6 py-3 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg font-medium">Cancel</button>
        <button type="submit" class="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed" :disabled="saving">{{ saving ? 'Creating...' : 'Create Batch' }}</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { BatchRepository } from '../repositories/BatchRepository'
import { VesselRepository } from '../repositories/VesselRepository'
import { MilestoneTemplateRepository } from '../repositories/MilestoneTemplateRepository'
import { AuthService } from '../services/AuthService'
import { AllocationRepository } from '../repositories/AllocationRepository'
import { RecipeRepository } from '../repositories/RecipeRepository'
import { LedgerRepository } from '../repositories/LedgerRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { SyncService } from '../services/SyncService'
import dayjs from 'dayjs'

const router = useRouter()
const vessels = ref([])
const recipes = ref([])
const milestoneTemplates = ref([])
const checklist = ref([])
const saving = ref(false)

const form = reactive({
  name: '',
  batch_date: dayjs().format('YYYY-MM-DD'),
  recipe_id: null,
  planned_volume_unit: 'bbl',
  status: 'PLANNED',
  milestone_template_id: null,
  splits: [{ vessel_id: null, current_volume: null }]
})

const totalVolume = computed(() => {
  const sum = form.splits.reduce((s, row) => s + (Number(row.current_volume) || 0), 0)
  return sum > 0 ? sum : null
})

// Exclude serving tanks only; fermenters/brites with location_id are allowed for batch assignment
const vesselsForBatch = computed(() =>
  (vessels.value || []).filter((v) => !v.deleted_at && (v.type || '').toUpperCase() !== 'SERVING')
)

const hasMissingItems = computed(() => checklist.value.some(c => !c.sufficient))

function addSplit() {
  form.splits.push({ vessel_id: null, current_volume: null })
}

function removeSplit(idx) {
  if (form.splits.length <= 1) return
  form.splits.splice(idx, 1)
}

watch(() => form.recipe_id, async (newId) => {
  if (newId) {
    const r = recipes.value.find(x => x.id === newId)
    if (r && r.base_volume) {
      form.planned_volume_unit = r.base_volume_unit || form.planned_volume_unit
      if (form.splits.length === 1 && !form.splits[0].current_volume) form.splits[0].current_volume = r.base_volume
    }
    const recipeItems = await RecipeRepository.getItems(newId)
    const onhand = await LedgerRepository.getAllOnhand()
    const allItems = await ItemRepository.getAll()
    const itemMap = new Map((allItems || []).map(i => [i.id, i]))
    const byItem = (onhand || []).reduce((acc, e) => {
      acc[e.item_id] = (acc[e.item_id] || 0) + e.quantity
      return acc
    }, {})
    checklist.value = (recipeItems || []).map(ri => {
      const required = Number(ri.quantity) || 0
      const onHand = byItem[ri.item_id] || 0
      return {
        itemId: ri.item_id,
        name: itemMap.get(ri.item_id)?.name || 'Unknown',
        required,
        unit: ri.unit || '',
        onHand,
        sufficient: onHand >= required
      }
    })
  } else {
    checklist.value = []
  }
})

onMounted(async () => {
  vessels.value = await VesselRepository.getAll()
  recipes.value = await RecipeRepository.getAll()
  const session = await AuthService.getSession()
  if (session?.orgId) await MilestoneTemplateRepository.ensureDefaultTemplate(session.orgId)
  milestoneTemplates.value = await MilestoneTemplateRepository.getAll()
})

const save = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const validSplits = form.splits.filter(s => s.vessel_id && (s.current_volume != null && s.current_volume !== ''))
    const totalTheoreticalVolume = validSplits.reduce((s, sp) => s + (Number(sp.current_volume) || 0), 0)
    if (validSplits.length === 0) {
      alert('Assign at least one vessel with volume.')
      return
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
    })
    if (form.recipe_id && checklist.value.length > 0) {
      for (const item of checklist.value) {
        await AllocationRepository.allocate(newBatch.id, item.itemId, null, item.required)
      }
    }
    await SyncService.sync()
    if (form.recipe_id) router.replace(`/batches/${newBatch.id}/consume-recipe/${form.recipe_id}`)
    else router.replace(`/batches/${newBatch.id}`)
  } catch (e) {
    alert('Failed to create batch: ' + e.message)
  } finally {
    saving.value = false
  }
}
</script>
