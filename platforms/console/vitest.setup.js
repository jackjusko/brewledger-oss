/**
 * Load fake IndexedDB before any test imports Dexie/db.
 * Must run first so Dexie uses the fake implementation.
 */
import 'fake-indexeddb/auto';
