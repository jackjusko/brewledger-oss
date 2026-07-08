/**
 * TTB Form 5130.9 calculation verification tests.
 *
 * Expected form values are computed beforehand using explicit arithmetic from
 * the seed transactions (see getExpectedTTBValues()). The test then seeds a
 * mock org with those ledger entries and asserts that generateForm() returns
 * values matching the pre-calculated expectations.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Use same constant as TTBFormService for any gallon-based conversions
const GALLONS_PER_BARREL = 31;

const TEST_ORG_ID = 'test-org-ttb';
const PERIOD_START = '2025-01-01T00:00:00.000Z';
const PERIOD_END = '2025-01-31T23:59:59.999Z';

vi.mock('./AuthService', () => ({
  AuthService: {
    getSession: vi.fn(() => Promise.resolve({ orgId: TEST_ORG_ID })),
  },
}));

// Optional: mock BreweryInfoService so detectDataGaps doesn't fail if we add those tests later
vi.mock('./BreweryInfoService', () => ({
  BreweryInfoService: {
    getBreweryInfo: vi.fn(() =>
      Promise.resolve({
        brewery_name: 'Test Brewery',
        ttb_brewery_number: 'BR-12345',
        brewery_ein: '12-3456789',
        brewery_address_street: '123 Main St',
        brewery_address_city: 'Town',
        brewery_address_county: 'County',
        brewery_address_state: 'ST',
        brewery_address_zip: '12345',
        brewery_phone: '555-0000',
      })
    ),
  },
}));

/**
 * Pre-calculate expected TTB values from the seed transactions we insert.
 * All beer quantities in ledger are in barrels (see TTBFormService beerQuantityBarrels).
 *
 * Seed design:
 * - Before period: one RECEIVE (beer) → beginning inventory
 * - In period: one RECEIVE production_complete, one CONSUME (sale), one TRANSFER_OUT (racking)
 */
function getExpectedTTBValues() {
  // --- Additions (Part 1) ---
  // Line 1: On hand beginning of period = all beer entries with created_at <= periodStart
  const line1 = 10; // single RECEIVE 10 bbl before period

  // Line 2: Beer produced by fermentation = RECEIVE with data.source === 'production_complete' in period
  const line2 = 5;

  // Lines 3–11: Line 4 = TRANSFER_IN with operation_type 'racking' (paired leg of our racking transfer)
  const line3 = 0;
  const line4 = 3; // TRANSFER_IN to racking location (operation_type 'racking') in period
  const line5 = 0;
  const line6 = 0;
  const line7 = 0;
  const line8 = 0;
  const line9 = 0;
  const line10 = 0;
  const line11 = 0;
  const line12 = 0;

  // Line 13: Total additions = sum of lines 1–12  →  10 + 5 + 3 = 18
  const line13 = line1 + line2 + line3 + line4 + line5 + line6 + line7 + line8 + line9 + line10 + line11 + line12;

  // --- Removals (Part 1) ---
  // Line 14: Removed for consumption or sale (CONSUME with removal_purpose 'sale')
  const line14 = 2;
  const line15 = 0;
  const line16 = 0;
  const line17 = 0;
  const line18 = 0;
  const line19 = 0;
  const line20 = 0;
  const line21 = 0;
  // Line 22: Beer transferred for racking (TRANSFER_OUT with operation_type 'racking')
  const line22 = 3;
  const line23 = 0;
  const line24 = 0;
  const line25 = 0;
  const line26 = 0;
  const line27 = 0;
  const line28 = 0;
  const line29 = 0;
  const line30 = 0;
  const line31 = 0;
  const line32 = 0;

  const totalRemovals =
    line14 + line15 + line16 + line17 + line18 + line19 + line20 +
    line21 + line22 + line23 + line24 + line25 + line26 + line27 +
    line28 + line29 + line30 + line31 + line32;

  // Line 33: Total on hand at end of period = Line 13 - total removals  →  18 - 5 = 13
  const line33 = line13 - totalRemovals;
  // Line 34: Total beer = Line 13  →  18
  const line34 = line13;

  return {
    additions: {
      line1,
      line2,
      line3,
      line4,
      line5,
      line6,
      line7,
      line8,
      line9,
      line10,
      line11,
      line12,
      line13,
    },
    removals: {
      line14,
      line15,
      line16,
      line17,
      line18,
      line19,
      line20,
      line21,
      line22,
      line23,
      line24,
      line25,
      line26,
      line27,
      line28,
      line29,
      line30,
      line31,
      line32,
      line33,
      line34,
    },
    totalRemovals,
  };
}

