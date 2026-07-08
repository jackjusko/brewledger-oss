<template>
  <div class="min-h-[40vh] flex flex-col items-center justify-center p-8">
    <div class="w-12 h-12 rounded-full border-4 border-primary-200 dark:border-primary-700 border-t-primary-600 animate-spin mb-4"></div>
    <p class="text-neutral-600 dark:text-neutral-400">Redirecting to billing…</p>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const sessionId = route.query.session_id
  const query = { tab: 'billing' }
  if (sessionId) query.session_id = sessionId
  router.replace({ path: '/settings', query })
})
</script>
