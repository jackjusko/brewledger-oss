<template>
  <div class="bbl-to-case max-w-4xl">
    <div class="rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 p-6 sm:p-8">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">BBL to Case Equivalent Converter</h1>
      <p class="text-slate-600 dark:text-neutral-400 mb-6">
        Translate barrels into pack-out estimates with loss, split batches across formats, and estimate materials and revenue.
      </p>

      <!-- Inputs -->
      <div class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label for="bbl-input" class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Barrels (BBL)</label>
            <input
              id="bbl-input"
              v-model.number="bblInput"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 23"
              class="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Yield {{ yieldPct }}% <span class="text-slate-500 font-normal">(accounts for tank loss, foam, low-fills)</span>
            </label>
            <input
              v-model.number="yieldPct"
              type="range"
              min="80"
              max="100"
              step="1"
              class="yield-slider w-full h-3 cursor-pointer"
              :style="{ '--slider-pct': `${((yieldPct - 80) / 20) * 100}%` }"
            />
            <div class="flex justify-between text-xs text-slate-500 mt-1">
              <span>80%</span>
              <span>100%</span>
            </div>
          </div>
        </div>

        <!-- Split Batch Allocation -->
        <div v-if="bbl > 0" class="border-t border-slate-200 dark:border-neutral-700 pt-4">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Split the batch</h2>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mb-3">Allocate BBL to different formats. Leave blank to show all formats for the full batch.</p>
          <div class="space-y-2">
            <div
              v-for="(row, i) in splitRows"
              :key="i"
              class="flex flex-wrap items-center gap-2"
            >
              <input
                v-model.number="row.bbl"
                type="number"
                min="0"
                step="0.01"
                placeholder="BBL"
                class="w-20 px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
              />
              <span class="text-slate-400">→</span>
              <select
                v-model="row.formatKey"
                class="px-2 py-1.5 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm min-w-[140px]"
              >
                <option v-for="f in splitFormatOptions" :key="f.key" :value="f.key">{{ f.label }}</option>
              </select>
              <button
                v-if="splitRows.length > 1"
                type="button"
                @click="removeSplitRow(i)"
                class="p-1 text-slate-400 hover:text-red-500"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
            <button
              type="button"
              @click="addSplitRow"
              class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700"
            >
              + Add allocation
            </button>
          </div>
          <p v-if="splitTotal > 0 && Math.abs(splitTotal - bbl) > 0.01" class="mt-2 text-sm text-amber-600 dark:text-amber-400">
            Allocated {{ formatNum(splitTotal) }} BBL of {{ formatNum(bbl) }} BBL total
          </p>
        </div>

        <!-- Comparison Table -->
        <div v-if="bbl > 0" class="border-t border-slate-200 dark:border-neutral-700 pt-6">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">What-if comparison</h2>
          <div class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
              <thead>
                <tr class="border-b border-slate-200 dark:border-neutral-600">
                  <th class="text-left py-2 pr-4 font-medium text-slate-600 dark:text-neutral-400">Format</th>
                  <th class="text-right py-2 px-2 font-medium text-slate-600 dark:text-neutral-400">100% (theoretical max)</th>
                  <th class="text-right py-2 px-2 font-medium text-slate-600 dark:text-neutral-400">{{ yieldPct }}% (realistic pack-out)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="f in allFormats"
                  :key="f.key"
                  class="border-b border-slate-100 dark:border-neutral-800"
                >
                  <td class="py-2 pr-4 text-slate-700 dark:text-slate-300">{{ f.label }}</td>
                  <td class="text-right py-2 px-2 tabular-nums">{{ formatNum(theoreticalByFormat[f.key]) }}</td>
                  <td class="text-right py-2 px-2 tabular-nums font-medium text-amber-600 dark:text-amber-400">{{ formatNum(realisticByFormat[f.key]) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Split Results (when allocation rows have values) -->
        <div v-if="bbl > 0 && splitRows.some(r => r.bbl > 0)" class="border-t border-slate-200 dark:border-neutral-700 pt-6">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Your pack-out</h2>
          <div class="space-y-2">
            <div
              v-for="(row, i) in splitRows.filter(r => r.bbl > 0)"
              :key="i"
              class="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-neutral-800/60"
            >
              <span class="text-slate-600 dark:text-slate-300">{{ formatNum(row.bbl * yieldPct / 100) }} BBL (net) → {{ formatLabel(row.formatKey) }}</span>
              <span class="font-semibold text-amber-600 dark:text-amber-400">{{ formatNum(splitUnitsByRow(row)) }}</span>
            </div>
          </div>
        </div>

        <!-- Materials Estimator -->
        <div v-if="showMaterials" class="border-t border-slate-200 dark:border-neutral-700 pt-6">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Materials needed</h2>
          <p v-if="!hasSplitAllocation" class="text-xs text-slate-500 dark:text-neutral-400 mb-2">If packing as 12&nbsp;oz 24-pack cases (at {{ yieldPct }}% yield)</p>
          <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <div v-if="materials.cans > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ formatNum(materials.cans) }}</div>
              <div class="text-xs text-slate-500">Empty cans</div>
            </div>
            <div v-if="materials.lids > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ formatNum(materials.lids) }}</div>
              <div class="text-xs text-slate-500">Lids / caps</div>
            </div>
            <div v-if="materials.bottles > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ formatNum(materials.bottles) }}</div>
              <div class="text-xs text-slate-500">750 ml bottles</div>
            </div>
            <div v-if="materials.flats > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <div class="text-lg font-bold text-slate-900 dark:text-slate-100">{{ formatNum(materials.flats) }}</div>
              <div class="text-xs text-slate-500">Cardboard flats / carriers</div>
            </div>
          </div>
        </div>

        <!-- Revenue Estimator -->
        <div v-if="bbl > 0" class="border-t border-slate-200 dark:border-neutral-700 pt-6">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">Revenue estimator</h2>
          <p class="text-xs text-slate-500 dark:text-neutral-400 mb-2">Enter wholesale price per case or keg. With a split, revenue uses your allocation; otherwise shows single-format estimates.</p>
          <div class="flex flex-wrap items-center gap-4 mb-3">
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-600 dark:text-slate-400">$</label>
              <input
                v-model.number="pricePerCase"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="w-24 px-3 py-2 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
              />
              <span class="text-sm text-slate-500">/ 24-pack case</span>
            </div>
            <div class="flex items-center gap-2">
              <label class="text-sm text-slate-600 dark:text-slate-400">$</label>
              <input
                v-model.number="pricePerKeg"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="w-24 px-3 py-2 rounded border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-sm"
              />
              <span class="text-sm text-slate-500">/ 1/2 BBL keg</span>
            </div>
          </div>
          <div v-if="hasSplitAllocation" class="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <span class="text-sm text-slate-600 dark:text-slate-400">Total potential revenue (from your allocation)</span>
            <div class="text-2xl font-bold text-amber-700 dark:text-amber-400">${{ formatNum(splitRevenueTotal) }}</div>
          </div>
          <div v-else-if="pricePerCase > 0 || pricePerKeg > 0" class="space-y-2">
            <div v-if="pricePerCase > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <span class="text-sm text-slate-600 dark:text-slate-400">If all 12&nbsp;oz 24-pack cases:</span>
              <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${{ formatNum(revenueIfAllCases) }}</div>
            </div>
            <div v-if="pricePerKeg > 0" class="rounded-lg border border-slate-200 dark:border-neutral-700 p-3">
              <span class="text-sm text-slate-600 dark:text-slate-400">If all 1/2&nbsp;BBL kegs:</span>
              <div class="text-xl font-bold text-amber-600 dark:text-amber-400">${{ formatNum(revenueIfAllKegs) }}</div>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-6 text-xs text-slate-500 dark:text-neutral-500">
        US beer barrel = 31 gal = 3,968 fl oz. 1/2 BBL = 15.5 gal; 1/6 BBL (sixtel) = 5.17 gal. Yield reflects typical losses from tank bottoms, foam, and low-fills.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const OZ_PER_BBL = 31 * 128

const FORMATS = [
  { key: 'case24', label: '12 oz case (24-pack)', ozPerUnit: 24 * 12, cansPerUnit: 24, lidsPerUnit: 24, flatsPerUnit: 1, bottlesPerUnit: 0 },
  { key: 'sixpack12', label: '12 oz 6-pack', ozPerUnit: 6 * 12, cansPerUnit: 6, lidsPerUnit: 6, flatsPerUnit: 1, bottlesPerUnit: 0 },
  { key: 'fourpack16', label: '16 oz 4-pack', ozPerUnit: 4 * 16, cansPerUnit: 4, lidsPerUnit: 4, flatsPerUnit: 1, bottlesPerUnit: 0 },
  { key: 'sixpack192', label: '19.2 oz stovepipe (6-pack)', ozPerUnit: 6 * 19.2, cansPerUnit: 6, lidsPerUnit: 6, flatsPerUnit: 1, bottlesPerUnit: 0 },
  { key: 'bottle750', label: '750 ml bottle', ozPerUnit: 750 / 29.5735, cansPerUnit: 0, lidsPerUnit: 1, flatsPerUnit: 0, bottlesPerUnit: 1 },
  { key: 'halfbbl', label: '1/2 BBL keg', ozPerUnit: 15.5 * 128, cansPerUnit: 0, lidsPerUnit: 0, flatsPerUnit: 0, bottlesPerUnit: 0 },
  { key: 'sixtel', label: '1/6 BBL keg (sixtel)', ozPerUnit: (31 / 6) * 128, cansPerUnit: 0, lidsPerUnit: 0, flatsPerUnit: 0, bottlesPerUnit: 0 }
]

const splitFormatOptions = FORMATS

const allFormats = FORMATS

const bblInput = ref('')
const yieldPct = ref(95)
const pricePerCase = ref('')
const pricePerKeg = ref('')
const splitRows = ref([{ bbl: '', formatKey: 'case24' }, { bbl: '', formatKey: 'halfbbl' }])

const bbl = computed(() => {
  const n = parseFloat(bblInput.value)
  return Number.isFinite(n) && n >= 0 ? n : 0
})

const effectiveBbl = computed(() => bbl.value * (yieldPct.value / 100))

const theoreticalOz = computed(() => bbl.value * OZ_PER_BBL)
const realisticOz = computed(() => effectiveBbl.value * OZ_PER_BBL)

const theoreticalByFormat = computed(() => {
  const oz = theoreticalOz.value
  const out = {}
  FORMATS.forEach((f) => {
    out[f.key] = oz / f.ozPerUnit
  })
  return out
})

const realisticByFormat = computed(() => {
  const oz = realisticOz.value
  const out = {}
  FORMATS.forEach((f) => {
    out[f.key] = oz / f.ozPerUnit
  })
  return out
})

const splitTotal = computed(() =>
  splitRows.value.reduce((sum, r) => sum + (Number.isFinite(parseFloat(r.bbl)) && r.bbl >= 0 ? parseFloat(r.bbl) : 0), 0)
)

function addSplitRow() {
  splitRows.value.push({ bbl: '', formatKey: 'case24' })
}

function removeSplitRow(i) {
  splitRows.value.splice(i, 1)
}

function formatLabel(key) {
  return FORMATS.find((f) => f.key === key)?.label || key
}

function splitUnitsByRow(row) {
  const bblVal = Number.isFinite(parseFloat(row.bbl)) && row.bbl >= 0 ? parseFloat(row.bbl) : 0
  if (bblVal <= 0) return 0
  const netBbl = bblVal * (yieldPct.value / 100)
  const oz = netBbl * OZ_PER_BBL
  const f = FORMATS.find((x) => x.key === row.formatKey)
  return f ? oz / f.ozPerUnit : 0
}

const hasCanFormatInSplit = computed(() =>
  splitRows.value.some((r) => {
    const bblVal = Number.isFinite(parseFloat(r.bbl)) && r.bbl >= 0 ? parseFloat(r.bbl) : 0
    if (bblVal <= 0) return false
    const f = FORMATS.find((x) => x.key === r.formatKey)
    return f && (f.cansPerUnit > 0 || f.bottlesPerUnit > 0)
  })
)

const showMaterials = computed(() => bbl.value > 0 && (hasCanFormatInSplit.value || !hasSplitAllocation.value))

const materials = computed(() => {
  let cans = 0
  let lids = 0
  let flats = 0
  let bottles = 0
  if (hasSplitAllocation.value) {
  splitRows.value.forEach((row) => {
    const bblVal = Number.isFinite(parseFloat(row.bbl)) && row.bbl >= 0 ? parseFloat(row.bbl) : 0
    if (bblVal <= 0) return
    const netBbl = bblVal * (yieldPct.value / 100)
    const oz = netBbl * OZ_PER_BBL
    const f = FORMATS.find((x) => x.key === row.formatKey)
    if (!f) return
    const units = oz / f.ozPerUnit
    cans += Math.ceil(units * (f.cansPerUnit || 0))
    lids += Math.ceil(units * (f.lidsPerUnit || f.cansPerUnit || 0))
    flats += Math.ceil(units * (f.flatsPerUnit || 0))
    bottles += Math.ceil(units * (f.bottlesPerUnit || 0))
  })
  } else {
    const case24 = FORMATS.find((f) => f.key === 'case24')
    const units = realisticByFormat.value.case24
    if (case24 && units > 0) {
      cans = Math.ceil(units * case24.cansPerUnit)
      lids = Math.ceil(units * case24.lidsPerUnit)
      flats = Math.ceil(units * case24.flatsPerUnit)
    }
  }
  return { cans, lids, flats, bottles }
})

const hasSplitAllocation = computed(() =>
  splitRows.value.some((r) => Number.isFinite(parseFloat(r.bbl)) && parseFloat(r.bbl) > 0)
)

const splitRevenueTotal = computed(() => {
  const casePrice = Number.isFinite(parseFloat(pricePerCase.value)) && pricePerCase.value >= 0 ? parseFloat(pricePerCase.value) : 0
  const kegPrice = Number.isFinite(parseFloat(pricePerKeg.value)) && pricePerKeg.value >= 0 ? parseFloat(pricePerKeg.value) : 0
  if (casePrice <= 0 && kegPrice <= 0) return 0
  let rev = 0
  splitRows.value.forEach((row) => {
    const bblVal = Number.isFinite(parseFloat(row.bbl)) && row.bbl >= 0 ? parseFloat(row.bbl) : 0
    if (bblVal <= 0) return
    const units = splitUnitsByRow(row)
    const f = FORMATS.find((x) => x.key === row.formatKey)
    if (!f) return
    if (f.key === 'halfbbl') {
      rev += units * kegPrice
    } else if (f.key === 'sixtel') {
      rev += units * (kegPrice * (1 / 6) / (1 / 2))
    } else if (f.key === 'bottle750') {
    } else {
      const cases24equiv = (units * f.ozPerUnit) / (24 * 12)
      rev += cases24equiv * casePrice
    }
  })
  return rev
})

const revenueIfAllCases = computed(() => {
  const casePrice = Number.isFinite(parseFloat(pricePerCase.value)) && pricePerCase.value >= 0 ? parseFloat(pricePerCase.value) : 0
  if (casePrice <= 0) return 0
  return realisticByFormat.value.case24 * casePrice
})

const revenueIfAllKegs = computed(() => {
  const kegPrice = Number.isFinite(parseFloat(pricePerKeg.value)) && pricePerKeg.value >= 0 ? parseFloat(pricePerKeg.value) : 0
  if (kegPrice <= 0) return 0
  return realisticByFormat.value.halfbbl * kegPrice
})

function formatNum(n) {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 1 })
  if (n >= 1) return n.toFixed(2).replace(/\.?0+$/, '')
  return n.toFixed(2)
}
</script>

<style scoped>
.yield-slider {
  appearance: none;
  -webkit-appearance: none;
  background: linear-gradient(to right, rgb(217 119 6 / 0.5) 0%, rgb(217 119 6 / 0.5) var(--slider-pct, 75%), rgb(203 213 225) var(--slider-pct, 75%), rgb(203 213 225) 100%);
  border-radius: 9999px;
}

.dark .yield-slider {
  background: linear-gradient(to right, rgb(245 158 11 / 0.5) 0%, rgb(245 158 11 / 0.5) var(--slider-pct, 75%), rgb(82 82 91) var(--slider-pct, 75%), rgb(82 82 91) 100%);
}

.yield-slider::-webkit-slider-thumb {
  appearance: none;
  -webkit-appearance: none;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: rgb(217 119 6);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
}

.dark .yield-slider::-webkit-slider-thumb {
  background: rgb(245 158 11);
  border-color: rgb(38 38 38);
}

.yield-slider::-moz-range-thumb {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 50%;
  background: rgb(217 119 6);
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  cursor: pointer;
}

.dark .yield-slider::-moz-range-thumb {
  background: rgb(245 158 11);
  border-color: rgb(38 38 38);
}
</style>
