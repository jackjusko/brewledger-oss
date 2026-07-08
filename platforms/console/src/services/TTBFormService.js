/**
 * TTB Form Service
 * Handles calculation and generation of TTB Form 5130.9 data
 */

import { LedgerRepository } from '../repositories/LedgerRepository'
import { ItemRepository } from '../repositories/ItemRepository'
import { LocationRepository } from '../repositories/LocationRepository'
import { BatchMilestoneRepository } from '../repositories/BatchMilestoneRepository'
import { BatchAdditionRepository } from '../repositories/BatchAdditionRepository'
import { PackagingRunRepository } from '../repositories/PackagingRunRepository'
import { VarianceEventRepository } from '../repositories/VarianceEventRepository'
import { BatchRepository } from '../repositories/BatchRepository'
import { db } from '../db'
import { AuthService } from './AuthService'
import { BreweryInfoService } from './BreweryInfoService'

// Unit conversion constants
const GALLONS_PER_BARREL = 31

/**
 * Convert gallons to barrels
 */
function gallonsToBarrels(gallons) {
  if (!gallons || gallons === 0) return 0
  return gallons / GALLONS_PER_BARREL
}

/**
 * Beer ledger and variance quantities: bulk in bbl, packaged in ea.
 * For packaged items (volume_per_unit), convert ea to bbl.
 */
function beerQuantityBarrels(entryOrQty, item) {
  const qty = typeof entryOrQty === 'object' ? Math.abs(Number(entryOrQty?.quantity) || 0) : Math.abs(Number(entryOrQty) || 0);
  const volPerUnit = item?.data?.volume_per_unit ?? item?.volume_per_unit;
  if (volPerUnit != null && typeof volPerUnit === 'number' && volPerUnit > 0) {
    return qty * volPerUnit;
  }
  return qty;
}

/**
 * Signed beer quantity for TTB totals. Handles reversals.
 * @param {Object} entry - Ledger entry
 * @param {Object} item - Beer item (for volume_per_unit)
 * @param {boolean} forAddition - true for RECEIVE/TRANSFER_IN (positive qty adds), false for CONSUME/TRANSFER_OUT (negative qty adds)
 */
function signedBeerQuantity(entry, item, forAddition) {
  const qty = beerQuantityBarrels(entry, item);
  const sign = forAddition
    ? ((Number(entry.quantity) || 0) >= 0 ? 1 : -1)
    : ((Number(entry.quantity) || 0) < 0 ? 1 : -1);
  return qty * sign;
}

// Map location stages to TTB columns
const STAGE_TO_COLUMN = {
  cellar: 'b',
  serving: 'b',
  racking_keg: 'd',
  bottling_bulk: 'e',
  case: 'f'
}

// Line → fillable columns (per ttb-final.pdf field availability)
const LINE_COLUMN_MAP = {
  line1: ['b', 'c', 'd', 'e', 'f', 'g'],
  line2: ['b', 'g'],
  line3: ['b', 'g'],
  line4: ['b', 'g'],
  line5: ['b', 'd', 'f', 'g'],
  line6: ['c', 'e', 'g'],
  line7: ['b', 'd', 'f', 'g'],
  line8: ['b', 'd', 'f', 'g'],
  line9: ['d', 'g'],
  line10: ['f', 'g'],
  line11: ['b', 'c', 'd', 'e', 'f', 'g'],
  line12: ['b', 'c', 'd', 'e', 'f', 'g'],
  line13: ['b', 'c', 'd', 'e', 'f', 'g'],
  line14: ['d', 'f', 'g'],
  line15: ['b', 'd', 'f', 'g'],
  line16: ['b', 'd', 'f', 'g'],
  line17: ['d', 'f', 'g'],
  line18: ['b', 'd', 'f', 'g'],
  line19: ['b', 'd', 'f', 'g'],
  line20: ['b', 'g'],
  line21: ['b', 'd', 'f', 'g'],
  line22: ['b', 'g'],
  line23: ['b', 'g'],
  line24: ['c', 'e', 'g'],
  line25: ['c', 'g'],
  line26: ['e', 'g'],
  line27: ['b', 'c', 'd', 'e', 'f', 'g'],
  line28: ['b', 'c', 'd', 'e', 'f', 'g'],
  line29: ['b', 'c', 'd', 'e', 'f', 'g'],
  line30: ['b', 'c', 'd', 'e', 'f', 'g'],
  line31: ['b', 'c', 'd', 'e', 'f', 'g'],
  line33: ['b', 'c', 'd', 'e', 'f', 'g'],
  line34: ['b', 'c', 'd', 'e', 'f', 'g']
}

async function getLocationStageMap() {
  const locations = await LocationRepository.getAll()
  const map = new Map()
  for (const loc of locations) {
    const stage = loc.stage && ['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'].includes(loc.stage)
      ? loc.stage
      : 'cellar'
    map.set(loc.id, stage)
  }
  return map
}

function mapStageToColumn(stage) {
  return STAGE_TO_COLUMN[stage] || null
}

/**
 * Get TTB stage for a ledger entry (operation-driven for movements).
 * - data.ttb_stage: explicit override
 * - operation_type production_complete → cellar
 * - operation_type racking: TRANSFER_OUT/source → cellar; TRANSFER_IN/destination → racking_keg
 * - operation_type bottling/canning: destination → case
 * - Else: fallback to location stage
 */
function getStageForEntry(entry, stageMap, isDestination) {
  const stage = entry.data?.ttb_stage
  if (stage && ['cellar', 'serving', 'racking_keg', 'bottling_bulk', 'case'].includes(stage)) {
    return stage
  }
  const op = entry.operation_type || entry.data?.operation_type
  if (op === 'production_complete') return 'cellar'
  if (op === 'racking') {
    return isDestination ? 'racking_keg' : (stageMap.get(entry.location_id) || 'cellar')
  }
  if (op === 'bottling' || op === 'canning') {
    return isDestination ? 'case' : (stageMap.get(entry.location_id) || 'cellar')
  }
  return stageMap.get(entry.location_id) || 'cellar'
}

function initColumns(lineKey, total) {
  const allowed = LINE_COLUMN_MAP[lineKey] || []
  const cols = { a: total }
  for (const col of allowed) {
    cols[col] = 0
  }
  // g = total by default if allowed
  if (allowed.includes('g')) {
    cols.g = total
  }
  return cols
}

function addToColumns(columns, allowed, columnKey, quantity) {
  if (!columnKey || !allowed.includes(columnKey)) return
  columns[columnKey] = (columns[columnKey] || 0) + quantity
  if (allowed.includes('g')) {
    columns.g = (columns.g || 0) + quantity
  }
}

