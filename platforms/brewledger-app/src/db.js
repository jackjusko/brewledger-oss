import Dexie from 'dexie';

export const db = new Dexie('BrewsterDB');

db.version(10).stores({
  // Auth & Sync Stores
  auth_state: 'key', // singleton, key='current'

  // Data Stores
  locations: 'id, name, org_id, sync_status',
  items: 'id, name, category, default_location_id, org_id, sync_status',
  batches: 'id, name, batch_date, status, vessel_id, org_id, sync_status',
  count_sessions: 'id, location_id, status, org_id, sync_status',
  
  // New Tables for Features
  vessels: 'id, name, type, org_id, sync_status',
  categories: 'id, name, org_id, sync_status',
  batch_additions: 'id, batch_id, item_id, event_type, org_id, sync_status',
  batch_readings: 'id, batch_id, reading_type, org_id, sync_status',
  packaging_runs: 'id, batch_id, org_id, sync_status',
  batch_milestones: 'id, batch_id, milestone_type, org_id, sync_status',

  // Tier 1
  variance_events: 'id, item_id, location_id, count_session_id, reason, org_id, sync_status',
  par_levels: 'id, item_id, location_id, org_id, sync_status',
  allocations: 'id, batch_id, item_id, location_id, org_id, sync_status',

  // Recipes
  recipes: 'id, name, org_id, sync_status',
  recipe_items: 'id, recipe_id, item_id, org_id, sync_status',

  // Ledger - append only
  ledger_entries: 'id, type, item_id, location_id, batch_id, count_session_id, transfer_group_id, reversal_group_id, reversed_of_ledger_id, created_at, org_id, sync_status',
  
  // Cache
  onhand_cache: '[item_id+location_id], item_id, location_id' 
});

// v11: batch_locations (vessel splits), batches no vessel_id index, readings/milestones optional batch_location_id
db.version(11).stores({
  batches: 'id, name, batch_date, status, org_id, sync_status',
  batch_readings: 'id, batch_id, batch_location_id, reading_type, org_id, sync_status',
  batch_milestones: 'id, batch_id, batch_location_id, milestone_type, org_id, sync_status',
  batch_locations: 'id, parent_batch_id, vessel_id, org_id, sync_status'
});

// v12: batch_volume_adjustments for logging volume changes (serving, loss, etc.)
db.version(12).stores({
  batch_volume_adjustments: 'id, batch_location_id, created_at, org_id, sync_status'
});

// v13: milestone_templates (org-level); batch_milestones use milestone_definition_id
db.version(13).stores({
  milestone_templates: 'id, org_id, sync_status',
  batch_milestones: 'id, batch_id, batch_location_id, milestone_definition_id, org_id, sync_status'
});

// v14: volume snapshots & transfers; richer adjustment index
db.version(14).stores({
  batch_volume_adjustments: 'id, batch_location_id, derived_from_snapshot_id, created_at, org_id, sync_status',
  batch_volume_snapshots: 'id, batch_location_id, measured_at, org_id, sync_status',
  batch_location_transfers: 'id, source_batch_location_id, parent_batch_id, destination_location_id, destination_vessel_id, org_id, sync_status'
});

// v15: vessel location_id (serving tank → location link)
db.version(15).stores({
  vessels: 'id, name, type, location_id, org_id, sync_status'
});

// Helper to clear database for reset
export async function resetDatabase() {
  await db.delete();
  await db.open();
}
