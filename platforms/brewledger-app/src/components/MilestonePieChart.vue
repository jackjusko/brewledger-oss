<template>
  <div class="milestone-pie-chart">
    <div class="relative" :style="{ width: size + 'px', height: size + 'px' }">
      <svg :width="size" :height="size" class="transform -rotate-90">
        <circle
          :cx="center"
          :cy="center"
          :r="radius"
          fill="none"
          stroke="currentColor"
          :stroke-width="strokeWidth"
          class="text-neutral-200 dark:text-neutral-700"
        />
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
      <!-- Center Label -->
      <div class="absolute inset-0 flex items-center justify-center">
        <div class="text-center">
          <div class="text-lg font-bold text-neutral-900 dark:text-neutral-100">{{ batch.name }}</div>
          <div class="text-xs text-neutral-500 dark:text-neutral-400">{{ completedCount }}/{{ totalCount }}</div>
        </div>
      </div>
    </div>
    <!-- Milestone Legend -->
    <div v-if="showLegend" class="mt-4 space-y-1">
      <div
        v-for="(sector, index) in sectors"
        :key="index"
        class="flex items-center gap-2 text-xs"
      >
        <div
          class="w-3 h-3 rounded"
          :style="{ backgroundColor: sector.color }"
        ></div>
        <span class="text-neutral-600 dark:text-neutral-400">{{ sector.label }}</span>
        <button
          v-if="allowHide"
          @click="handleHideMilestone(sector.type)"
          class="ml-auto text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-xs"
          title="Hide milestone"
        >
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  batch: {
    type: Object,
    required: true
  },
  milestones: {
    type: Array,
    required: true
  },
  hiddenMilestones: {
    type: Array,
    default: () => []
  },
  size: {
    type: Number,
    default: 200
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  allowHide: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['hide-milestone', 'sector-click'])

const center = computed(() => props.size / 2)
const radius = computed(() => props.size / 2 - 10)
const strokeWidth = computed(() => props.size / 20)

// Valid milestone types (from DEFINITIONS)
const VALID_MILESTONE_TYPES = [
  'KNOCKOUT', 'PITCHED', 'FERMENTATION_START', 'FG_CONFIRMED', 'COLD_CRASH',
  'TRANSFERRED', 'SERVING', 'PACKAGING_START', 'PACKAGING_COMPLETE', 'RELEASED', 'CLOSED'
]

const milestoneLabels = {
  'KNOCKOUT': 'Knocked Out',
  'PITCHED': 'Pitched',
  'FERMENTATION_START': 'Fermentation Started',
  'FG_CONFIRMED': 'FG Confirmed',
  'COLD_CRASH': 'Cold Crash',
  'TRANSFERRED': 'Transferred',
  'SERVING': 'Serving',
  'PACKAGING_START': 'Packaging Started',
  'PACKAGING_COMPLETE': 'Packaging Completed',
  'RELEASED': 'Released',
  'CLOSED': 'Batch Closed'
}

// Filter out hidden milestones
const visibleMilestones = computed(() => {
  return props.milestones.filter(m => !props.hiddenMilestones.includes(m.milestone_type))
})

// Create milestone map for quick lookup
const milestoneMap = computed(() => {
  const map = new Map()
  visibleMilestones.value.forEach(m => {
    map.set(m.milestone_type, m)
  })
  return map
})

// Get all visible milestone definitions in order
const visibleDefinitions = computed(() => {
  return VALID_MILESTONE_TYPES
    .filter(type => !props.hiddenMilestones.includes(type))
    .map(type => ({
      type,
      label: milestoneLabels[type] || type,
      completed: milestoneMap.value.get(type)?.completed || false
    }))
})

const totalCount = computed(() => visibleDefinitions.value.length)
const completedCount = computed(() => visibleDefinitions.value.filter(d => d.completed).length)

// Calculate pie chart sectors
const sectors = computed(() => {
  if (totalCount.value === 0) {
    return [{
      path: `M ${center.value} ${center.value} L ${center.value} ${center.value - radius.value} A ${radius.value} ${radius.value} 0 1 1 ${center.value - 0.01} ${center.value - radius.value} Z`,
      color: '#e5e7eb',
      strokeColor: '#d1d5db',
      label: 'No milestones',
      type: null,
      completed: false
    }]
  }

  const anglePerSector = (2 * Math.PI) / totalCount.value
  const sectors = []

  visibleDefinitions.value.forEach((def, index) => {
    const startAngle = index * anglePerSector
    const endAngle = (index + 1) * anglePerSector

    const x1 = center.value + radius.value * Math.cos(startAngle)
    const y1 = center.value + radius.value * Math.sin(startAngle)
    const x2 = center.value + radius.value * Math.cos(endAngle)
    const y2 = center.value + radius.value * Math.sin(endAngle)

    const largeArcFlag = anglePerSector > Math.PI ? 1 : 0

    const path = `M ${center.value} ${center.value} L ${x1} ${y1} A ${radius.value} ${radius.value} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`

    // Green if completed, gray if not
    const color = def.completed 
      ? '#10b981' // success-500
      : '#9ca3af' // neutral-400
    
    const strokeColor = def.completed
      ? '#059669' // success-600
      : '#6b7280' // neutral-500

    sectors.push({
      path,
      color,
      strokeColor,
      label: def.label,
      type: def.type,
      completed: def.completed,
      index
    })
  })

  return sectors
})

const handleSectorClick = (sector) => {
  emit('sector-click', sector)
}

const handleHideMilestone = (milestoneType) => {
  if (milestoneType && props.allowHide) {
    emit('hide-milestone', milestoneType)
  }
}
</script>

<style scoped>
.milestone-pie-chart {
  display: flex;
  flex-direction: column;
  align-items: center;
}
</style>