function aggregateByStage(lineKey, entries, getStage, getQuantity) {
  const allowed = LINE_COLUMN_MAP[lineKey] || []
  const columns = initColumns(lineKey, 0)
  for (const entry of entries) {
    const qty = Math.max(0, getQuantity(entry))
    columns.a += qty
    const col = mapStageToColumn(getStage(entry))
    addToColumns(columns, allowed, col, qty)
  }
  if (allowed.includes('g')) {
    // If g not incremented in loop (no allowed stage columns), set to total a
    columns.g = columns.g ?? columns.a
  }
  return columns
}

function groupTransfersByPair(entries, stageMap) {
  const pairs = []
  const grouped = new Map()
  for (const entry of entries) {
    if (!entry.transfer_group_id) continue
    if (!grouped.has(entry.transfer_group_id)) {
      grouped.set(entry.transfer_group_id, [])
    }
    grouped.get(entry.transfer_group_id).push(entry)
  }
  for (const [, group] of grouped) {
    const out = group.find(e => e.type === 'TRANSFER_OUT')
    const inn = group.find(e => e.type === 'TRANSFER_IN')
    if (!out || !inn) continue
    const quantity = Math.abs(out.quantity || inn.quantity || 0)
    const fromStage = getStageForEntry(out, stageMap, false)
    const toStage = getStageForEntry(inn, stageMap, true)
    const operationType = out.operation_type || inn.operation_type || (out.data || {}).operation_type || (inn.data || {}).operation_type || null
    pairs.push({ quantity, fromStage, toStage, operationType })
  }
  return pairs
}

/**
 * Get organization ID from session
 */
async function getOrgId() {
  const session = await AuthService.getSession()
  return session ? session.orgId : null
}

/**
 * Query ledger entries for a date range
 */
async function getLedgerEntriesForPeriod(periodStart, periodEnd, filters = {}) {
  const orgId = await getOrgId()
  if (!orgId) return []
  
  const entries = await LedgerRepository.getEntries({
    startDate: periodStart,
    endDate: periodEnd,
    ...filters
  })
  
  return entries.filter(e => e.org_id === orgId)
}

/**
 * Get beer item IDs for this org (category "Finished Beer").
 * Includes soft-deleted beer items so TTB calculations count historical ledger entries (production, removals, inventory).
 */
async function getBeerItemIds() {
  const beerItems = await ItemRepository.getBeerItems({ includeDeleted: true })
  return new Set(beerItems.map(i => i.id))
}

/**
 * Get beer items as Map<id, item> for volume_per_unit lookup (packaged beer ea→bbl conversion).
 */
async function getBeerItemsMap() {
  const beerItems = await ItemRepository.getBeerItems({ includeDeleted: true })
  return new Map(beerItems.map(i => [i.id, i]))
}

/**
 * Ledger entries for period restricted to beer items (for TTB lines 4–8, 14–28).
 */
async function getBeerLedgerEntriesForPeriod(periodStart, periodEnd, filters = {}) {
  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) return []
  const entries = await getLedgerEntriesForPeriod(periodStart, periodEnd, filters)
  return entries.filter(e => beerItemIds.has(e.item_id))
}

/**
 * Calculate beginning inventory (Line 1)
 * Ending inventory from previous period, beer items only.
 * Uses entries strictly before periodStart (created_at < periodStart) so the first moment of the period is not double-counted.
 */
async function calculateBeginningInventory(periodStart, itemMap) {
  const orgId = await getOrgId()
  if (!orgId) return 0

  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) return 0

  const map = itemMap || await getBeerItemsMap()
  const allEntries = await LedgerRepository.getEntries({
    endDate: periodStart
  })
  const entriesBeforePeriod = allEntries.filter(e => e.created_at < periodStart)

  let total = 0
  for (const entry of entriesBeforePeriod) {
    if (!beerItemIds.has(entry.item_id)) continue
    const item = map.get(entry.item_id)
    const qty = beerQuantityBarrels(entry, item)
    const sign = (Number(entry.quantity) || 0) >= 0 ? 1 : -1
    if (entry.type === 'TRANSFER_IN' || entry.type === 'RECEIVE') {
      total += qty * sign
    } else if (entry.type === 'TRANSFER_OUT' || entry.type === 'CONSUME') {
      total -= qty
    } else {
      total += qty * sign
    }
  }
  return Math.max(0, total)
}

/**
 * Calculate beer produced by fermentation (Line 2)
 * From RECEIVE entries with data.source === 'production_complete' (beer items only).
 * No dependency on milestone type (custom templates).
 */
async function calculateBeerProduced(periodStart, periodEnd, itemMap) {
  const orgId = await getOrgId()
  if (!orgId) return 0

  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) return 0

  const map = itemMap || await getBeerItemsMap()
  const entries = await LedgerRepository.getEntries({
    startDate: periodStart,
    endDate: periodEnd,
    type: 'RECEIVE'
  })

  const reversalIds = [...new Set(entries.filter(e => e.reversed_of_ledger_id).map(e => e.reversed_of_ledger_id))]
  const entryById = new Map()
  if (reversalIds.length > 0) {
    const originals = await db.ledger_entries.where('id').anyOf(reversalIds).toArray()
    for (const e of originals) entryById.set(e.id, e)
  }

  let total = 0
  for (const entry of entries) {
    if (!beerItemIds.has(entry.item_id)) continue
    const data = entry.data || {}
    const isProductionComplete = data.source === 'production_complete'
    const isReversalOfProductionComplete = entry.reversed_of_ledger_id && (() => {
      const orig = entryById.get(entry.reversed_of_ledger_id)
      return orig && (orig.data || {}).source === 'production_complete'
    })()
    if (!isProductionComplete && !isReversalOfProductionComplete) continue
    const sign = (Number(entry.quantity) || 0) >= 0 ? 1 : -1
    total += beerQuantityBarrels(entry, map.get(entry.item_id)) * sign
  }
  return Math.max(0, total)
}

/**
 * Calculate water and liquid additions (Line 3)
 * From batch_additions with event_type WATER_ADDITION or LIQUID_ADDITION
 */
async function calculateWaterAdditions(periodStart, periodEnd) {
  const orgId = await getOrgId()
  if (!orgId) return 0
  
  const additions = await db.batch_additions
    .where('org_id').equals(orgId)
    .toArray()
  
  let total = 0
  
  for (const addition of additions) {
    const addedAt = addition.added_at || addition.created_at
    if (addedAt >= periodStart && addedAt <= periodEnd) {
      if (addition.event_type === 'WATER_ADDITION' || addition.event_type === 'LIQUID_ADDITION') {
        const quantity = Math.abs(addition.quantity || 0)
        // Assume quantity is in gallons
        total += gallonsToBarrels(quantity)
      }
    }
  }
  
  return total
}

/**
 * Calculate beer received from racking and bottling (Line 4)
 * Transfers with operation_type: 'racking' that return to cellars
 */
