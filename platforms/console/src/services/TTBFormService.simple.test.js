/**
 * Minimal test: only pre-calculated expected values (no DB, no TTBFormService).
 * Verifies that expected TTB math is correct; run full test with TTBFormService.test.js.
 */
import { describe, it, expect } from 'vitest';

function getExpectedTTBValues() {
  const line1 = 10;
  const line2 = 5;
  const line3 = 0;
  const line4 = 3; // TRANSFER_IN (operation_type 'racking') in seed
  const line5 = 0;
  const line6 = 0;
  const line7 = 0;
  const line8 = 0;
  const line9 = 0;
  const line10 = 0;
  const line11 = 0;
  const line12 = 0;
  const line13 = line1 + line2 + line3 + line4 + line5 + line6 + line7 + line8 + line9 + line10 + line11 + line12;
  const line14 = 2;
  const line15 = 0;
  const line16 = 0;
  const line17 = 0;
  const line18 = 0;
  const line19 = 0;
  const line20 = 0;
  const line21 = 0;
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
  const line33 = line13 - totalRemovals;
  const line34 = line13;
  return { line13, totalRemovals, line33, line34 };
}

describe('TTB expected value math', () => {
  it('computes Line 13, total removals, Line 33, Line 34 from seed data', () => {
    const expected = getExpectedTTBValues();
    expect(expected.line13).toBe(18);      // 10 + 5 + 3 (line4)
    expect(expected.totalRemovals).toBe(5); // 2 + 3
    expect(expected.line33).toBe(13);       // 18 - 5
    expect(expected.line34).toBe(18);
  });
});
