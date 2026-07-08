<template>
  <div class="space-y-6">
    <div class="bg-white dark:bg-stone-800 rounded-xl p-6 border border-neutral-200 dark:border-stone-700">
      <h3 class="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">TTB Brewery Information</h3>
      <p class="text-neutral-600 dark:text-stone-400 mb-6">
        Enter your brewery's TTB registration information. This data will be used to automatically populate TTB Form 5130.9.
      </p>

      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Brewery Name (used on TTB Form 5130.9) -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Brewery Name
          </label>
          <input
            v-model="form.brewery_name"
            type="text"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
            placeholder="Legal name of brewery (as on Brewer's Notice)"
          />
          <p class="text-sm text-neutral-500 dark:text-stone-400 mt-1">Used on TTB Form 5130.9; should match your Brewer's Notice.</p>
        </div>

        <!-- EIN -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Employer Identification Number (EIN)
          </label>
          <input
            v-model="form.brewery_ein"
            type="text"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
            placeholder="12-3456789"
            maxlength="20"
          />
          <p class="text-sm text-neutral-500 dark:text-stone-400 mt-1">Your federal tax ID number</p>
        </div>

        <!-- TTB Brewery Number -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            TTB Brewery Number <span class="text-danger-600">*</span>
          </label>
          <div class="flex">
            <span class="inline-flex items-center px-4 py-2 rounded-l-lg border border-r-0 bg-neutral-100 dark:bg-stone-700 border-neutral-300 dark:border-stone-600 text-neutral-600 dark:text-stone-400 font-medium">
              BR-
            </span>
            <input
              v-model="ttbNumberDigits"
              type="text"
              inputmode="numeric"
              class="flex-1 px-4 py-2 border rounded-r-lg bg-transparent text-neutral-900 dark:text-neutral-100"
              :class="ttbNumberError ? 'border-danger-500 dark:border-danger-500' : 'border-neutral-300 dark:border-stone-600'"
              placeholder="12345"
              maxlength="15"
            />
          </div>
          <p v-if="ttbNumberError" class="text-sm text-danger-600 dark:text-danger-400 mt-1">
            {{ ttbNumberError }}
          </p>
          <p v-else class="text-sm text-neutral-500 dark:text-stone-400 mt-1">
            Enter digits only (e.g., 12345). BR- is added automatically.
          </p>
        </div>

        <!-- Address -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Street Address
          </label>
          <input
            v-model="form.brewery_address_street"
            type="text"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
            placeholder="123 Main Street"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              City
            </label>
            <input
              v-model="form.brewery_address_city"
              type="text"
              class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
              placeholder="City"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              County
            </label>
            <input
              v-model="form.brewery_address_county"
              type="text"
              class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
              placeholder="County"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              State
            </label>
            <input
              v-model="form.brewery_address_state"
              type="text"
              class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
              placeholder="State"
              maxlength="2"
            />
            <p class="text-sm text-neutral-500 dark:text-stone-400 mt-1">Two-letter state code</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
              ZIP Code
            </label>
            <input
              v-model="form.brewery_address_zip"
              type="text"
              class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
              placeholder="12345"
              maxlength="10"
            />
          </div>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">
            Phone Number
          </label>
          <input
            v-model="form.brewery_phone"
            type="tel"
            class="w-full px-4 py-2 border border-neutral-300 dark:border-stone-600 rounded-lg bg-transparent text-neutral-900 dark:text-neutral-100"
            placeholder="(555) 123-4567"
          />
        </div>

        <!-- Success/Error Messages -->
        <div v-if="message" class="p-4 rounded-lg" :class="messageType === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300'">
          {{ message }}
        </div>

        <!-- Submit Button -->
        <div class="flex items-center justify-end gap-4 pt-4 border-t border-neutral-200 dark:border-stone-700">
          <button
            type="button"
            @click="resetForm"
            class="px-4 py-2 border border-neutral-300 dark:border-stone-600 text-neutral-700 dark:text-stone-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-stone-700 transition-colors font-medium"
            :disabled="isSaving"
          >
            Reset
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="isSaving || !isFormValid"
          >
            <span v-if="isSaving">Saving...</span>
            <span v-else>Save Brewery Information</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { BreweryInfoService } from '../services/BreweryInfoService'

const form = reactive({
  brewery_name: '',
  brewery_ein: '',
  ttb_brewery_number: '',
  brewery_address_street: '',
  brewery_address_city: '',
  brewery_address_county: '',
  brewery_address_state: '',
  brewery_address_zip: '',
  brewery_phone: ''
})

const originalForm = ref({})
const isSaving = ref(false)
const isLoading = ref(false)
const message = ref('')
const messageType = ref('')

// TTB number: display digits only; store as BR-XXXXX for API
const ttbNumberDigits = computed({
  get() {
    const v = form.ttb_brewery_number && form.ttb_brewery_number.toString()
    if (!v) return ''
    const match = v.match(/^BR-(.+)$/)
    return match ? match[1] : v.replace(/\D/g, '')
  },
  set(val) {
    const digits = (val || '').replace(/\D/g, '')
    form.ttb_brewery_number = digits ? 'BR-' + digits : ''
  }
})

// TTB number validation
const ttbNumberError = computed(() => {
  if (!form.ttb_brewery_number) return ''
  if (!/^BR-\d+$/.test(form.ttb_brewery_number)) {
    return 'Enter your TTB brewery number (digits only)'
  }
  return ''
})

const isFormValid = computed(() => {
  // TTB number is required and must be valid format
  return form.ttb_brewery_number && !ttbNumberError.value
})

const loadBreweryInfo = async () => {
  isLoading.value = true
  message.value = ''
  try {
    const data = await BreweryInfoService.getBreweryInfo()
    // Populate form with existing data
    Object.assign(form, {
      brewery_name: data.brewery_name || '',
      brewery_ein: data.brewery_ein || '',
      ttb_brewery_number: data.ttb_brewery_number || '',
      brewery_address_street: data.brewery_address_street || '',
      brewery_address_city: data.brewery_address_city || '',
      brewery_address_county: data.brewery_address_county || '',
      brewery_address_state: data.brewery_address_state || '',
      brewery_address_zip: data.brewery_address_zip || '',
      brewery_phone: data.brewery_phone || ''
    })
    // Store original for reset
    originalForm.value = { ...form }
  } catch (error) {
    console.error('Failed to load brewery info:', error)
    message.value = error.message || 'Failed to load brewery information'
    messageType.value = 'error'
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    message.value = 'Please fix validation errors before saving'
    messageType.value = 'error'
    return
  }

  isSaving.value = true
  message.value = ''

  try {
    await BreweryInfoService.updateBreweryInfo(form)
    message.value = 'Brewery information saved successfully'
    messageType.value = 'success'
    originalForm.value = { ...form }
    
    // Clear message after 3 seconds
    setTimeout(() => {
      message.value = ''
    }, 3000)
  } catch (error) {
    console.error('Failed to save brewery info:', error)
    message.value = error.message || 'Failed to save brewery information'
    messageType.value = 'error'
  } finally {
    isSaving.value = false
  }
}

const resetForm = () => {
  Object.assign(form, originalForm.value)
  message.value = ''
}

onMounted(() => {
  loadBreweryInfo()
})
</script>
