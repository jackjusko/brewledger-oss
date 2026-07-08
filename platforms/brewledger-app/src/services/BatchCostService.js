import { db } from '../db';

const normalizeCost = (unitCost, quantity) => {
  if (unitCost == null || quantity == null) return null;
  return unitCost * quantity;
};

export const BatchCostService = {
  async compute(batchId) {
    const additions = await db.batch_additions.where('batch_id').equals(batchId).toArray();
    const items = await db.items.toArray();
    const itemMap = new Map(items.map(i => [i.id, i]));
    let materials = 0;
    let packaging = 0;
    let other = 0;
    let currency = 'USD';

    const waterLiquidTypes = ['WATER_ADDITION', 'LIQUID_ADDITION'];
    for (const add of additions) {
      if (!waterLiquidTypes.includes(add.event_type)) continue;
      const item = add.item_id ? itemMap.get(add.item_id) : null;
      if (item?.currency) currency = item.currency;
      const unitCost = add.unit_cost != null ? add.unit_cost : item?.default_unit_cost;
      const total = add.total_cost != null ? add.total_cost : normalizeCost(unitCost, add.quantity);
      if (total == null) continue;
      const absTotal = Math.abs(total);
      if (item?.category === 'Packaging') packaging += absTotal;
      else if (item?.category) materials += absTotal;
      else other += absTotal;
    }

    const ledgerEntries = await db.ledger_entries.where('batch_id').equals(batchId).toArray();
    for (const entry of ledgerEntries) {
      if (entry.operation_type === 'packaging_supply') {
        const item = entry.item_id ? itemMap.get(entry.item_id) : null;
        if (item?.currency) currency = item.currency;
        const cost = entry.total_cost != null ? entry.total_cost : normalizeCost(entry.unit_cost, entry.quantity);
        if (cost == null) continue;
        packaging += Math.abs(cost);
      } else if (entry.type === 'CONSUME') {
        const item = entry.item_id ? itemMap.get(entry.item_id) : null;
        if (item?.currency) currency = item.currency;
        const qty = Math.abs(entry.quantity);
        const cost = entry.total_cost != null
          ? entry.total_cost
          : (entry.unit_cost != null ? entry.unit_cost * qty : (item?.default_unit_cost != null ? item.default_unit_cost * qty : null));
        if (cost == null) continue;
        const absCost = Math.abs(cost);
        if (item?.category === 'Packaging') packaging += absCost;
        else if (item?.category) materials += absCost;
        else other += absCost;
      }
    }

    const total = materials + packaging + other;
    return { currency, total, materials, packaging, other };
  },

  async computeAndStore(batchId) {
    const summary = await this.compute(batchId);
    const current = await db.batches.get(batchId);
    if (!current) return summary;
    await db.batches.update(batchId, {
      cost_summary: summary,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      version: (current.version || 0) + 1
    });
    return summary;
  }
};
