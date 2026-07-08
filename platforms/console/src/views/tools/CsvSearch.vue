<template>
  <div class="csv-search max-w-5xl">
    <!-- Load form: shown when no CSV loaded -->
    <div v-if="!hasCsv && !loading" class="rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80 p-6 sm:p-8">
      <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">CSV Search</h2>
      <p class="text-slate-600 dark:text-neutral-400 mb-4">Load a CSV from a URL or upload a file to view and search it.</p>
      <form @submit.prevent="loadFromUrl" class="space-y-4">
        <div class="flex flex-col sm:flex-row gap-3">
          <input
            v-model="urlInput"
            type="text"
            placeholder="https://example.com/data.csv or /bsg-inventory.csv"
            class="flex-1 min-w-0 px-4 py-2.5 rounded-lg border-2 border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <button
            type="submit"
            class="px-4 py-2.5 rounded-lg font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition"
          >
            Load from URL
          </button>
        </div>
        <div v-if="!embedded" class="flex items-center gap-3">
          <span class="text-sm text-slate-500 dark:text-neutral-500">or</span>
          <label class="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-neutral-700 transition text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
              ref="fileInputEl"
              type="file"
              accept=".csv,text/csv,application/csv"
              class="sr-only"
              @change="handleFileSelect"
            />
            Upload CSV file
          </label>
          <span v-if="selectedFileName" class="text-sm text-slate-500 dark:text-neutral-400 truncate max-w-[200px]">{{ selectedFileName }}</span>
        </div>
      </form>
    </div>

    <!-- CSV viewer -->
    <div v-else class="csv-tool rounded-xl border-2 border-slate-200 dark:border-neutral-700 bg-white dark:bg-neutral-900/80">
      <div class="p-4 sm:px-6 border-b border-slate-100 dark:border-neutral-800 space-y-3">
        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Search rows..."
            class="flex-1 min-w-0 px-3 py-2 rounded-lg border border-slate-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            aria-label="Search CSV rows"
          />
          <div class="flex flex-wrap items-center gap-2">
            <button
              v-if="!embedded"
              type="button"
              @click="clearAll"
              class="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-neutral-600 hover:bg-slate-50 dark:hover:bg-neutral-700 transition"
            >
              Change file or URL
            </button>
          </div>
        </div>
        <p class="text-sm text-slate-500 dark:text-neutral-400">
          {{ filteredRows.length }} of {{ dataRows.length }} rows
        </p>
      </div>

      <div v-if="loading" class="flex items-center gap-3 px-6 py-12 text-slate-500 dark:text-neutral-400">
        <span class="w-5 h-5 border-2 border-slate-300 dark:border-neutral-600 border-t-slate-600 rounded-full animate-spin"></span>
        Loading CSV...
      </div>

      <div v-else-if="loadError" class="px-6 py-8">
        <p class="text-red-600 dark:text-red-400 font-medium mb-2">{{ loadError }}</p>
        <p class="text-sm text-slate-500 dark:text-neutral-400 mb-3">For URLs, ensure the file allows cross-origin requests (CORS). Or try uploading a file.</p>
        <button v-if="!embedded" type="button" @click="clearAll" class="px-3 py-2 rounded-lg font-medium bg-slate-100 dark:bg-neutral-700">
          Try another file or URL
        </button>
      </div>

      <div v-else-if="headers.length" class="overflow-auto min-h-[200px] max-h-[60vh] p-4 sm:px-6">
        <table class="csv-table w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-neutral-700 bg-slate-50 dark:bg-neutral-800/80">
              <th
                v-for="(h, i) in headers"
                :key="i"
                class="px-4 py-3 text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider whitespace-nowrap"
              >
                {{ h || `Column ${i + 1}` }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, rowIndex) in filteredRows"
              :key="rowIndex"
              class="border-b border-slate-100 dark:border-neutral-800 hover:bg-slate-50/50 dark:hover:bg-neutral-800/50"
            >
              <td
                v-for="(cell, colIndex) in row"
                :key="colIndex"
                class="px-4 py-2.5 text-sm whitespace-nowrap max-w-xs truncate text-slate-700 dark:text-slate-300"
                :title="String(cell)"
              >
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="filteredRows.length === 0" class="px-4 py-6 text-center text-slate-500 dark:text-neutral-400 text-sm">
          {{ dataRows.length === 0 ? 'No data rows.' : 'No rows match your search.' }}
        </p>
      </div>

      <div v-else class="px-6 py-8 text-slate-500 dark:text-neutral-400 text-center">
        <p>No data to display.</p>
        <button v-if="!embedded" type="button" @click="clearAll" class="mt-3 px-3 py-2 rounded-lg font-medium bg-slate-100 dark:bg-neutral-700">Change file or URL</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const props = defineProps({
  initialCsvUrl: { type: String, default: '' },
  embedded: { type: Boolean, default: false }
})

