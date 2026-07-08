/**
 * Standalone verification of expected TTB form values from seed data.
 * Run: node scripts/verify-ttb-expected-math.cjs
 *
 * Seed data (barrels):
 *   - Before period: RECEIVE 10 bbl → Line 1 (beginning inventory)
 *   - In period:     RECEIVE 5 bbl (production_complete) → Line 2
 *   - In period:     TRANSFER_IN 3 bbl (operation_type 'racking') → Line 4
 *   - In period:     CONSUME 2 bbl (sale) → Line 14
 *   - In period:     TRANSFER_OUT 3 bbl (racking) → Line 22
 *
 * Pre-calculated expected values:
 */
function getExpectedTTBValues() {
  const line1 = 10;
  const line2 = 5;
  const line3 = 0;
  const line4 = 3; // TRANSFER_IN to racking (operation_type 'racking')
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

  return {
    additions: { line1, line2, line4, line13 },
    removals: { line14, line22, line33, line34 },
    totalRemovals,
  };
}

const expected = getExpectedTTBValues();
console.log('TTB Form 5130.9 – Expected values from seed data:\n');
console.log('Additions:');
console.log('  Line 1 (beginning inventory):', expected.additions.line1);
console.log('  Line 2 (beer produced):       ', expected.additions.line2);
console.log('  Line 13 (total additions):    ', expected.additions.line13);
console.log('');
console.log('Removals:');
console.log('  Line 14 (sale):               ', expected.removals.line14);
console.log('  Line 22 (transferred racking):', expected.removals.line22);
console.log('  Total removals:               ', expected.totalRemovals);
console.log('');
console.log('  Line 4 (from racking/bottling):', expected.additions.line4);
console.log('  Line 33 (ending inventory):    ', expected.removals.line33);
console.log('  Line 34 (total beer):         ', expected.removals.line34);
console.log('');
console.log('Identity checks:');
console.log('  Line 13 = 10+5+3 (line4):         ', expected.additions.line13, '→', expected.additions.line13 === 18 ? 'OK' : 'MISMATCH');
console.log('  Line 33 = Line 13 - totalRemovals:', expected.removals.line33, '=', expected.additions.line13, '-', expected.totalRemovals, '→', expected.additions.line13 - expected.totalRemovals === expected.removals.line33 ? 'OK' : 'MISMATCH');
console.log('  Line 34 = Line 13:               ', expected.removals.line34, '=', expected.additions.line13, '→', expected.removals.line34 === expected.additions.line13 ? 'OK' : 'MISMATCH');
