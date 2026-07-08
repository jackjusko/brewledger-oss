<template>
  <div class="desktop-container">
    <!-- Period Selection -->
    <div class="card mb-8">
      <div class="card-header flex items-center gap-3">
        <i class="ri-calendar-line text-xl text-amber-600 dark:text-amber-400" aria-hidden="true"></i>
        <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 heading-refined">Report Period</h3>
      </div>
      <div class="card-body">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Report Type
          </label>
          <select
            v-model="form.reportType"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
          >
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Year
          </label>
          <input
            v-model.number="form.year"
            type="number"
            :min="2020"
            :max="new Date().getFullYear()"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            {{ form.reportType === 'monthly' ? 'Month' : 'Quarter' }}
          </label>
          <select
            v-model="form.period"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-800 text-neutral-900 dark:text-stone-100"
          >
            <option v-if="form.reportType === 'monthly'" v-for="m in 12" :key="m" :value="m">
              {{ getMonthName(m) }}
            </option>
            <option v-else v-for="q in 4" :key="q" :value="q">Q{{ q }}</option>
          </select>
        </div>
      </div>
      <div class="pt-4 flex items-center justify-end gap-4">
        <button
          @click="generateForm"
          class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="isGenerating || !isPeriodValid || !canGenerate"
        >
          <span v-if="isGenerating">Generating...</span>
          <span v-else>Generate Form</span>
        </button>
      </div>
      </div>
    </div>

    <!-- Data Completeness Check - Critical Gaps -->
    <div v-if="dataGaps.length > 0" class="console-error-banner mb-8">
      <i class="ri-error-warning-line" aria-hidden="true"></i>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2">Critical Data Gaps</h3>
          <p class="text-neutral-600 dark:text-stone-400 mb-4">
            The following information is required before generating the form:
          </p>
          <ul class="list-disc list-inside space-y-2 text-neutral-700 dark:text-stone-300">
            <li v-for="gap in dataGaps" :key="gap">{{ gap }}</li>
          </ul>
          <div class="mt-4">
            <router-link
              to="/settings?tab=brewery"
              class="inline-flex items-center gap-2 px-4 py-2 bg-danger-600 text-white rounded-lg hover:bg-danger-700 transition-colors font-medium"
            >
              Update Brewery Information
            </router-link>
          </div>
        </div>
    </div>

    <!-- Data Warnings - Non-Critical -->
    <div v-if="dataWarnings.length > 0" class="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-xl p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
          <i class="ri-error-warning-line text-xl text-warning-600 dark:text-warning-400" aria-hidden="true"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2">Data Quality Warnings</h3>
          <p class="text-neutral-600 dark:text-stone-400 mb-4">
            The following issues may affect form accuracy:
          </p>
          <ul class="list-disc list-inside space-y-2 text-neutral-700 dark:text-stone-300">
            <li v-for="warning in dataWarnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Validation Errors -->
    <div v-if="validationErrors.length > 0" class="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-700 rounded-xl p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-lg bg-danger-100 dark:bg-danger-900/30">
          <span class="text-2xl">❌</span>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2">Form Validation Errors</h3>
          <p class="text-neutral-600 dark:text-stone-400 mb-4">
            The generated form has calculation errors:
          </p>
          <ul class="list-disc list-inside space-y-2 text-neutral-700 dark:text-stone-300">
            <li v-for="error in validationErrors" :key="error">{{ error }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Validation Warnings -->
    <div v-if="validationWarnings.length > 0" class="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-xl p-6 mb-8">
      <div class="flex items-start gap-4">
        <div class="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
          <i class="ri-error-warning-line text-xl text-warning-600 dark:text-warning-400" aria-hidden="true"></i>
        </div>
        <div class="flex-1">
          <h3 class="text-lg font-bold text-neutral-900 dark:text-stone-100 mb-2">Form Validation Warnings</h3>
          <p class="text-neutral-600 dark:text-stone-400 mb-4">
            Please review these values:
          </p>
          <ul class="list-disc list-inside space-y-2 text-neutral-700 dark:text-stone-300">
            <li v-for="warning in validationWarnings" :key="warning">{{ warning }}</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Form Preview -->
    <div v-if="formData" class="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700 mb-8">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100">Form Preview</h3>
        <div class="flex items-center gap-4">
          <button
            @click="exportPDF"
            class="px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors font-medium disabled:opacity-50"
            :disabled="!formData || isExporting"
          >
            <span v-if="isExporting">Exporting...</span>
            <span v-else>Export PDF</span>
          </button>
        </div>
      </div>
      <TTBFormPreview :form-data="formData" />
    </div>

    <!-- Placeholder when no form generated -->
    <div v-else class="card console-empty">
      <i class="ri-file-text-line console-empty-icon" aria-hidden="true"></i>
      <h3 class="text-xl font-bold text-neutral-900 dark:text-stone-100 mb-2">No Form Generated</h3>
      <p class="text-neutral-600 dark:text-stone-400 mb-6">
        Select a report period and click "Generate Form" to calculate TTB Form 5130.9 values.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { TTBFormService } from '../services/TTBFormService'
import { BreweryInfoService } from '../services/BreweryInfoService'
import { exportTTBFormToPDF, downloadPDF } from '../services/TTBPDFExportService'
import TTBFormPreview from '../components/TTBFormPreview.vue'

const router = useRouter()

const form = reactive({
  reportType: 'monthly',
  year: new Date().getFullYear(),
  period: new Date().getMonth() + 1 // Current month (1-12)
})

const formData = ref(null)
const isGenerating = ref(false)
const isExporting = ref(false)
const dataGaps = ref([])
const dataWarnings = ref([])
const canGenerate = ref(true)
const validationErrors = ref([])
const validationWarnings = ref([])

const isPeriodValid = computed(() => {
  return form.year >= 2020 && form.year <= new Date().getFullYear() &&
         form.period >= 1 && form.period <= (form.reportType === 'monthly' ? 12 : 4)
})

const getMonthName = (month) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December']
  return months[month - 1]
}