const route = useRoute()
const router = useRouter()
const urlInput = ref('')
const csvUrl = ref('')
const loading = ref(false)
const loadError = ref(null)
const rows = ref([])
const searchQuery = ref('')
const selectedFileName = ref('')
const fileInputEl = ref(null)

const effectiveCsvUrl = computed(() => {
  if (props.embedded && props.initialCsvUrl) return props.initialCsvUrl
  const fromRoute = (route.query.url || '').trim()
  return csvUrl.value || fromRoute || null
})

const hasCsv = computed(() => rows.value.length > 0 || effectiveCsvUrl.value)

const headers = computed(() => {
  if (rows.value.length === 0) return []
  return rows.value[0].map(h => (h || '').toString().trim())
})

const dataRows = computed(() => {
  if (rows.value.length <= 1) return []
  return rows.value.slice(1)
})

const filteredRows = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return dataRows.value
  return dataRows.value.filter(row =>
    row.some(cell => String(cell).toLowerCase().includes(q))
  )
})

function detectDelimiter(text) {
  const raw = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const firstTwo = raw.split('\n').slice(0, 2).join('\n')
  let commas = 0, semicolons = 0, tabs = 0
  let inQuotes = false
  for (let i = 0; i < firstTwo.length; i++) {
    const c = firstTwo[i]
    if (c === '"') {
      if (firstTwo[i + 1] === '"') i++
      else inQuotes = !inQuotes
    } else if (!inQuotes) {
      if (c === ',') commas++
      else if (c === ';') semicolons++
      else if (c === '\t') tabs++
    }
  }
  if (tabs > commas && tabs > semicolons) return '\t'
  if (semicolons > commas) return ';'
  return ','
}

function parseCsv(text, delim = ',') {
  const normalized = (text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const result = []
  let current = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < normalized.length; i++) {
    const c = normalized[i]
    if (inQuotes) {
      if (c === '"') {
        if (normalized[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === delim || c === '\n') {
        current.push(field.trim())
        field = ''
        if (c === '\n') { result.push(current); current = [] }
      } else if (c !== '\r') field += c
    }
  }
  current.push(field.trim())
  if (current.length || field) result.push(current)
  return result
}

async function fetchCsv(url) {
  loading.value = true
  loadError.value = null
  rows.value = []
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to load: ${res.status}`)
    const text = await res.text()
    const delim = detectDelimiter(text)
    rows.value = parseCsv(text, delim)
    if (rows.value.length === 0) loadError.value = 'CSV appears empty.'
  } catch (e) {
    loadError.value = e.message || 'Could not load CSV.'
  } finally {
    loading.value = false
  }
}

function loadFromUrl() {
  const u = urlInput.value.trim()
  if (!u) return
  selectedFileName.value = ''
  csvUrl.value = u
  fetchCsv(u)
}

function handleFileSelect(ev) {
  const file = ev.target?.files?.[0]
  if (!file) return
  selectedFileName.value = file.name
  urlInput.value = ''
  csvUrl.value = ''
  loading.value = true
  loadError.value = null
  rows.value = []
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const text = reader.result
      if (!text || typeof text !== 'string') { loadError.value = 'Could not read file.'; return }
      const delim = detectDelimiter(text)
      rows.value = parseCsv(text, delim)
      if (rows.value.length === 0) loadError.value = 'CSV appears empty.'
    } catch (e) { loadError.value = e.message || 'Could not parse CSV.' }
    finally { loading.value = false }
  }
  reader.onerror = () => { loadError.value = 'Could not read file.'; loading.value = false }
  reader.readAsText(file, 'UTF-8')
}

function clearAll() {
  csvUrl.value = ''
  urlInput.value = ''
  selectedFileName.value = ''
  rows.value = []
  loadError.value = null
  searchQuery.value = ''
  if (fileInputEl.value) fileInputEl.value.value = ''
  if (route.query.url) router.replace({ path: route.path, query: {} })
}

watch(effectiveCsvUrl, (url) => {
  if (url && !rows.value.length && !loading.value) fetchCsv(url)
}, { immediate: false })

onMounted(() => {
  if (effectiveCsvUrl.value) fetchCsv(effectiveCsvUrl.value)
  if (route.query.url) urlInput.value = route.query.url
  if (route.query.q) searchQuery.value = route.query.q
})
</script>

<style scoped>
.csv-search table td,
.csv-search table th {
  min-width: 4rem;
}
</style>
