import axios from 'axios';
import { AuthService } from './AuthService';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { BatchRepository } from '../repositories/BatchRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { VesselRepository } from '../repositories/VesselRepository';
import { API_BASE_URL } from '../config';

const toIso = (value) => value ? new Date(value).toISOString() : null;

const inRange = (date, start, end) => {
  if (!date) return false;
  const d = new Date(date).toISOString();
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
};

export const ServingReportsService = {
  /**
   * Server-backed report (preferred for long ranges). Falls back to local aggregation on error.
   */
  async getReport({ periodStart, periodEnd, offlineFallback = true } = {}) {
    const session = await AuthService.getSession();
    if (session?.token) {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/reports/serving`, {
          params: {
            periodStart: periodStart ? new Date(periodStart).toISOString() : undefined,
            periodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined
          },
          headers: { Authorization: `Bearer ${session.token}` }
        });
        return {
          brewedByLocation: data.brewed_by_location || [],
          inventoryChange: data.inventory_change || { byBatch: [], byBrand: [] },
          bulkOnhandByVessel: data.bulk_onhand_by_vessel || [],
          packagedByLocation: data.packaged_by_location || [],
          source: 'server'
        };
      } catch (e) {
        console.warn('Falling back to local serving report', e);
      }
    }
    if (!offlineFallback) {
      throw new Error('Server report unavailable and offline fallback disabled.');
    }
    return {
      brewedByLocation: await this.getBrewedVolumeByLocation({ periodStart, periodEnd }),
      inventoryChange: await this.getInventoryChangeByBatchAndBrand({ periodStart, periodEnd }),
      bulkOnhandByVessel: await this.getBulkOnHandByVessel(),
      packagedByLocation: await this.getPackagedInventoryByLocation(),
      source: 'local'
    };
  },

  /**
   * Volume of beer brewed at each location (uses RECEIVE ledger entries with batch_id).
   */
  async getBrewedVolumeByLocation({ periodStart, periodEnd } = {}) {
    const start = toIso(periodStart);
    const end = toIso(periodEnd);
    const entries = await LedgerRepository.getEntries({
      startDate: start || undefined,
      endDate: end || undefined
    });
    const locations = await LocationRepository.getAll();
    const locMap = new Map(locations.map((l) => [l.id, l.name]));
    const totals = new Map();
    entries
      .filter((e) => e.type === 'RECEIVE' && e.batch_id && inRange(e.created_at, start, end))
      .forEach((e) => {
        const key = e.location_id || 'unspecified';
        const name = locMap.get(e.location_id) || 'Unspecified';
        const current = totals.get(key) || { location_id: key, location_name: name, quantity: 0 };
        current.quantity += Number(e.quantity) || 0;
        totals.set(key, current);
      });
    return Array.from(totals.values());
  },

  /**
   * Inventory change over a month by batch and brand.
   */
  async getInventoryChangeByBatchAndBrand({ periodStart, periodEnd } = {}) {
    const start = toIso(periodStart);
    const end = toIso(periodEnd);
    const entries = await LedgerRepository.getEntries({
      startDate: start || undefined,
      endDate: end || undefined
    });
    const items = await ItemRepository.getAll();
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const byBatch = new Map();
    const byBrand = new Map();

    entries.filter((e) => inRange(e.created_at, start, end)).forEach((e) => {
      if (e.batch_id) {
        const current = byBatch.get(e.batch_id) || { batch_id: e.batch_id, quantity: 0 };
        current.quantity += Number(e.quantity) || 0;
        byBatch.set(e.batch_id, current);
      }
      if (e.item_id) {
        const item = itemMap.get(e.item_id);
        const key = e.item_id;
        const current = byBrand.get(key) || { item_id: key, item_name: item?.name || 'Unknown', quantity: 0 };
        current.quantity += Number(e.quantity) || 0;
        byBrand.set(key, current);
      }
    });

    return {
      byBatch: Array.from(byBatch.values()),
      byBrand: Array.from(byBrand.values())
    };
  },

  /**
   * Bulk inventory on hand by vessel (serving/brite/fermenter), using latest batch_location volumes.
   */
  async getBulkOnHandByVessel() {
    const batches = await BatchRepository.getAll();
    const batchIds = batches.map((b) => b.id);
    const splits = await BatchLocationRepository.getByBatchIds(batchIds);
    const vessels = await VesselRepository.getAll();
    const vesselMap = new Map(vessels.map((v) => [v.id, v]));
    const totals = new Map();
    splits.forEach((bl) => {
      const vessel = vesselMap.get(bl.vessel_id);
      const key = bl.vessel_id || 'unknown';
      const current = totals.get(key) || { vessel_id: key, vessel_name: vessel?.name || 'Unknown vessel', type: vessel?.type || '', quantity: 0 };
      current.quantity += Number(bl.current_volume) || 0;
      totals.set(key, current);
    });
    return Array.from(totals.values());
  },

  /**
   * Packaged inventory remaining in each cold storage location (Finished Beer category).
   */
  async getPackagedInventoryByLocation() {
    const onhand = await LedgerRepository.getAllOnhand();
    const items = await ItemRepository.getAll();
    const locations = await LocationRepository.getAll();
    const itemMap = new Map(items.map((i) => [i.id, i]));
    const locationMap = new Map(locations.map((l) => [l.id, l]));
    const totals = new Map();

    onhand.forEach((row) => {
      const item = itemMap.get(row.item_id);
      if (item?.category !== 'Finished Beer') return;
      const loc = locationMap.get(row.location_id);
      const key = row.location_id || 'unspecified';
      const current = totals.get(key) || { location_id: key, location_name: loc?.name || 'Unspecified', quantity: 0 };
      current.quantity += Number(row.quantity) || 0;
      totals.set(key, current);
    });

    return Array.from(totals.values());
  }
};
