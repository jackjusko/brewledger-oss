import { LocationRepository } from '../repositories/LocationRepository';
import { ItemRepository } from '../repositories/ItemRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';

export async function seedData() {
  const locations = await LocationRepository.getAll();
  if (locations.length > 0) return; // Already seeded

  console.log('Seeding data...');

  // Locations
  const locGrain = await LocationRepository.create({ name: 'Grain Room' });
  const locWalkIn = await LocationRepository.create({ name: 'Walk-in' });
  const locChem = await LocationRepository.create({ name: 'Chem Cabinet' });

  // Items
  const itemMalt = await ItemRepository.create({ 
    name: '2-row malt', 
    category: 'malt', 
    unit: 'lb', 
    default_location_id: locGrain.id, 
    reorder_threshold: 200 
  });
  
  const itemHops = await ItemRepository.create({ 
    name: 'Citra hops', 
    category: 'hops', 
    unit: 'lb', 
    default_location_id: locWalkIn.id, 
    reorder_threshold: 10 
  });
  
  const itemYeast = await ItemRepository.create({ 
    name: 'US-05 yeast', 
    category: 'yeast', 
    unit: 'each', 
    default_location_id: locWalkIn.id, 
    reorder_threshold: 5 
  });
  
  // Removed Packaging items

  // Initial Receives
  await LedgerRepository.addEntry({
    type: 'RECEIVE',
    item_id: itemMalt.id,
    location_id: locGrain.id,
    quantity: 1100, // One pallet
    note: 'Initial seed inventory'
  });

  await LedgerRepository.addEntry({
    type: 'RECEIVE',
    item_id: itemHops.id,
    location_id: locWalkIn.id,
    quantity: 44, 
    note: 'Initial seed inventory'
  });
  
  await LedgerRepository.addEntry({
    type: 'RECEIVE',
    item_id: itemYeast.id,
    location_id: locWalkIn.id,
    quantity: 20, 
    note: 'Initial seed inventory'
  });

  console.log('Seeding complete.');
}
