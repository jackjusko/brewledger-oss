import { ref } from 'vue';

// Shared state
const lastSyncTimestamp = ref(null);
const isSyncing = ref(false);
// Increments on every successful sync so views can watch and reload (avoids same-timestamp = no watch fire)
const syncTrigger = ref(0);

// Export refs for direct access (e.g., in services)
export { lastSyncTimestamp, isSyncing, syncTrigger };

/**
 * Call after a successful sync so views watching syncTrigger will reload.
 */
export function incrementSyncTrigger() {
  syncTrigger.value += 1;
}

/**
 * Composable to access sync state and trigger sync updates.
 */
export function useSync() {
  /**
   * Update the last sync timestamp (call after successful sync).
   * @param {string|number|Date} timestamp - Optional timestamp; defaults to current time.
   */
  const updateSyncTimestamp = (timestamp = null) => {
    lastSyncTimestamp.value = timestamp || new Date().toISOString();
  };

  /**
   * Set syncing status.
   */
  const setSyncing = (syncing) => {
    isSyncing.value = syncing;
  };

  return {
    lastSyncTimestamp,
    isSyncing,
    syncTrigger,
    updateSyncTimestamp,
    setSyncing,
  };
}
