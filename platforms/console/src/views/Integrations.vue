<template>
  <div class="desktop-container">
    <div class="console-toolbar mb-6">
      <div class="console-toolbar-title">
        <h4 class="heading-refined">Integrations</h4>
        <p>Connect accounting and distribution tools</p>
      </div>
    </div>

    <div v-if="callbackMessage" class="mb-6 p-4 rounded-xl" :class="callbackMessageType === 'success' ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-800' : 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-800'">
      {{ callbackMessage }}
    </div>

    <div v-if="!hasClientConfig" class="card border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
      <div class="card-body">
        <p class="text-amber-800 dark:text-amber-200 font-medium">QuickBooks is not configured on this server.</p>
        <p class="text-sm text-amber-700 dark:text-amber-300 mt-1">Contact your administrator to set up QBO_CLIENT_ID and QBO_CLIENT_SECRET.</p>
      </div>
    </div>

    <div v-else class="space-y-6">
      <div class="card">
        <div class="card-header flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <i class="ri-bank-line text-xl text-primary-600 dark:text-primary-400" aria-hidden="true"></i>
            <div>
              <h3 class="text-lg font-bold text-neutral-900 dark:text-neutral-100 heading-refined">QuickBooks Online</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Sync sales orders as Invoices</p>
            </div>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-semibold"
            :class="status?.connected ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300' : 'bg-neutral-100 dark:bg-stone-800 text-neutral-600 dark:text-stone-400'"
          >
            {{ status?.connected ? 'Connected' : 'Not connected' }}
          </span>
        </div>
        <div class="card-body space-y-6">
          <template v-if="status?.connected">
            <p class="text-sm text-neutral-600 dark:text-stone-400">
              QuickBooks is connected. You can create Invoices from Sales Orders in Distribution → Sales Order.
            </p>
            <div class="flex items-center gap-3">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="disconnecting"
                @click="handleDisconnect"
              >
                {{ disconnecting ? 'Disconnecting…' : 'Disconnect QuickBooks' }}
              </button>
            </div>

            <div class="border-t border-neutral-200 dark:border-stone-700 pt-6">
              <h4 class="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Item Mapping</h4>
              <p class="text-sm text-neutral-500 dark:text-stone-400 mb-4">
                Map your beer items to QuickBooks so Sales Orders can sync as Invoices.
              </p>

              <div v-if="mappingsLoading" class="text-sm text-neutral-500 dark:text-stone-400 py-4">
                Loading mappings…
              </div>
              <div v-else-if="mappingsError" class="p-4 rounded-lg bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300 text-sm">
                {{ mappingsError }}
              </div>
              <div v-else-if="beerItems.length === 0" class="p-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20">
                <p class="text-amber-800 dark:text-amber-200 text-sm">No beer items. Add beers in Beers or via Mark Production Complete first.</p>
                <router-link to="/beers" class="text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-block">
                  Go to Beers →
                </router-link>
              </div>
              <div v-else class="space-y-4">
                <div
                  v-for="beer in beerItems"
                  :key="beer.id"
                  class="p-4 rounded-xl border border-neutral-200 dark:border-stone-700 bg-neutral-50/50 dark:bg-stone-900/30"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div>
                      <p class="font-medium text-neutral-900 dark:text-neutral-100">{{ beer.name }}</p>
                      <p v-if="getMappingForBeer(beer.id)?.qbo_item_id" class="text-sm text-success-600 dark:text-success-400 mt-0.5">
                        Linked to: {{ getQboItemName(getMappingForBeer(beer.id).qbo_item_id) }}
                      </p>
                      <p v-else class="text-sm text-neutral-500 dark:text-stone-400 mt-0.5">Not mapped</p>
                    </div>
                    <div class="flex flex-col gap-2 min-w-[280px]">
                      <template v-if="getMappingForBeer(beer.id)?.qbo_item_id">
                        <div class="flex items-center gap-2">
                          <button
                            type="button"
                            class="btn btn-secondary text-sm py-1 px-2"
                            :disabled="savingMappingId === beer.id"
                            @click="startChangeMapping(beer.id)"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            class="btn btn-secondary text-sm py-1 px-2 text-danger-600 dark:text-danger-400"
                            :disabled="savingMappingId === beer.id"
                            @click="handleUnlink(beer.id)"
                          >
                            Unlink
                          </button>
                        </div>
                      </template>
                      <template v-else>
                        <template v-if="choiceMode[beer.id] === 'link'">
                          <div class="flex flex-wrap items-center gap-2">
                            <select
                              v-model="selectedQboId[beer.id]"
                              class="input py-1.5 text-sm min-w-[180px]"
                            >
                              <option value="">Select QuickBooks item…</option>
                              <option v-for="qbo in qboItems" :key="qbo.Id" :value="qbo.Id">
                                {{ qbo.Name }}
                              </option>
                            </select>
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              :disabled="!selectedQboId[beer.id] || savingMappingId === beer.id"
                              @click="handleSaveMapping(beer.id)"
                            >
                              {{ savingMappingId === beer.id ? 'Linking…' : 'Link' }}
                            </button>
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              :disabled="savingMappingId === beer.id"
                              @click="choiceMode[beer.id] = null"
                            >
                              Cancel
                            </button>
                          </div>
                        </template>
                        <template v-else-if="choiceMode[beer.id] === 'create'">
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              :disabled="pushingItemId === beer.id"
                              @click="handleCreateInQbo(beer.id)"
                            >
                              {{ pushingItemId === beer.id ? 'Creating…' : 'Create in QuickBooks' }}
                            </button>
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              :disabled="pushingItemId === beer.id"
                              @click="choiceMode[beer.id] = null"
                            >
                              Cancel
                            </button>
                          </div>
                        </template>
                        <template v-else>
                          <div class="flex items-center gap-2">
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              @click="choiceMode[beer.id] = 'link'"
                            >
                              Link to existing
                            </button>
                            <button
                              type="button"
                              class="btn btn-secondary text-sm py-1 px-2"
                              @click="choiceMode[beer.id] = 'create'"
                            >
                              Create new
                            </button>
                          </div>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <p class="text-sm text-neutral-600 dark:text-stone-400">
              Connect your QuickBooks company to sync sales orders as Invoices. You will be redirected to Intuit to authorize.
            </p>
            <div class="space-y-4">
              <button
                type="button"
                class="btn btn-primary"
                :disabled="connecting"
                @click="handleConnect"
              >
                {{ connecting ? 'Connecting…' : 'Connect QuickBooks' }}
              </button>

              <div class="border-t border-neutral-200 dark:border-stone-700 pt-4">
                <p class="text-sm font-medium text-neutral-700 dark:text-stone-300 mb-2">Manual connection</p>
                <p class="text-xs text-neutral-500 dark:text-stone-400 mb-3">
                  If the popup was blocked, open the callback URL, complete authorization, then paste the code and realm ID below.
                </p>
                <button
                  type="button"
                  class="text-sm text-amber-600 dark:text-amber-400 hover:underline mb-3 inline-block text-left"
                  :disabled="connecting"
                  @click="handleConnect"
                >
                  Open QuickBooks authorization page →
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Code</label>
                    <input v-model="exchangeCode" type="text" class="input w-full" placeholder="Paste authorization code" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-neutral-700 dark:text-stone-300 mb-1">Realm ID</label>
                    <input v-model="exchangeRealmId" type="text" class="input w-full" placeholder="Paste realm ID" />
                  </div>
                  <button
                    type="button"
                    class="btn btn-secondary w-fit"
                    :disabled="connecting || !exchangeCode?.trim() || !exchangeRealmId?.trim()"
                    @click="handleExchange"
                  >
                    Exchange & connect
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { QBOService } from '../services/QBOService'
import { ItemRepository } from '../repositories/ItemRepository'

