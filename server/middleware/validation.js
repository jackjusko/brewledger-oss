/**
 * Entity validation for sync. Expects get from db (passed via ctx).
 * @param {(sql: string, params?: any[]) => Promise<any>} get
 * @returns {(type: string, entity: any, orgId: string) => Promise<boolean>}
 */
function createValidateEntity(get) {
  return async (type, entity, orgId) => {
    if (!entity || !entity.id) return false;

    entity.org_id = orgId;

    switch (type) {
      case 'item':
        if (!entity.name || typeof entity.name !== 'string') return false;
        if (entity.type_class !== undefined && typeof entity.type_class !== 'string') return false;
        if (entity.category !== undefined && typeof entity.category !== 'string') return false;
        if (entity.unit !== undefined && typeof entity.unit !== 'string') return false;
        if (entity.price !== undefined && typeof entity.price !== 'number') return false;
        if (entity.vendor !== undefined && typeof entity.vendor !== 'string') return false;
        if (entity.interval !== undefined && (typeof entity.interval !== 'number' || entity.interval <= 0)) return false;
        if (entity.template_id !== undefined && typeof entity.template_id !== 'string') return false;
        if (entity.default_unit_cost !== undefined && typeof entity.default_unit_cost !== 'number') return false;
        if (entity.default_unit_cost !== undefined && entity.default_unit_cost < 0) return false;
        if (entity.currency !== undefined && typeof entity.currency !== 'string') return false;
        break;
      case 'location':
        if (!entity.name || typeof entity.name !== 'string') return false;
        break;
      case 'batch':
        if (!entity.name) return false;
        if (entity.milestone_definitions !== undefined) {
          if (!Array.isArray(entity.milestone_definitions)) return false;
        }
        break;
      case 'vessel':
        if (!entity.name || !entity.type) return false;
        if (entity.location_id != null && entity.location_id !== '') {
          const loc = await get('SELECT id, data FROM locations WHERE id = ? AND org_id = ?', [entity.location_id, orgId]);
          if (!loc) return false;
          try {
            const locData = loc.data ? JSON.parse(loc.data) : {};
            const stage = locData.stage || 'cellar';
            if (!['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'].includes(stage)) return false;
          } catch (e) { return false; }
        }
        break;
      case 'category':
        if (!entity.name) return false;
        break;
      case 'batch_addition':
        if (!entity.batch_id || !entity.event_type) return false;
        const isWaterOrLiquid = entity.event_type === 'WATER_ADDITION' || entity.event_type === 'LIQUID_ADDITION';
        if (!isWaterOrLiquid && !entity.item_id) return false;
        if (isWaterOrLiquid && (typeof entity.quantity !== 'number' || entity.quantity <= 0)) return false;
        break;
      case 'batch_reading':
        if (!entity.batch_id || !entity.reading_type || !entity.value) return false;
        break;
      case 'packaging_run':
        if (!entity.batch_id || !entity.format || !entity.units_count) return false;
        break;
      case 'variance_event':
        if (!entity.item_id || !entity.location_id || !entity.reason) return false;
        break;
      case 'par_level':
        if (!entity.item_id || typeof entity.min_qty !== 'number') return false;
        break;
      case 'allocation':
        if (!entity.batch_id || !entity.item_id || typeof entity.quantity !== 'number') return false;
        break;
      case 'recipe':
        if (!entity.name) return false;
        break;
      case 'recipe_item':
        if (!entity.recipe_id || !entity.item_id) return false;
        break;
      case 'batch_milestone':
        if (!entity.batch_id) return false;
        if (!entity.milestone_definition_id && !entity.milestone_type) return false;
        break;
      case 'milestone_template':
        if (!entity.name || typeof entity.name !== 'string') return false;
        if (!entity.milestones || !Array.isArray(entity.milestones)) return false;
        break;
      case 'batch_location':
        if (entity.deleted_at) return !!entity.id;
        if (!entity.parent_batch_id || !entity.vessel_id) return false;
        if (typeof entity.current_volume !== 'number' && entity.current_volume != null) return false;
        if (entity.status !== undefined && !['Fermenting', 'Crash', 'Conditioning', 'Carbonating'].includes(entity.status)) return false;
        const vesselRow = await get('SELECT id, data FROM vessels WHERE id = ? AND org_id = ?', [entity.vessel_id, orgId]);
        if (vesselRow && vesselRow.data) {
          try {
            const vesselData = JSON.parse(vesselRow.data);
            const vesselType = (vesselData.type || '').toUpperCase();
            if (vesselData.location_id && vesselType === 'SERVING') return false;
          } catch (e) { /* ignore */ }
        }
        const conflictRow = await get(
          'SELECT id, data FROM batch_locations WHERE org_id = ? AND json_extract(data, "$.vessel_id") = ? AND json_extract(data, "$.deleted_at") IS NULL AND id != ?',
          [orgId, entity.vessel_id, entity.id || '']
        );
        if (conflictRow) {
          let conflict;
          try { conflict = JSON.parse(conflictRow.data); } catch (e) { conflict = null; }
          if (conflict && conflict.parent_batch_id && conflict.parent_batch_id !== entity.parent_batch_id) return false;
          if (!conflict || !conflict.parent_batch_id) return false;
        }
        break;
      case 'batch_volume_adjustment':
        if (!entity.batch_location_id) return false;
        if (typeof entity.volume_change !== 'number') return false;
        if (entity.deleted_at !== undefined && typeof entity.deleted_at !== 'string') return false;
        if (entity.derived_from_snapshot_id !== undefined && typeof entity.derived_from_snapshot_id !== 'string') return false;
        if (entity.snapshot_measured_at !== undefined && typeof entity.snapshot_measured_at !== 'string') return false;
        break;
      case 'batch_volume_snapshot':
        if (!entity.batch_location_id) return false;
        if (typeof entity.measured_volume !== 'number') return false;
        if (entity.measured_volume < 0) return false;
        if (!entity.measured_at || typeof entity.measured_at !== 'string') return false;
        if (entity.method !== undefined && typeof entity.method !== 'string') return false;
        if (entity.recorded_by !== undefined && typeof entity.recorded_by !== 'string') return false;
        break;
      case 'batch_location_transfer':
        if (!entity.source_batch_location_id) return false;
        if (typeof entity.volume !== 'number' || entity.volume <= 0) return false;
        if (!entity.destination_location_id && !entity.destination_vessel_id && !entity.destination_batch_location_id) return false;
        if (entity.transfer_type !== undefined && typeof entity.transfer_type !== 'string') return false;
        if (entity.note !== undefined && typeof entity.note !== 'string') return false;
        break;
      case 'ledger':
        if (!entity.item_id || !entity.location_id) return false;
        if (typeof entity.quantity !== 'number') return false;
        if (!['RECEIVE', 'CONSUME', 'COUNT_ADJUST', 'MOVE', 'TRANSFER_IN', 'TRANSFER_OUT', 'REVERSAL', 'CORRECTION'].includes(entity.type)) return false;
        if (entity.unit_cost !== undefined && entity.unit_cost !== null && typeof entity.unit_cost !== 'number') return false;
        if (entity.total_cost !== undefined && entity.total_cost !== null && typeof entity.total_cost !== 'number') return false;
        if (entity.vendor !== undefined && entity.vendor !== null && typeof entity.vendor !== 'string') return false;
        if (entity.invoice_number !== undefined && entity.invoice_number !== null && typeof entity.invoice_number !== 'string') return false;
        if (entity.qbo_bill_id !== undefined && entity.qbo_bill_id !== null && typeof entity.qbo_bill_id !== 'string') return false;
        const item = await get('SELECT id FROM items WHERE id = ? AND org_id = ?', [entity.item_id, orgId]);
        if (!item) return false;
        const location = await get('SELECT id FROM locations WHERE id = ? AND org_id = ?', [entity.location_id, orgId]);
        if (!location) return false;
        if (entity.batch_id) {
          const batch = await get('SELECT id FROM batches WHERE id = ? AND org_id = ?', [entity.batch_id, orgId]);
          if (!batch) return false;
        }
        break;
    }
    return true;
  };
}

module.exports = {
  createValidateEntity,
};
