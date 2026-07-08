<template>
  <div class="milestone-pie-chart">
    <div class="text-center mb-2">
      <div class="text-lg font-bold text-neutral-900 dark:text-neutral-100">{{ batch.name }}</div>
      <div v-if="currentStatusMilestone" class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
        {{ currentStatusMilestone.label }}
      </div>
      <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{{ completedCount }}/{{ totalCount }}</div>
    </div>
    
    <div class="relative flex items-center justify-center" :style="{ width: size + 'px', height: size + 'px' }">
      <svg :width="size" :height="size" class="transform -rotate-90">
        <path
          v-for="(sector, index) in sectors"
          :key="index"
          :d="sector.path"
          :fill="sector.color"
          :stroke="sector.strokeColor"
          stroke-width="1"
          class="transition-all duration-200 hover:opacity-80 cursor-pointer"
          @click="handleSectorClick(sector)"
          :title="sector.label"
        />
      </svg>
    </div>
    
    <div v-if="showLegend" class="mt-4 space-y-1 w-full">
      <span class="text-xs font-medium text-neutral-600 dark:text-neutral-400 block mb-2">Milestones</span>
      <div
        v-for="(sector, index) in sectors"
        :key="index"
        class="flex items-center gap-2 text-xs py-1"
      >
        <div class="w-3 h-3 rounded flex-shrink-0" :style="{ backgroundColor: sector.color }"></div>
        <span class="text-neutral-600 dark:text-neutral-400 flex-1">{{ sector.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  batch: { type: Object, required: true },
  milestones: { type: Array, required: true },
  size: { type: Number, default: 200 },
  showLegend: { type: Boolean, default: true }
})

const emit = defineEmits(['sector-click'])

const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - 10)

const visibleDefinitions = computed(() => {
  return props.milestones.map(m => ({
    id: m.id,
    label: m.label || 'Milestone',
    completed: m.completed || false
  })).filter(d => d.label)
})

const totalCount = computed(() => visibleDefinitions.value.length)
const completedCount = computed(() => visibleDefinitions.value.filter(d => d.completed).length)

const currentStatusMilestone = computed(() => {
  for (let i = visibleDefinitions.value.length - 1; i >= 0; i--) {
    if (visibleDefinitions.value[i].completed) return visibleDefinitions.value[i]
  }
  return null
})

const sectors = computed(() => {
  if (totalCount.value === 0) {
    return [{
      path: `M ${center.value} ${center.value} L ${center.value} ${center.value - radius.value} A ${radius.value} ${radius.value} 0 1 1 ${center.value - 0.01} ${center.value - radius.value} Z`,
      color: '#e5e7eb', strokeColor: '#d1d5db', label: 'No milestones', id: null, completed: false
    }]
  }
  const anglePerSector = (2 * Math.PI) / totalCount.value
  const result = []
  visibleDefinitions.value.forEach((def, index) => {
    const startAngle = index * anglePerSector
    const endAngle = (index + 1) * anglePerSector
    const x1 = center.value + radius.value * Math.cos(startAngle)
    const y1 = center.value + radius.value * Math.sin(startAngle)
    const x2 = center.value + radius.value * Math.cos(endAngle)
    const y2 = center.value + radius.value * Math.sin(endAngle)
    const largeArcFlag = anglePerSector > Math.PI ? 1 : 0
    const path = `M ${center.value} ${center.value} L ${x1} ${y1} A ${radius.value} ${radius.value} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    const color = def.completed ? '#10b981' : '#9ca3af'
    const strokeColor = def.completed ? '#059669' : '#6b7280'
    result.push({ path, color, strokeColor, label: def.label, id: def.id, completed: def.completed, index })
  })
  return result
})

const handleSectorClick = (sector) => {
  emit('sector-click', sector)
}
</script>

<style scoped>
.milestone-pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
</style>