const route = useRoute()
const router = useRouter()

const status = ref(null)
const connecting = ref(false)
const disconnecting = ref(false)
const exchangeCode = ref('')
const exchangeRealmId = ref('')
const callbackMessage = ref('')
const callbackMessageType = ref('success')

const beerItems = ref([])
const mappings = ref([])
const qboItems = ref([])
const mappingsLoading = ref(false)
const mappingsError = ref('')
const selectedQboId = reactive({})
const choiceMode = reactive({})
const savingMappingId = ref(null)
const pushingItemId = ref(null)

const hasClientConfig = computed(() => status.value?.hasClientConfig ?? false)

function getMappingForBeer(brewItemId) {
  return mappings.value.find(m => m.brew_item_id === brewItemId)
}

function getQboItemName(qboItemId) {
  const qbo = qboItems.value.find(i => i.Id === qboItemId)
  return qbo?.Name || qboItemId
}

function startChangeMapping(brewItemId) {
  handleUnlink(brewItemId)
}

function hasMappingChanged(brewItemId) {
  const current = getMappingForBeer(brewItemId)?.qbo_item_id || ''
  const selected = selectedQboId[brewItemId] || ''
  return current !== selected
}

async function loadMappingData() {
  if (!status.value?.connected) return
  mappingsLoading.value = true
  mappingsError.value = ''
  try {
    const [beers, maps, items] = await Promise.all([
      ItemRepository.getBeerItems(),
      QBOService.getMappings(),
      QBOService.getItems()
    ])
    beerItems.value = beers
    mappings.value = maps
    qboItems.value = items
    for (const beer of beers) {
      const m = maps.find(x => x.brew_item_id === beer.id)
      selectedQboId[beer.id] = m?.qbo_item_id || ''
      choiceMode[beer.id] = null
    }
  } catch (e) {
    console.error('Failed to load mapping data', e)
    mappingsError.value = e.response?.data?.error || e.message || 'Failed to load mappings'
  } finally {
    mappingsLoading.value = false
  }
}