async function seedTTBTestData(db) {
  const catId = uuidv4();
  const beerItemId = uuidv4();
  const cellarId = uuidv4();
  const rackingId = uuidv4();

  await db.categories.add({
    id: catId,
    name: 'Finished Beer',
    org_id: TEST_ORG_ID,
    sync_status: 'synced',
  });

  await db.items.add({
    id: beerItemId,
    name: 'Finished Beer',
    category: 'Finished Beer',
    unit: 'bbl',
    org_id: TEST_ORG_ID,
    sync_status: 'synced',
  });

  await db.locations.add({
    id: cellarId,
    name: 'Cellar',
    org_id: TEST_ORG_ID,
    stage: 'cellar',
    sync_status: 'synced',
  });
  await db.locations.add({
    id: rackingId,
    name: 'Racking',
    org_id: TEST_ORG_ID,
    stage: 'racking_keg',
    sync_status: 'synced',
  });

  // All quantities in barrels (beer ledger uses barrels per TTBFormService)
  const entries = [
    {
      id: uuidv4(),
      org_id: TEST_ORG_ID,
      type: 'RECEIVE',
      item_id: beerItemId,
      location_id: cellarId,
      quantity: 10,
      created_at: '2024-12-15T12:00:00.000Z', // before period → Line 1
      sync_status: 'synced',
    },
    {
      id: uuidv4(),
      org_id: TEST_ORG_ID,
      type: 'RECEIVE',
      item_id: beerItemId,
      location_id: cellarId,
      quantity: 5,
      data: { source: 'production_complete' },
      created_at: '2025-01-10T12:00:00.000Z', // in period → Line 2
      sync_status: 'synced',
    },
    {
      id: uuidv4(),
      org_id: TEST_ORG_ID,
      type: 'CONSUME',
      item_id: beerItemId,
      location_id: cellarId,
      quantity: -2, // ledger can store negative for CONSUME; service uses Math.abs
      removal_purpose: 'sale',
      created_at: '2025-01-20T12:00:00.000Z', // in period → Line 14
      sync_status: 'synced',
    },
    {
      id: uuidv4(),
      org_id: TEST_ORG_ID,
      type: 'TRANSFER_OUT',
      item_id: beerItemId,
      location_id: cellarId,
      quantity: -3, // transfer out is negative
      operation_type: 'racking',
      created_at: '2025-01-22T12:00:00.000Z', // in period → Line 22
      sync_status: 'synced',
    },
    {
      id: uuidv4(),
      org_id: TEST_ORG_ID,
      type: 'TRANSFER_IN',
      item_id: beerItemId,
      location_id: rackingId,
      quantity: 3,
      operation_type: 'racking',
      created_at: '2025-01-22T12:00:00.000Z',
      sync_status: 'synced',
    },
  ];

  for (const e of entries) {
    await db.ledger_entries.add(e);
  }

  return { beerItemId, cellarId, rackingId };
}

describe('TTB Form 5130.9 calculation verification', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { db, resetDatabase } = await import('../db');
    await resetDatabase();
    await seedTTBTestData(db);
  });

  it('generates form values that match pre-calculated expected values from seed ledger data', async () => {
    const { TTBFormService } = await import('./TTBFormService');
    const expected = getExpectedTTBValues();

    const params = {
      reportType: 'monthly',
      year: 2025,
      period: 1,
      periodStart: PERIOD_START,
      periodEnd: PERIOD_END,
    };

    const form = await TTBFormService.generateForm(params);

    const tolerance = 0.001;

    // Additions
    expect(form.additions.line1).toBeCloseTo(expected.additions.line1, tolerance);
    expect(form.additions.line2).toBeCloseTo(expected.additions.line2, tolerance);
    expect(form.additions.line3).toBeCloseTo(expected.additions.line3, tolerance);
    expect(form.additions.line4).toBeCloseTo(expected.additions.line4, tolerance);
    expect(form.additions.line5).toBeCloseTo(expected.additions.line5, tolerance);
    expect(form.additions.line6).toBeCloseTo(expected.additions.line6, tolerance);
    expect(form.additions.line7).toBeCloseTo(expected.additions.line7, tolerance);
    expect(form.additions.line8).toBeCloseTo(expected.additions.line8, tolerance);
    expect(form.additions.line9).toBeCloseTo(expected.additions.line9, tolerance);
    expect(form.additions.line10).toBeCloseTo(expected.additions.line10, tolerance);
    expect(form.additions.line11).toBeCloseTo(expected.additions.line11, tolerance);
    expect(form.additions.line12).toBeCloseTo(expected.additions.line12, tolerance);
    expect(form.additions.line13).toBeCloseTo(expected.additions.line13, tolerance);

    // Removals
    expect(form.removals.line14).toBeCloseTo(expected.removals.line14, tolerance);
    expect(form.removals.line15).toBeCloseTo(expected.removals.line15, tolerance);
    expect(form.removals.line22).toBeCloseTo(expected.removals.line22, tolerance);
    expect(form.removals.line33).toBeCloseTo(expected.removals.line33, tolerance);
    expect(form.removals.line34).toBeCloseTo(expected.removals.line34, tolerance);

    // Critical identity: Line 33 = Line 13 - total removals
    const computedLine33 = form.additions.line13 - (
      form.removals.line14 + form.removals.line15 + form.removals.line16 +
      form.removals.line17 + form.removals.line18 + form.removals.line19 +
      form.removals.line20 + form.removals.line21 + form.removals.line22 +
      form.removals.line23 + form.removals.line24 + form.removals.line25 +
      form.removals.line26 + form.removals.line27 + form.removals.line28 +
      form.removals.line29 + form.removals.line30 + form.removals.line31 +
      form.removals.line32
    );
    expect(form.removals.line33).toBeCloseTo(computedLine33, tolerance);
    expect(form.removals.line34).toBeCloseTo(form.additions.line13, tolerance);
  });

  it('expected values are computed correctly from seed math', () => {
    const expected = getExpectedTTBValues();
    // Line 13 = 10 + 5 + 3 (line4) = 18
    expect(expected.additions.line13).toBe(18);
    // Total removals = 2 + 3 = 5
    expect(expected.totalRemovals).toBe(5);
    // Line 33 = 18 - 5 = 13
    expect(expected.removals.line33).toBe(13);
    expect(expected.removals.line34).toBe(18);
  });
});