const checkDataGaps = async () => {
  try {
    // Calculate period dates for gap detection
    const periodStart = new Date(form.year, form.reportType === 'monthly' ? form.period - 1 : (form.period - 1) * 3, 1)
    const periodEnd = form.reportType === 'monthly'
      ? new Date(form.year, form.period, 0, 23, 59, 59, 999)
      : new Date(form.year, form.period * 3, 0, 23, 59, 59, 999)
    
    const gapData = await TTBFormService.detectDataGaps(
      periodStart.toISOString(),
      periodEnd.toISOString()
    )
    
    dataGaps.value = gapData.gaps || []
    dataWarnings.value = gapData.warnings || []
    canGenerate.value = gapData.canGenerate !== false
  } catch (error) {
    console.error('Failed to check data gaps:', error)
    dataGaps.value = ['Unable to verify data completeness']
    canGenerate.value = false
  }
}

const generateForm = async () => {
  if (!isPeriodValid.value) return

  isGenerating.value = true
  try {
    // Calculate period dates
    const periodStart = new Date(form.year, form.reportType === 'monthly' ? form.period - 1 : (form.period - 1) * 3, 1)
    const periodEnd = form.reportType === 'monthly'
      ? new Date(form.year, form.period, 0, 23, 59, 59, 999) // End of last day of month
      : new Date(form.year, form.period * 3, 0, 23, 59, 59, 999) // End of last day of quarter

    // Generate form data using TTBFormService
    const data = await TTBFormService.generateForm({
      reportType: form.reportType,
      year: form.year,
      period: form.period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString()
    })

    formData.value = data
    
    // Validate generated form data
    const validation = TTBFormService.validateFormData(data)
    validationErrors.value = validation.errors || []
    validationWarnings.value = validation.warnings || []
    
    if (!validation.isValid) {
      console.warn('Form validation errors:', validation.errors)
      alert(`Form generated with validation errors:\n${validation.errors.join('\n')}`)
    } else if (validation.warnings.length > 0) {
      console.warn('Form validation warnings:', validation.warnings)
    }
    
    // Re-check data gaps after generation
    await checkDataGaps()
  } catch (error) {
    console.error('Failed to generate form:', error)
    alert(`Failed to generate form: ${error.message || 'Unknown error'}`)
  } finally {
    isGenerating.value = false
  }
}

const exportPDF = async () => {
  if (!formData.value) return

  isExporting.value = true
  try {
    // Generate PDF from form data
    const pdfBlob = await exportTTBFormToPDF(formData.value)
    
    // Generate filename
    const periodStr = formData.value.header.reportType === 'monthly'
      ? `${formData.value.header.year}-${String(formData.value.header.period).padStart(2, '0')}`
      : `${formData.value.header.year}-Q${formData.value.header.period}`
    const filename = `TTB-Form-5130.9-${periodStr}.pdf`
    
    // Download PDF
    downloadPDF(pdfBlob, filename)
  } catch (error) {
    console.error('Failed to export PDF:', error)
    alert(`Failed to export PDF: ${error.message || 'Unknown error'}`)
  } finally {
    isExporting.value = false
  }
}

// Watch period changes to update gap detection automatically
watch([() => form.year, () => form.period, () => form.reportType], () => {
  checkDataGaps()
})

onMounted(() => {
  checkDataGaps()
})
</script>