async function calculateBeerReceivedFromRackingBottling(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'TRANSFER_IN'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.operation_type === 'racking' || (entry.data || {}).operation_type === 'racking') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer received in bond (Line 5)
 * Ledger entries with specific classification for in-bond transfers
 */
async function calculateBeerReceivedInBond(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'RECEIVE'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    const data = entry.data || {}
    if (entry.operation_type === 'in_bond' || data.in_bond === true || entry.removal_purpose === 'in_bond_receive') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer received from cellars (Line 6)
 * Transfers between cellar locations
 */
async function calculateBeerReceivedFromCellars(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'TRANSFER_IN'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    const note = (entry.note || '').toLowerCase()
    if ((!entry.operation_type || entry.operation_type === 'transfer') &&
        !note.includes('return') && !note.includes('cellar')) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer returned after removal (Line 7)
 * RECEIVE or TRANSFER_IN with return_of_ledger_id. Exclude TRANSFER_IN already counted in
 * Line 4 (operation_type racking) or Line 24 (note return/cellar) to avoid double-count.
 */
async function calculateBeerReturnedAfterRemoval(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd)
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (!entry.return_of_ledger_id) continue
    const item = map.get(entry.item_id)
    if (entry.type === 'RECEIVE') {
      total += signedBeerQuantity(entry, item, true)
      continue
    }
    if (entry.type === 'TRANSFER_IN') {
      if (entry.operation_type === 'racking') continue
      const note = (entry.note || '').toLowerCase()
      if (note.includes('return') || note.includes('cellar')) continue
      total += signedBeerQuantity(entry, item, true)
    }
  }
  return total
}

/**
 * Calculate beer returned from other brewery (Line 8)
 * Ledger entries with related_brewery_id
 */
async function calculateBeerReturnedFromOtherBrewery(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'RECEIVE'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.related_brewery_id) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer racked (Line 9)
 * Ledger RECEIVE with operation_type racking (packaged beer)
 */
async function calculateBeerRacked(periodStart, periodEnd, itemMap) {
  const map = itemMap || await getBeerItemsMap()
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'RECEIVE'
  })
  let total = 0
  for (const entry of entries) {
    const op = entry.operation_type || (entry.data || {}).operation_type
    if (op === 'racking') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer bottled (Line 10)
 * Ledger RECEIVE with operation_type bottling/canning (packaged beer)
 */
async function calculateBeerBottled(periodStart, periodEnd, itemMap) {
  const map = itemMap || await getBeerItemsMap()
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'RECEIVE'
  })
  let total = 0
  for (const entry of entries) {
    const op = entry.operation_type || (entry.data || {}).operation_type
    if (op === 'bottling' || op === 'canning') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate physical inventory overage (Line 11)
 */
async function calculateInventoryOverage(periodStart, periodEnd, itemMap) {
  const orgId = await getOrgId()
  if (!orgId) return 0
  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) return 0
  const map = itemMap || await getBeerItemsMap()
  const variances = await db.variance_events.where('org_id').equals(orgId).toArray()
  let total = 0
  for (const variance of variances) {
    if (!beerItemIds.has(variance.item_id)) continue
    const createdAt = variance.created_at || variance.occurred_at
    if (createdAt >= periodStart && createdAt <= periodEnd) {
      if (variance.variance_type === 'overage' && variance.delta_qty > 0) {
        const item = map.get(variance.item_id)
        total += beerQuantityBarrels({ quantity: variance.delta_qty }, item)
      }
    }
  }
  return total
}

function classifyRemovalEntry(entry) {
  const purpose = entry.removal_purpose || ''
  const note = (entry.note || '').toLowerCase()
  const onPremises = note.includes('premises') || note.includes('on-site')

  switch (purpose) {
    case 'sale':
      return 'line14'
    case 'consumption':
      return onPremises ? null : 'line14'
    case 'tavern':
    case 'on_premise':
      return 'line15'
    case 'export':
      return 'line16'
    case 'supplies':
      return 'line17'
    case 'rd':
    case 'research':
    case 'rnd':
      return 'line18'
    case 'other_brewery':
    case 'inter_brewery':
      return 'line19'
    case 'unfit':
      return null // counted in Line 28
    case 'sample':
      return null // Line 27
    case 'destruction':
      return null // Line 28
    case 'dsp_transfer':
      return null // Line 29
    case 'loss_theft':
      return null // Line 30
    default: {
      const noteHint = note.includes('sample') || note.includes('lab') || note.includes('destroy') ||
        note.includes('dispose') || note.includes('loss') || note.includes('theft')
      if (noteHint) return null
      if (entry.tax_status === 'tax_determined') return 'line15'
      return onPremises ? null : 'line14'
    }
  }
}

/**
 * Calculate removals by purpose (Lines 14-20)
 */
async function calculateRemovalsByPurpose(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'CONSUME'
  })
  const map = itemMap || await getBeerItemsMap()
  const removals = {
    line14: 0, // Removed for consumption or sale
    line15: 0, // Removed tax-determined for tavern
    line16: 0, // Removed without payment of tax for export
    line17: 0, // Removed for supplies (vessels/aircraft)
    line18: 0, // Removed for R&D
    line19: 0, // Removed to other breweries
    line20: 0  // Removed as unfit for sale
  }
  
  for (const entry of entries) {
    const quantity = signedBeerQuantity(entry, map.get(entry.item_id), false)
    const purpose = entry.removal_purpose || ''
    const note = (entry.note || '').toLowerCase()
    const onPremises = note.includes('premises') || note.includes('on-site')

    switch (purpose) {
      case 'sale':
        removals.line14 += quantity
        break
      case 'consumption':
        // On-premises consumption goes to Line 21 only; do not double-count in line14
        if (!onPremises) removals.line14 += quantity
        break
      case 'tavern':
        removals.line15 += quantity
        break
      case 'on_premise':
      case 'serving':
        // Line 21 only (on-premises consumption); do not add to line15
        break
      case 'export':
        removals.line16 += quantity
        break
      case 'supplies':
        removals.line17 += quantity
        break
      case 'rd':
      case 'research':
      case 'rnd':
        removals.line18 += quantity
        break
      case 'other_brewery':
      case 'inter_brewery':
        removals.line19 += quantity
        break
      case 'unfit':
        // Counted in Line 28 (calculateBeerDestroyed) only; avoid double-count with line20
        break
      case 'sample':
        // Counted in Line 27 (calculateLaboratorySamples)
        break
      case 'destruction':
        // Counted in Line 28 (calculateBeerDestroyed)
        break
      case 'dsp_transfer':
        // Counted in Line 29 (calculateBeerTransferredToDSP)
        break
      case 'loss_theft':
        // Counted in Line 30 (calculateLosses) only
        break
      default:
        // Unclassified: avoid double-count with Lines 27–30 (note-based classification)
        const noteHint = note.includes('sample') || note.includes('lab') || note.includes('destroy') ||
          note.includes('dispose') || note.includes('loss') || note.includes('theft')
        if (noteHint) break
        if (entry.tax_status === 'tax_determined') {
          removals.line15 += quantity
        } else {
          if (!onPremises) removals.line14 += quantity
        }
    }
  }
  
  return removals
}

