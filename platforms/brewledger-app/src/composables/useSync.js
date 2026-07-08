import { ref } from 'vue';

// Shared state
const lastSyncTimestamp = ref(null);
const isSyncing = ref(false);

// Export refs for direct access (e.g., in services)
export { lastSyncTimestamp, isSyncing };

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
    updateSyncTimestamp,
    setSyncing,
  };
}