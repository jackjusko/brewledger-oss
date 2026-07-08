import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LedgerRepository } from '../../src/repositories/LedgerRepository';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';

// Mock AuthService to control orgId and token
vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn()
  }
}));

describe('LedgerRepository', () => {
  beforeEach(async () => {
    // Reset DB state
    await db.delete();
    await db.open();
    
    // Default mock session
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org-id',
      token: 'test-token'
    });
  });

  it('should add a ledger entry and update the onhand cache', async () => {
    const entry = {
      type: 'RECEIVE',
      item_id: 'item-123',
      location_id: 'loc-123',
      quantity: 50,
      note: 'Initial stock'
    };

    const savedEntry = await LedgerRepository.addEntry(entry);

    // Verify entry saved
    expect(savedEntry.id).toBeDefined();
    expect(savedEntry.org_id).toBe('test-org-id');
    expect(savedEntry.quantity).toBe(50);

    // Verify cache updated
    const onHand = await LedgerRepository.getOnhand('item-123', 'loc-123');
    expect(onHand).toBe(50);
  });

  it('should calculate correct on-hand quantity from multiple entries', async () => {
    // 1. Receive 100
    await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: 'item-A',
      location_id: 'loc-A',
      quantity: 100
    });

    // 2. Consume 30
    await LedgerRepository.addEntry({
      type: 'CONSUME',
      item_id: 'item-A',
      location_id: 'loc-A',
      quantity: -30
    });

    // 3. Receive 10
    await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: 'item-A',
      location_id: 'loc-A',
      quantity: 10
    });

    const onHand = await LedgerRepository.getOnhand('item-A', 'loc-A');
    expect(onHand).toBe(100 - 30 + 10); // 80
  });

  it('should handle transfers correctly (out from one, in to another)', async () => {
    const transferData = {
      itemId: 'item-T',
      fromLocationId: 'loc-Source',
      toLocationId: 'loc-Dest',
      quantity: 20,
      note: 'Moving stock'
    };

    // Initial stock in source
    await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: 'item-T',
      location_id: 'loc-Source',
      quantity: 50
    });

    await LedgerRepository.transfer(transferData);

    const sourceQty = await LedgerRepository.getOnhand('item-T', 'loc-Source');
    const destQty = await LedgerRepository.getOnhand('item-T', 'loc-Dest');

    expect(sourceQty).toBe(30); // 50 - 20
    expect(destQty).toBe(20);   // 0 + 20
  });

  it('should reverse an entry correctly', async () => {
    // Original Entry
    const original = await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: 'item-R',
      location_id: 'loc-R',
      quantity: 100
    });

    // Verify initial state
    expect(await LedgerRepository.getOnhand('item-R', 'loc-R')).toBe(100);

    // Reverse it
    await LedgerRepository.reverseEntry(original, 'Made a mistake');

    // Verify reversal
    expect(await LedgerRepository.getOnhand('item-R', 'loc-R')).toBe(0);
    
    // Verify ledger entries
    const entries = await LedgerRepository.getEntries({ item_id: 'item-R' });
    expect(entries).toHaveLength(2);
    expect(entries.find(e => e.reversed_of_ledger_id === original.id)).toBeDefined();
  });

  it('should not allow double reversal', async () => {
    const original = await LedgerRepository.addEntry({
      type: 'RECEIVE',
      item_id: 'item-D',
      location_id: 'loc-D',
      quantity: 10
    });

    await LedgerRepository.reverseEntry(original, 'First reversal');
    
    await expect(LedgerRepository.reverseEntry(original, 'Second reversal'))
      .rejects.toThrow('This entry has already been reversed');
  });
});