async function handleUnlink(brewItemId) {
  savingMappingId.value = brewItemId
  try {
    await QBOService.saveMapping({
      brew_item_id: brewItemId,
      qbo_item_id: null
    })
    const idx = mappings.value.findIndex(x => x.brew_item_id === brewItemId)
    if (idx >= 0) mappings.value.splice(idx, 1)
    selectedQboId[brewItemId] = ''
    choiceMode[brewItemId] = null
  } catch (e) {
    console.error('Failed to unlink mapping', e)
    alert(e.response?.data?.error || 'Failed to unlink')
  } finally {
    savingMappingId.value = null
  }
}

async function handleSaveMapping(brewItemId) {
  savingMappingId.value = brewItemId
  try {
    await QBOService.saveMapping({
      brew_item_id: brewItemId,
      qbo_item_id: selectedQboId[brewItemId] || null
    })
    const m = mappings.value.find(x => x.brew_item_id === brewItemId)
    if (m) {
      m.qbo_item_id = selectedQboId[brewItemId] || null
    } else if (selectedQboId[brewItemId]) {
      mappings.value.push({ brew_item_id: brewItemId, qbo_item_id: selectedQboId[brewItemId] })
    } else {
      mappings.value = mappings.value.filter(x => x.brew_item_id !== brewItemId)
    }
    choiceMode[brewItemId] = null
  } catch (e) {
    console.error('Failed to save mapping', e)
    alert(e.response?.data?.error || 'Failed to save mapping')
  } finally {
    savingMappingId.value = null
  }
}

async function handleCreateInQbo(brewItemId) {
  pushingItemId.value = brewItemId
  try {
    const result = await QBOService.pushItem(brewItemId)
    if (result?.qbo_item_id) {
      selectedQboId[brewItemId] = result.qbo_item_id
      const m = mappings.value.find(x => x.brew_item_id === brewItemId)
      if (m) {
        m.qbo_item_id = result.qbo_item_id
      } else {
        mappings.value.push({ brew_item_id: brewItemId, qbo_item_id: result.qbo_item_id })
      }
      qboItems.value = await QBOService.getItems()
      choiceMode[brewItemId] = null
    }
  } catch (e) {
    console.error('Failed to create item in QuickBooks', e)
    alert(e.response?.data?.error || e.message || 'Failed to create item in QuickBooks')
  } finally {
    pushingItemId.value = null
  }
}

async function loadStatus() {
  try {
    status.value = await QBOService.getStatus()
  } catch (e) {
    console.error('Failed to load QBO status', e)
    status.value = { hasClientConfig: false }
  }
}

async function handleConnect() {
  if (!status.value?.hasClientConfig) return
  connecting.value = true
  try {
    const { url } = await QBOService.getAuthorizeUrl()
    if (url) window.open(url, 'qbo-auth', 'width=600,height=700')
  } catch (e) {
    console.error('Failed to get auth URL', e)
    alert(e.response?.data?.error || 'Failed to get authorization URL')
  } finally {
    connecting.value = false
  }
}

async function handleExchange() {
  const code = exchangeCode.value?.trim()
  const realmId = exchangeRealmId.value?.trim()
  if (!code || !realmId) return
  connecting.value = true
  callbackMessage.value = ''
  try {
    await QBOService.exchangeCode({ code, realmId })
    exchangeCode.value = ''
    exchangeRealmId.value = ''
    await loadStatus()
    callbackMessage.value = 'QuickBooks connected successfully.'
    callbackMessageType.value = 'success'
    setTimeout(() => { callbackMessage.value = '' }, 4000)
  } catch (e) {
    console.error('QBO exchange failed', e)
    callbackMessage.value = e.response?.data?.error || 'Failed to connect QuickBooks'
    callbackMessageType.value = 'error'
  } finally {
    connecting.value = false
  }
}

async function handleDisconnect() {
  disconnecting.value = true
  try {
    await QBOService.disconnect()
    await loadStatus()
  } catch (e) {
    console.error('QBO disconnect failed', e)
    alert(e.response?.data?.error || 'Failed to disconnect')
  } finally {
    disconnecting.value = false
  }
}

async function processCallbackFromUrl() {
  const code = route.query.code
  const realmId = route.query.realmId
  if (!code || !realmId) return

  connecting.value = true
  callbackMessage.value = ''
  try {
    await QBOService.exchangeCode({ code, realmId })
    await loadStatus()

    router.replace({ path: '/integrations', query: {} })

    if (window.opener) {
      window.opener.postMessage({ type: 'qbo-connected' }, window.location.origin)
      window.close()
    } else {
      callbackMessage.value = 'QuickBooks connected successfully.'
      callbackMessageType.value = 'success'
      setTimeout(() => { callbackMessage.value = '' }, 4000)
    }
  } catch (e) {
    console.error('QBO exchange failed', e)
    callbackMessage.value = e.response?.data?.error || 'Failed to connect QuickBooks'
    callbackMessageType.value = 'error'
  } finally {
    connecting.value = false
  }
}

function handleMessage(e) {
  if (e.origin !== window.location.origin) return
  if (e.data?.type === 'qbo-connected') {
    loadStatus()
  }
}

watch(() => status.value?.connected, (connected) => {
  if (connected) loadMappingData()
})

onMounted(() => {
  loadStatus()
  processCallbackFromUrl()
  window.addEventListener('message', handleMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
</script>