/**
 * Calculate beer consumed on premises (Line 21)
 */
async function calculateBeerConsumedOnPremises(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'CONSUME'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    const note = (entry.note || '').toLowerCase()
    const onPremisesNote = note.includes('premises') || note.includes('on-site')
    if (entry.removal_purpose === 'serving' || entry.removal_purpose === 'on_premise') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    } else if (entry.removal_purpose === 'consumption' && onPremisesNote) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate beer transferred for racking (Line 22)
 */
async function calculateBeerTransferredForRacking(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'TRANSFER_OUT'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.operation_type === 'racking' || (entry.data || {}).operation_type === 'racking') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate beer transferred for bottling (Line 23)
 */
async function calculateBeerTransferredForBottling(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'TRANSFER_OUT'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.operation_type === 'bottling' || (entry.data || {}).operation_type === 'bottling' ||
        entry.note?.toLowerCase().includes('bottling')) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate beer returned to cellars (Line 24)
 */
async function calculateBeerReturnedToCellars(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'TRANSFER_IN'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.operation_type === 'racking' || (entry.data || {}).operation_type === 'racking') continue
    if (entry.note?.toLowerCase().includes('return') ||
        entry.note?.toLowerCase().includes('cellar')) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), true)
    }
  }
  return total
}

/**
 * Calculate beer racked (Line 25) - removals side.
 * Set to 0 so "beer racked" appears only in additions (Line 9). The removal from
 * cellar for racking is already captured by Line 22 (beer transferred for racking).
 * This avoids the same volume appearing on both additions and removals.
 */
async function calculateBeerRackedRemoval(periodStart, periodEnd) {
  return 0
}

/**
 * Calculate beer bottled (Line 26) - removals side.
 * Set to 0 so "beer bottled" appears only in additions (Line 10). Removal side is Line 23 (beer transferred for bottling).
 */
async function calculateBeerBottledRemoval(periodStart, periodEnd) {
  return 0
}

/**
 * Calculate laboratory samples (Line 27)
 */
async function calculateLaboratorySamples(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'CONSUME'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.removal_purpose === 'sample' ||
        entry.note?.toLowerCase().includes('sample') ||
        entry.note?.toLowerCase().includes('lab')) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate beer destroyed at brewery (Line 28)
 */
async function calculateBeerDestroyed(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'CONSUME'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.removal_purpose === 'destruction' ||
        entry.removal_purpose === 'unfit' ||
        entry.note?.toLowerCase().includes('destroy') ||
        entry.note?.toLowerCase().includes('dispose')) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate beer transferred to DSP (Line 29)
 */
async function calculateBeerTransferredToDSP(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, {
    type: 'CONSUME'
  })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    if (entry.removal_purpose === 'dsp_transfer') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate losses including theft (Line 30)
 */
async function calculateLosses(periodStart, periodEnd, itemMap) {
  const entries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd, { type: 'CONSUME' })
  const map = itemMap || await getBeerItemsMap()
  let total = 0
  for (const entry of entries) {
    const purpose = entry.removal_purpose || ''
    const note = (entry.note || '').toLowerCase()
    if (purpose === 'loss_theft') {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    } else if (!purpose && (note.includes('loss') || note.includes('theft'))) {
      total += signedBeerQuantity(entry, map.get(entry.item_id), false)
    }
  }
  return total
}

/**
 * Calculate physical inventory shortage (Line 31)
 */
async function calculateInventoryShortage(periodStart, periodEnd, itemMap) {
  const orgId = await getOrgId()
  if (!orgId) return 0
  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) return 0
  const map = itemMap || await getBeerItemsMap()
  const variances = await db.variance_events.where('org_id').equals(orgId).toArray()
  let total = 0
  for (const variance of variances) {
    if (!beerItemIds.has(variance.item_id)) continue
    const createdAt = variance.created_at || variance.occurred_at
    if (createdAt >= periodStart && createdAt <= periodEnd) {
      if (variance.variance_type === 'shortage' && !variance.loss_type) {
        const item = map.get(variance.item_id)
        total += beerQuantityBarrels({ quantity: Math.abs(variance.delta_qty) }, item)
      }
    }
  }
  return total
}

/**
 * Get beer on-hand by location stage (for Lines 1 and 33 columns b–e).
 * Sums ledger entries for beer items up to asOfDate by location, maps locations to stage.
 */
async function getBeerOnhandByStage(asOfDate, opts = {}) {
  const { inclusiveEnd = true } = opts
  const beerItemIds = await getBeerItemIds()
  if (beerItemIds.size === 0) {
    return { cellar: 0, racking_keg: 0, bottling_bulk: 0, case: 0 }
  }
  const itemMap = await getBeerItemsMap()
  const locations = await LocationRepository.getAll()
  const locationStage = new Map()
  for (const loc of locations) {
    const stage = loc.stage && ['cellar', 'racking_keg', 'bottling_bulk', 'case'].includes(loc.stage)
      ? loc.stage
      : 'cellar'
    locationStage.set(loc.id, stage)
  }

  let entries = await LedgerRepository.getEntries({ endDate: asOfDate })
  if (!inclusiveEnd) {
    entries = entries.filter(e => e.created_at < asOfDate)
  }

  const byLocation = new Map()
  for (const entry of entries) {
    if (!beerItemIds.has(entry.item_id)) continue
    const item = itemMap.get(entry.item_id)
    const qty = beerQuantityBarrels(entry, item)
    const sign = (Number(entry.quantity) || 0) >= 0 ? 1 : -1
    let delta
    if (entry.type === 'RECEIVE' || entry.type === 'TRANSFER_IN') {
      delta = qty * sign
    } else if (entry.type === 'TRANSFER_OUT' || entry.type === 'CONSUME') {
      delta = -qty
    } else {
      delta = qty * sign
    }
    const locId = entry.location_id
    if (locId != null) {
      byLocation.set(locId, (byLocation.get(locId) || 0) + delta)
    }
  }

  const byStage = { cellar: 0, racking_keg: 0, bottling_bulk: 0, case: 0 }
  for (const [locId, net] of byLocation) {
    const stage = locationStage.get(locId) || 'cellar'
    byStage[stage] = (byStage[stage] || 0) + Math.max(0, net)
  }

  return {
    cellar: byStage.cellar || 0,
    racking_keg: byStage.racking_keg || 0,
    bottling_bulk: byStage.bottling_bulk || 0,
    case: byStage.case || 0
  }
}

