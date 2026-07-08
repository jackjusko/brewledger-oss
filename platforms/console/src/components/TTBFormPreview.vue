<template>
  <div class="space-y-6">
    <!-- Header Info -->
    <div class="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg">
      <div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Report Type</p>
        <p class="font-medium text-neutral-900 dark:text-neutral-100 capitalize">{{ formData.header.reportType }}</p>
      </div>
      <div>
        <p class="text-sm text-neutral-600 dark:text-neutral-400">Period</p>
        <p class="font-medium text-neutral-900 dark:text-neutral-100">
          {{ formatPeriod(formData.header) }}
        </p>
      </div>
    </div>

    <!-- Additions Section -->
    <div>
      <h4 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Additions to Inventory</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="text-left py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Line</th>
              <th class="text-left py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Description</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Amount (a)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Cellar (b)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Racking Bulk (c)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Racking Keg (d)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Bottling Bulk (e)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Case (f)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Total (g)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in additionsLines" :key="key" class="border-b border-neutral-100 dark:border-neutral-800">
              <td class="py-2 px-4 text-neutral-600 dark:text-neutral-400">{{ getLineNumber(key) }}</td>
              <td class="py-2 px-4 text-neutral-900 dark:text-neutral-100">{{ getLineDescription(key) }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'a') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'b') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'c') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'd') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'e') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'f') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'g') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Removals Section -->
    <div>
      <h4 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Removals from Inventory</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-neutral-200 dark:border-neutral-700">
              <th class="text-left py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Line</th>
              <th class="text-left py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Description</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Amount (a)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Cellar (b)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Racking Bulk (c)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Racking Keg (d)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Bottling Bulk (e)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Case (f)</th>
              <th class="text-right py-2 px-4 font-medium text-neutral-700 dark:text-neutral-300">Total (g)</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in removalsLines" :key="key" class="border-b border-neutral-100 dark:border-neutral-800">
              <td class="py-2 px-4 text-neutral-600 dark:text-neutral-400">{{ getLineNumber(key) }}</td>
              <td class="py-2 px-4 text-neutral-900 dark:text-neutral-100">{{ getLineDescription(key) }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'a') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'b') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'c') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'd') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'e') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'f') }}</td>
              <td class="py-2 px-4 text-right font-mono text-neutral-900 dark:text-neutral-100">{{ getColumnValue(key, value, 'g') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Placeholder notice -->
    <div class="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
      <p class="text-sm text-neutral-600 dark:text-neutral-400">
        <strong>Note:</strong> Columns reflect location-stage breakdowns when available; blanks indicate stages not captured for that line.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  formData: {
    type: Object,
    required: true
  }
})

const additionsLines = computed(() => {
  const lines = {}
  for (let i = 1; i <= 13; i++) {
    lines[`line${i}`] = props.formData.additions[`line${i}`] || 0
  }
  return lines
})

const removalsLines = computed(() => {
  const lines = {}
  for (let i = 14; i <= 34; i++) {
    lines[`line${i}`] = props.formData.removals[`line${i}`] || 0
  }
  return lines
})

const getColumnValue = (lineKey, fallback, columnKey) => {
  const cols = props.formData.columnsByLine?.[lineKey]
  if (columnKey === 'a') {
    const value = cols?.a ?? fallback ?? 0
    return formatBarrels(value)
  }
  if (!cols || cols[columnKey] === undefined) return ''
  return formatBarrels(cols[columnKey])
}

const formatPeriod = (header) => {
  if (header.reportType === 'monthly') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December']
    return `${months[header.period - 1]} ${header.year}`
  } else {
    return `Q${header.period} ${header.year}`
  }
}

const getLineNumber = (key) => {
  return key.replace('line', '')
}

const getLineDescription = (key) => {
  const descriptions = {
    line1: 'On hand beginning of period',
    line2: 'Beer produced by fermentation',
    line3: 'Addition of water and other liquids',
    line4: 'Beer received from racking and bottling',
    line5: 'Beer received in bond',
    line6: 'Beer received from cellars',
    line7: 'Beer returned after removal',
    line8: 'Beer returned from other brewery',
    line9: 'Racked',
    line10: 'Bottled',
    line11: 'Physical inventory disclosed an overage',
    line12: '(Blank)',
    line13: 'Total additions',
    line14: 'Removed for consumption or sale',
    line15: 'Removed tax-determined for tavern',
    line16: 'Removed without payment of tax for export',
    line17: 'Removed for supplies (vessels/aircraft)',
    line18: 'Removed for R&D',
    line19: 'Removed to other breweries',
    line20: 'Removed as unfit for sale',
    line21: 'Beer consumed on premises',
    line22: 'Beer transferred for racking',
    line23: 'Beer transferred for bottling',
    line24: 'Beer returned to cellars',
    line25: 'Beer racked',
    line26: 'Beer bottled',
    line27: 'Laboratory samples',
    line28: 'Beer destroyed at brewery',
    line29: 'Beer transferred to DSP',
    line30: 'Losses, including theft',
    line31: 'Physical inventory disclosed a shortage',
    line32: '(Blank)',
    line33: 'Total amount of beer on hand at end of period',
    line34: 'Total beer'
  }
  return descriptions[key] || key
}

const formatBarrels = (value) => {
  if (value === 0) return '0.00'
  return Number(value).toFixed(2)
}
</script>
