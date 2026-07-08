<template>
  <div class="p-4 pb-24">
    <h1 class="text-2xl font-bold mb-4">Low Stock</h1>
    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Items below par levels (individual or global)</p>

    <div class="space-y-2">
      <div v-for="item in lowItems" :key="item.key" class="bg-white dark:bg-gray-800 p-4 rounded shadow border border-l-4 border-l-red-500">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="font-bold text-lg">{{ item.name }}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm">
              <span v-if="item.isGlobal">🌐</span>
              <span v-else>📍</span>
              {{ item.scopeLabel }}
            </p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-red-600 dark:text-red-400">{{ item.onHand }} {{ item.unit }}</div>
            <div class="text-xs text-gray-400 dark:text-gray-300">Par: {{ item.parMin }}</div>
          </div>
        </div>
      </div>

      <div v-if="lowItems.length === 0" class="text-center text-gray-500 dark:text-gray-400 mt-8 p-8 bg-white dark:bg-gray-800 rounded shadow">
        <div class="text-4xl mb-2">🎉</div>
        <div>All stock levels are healthy!</div>
        <router-link to="/reorder" class="mt-4 inline-block text-blue-600 dark:text-blue-400">Set par levels →</router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ParLevelRepository } from '../repositories/ParLevelRepository';

const lowItems = ref([]);

onMounted(async () => {
  const [items, locations, parLevels] = await Promise.all([
    ItemRepository.getAll(),
    LocationRepository.getAll(),
    ParLevelRepository.getAll()
  ]);

  const locationMap = new Map(locations.map(l => [l.id, l.name]));
  const list = [];

  for (const par of parLevels) {
    if (!par.min_qty || par.min_qty <= 0) continue;

    const item = items.find(i => i.id === par.item_id);
    if (!item) continue;

    const isGlobal = par.location_id == null || par.location_id === '';
    let onHand;

    if (isGlobal) {
      onHand = await LedgerRepository.getTotalOnhand(par.item_id);
    } else {
      onHand = await LedgerRepository.getOnhand(par.item_id, par.location_id);
    }

    if (onHand < par.min_qty) {
      list.push({
        key: `${par.item_id}-${isGlobal ? 'global' : par.location_id}`,
        ...item,
        onHand,
        parMin: par.min_qty,
        scopeLabel: isGlobal ? 'All Locations (Global)' : (locationMap.get(par.location_id) || par.location_id),
        isGlobal
      });
    }
  }

  lowItems.value = list.sort((a, b) => (a.parMin - a.onHand) - (b.parMin - b.onHand)).reverse();
});
</script>
