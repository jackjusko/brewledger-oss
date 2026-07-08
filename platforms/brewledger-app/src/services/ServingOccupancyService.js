/**
 * Resolves which Finished Beer item (if any) occupies a serving location,
 * based on ledger on-hand. Enforces "one beer item per serving location" by
 * detecting multiple items with on-hand at the same location (conflict).
 */
import { ItemRepository } from '../repositories/ItemRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';

/**
 * Get the current beer item and on-hand at a location.
 * @param {string} locationId - Location ID (e.g. serving tank location)
 * @returns {Promise<{ item: object, onHand: number }|{ conflict: true, items: Array<{ item: object, onHand: number }> }|{ empty: true }>}
 */
export async function getCurrentBeerAtLocation(locationId) {
  if (!locationId) return { empty: true };
  const beerItems = await ItemRepository.getBeerItems();
  if (!beerItems.length) return { empty: true };

  const withOnHand = [];
  for (const item of beerItems) {
    const onHand = await LedgerRepository.getOnhand(item.id, locationId);
    if (onHand > 0) withOnHand.push({ item, onHand });
  }

  if (withOnHand.length === 0) return { empty: true };
  if (withOnHand.length > 1) return { conflict: true, items: withOnHand };
  return { item: withOnHand[0].item, onHand: withOnHand[0].onHand };
}

/**
 * Resolve the single beer item to use for ledger actions at this location.
 * @param {string} locationId
 * @returns {Promise<{ item: object, onHand: number }|null>}
 */
export async function getBeerItemForServingLocation(locationId) {
  const result = await getCurrentBeerAtLocation(locationId);
  if (result.empty || result.conflict) return null;
  return { item: result.item, onHand: result.onHand };
}
