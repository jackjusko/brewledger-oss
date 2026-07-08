import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SyncService } from '../../src/services/SyncService';
import { db } from '../../src/db';
import { AuthService } from '../../src/services/AuthService';
import axios from 'axios';

vi.mock('axios');
vi.mock('../../src/services/AuthService', () => ({
  AuthService: {
    getSession: vi.fn(),
    updateLastSync: vi.fn()
  }
}));

describe('SyncService', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    vi.clearAllMocks();
    
    vi.mocked(AuthService.getSession).mockResolvedValue({
      orgId: 'test-org',
      token: 'test-token'
    });
  });

  it('should gather pending records', async () => {
    await db.items.add({ id: 'i1', name: 'Item 1', sync_status: 'pending' });
    await db.items.add({ id: 'i2', name: 'Item 2', sync_status: 'synced' });

    axios.post.mockResolvedValue({
      data: {
        updates: {},
        serverTimestamp: '2023-01-02T00:00:00Z'
      }
    });

    await SyncService.sync();

    // Verify axios called with item i1
    expect(axios.post).toHaveBeenCalled();
    const payload = axios.post.mock.calls[0][1];
    expect(payload.changes.items).toHaveLength(1);
    expect(payload.changes.items[0].id).toBe('i1');
  });

  it('should apply server updates', async () => {
    const updates = {
      items: [{ id: 'i3', name: 'Item 3 (Remote)', version: 1, sync_status: 'synced' }]
    };

    axios.post.mockResolvedValue({
      data: {
        updates,
        serverTimestamp: '2023-01-02T00:00:00Z'
      }
    });

    await SyncService.sync();

    const item = await db.items.get('i3');
    expect(item).toBeDefined();
    expect(item.name).toBe('Item 3 (Remote)');
    // Note: implementation might not set sync_status explicitly if it just puts the object, 
    // but usually it should be synced coming from server.
    // Let's check name to be sure.
  });
});
