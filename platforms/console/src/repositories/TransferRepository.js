import { LedgerRepository } from './LedgerRepository';

export const TransferRepository = {
  async recordTransfer({ itemId, fromLocationId, toLocationId, quantity, note, operationType }) {
    return LedgerRepository.transfer({
      itemId,
      fromLocationId,
      toLocationId,
      quantity,
      note,
      operationType: operationType || 'transfer'
    });
  },

  async getRecentTransfers({ limit = 50, startDate, endDate } = {}) {
    const entries = await LedgerRepository.getEntries({
      type: 'TRANSFER_OUT',
      startDate,
      endDate
    });
    return limit ? entries.slice(0, limit) : entries;
  }
};
