import { LedgerRepository } from './LedgerRepository';

export const ConsumeRepository = {
  async recordConsume({ batchId, locationId, lines, note = 'Manual consumption' }) {
    const entries = [];
    for (const line of lines) {
      if (!line.item_id || !(line.quantity > 0)) continue;
      const entry = await LedgerRepository.addEntry({
        type: 'CONSUME',
        item_id: line.item_id,
        location_id: locationId,
        batch_id: batchId,
        quantity: -Math.abs(line.quantity),
        note
      });
      entries.push(entry);
    }
    return entries;
  },

  async getRecentConsumes({ limit = 50, startDate, endDate } = {}) {
    const entries = await LedgerRepository.getEntries({
      type: 'CONSUME',
      startDate,
      endDate
    });
    return limit ? entries.slice(0, limit) : entries;
  }
};