function columnsFromOnhand(lineKey, stageTotals, total) {
  const allowed = LINE_COLUMN_MAP[lineKey] || []
  const cols = initColumns(lineKey, total)
  if (allowed.includes('b')) cols.b = stageTotals.cellar || 0
  if (allowed.includes('c')) cols.c = 0 // racking bulk not tracked separately
  if (allowed.includes('d')) cols.d = stageTotals.racking_keg || 0
  if (allowed.includes('e')) cols.e = stageTotals.bottling_bulk || 0
  if (allowed.includes('f')) cols.f = stageTotals.case || 0
  if (allowed.includes('g')) {
    cols.g = (cols.b || 0) + (cols.c || 0) + (cols.d || 0) + (cols.e || 0) + (cols.f || 0)
  }
  return cols
}

async function buildColumnsByLine({ periodStart, periodEnd, totals, line1Stage, line33Stage, itemMap }) {
  const columns = {}
  const additions = totals.additions
  const removals = totals.removals
  const map = itemMap || await getBeerItemsMap()
  const getQty = (e) => beerQuantityBarrels(e, map.get(e.item_id))

  columns.line1 = columnsFromOnhand('line1', line1Stage, additions.line1)
  columns.line33 = columnsFromOnhand('line33', line33Stage, removals.line33)
  columns.line34 = columnsFromOnhand('line34', line33Stage, removals.line34 || additions.line13)
  if ('g' in columns.line34) {
    columns.line34.g = columns.line34.a
  }

  const stageMap = await getLocationStageMap()
  const getStage = (locId) => stageMap.get(locId) || 'cellar'

  const beerEntries = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd)
  const orgId = await getOrgId()

  let varianceEvents = []
  if (orgId) {
    varianceEvents = await db.variance_events.where('org_id').equals(orgId).toArray()
    varianceEvents = varianceEvents.filter(v => {
      const createdAt = v.created_at || v.occurred_at
      return createdAt >= periodStart && createdAt <= periodEnd
    })
  }

  const productionReceives = beerEntries.filter(e => e.type === 'RECEIVE' && (e.data || {}).source === 'production_complete')
  const line2Cols = aggregateByStage('line2', productionReceives, e => getStageForEntry(e, stageMap, true), getQty)
  line2Cols.a = additions.line2
  if ('g' in line2Cols) line2Cols.g = line2Cols.g || additions.line2
  columns.line2 = line2Cols

  const line3Cols = initColumns('line3', additions.line3)
  if (LINE_COLUMN_MAP.line3?.includes('b')) line3Cols.b = additions.line3
  if (LINE_COLUMN_MAP.line3?.includes('g')) line3Cols.g = additions.line3
  columns.line3 = line3Cols

  const line4Entries = beerEntries.filter(e => e.type === 'TRANSFER_IN' && (e.operation_type === 'racking' || (e.data || {}).operation_type === 'racking'))
  const line4Cols = aggregateByStage('line4', line4Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line4Cols.a = additions.line4
  if ('g' in line4Cols) line4Cols.g = line4Cols.g || additions.line4
  columns.line4 = line4Cols

  const line5Entries = beerEntries.filter(e => {
    if (e.type !== 'RECEIVE') return false
    const data = e.data || {}
    return e.operation_type === 'in_bond' || data.in_bond === true || e.removal_purpose === 'in_bond_receive'
  })
  const line5Cols = aggregateByStage('line5', line5Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line5Cols.a = additions.line5
  if ('g' in line5Cols) line5Cols.g = line5Cols.g || additions.line5
  columns.line5 = line5Cols

  const line6Entries = beerEntries.filter(e => {
    if (e.type !== 'TRANSFER_IN') return false
    const note = (e.note || '').toLowerCase()
    return (!e.operation_type || e.operation_type === 'transfer') && !note.includes('return') && !note.includes('cellar')
  })
  const line6Cols = aggregateByStage('line6', line6Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line6Cols.a = additions.line6
  if ('g' in line6Cols) line6Cols.g = line6Cols.g || additions.line6
  columns.line6 = line6Cols

  const line7Entries = beerEntries.filter(e => {
    if (!e.return_of_ledger_id) return false
    if (e.type === 'RECEIVE') return true
    if (e.type !== 'TRANSFER_IN') return false
    if (e.operation_type === 'racking') return false
    const note = (e.note || '').toLowerCase()
    if (note.includes('return') || note.includes('cellar')) return false
    return true
  })
  const line7Cols = aggregateByStage('line7', line7Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line7Cols.a = additions.line7
  if ('g' in line7Cols) line7Cols.g = line7Cols.g || additions.line7
  columns.line7 = line7Cols

  const line8Entries = beerEntries.filter(e => e.type === 'RECEIVE' && e.related_brewery_id)
  const line8Cols = aggregateByStage('line8', line8Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line8Cols.a = additions.line8
  if ('g' in line8Cols) line8Cols.g = line8Cols.g || additions.line8
  columns.line8 = line8Cols

  // Line 9: Beer racked (ledger RECEIVE operation_type racking)
  const line9Entries = beerEntries.filter(e => e.type === 'RECEIVE' && (e.operation_type === 'racking' || (e.data || {}).operation_type === 'racking'))
  const line9FromLedger = aggregateByStage('line9', line9Entries, e => getStageForEntry(e, stageMap, true), getQty)
  const line9Cols = initColumns('line9', additions.line9)
  for (const col of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
    if (line9Cols[col] !== undefined) line9Cols[col] = line9FromLedger[col] || 0
  }
  line9Cols.a = additions.line9
  if ('g' in line9Cols) line9Cols.g = line9Cols.g || additions.line9
  columns.line9 = line9Cols

  // Line 10: Beer bottled (ledger RECEIVE operation_type bottling/canning)
  const line10Entries = beerEntries.filter(e => e.type === 'RECEIVE' && ((e.operation_type === 'bottling' || e.operation_type === 'canning') || ((e.data || {}).operation_type === 'bottling' || (e.data || {}).operation_type === 'canning')))
  const line10FromLedger = aggregateByStage('line10', line10Entries, e => getStageForEntry(e, stageMap, true), getQty)
  const line10Cols = initColumns('line10', additions.line10)
  for (const col of ['a', 'b', 'c', 'd', 'e', 'f', 'g']) {
    if (line10Cols[col] !== undefined) line10Cols[col] = line10FromLedger[col] || 0
  }
  line10Cols.a = additions.line10
  if ('g' in line10Cols) line10Cols.g = line10Cols.g || additions.line10
  columns.line10 = line10Cols

  const line11Cols = aggregateByStage(
    'line11',
    varianceEvents.filter(v => v.variance_type === 'overage' && v.delta_qty > 0),
    v => getStage(v.location_id),
    v => beerQuantityBarrels({ quantity: v.delta_qty }, map.get(v.item_id))
  )
  line11Cols.a = additions.line11
  if ('g' in line11Cols) line11Cols.g = line11Cols.g || additions.line11
  columns.line11 = line11Cols

  const line12Cols = initColumns('line12', additions.line12)
  if ('g' in line12Cols) line12Cols.g = additions.line12
  columns.line12 = line12Cols

  const line13Cols = initColumns('line13', additions.line13)
  if ('g' in line13Cols) line13Cols.g = additions.line13
  columns.line13 = line13Cols

  // Removal lines 14–20 (purpose-classified)
  const removalLines = {
    line14: initColumns('line14', 0),
    line15: initColumns('line15', 0),
    line16: initColumns('line16', 0),
    line17: initColumns('line17', 0),
    line18: initColumns('line18', 0),
    line19: initColumns('line19', 0),
    line20: initColumns('line20', 0)
  }
  const removalEntries = beerEntries.filter(e => e.type === 'CONSUME')
  for (const entry of removalEntries) {
    const lineKey = classifyRemovalEntry(entry)
    if (!lineKey || !removalLines[lineKey]) continue
    const allowed = LINE_COLUMN_MAP[lineKey] || []
    const qty = getQty(entry)
    const col = mapStageToColumn(getStageForEntry(entry, stageMap, false))
    addToColumns(removalLines[lineKey], allowed, col, qty)
    removalLines[lineKey].a += qty
  }
  for (const key of Object.keys(removalLines)) {
    removalLines[key].a = removals[key]
    if ('g' in removalLines[key]) {
      removalLines[key].g = removalLines[key].g || removals[key]
    }
  }
  Object.assign(columns, removalLines)

  const line21Entries = removalEntries.filter(entry => {
    const note = (entry.note || '').toLowerCase()
    const onPremisesNote = note.includes('premises') || note.includes('on-site')
    if (entry.removal_purpose === 'serving' || entry.removal_purpose === 'on_premise') return true
    return entry.removal_purpose === 'consumption' && (onPremisesNote)
  })
  // Line 21 columns: use consumption_form (cellar→b, keg→d, case→f) when present, else location stage
  const getStageForLine21 = (entry) => {
    const cf = (entry.data && entry.data.consumption_form) || entry.consumption_form
    if (cf === 'cellar') return 'cellar'
    if (cf === 'keg') return 'racking_keg'
    if (cf === 'case') return 'case'
    return getStage(entry.location_id)
  }
  const line21Cols = aggregateByStage('line21', line21Entries, getStageForLine21, getQty)
  line21Cols.a = removals.line21
  if ('g' in line21Cols) line21Cols.g = line21Cols.g || removals.line21
  columns.line21 = line21Cols

  const line22Entries = beerEntries.filter(e => e.type === 'TRANSFER_OUT' && (e.operation_type === 'racking' || (e.data || {}).operation_type === 'racking'))
  const line22Cols = aggregateByStage('line22', line22Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line22Cols.a = removals.line22
  if ('g' in line22Cols) line22Cols.g = line22Cols.g || removals.line22
  columns.line22 = line22Cols

  const line23Entries = beerEntries.filter(e => {
    if (e.type !== 'TRANSFER_OUT') return false
    if (e.operation_type === 'bottling' || (e.data || {}).operation_type === 'bottling') return true
    const note = (e.note || '').toLowerCase()
    return note.includes('bottling')
  })
  const line23Cols = aggregateByStage('line23', line23Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line23Cols.a = removals.line23
  if ('g' in line23Cols) line23Cols.g = line23Cols.g || removals.line23
  columns.line23 = line23Cols

  const line24Entries = beerEntries.filter(e => {
    if (e.type !== 'TRANSFER_IN') return false
    if (e.operation_type === 'racking' || (e.data || {}).operation_type === 'racking') return false
    const note = (e.note || '').toLowerCase()
    return note.includes('return') || note.includes('cellar')
  })
  const line24Cols = aggregateByStage('line24', line24Entries, e => getStageForEntry(e, stageMap, true), getQty)
  line24Cols.a = removals.line24
  if ('g' in line24Cols) line24Cols.g = line24Cols.g || removals.line24
  columns.line24 = line24Cols

  columns.line25 = initColumns('line25', removals.line25)
  if ('g' in columns.line25) columns.line25.g = removals.line25
  columns.line26 = initColumns('line26', removals.line26)
  if ('g' in columns.line26) columns.line26.g = removals.line26

  const line27Entries = removalEntries.filter(entry => {
    const note = (entry.note || '').toLowerCase()
    return entry.removal_purpose === 'sample' || note.includes('sample') || note.includes('lab')
  })
  const line27Cols = aggregateByStage('line27', line27Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line27Cols.a = removals.line27
  if ('g' in line27Cols) line27Cols.g = line27Cols.g || removals.line27
  columns.line27 = line27Cols

  const line28Entries = removalEntries.filter(entry => {
    const note = (entry.note || '').toLowerCase()
    return entry.removal_purpose === 'destruction' ||
      entry.removal_purpose === 'unfit' ||
      note.includes('destroy') ||
      note.includes('dispose')
  })
  const line28Cols = aggregateByStage('line28', line28Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line28Cols.a = removals.line28
  if ('g' in line28Cols) line28Cols.g = line28Cols.g || removals.line28
  columns.line28 = line28Cols

  const line29Entries = removalEntries.filter(entry => entry.removal_purpose === 'dsp_transfer')
  const line29Cols = aggregateByStage('line29', line29Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line29Cols.a = removals.line29
  if ('g' in line29Cols) line29Cols.g = line29Cols.g || removals.line29
  columns.line29 = line29Cols

  const line30Entries = removalEntries.filter(entry => {
    const purpose = entry.removal_purpose || ''
    const note = (entry.note || '').toLowerCase()
    return purpose === 'loss_theft' || (!purpose && (note.includes('loss') || note.includes('theft')))
  })
  const line30Cols = aggregateByStage('line30', line30Entries, e => getStageForEntry(e, stageMap, false), getQty)
  line30Cols.a = removals.line30
  if ('g' in line30Cols) line30Cols.g = line30Cols.g || removals.line30
  columns.line30 = line30Cols

  const line31Cols = aggregateByStage(
    'line31',
    varianceEvents.filter(v => v.variance_type === 'shortage' && !v.loss_type),
    v => getStage(v.location_id),
    v => beerQuantityBarrels({ quantity: Math.abs(v.delta_qty) }, map.get(v.item_id))
  )
  line31Cols.a = removals.line31
  if ('g' in line31Cols) line31Cols.g = line31Cols.g || removals.line31
  columns.line31 = line31Cols

  return columns
}

export const TTBFormService = {
  /**
   * Generate TTB Form 5130.9 data for a given period
   * @param {Object} params - Period parameters
   * @param {string} params.reportType - 'monthly' or 'quarterly'
   * @param {number} params.year - Year
   * @param {number} params.period - Month (1-12) or Quarter (1-4)
   * @param {string} params.periodStart - ISO date string
   * @param {string} params.periodEnd - ISO date string
   * @returns {Promise<Object>} Form data object
   */
  async generateForm(params) {
    const { periodStart, periodEnd } = params
    const itemMap = await getBeerItemsMap()

    // Calculate all additions
    const line1 = await calculateBeginningInventory(periodStart, itemMap)
    const line2 = await calculateBeerProduced(periodStart, periodEnd, itemMap)
    const line3 = await calculateWaterAdditions(periodStart, periodEnd)
    const line4 = await calculateBeerReceivedFromRackingBottling(periodStart, periodEnd, itemMap)
    const line5 = await calculateBeerReceivedInBond(periodStart, periodEnd, itemMap)
    const line6 = await calculateBeerReceivedFromCellars(periodStart, periodEnd, itemMap)
    const line7 = await calculateBeerReturnedAfterRemoval(periodStart, periodEnd, itemMap)
    const line8 = await calculateBeerReturnedFromOtherBrewery(periodStart, periodEnd, itemMap)
    const line9 = await calculateBeerRacked(periodStart, periodEnd, itemMap)
    const line10 = await calculateBeerBottled(periodStart, periodEnd, itemMap)
    const line11 = await calculateInventoryOverage(periodStart, periodEnd, itemMap)
    const line12 = 0 // Blank line
    const line13 = line1 + line2 + line3 + line4 + line5 + line6 + line7 + line8 + line9 + line10 + line11 + line12

    // Calculate removals
    const removalsByPurpose = await calculateRemovalsByPurpose(periodStart, periodEnd, itemMap)
    const line21 = await calculateBeerConsumedOnPremises(periodStart, periodEnd, itemMap)
    const line22 = await calculateBeerTransferredForRacking(periodStart, periodEnd, itemMap)
    const line23 = await calculateBeerTransferredForBottling(periodStart, periodEnd, itemMap)
    const line24 = await calculateBeerReturnedToCellars(periodStart, periodEnd, itemMap)
    const line25 = await calculateBeerRackedRemoval(periodStart, periodEnd)
    const line26 = await calculateBeerBottledRemoval(periodStart, periodEnd)
    const line27 = await calculateLaboratorySamples(periodStart, periodEnd, itemMap)
    const line28 = await calculateBeerDestroyed(periodStart, periodEnd, itemMap)
    const line29 = await calculateBeerTransferredToDSP(periodStart, periodEnd, itemMap)
    const line30 = await calculateLosses(periodStart, periodEnd, itemMap)
    const line31 = await calculateInventoryShortage(periodStart, periodEnd, itemMap)
    const line32 = 0 // Blank line
    
    const totalRemovals = removalsByPurpose.line14 + removalsByPurpose.line15 + 
                         removalsByPurpose.line16 + removalsByPurpose.line17 + 
                         removalsByPurpose.line18 + removalsByPurpose.line19 + 
                         removalsByPurpose.line20 + line21 + line22 + line23 + 
                         line24 + line25 + line26 + line27 + line28 + line29 + 
                         line30 + line31 + line32
    
    const line33 = line13 - totalRemovals // Ending inventory
    const line34 = line13 // Total beer

    const line1ByStage = await getBeerOnhandByStage(periodStart, { inclusiveEnd: false })
    const line33ByStage = await getBeerOnhandByStage(periodEnd, { inclusiveEnd: true })

    const totals = {
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
        line13
      },
      removals: {
        ...removalsByPurpose,
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
        line34
      }
    }

    const columnsByLine = await buildColumnsByLine({
      periodStart,
      periodEnd,
      totals,
      line1Stage: line1ByStage,
      line33Stage: line33ByStage,
      itemMap
    })

    return {
      header: {
        reportType: params.reportType,
        year: params.year,
        period: params.period,
        periodStart: params.periodStart,
        periodEnd: params.periodEnd
      },
      additions: totals.additions,
      removals: totals.removals,
      cerealBeverages: {
        line1: 0, // Produced (not tracked yet)
        line2: 0, // Removed (not tracked yet)
        line3: 0, // Received (not tracked yet)
        line4: 0, // Loss and wastage (not tracked yet)
        line5: 0, // (Blank)
        line6: 0  // Total on hand end of period (not tracked yet)
      },
      remarks: '',
      columnsByLine
    }
  },

  /**
   * Detect data gaps for a given period
   * @param {string} periodStart - ISO date string
   * @param {string} periodEnd - ISO date string
   * @returns {Promise<Object>} Object with gaps array and warnings array
   */
  async detectDataGaps(periodStart, periodEnd) {
    const gaps = []
    const warnings = []

    const stageMap = await getLocationStageMap()

    // Check beer items exist (required for TTB form calculations)
    const beerItemIds = await getBeerItemIds()
    if (beerItemIds.size === 0) {
      gaps.push('No beer items (Finished Beer) found. Sync or run the TTB beer category migration to add the Finished Beer item for TTB reporting.')
    }

    // Check brewery info (critical gaps)
    try {
      const breweryInfo = await BreweryInfoService.getBreweryInfo()
      
      if (!breweryInfo.brewery_name || !String(breweryInfo.brewery_name).trim()) {
        gaps.push('Brewery name is missing (required for form submission; set in Settings or at registration)')
      }
      if (!breweryInfo.ttb_brewery_number) {
        gaps.push('TTB Brewery Number is missing (required for form submission)')
      }
      if (!breweryInfo.brewery_ein) {
        warnings.push('Brewery EIN is missing (recommended for form submission)')
      }
      if (!breweryInfo.brewery_address_street || !breweryInfo.brewery_address_city ||
          !breweryInfo.brewery_address_county || !breweryInfo.brewery_address_state ||
          !breweryInfo.brewery_address_zip) {
        gaps.push('Brewery address is incomplete (street, city, county, state, and ZIP required for form submission)')
      }
      if (!breweryInfo.brewery_phone) {
        warnings.push('Brewery phone number is missing (recommended for form submission)')
      }
    } catch (error) {
      gaps.push('Unable to verify brewery information')
    }
    
    const beerEntriesAll = await getBeerLedgerEntriesForPeriod(periodStart, periodEnd)

    const stageValues = Array.from(stageMap.values())
    if (beerEntriesAll.length > 0 && stageValues.length > 0 && stageValues.every(v => v === 'cellar')) {
      warnings.push('All locations use the default TTB stage (cellar). Set stages (keg/bottling/case) to populate columns b–f.')
    }

    const entries = beerEntriesAll.filter(e => e.type === 'CONSUME')
    const unclassified = entries.filter(e => !e.removal_purpose)
    if (unclassified.length > 0) {
      warnings.push(`${unclassified.length} beer removal(s) without classification - may affect accuracy`)
    }
    
    const transfers = beerEntriesAll.filter(e => e.type === 'TRANSFER_OUT')
    const unclassifiedTransfers = transfers.filter(e => !e.operation_type &&
      !e.note?.toLowerCase().includes('racking') &&
      !e.note?.toLowerCase().includes('bottling'))
    if (unclassifiedTransfers.length > 0) {
      warnings.push(`${unclassifiedTransfers.length} beer transfer(s) without operation type classification`)
    }

    const entriesMissingLocation = beerEntriesAll.filter(e => !e.location_id)
    if (entriesMissingLocation.length > 0) {
      warnings.push(`${entriesMissingLocation.length} beer ledger entr${entriesMissingLocation.length === 1 ? 'y has' : 'ies have'} no location; column breakdowns will exclude them.`)
    }
    
    // Check for production data (Line 2 = RECEIVE with data.source === 'production_complete', beer items only)
    const orgId = await getOrgId()
    if (orgId && beerItemIds.size > 0) {
      const productionReceives = beerEntriesAll.filter(e => e.type === 'RECEIVE' && (e.data || {}).source === 'production_complete')
      if (productionReceives.length === 0) {
        warnings.push('No production complete RECEIVE entries found for this period (Line 2 may be zero)')
      }
    }

    const inBondReceives = beerEntriesAll.filter(e => e.type === 'RECEIVE' && (e.operation_type === 'in_bond' || (e.data || {}).in_bond === true || e.removal_purpose === 'in_bond_receive'))
    if (inBondReceives.length === 0) {
      warnings.push('No in-bond receipts recorded for this period (Line 5 will be zero).')
    }
    
    // Check for variance events without classification
    if (orgId) {
      const variances = await db.variance_events
        .where('org_id').equals(orgId)
        .toArray()
      
      const periodVariances = variances.filter(v => {
        const createdAt = v.created_at || v.occurred_at
        return createdAt >= periodStart && createdAt <= periodEnd
      })
      
      const unclassifiedVariances = periodVariances.filter(v => !v.variance_type)
      if (unclassifiedVariances.length > 0) {
        warnings.push(`${unclassifiedVariances.length} variance event(s) without classification`)
      }
    }
    
    // Check for packaging runs without volume data
    if (orgId) {
      const packagingRuns = await db.packaging_runs
        .where('org_id').equals(orgId)
        .toArray()
      
      const periodRuns = packagingRuns.filter(r => {
        const packagedAt = r.packaged_at || r.created_at
        return packagedAt >= periodStart && packagedAt <= periodEnd
      })
      
      const runsWithoutVolume = periodRuns.filter(r => {
        const data = r.data || {}
        return !data.volume_bottled && (!r.units_count || r.units_count === 0)
      })
      
      if (runsWithoutVolume.length > 0) {
        warnings.push(`${runsWithoutVolume.length} packaging run(s) without volume data`)
      }
    }
    
    return {
      gaps, // Critical issues that prevent form generation
      warnings, // Non-critical issues that may affect accuracy
      canGenerate: gaps.length === 0 // Can generate form if no critical gaps
    }
  },

  /**
   * Validate form data before generation
   * @param {Object} formData - Generated form data
   * @returns {Object} Validation result with isValid flag and errors array
   */
  validateFormData(formData) {
    const errors = []
    const warnings = []
    if (!formData || !formData.additions || !formData.removals) {
      errors.push('Form data is missing additions or removals')
      return { isValid: false, errors, warnings }
    }

    const add = (key) => Number(formData.additions[key]) || 0
    const rem = (key) => Number(formData.removals[key]) || 0

    // Validate additions total
    const additionsTotal = add('line13')
    const calculatedTotal = add('line1') + add('line2') + add('line3') + add('line4') +
                           add('line5') + add('line6') + add('line7') + add('line8') +
                           add('line9') + add('line10') + add('line11') + add('line12')

    if (Math.abs(additionsTotal - calculatedTotal) > 0.01) {
      errors.push(`Additions total (Line 13) doesn't match sum of lines 1-12. Expected ${calculatedTotal.toFixed(2)}, got ${additionsTotal.toFixed(2)}`)
    }

    // Validate removals total
    const removalsTotal = rem('line14') + rem('line15') + rem('line16') + rem('line17') +
                        rem('line18') + rem('line19') + rem('line20') + rem('line21') +
                        rem('line22') + rem('line23') + rem('line24') + rem('line25') +
                        rem('line26') + rem('line27') + rem('line28') + rem('line29') +
                        rem('line30') + rem('line31') + rem('line32')

    // Validate ending inventory
    const calculatedEnding = additionsTotal - removalsTotal
    const line33 = rem('line33')
    if (Math.abs(line33 - calculatedEnding) > 0.01) {
      errors.push(`Ending inventory (Line 33) doesn't match calculation. Expected ${calculatedEnding.toFixed(2)}, got ${line33.toFixed(2)}`)
    }

    // Validate total beer
    if (Math.abs(rem('line34') - additionsTotal) > 0.01) {
      errors.push('Total beer (Line 34) should equal additions total (Line 13)')
    }

    // Reconciliation: Line 33 columns vs total
    const line33Columns = formData.columnsByLine?.line33
    if (line33Columns) {
      const columnSum = Number(line33Columns.b || 0) + Number(line33Columns.c || 0) +
        Number(line33Columns.d || 0) + Number(line33Columns.e || 0) + Number(line33Columns.f || 0)
      if (Math.abs(columnSum - line33) > 0.01) {
        warnings.push('Ending inventory columns (33b–33f) do not sum to Line 33 total. Check location stages and location assignments.')
      }
    }

    // Check for negative values (shouldn't happen)
    for (const [key, value] of Object.entries(formData.additions)) {
      const v = Number(value)
      if (!Number.isNaN(v) && v < 0) {
        warnings.push(`Negative value detected in additions ${key}: ${value}`)
      }
    }
    for (const [key, value] of Object.entries(formData.removals)) {
      if (key === 'line33') continue
      const v = Number(value)
      if (!Number.isNaN(v) && v < 0) {
        warnings.push(`Negative value detected in removals ${key}: ${value}`)
      }
    }

    // Check for suspiciously large values
    if (add('line2') > 10000) {
      warnings.push('Beer produced (Line 2) seems unusually large - please verify')
    }
    if (rem('line30') > 1000) {
      warnings.push('Losses (Line 30) seem unusually large - please verify')
    }
    if (line33 < 0) {
      warnings.push('Ending inventory (Line 33) is negative - check for missing removals or data errors')
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
}
