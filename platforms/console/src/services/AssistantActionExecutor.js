import { ItemRepository } from '../repositories/ItemRepository';
import { LocationRepository } from '../repositories/LocationRepository';
import { LedgerRepository } from '../repositories/LedgerRepository';
import { ParLevelRepository } from '../repositories/ParLevelRepository';
import { BatchRepository } from '../repositories/BatchRepository';
import { BatchLocationRepository } from '../repositories/BatchLocationRepository';
import { BatchReadingRepository } from '../repositories/BatchReadingRepository';
import { BatchVolumeAdjustmentRepository } from '../repositories/BatchVolumeAdjustmentRepository';
import { BatchAdditionRepository } from '../repositories/BatchAdditionRepository';
import { CountSessionRepository } from '../repositories/CountSessionRepository';
import { PackagingRunRepository } from '../repositories/PackagingRunRepository';
import { SyncService } from './SyncService';
import { VesselRepository } from '../repositories/VesselRepository';
import { RecipeRepository } from '../repositories/RecipeRepository';
import { LOCATION_STAGES } from '../repositories/LocationRepository';

/**
 * Resolves names/ids into concrete records with best-effort fuzzy matching.
 */
const resolveByName = (list, name) => {
  if (!name) return null;
  const target = name.trim().toLowerCase();
  return (
    list.find(i => i.name?.toLowerCase() === target) ||
    list.find(i => i.name?.toLowerCase().includes(target))
  );
};

const resolveItem = async ({ itemId, itemName }) => {
  if (itemId) {
    const byId = await ItemRepository.getById(itemId);
    if (byId) return byId;
  }
  const items = await ItemRepository.getAll();
  return resolveByName(items, itemName);
};

const ensureItem = async ({ itemId, itemName }) => {
  const existing = await resolveItem({ itemId, itemName });
  return existing || null;
};

const normalizeParams = (raw = {}) => {
  const p = { ...raw };
  // Common aliases from model output
  p.itemName = p.itemName || p.item_name || p.item || p.itemname;
  p.locationName = p.locationName || p.location_name || p.location || p.loc || p.locationname;
  p.fromLocationName = p.fromLocationName || p.from_location || p.from_location_name;
  p.toLocationName = p.toLocationName || p.to_location || p.to_location_name;
  p.batchName = p.batchName || p.batch_name || p.batch;
  p.batchLocationName = p.batchLocationName || p.batch_location_name || p.vessel || p.vesselName || p.vessel_name;
  p.destinationVesselName = p.destinationVesselName || p.destination_vessel_name;
  p.destinationBatchLocationName = p.destinationBatchLocationName || p.destination_batch_location_name;
  p.sourceBatchLocationName = p.sourceBatchLocationName || p.source_batch_location_name;
  p.transactionType = p.transactionType || p.transaction_type;
  if (p.quantity == null && p.qty != null) p.quantity = p.qty;
  return p;
};

const mapLocations = (list = [], limit = 6) =>
  (list || [])
    .filter(Boolean)
    .slice(0, limit)
    .map(l => ({ id: l.id, name: l.name }));

const mapVessels = (list = [], limit = 6) =>
  (list || [])
    .filter(Boolean)
    .slice(0, limit)
    .map(v => ({ id: v.id, name: v.name }));

const mapRecipes = (list = [], limit = 6) =>
  (list || [])
    .filter(Boolean)
    .slice(0, limit)
    .map(r => ({ id: r.id, name: r.name }));

const mapBatches = (list = [], limit = 6) =>
  (list || [])
    .filter(Boolean)
    .sort((a, b) => (b.batch_date || '').localeCompare(a.batch_date || ''))
    .slice(0, limit)
    .map(b => ({ id: b.id, name: b.name || b.id }));

const mapItems = (list = [], limit = 8) =>
  (list || [])
    .filter(Boolean)
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .slice(0, limit)
    .map(i => ({ id: i.id, name: i.name }));

const mapBatchLocations = (list = [], limit = 8) =>
  (list || [])
    .filter(Boolean)
    .slice(0, limit)
    .map(bl => ({ id: bl.id, name: bl.name || bl.vessel_id || bl.id, vessel_id: bl.vessel_id }));

const mapStages = () => LOCATION_STAGES.map(stage => ({ id: stage, name: stage }));

const resolveLocation = async ({ locationId, locationName }) => {
  if (locationId) {
    const byId = await LocationRepository.getById(locationId);
    if (byId) return byId;
  }
  const locations = await LocationRepository.getAll();
  return resolveByName(locations, locationName);
};

const resolveBatch = async ({ batchId, batchName }) => {
  if (batchId) {
    const byId = await BatchRepository.getById(batchId);
    if (byId) return byId;
  }
  const batches = await BatchRepository.getAll();
  return resolveByName(batches, batchName);
};

const resolveBatchLocation = async ({ batchLocationId, batchLocationName, batchId }) => {
  if (batchLocationId) {
    const byId = await BatchLocationRepository.getById(batchLocationId);
    if (byId) return byId;
  }
  let locations = [];
  if (batchId) {
    locations = await BatchLocationRepository.getByBatchId(batchId);
  } else {
    const batches = await BatchRepository.getAll();
    const ids = batches.map(b => b.id);
    locations = await BatchLocationRepository.getByBatchIds(ids);
  }
  if (!locations) return null;
  const byName = resolveByName(locations, batchLocationName);
  return byName || locations[0];
};

const resolveVessel = async ({ vesselId, vesselName }) => {
  if (vesselId) {
    const byId = await VesselRepository.getById(vesselId);
    if (byId) return byId;
  }
  const vessels = await VesselRepository.getAll();
  return resolveByName(vessels, vesselName);
};

const resolveRecipe = async ({ recipeId, recipeName }) => {
  if (recipeId) {
    const byId = await RecipeRepository.getById(recipeId);
    if (byId) return byId;
  }
  const recipes = await RecipeRepository.getAll();
  return resolveByName(recipes, recipeName);
};

const guardSync = async () => {
  // Start a sync in the background when we enqueue pending records.
  try {
    await SyncService.sync();
  } catch (e) {
    console.warn('Assistant sync guard failed', e);
  }
};

export const AssistantActionExecutor = {
  supportedIntents: [
    'set_par_level',
    'adjust_onhand',
    'transfer_inventory',
    'record_batch_reading',
    'adjust_batch_volume',
    'forecast_item',
    'update_batch_status',
    'transfer_split',
    'combine_splits',
    'create_batch_from_recipe',
    'add_batch_addition',
    'create_item',
    'create_location',
    'start_count_session',
    'close_count_session',
    'create_packaging_run',
  ],

  /**
   * Execute an action payload produced by the assistant.
   * @param {{intent: string, params?: object, summary?: string, title?: string}} action
   * @returns {Promise<{status: 'success'|'error'|'info', message: string, data?: any}>}
   */
  async execute(action) {
    if (!action || !action.intent) {
      return { status: 'error', message: 'Invalid action payload.' };
    }

    const intent = action.intent;
    const params = normalizeParams(action.params || {});

    switch (intent) {
      case 'set_par_level':
        return await this.handleSetParLevel(params);
      case 'adjust_onhand':
        return await this.handleAdjustOnhand(params);
      case 'record_batch_reading':
        return await this.handleRecordBatchReading(params);
      case 'adjust_batch_volume':
        return await this.handleAdjustBatchVolume(params);
      case 'forecast_item':
        return await this.handleForecastItem(params);
      case 'transfer_inventory':
        return await this.handleTransferInventory(params);
      case 'update_batch_status':
        return await this.handleUpdateBatchStatus(params);
      case 'transfer_split':
        return await this.handleTransferSplit(params);
      case 'combine_splits':
        return await this.handleCombineSplits(params);
      case 'create_batch_from_recipe':
        return await this.handleCreateBatchFromRecipe(params);
      case 'add_batch_addition':
        return await this.handleAddBatchAddition(params);
      case 'create_item':
        return await this.handleCreateItem(params);
      case 'create_location':
        return await this.handleCreateLocation(params);
      case 'start_count_session':
        return await this.handleStartCountSession(params);
      case 'close_count_session':
        return await this.handleCloseCountSession(params);
      case 'create_packaging_run':
        return await this.handleCreatePackagingRun(params);
      default:
        return { status: 'error', message: `Unsupported intent: ${intent}` };
    }
  },

  async handleSetParLevel(params) {
    const { itemId, itemName, locationId, locationName, minQty, maxQty, scope } = params;
    const item = await resolveItem({ itemId, itemName });
    if (!item) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item', message: 'Select an item for par level.', items: mapItems(items) };
    }

    const numericMin = Number(minQty);
    const numericMax = maxQty != null ? Number(maxQty) : null;
    if (Number.isNaN(numericMin)) return { status: 'error', message: 'Par level min quantity is required.' };

    const isGlobal = scope === 'global' || locationId == null && !locationName;
    let location = null;
    if (!isGlobal) {
      location = await resolveLocation({ locationId, locationName });
      if (!location) {
        const locs = await LocationRepository.getAll();
        const options = [{ id: null, name: 'Global (all locations)' }, ...mapLocations(locs)];
        return { status: 'need_location', message: 'Select a location or global.', options };
      }
    }

    if (isGlobal) {
      await ParLevelRepository.setGlobalParLevel(item.id, numericMin, numericMax);
    } else {
      await ParLevelRepository.setParLevel(item.id, location.id, numericMin, numericMax);
    }
    await guardSync();
    return {
      status: 'success',
      message: `Par level updated${isGlobal ? ' (global)' : ''} for ${item.name}${location ? ` @ ${location.name}` : ''}.`,
    };
  },

  async handleAdjustOnhand(params) {
    const { itemId, itemName, locationId, locationName, quantity, note, type, category, transactionType } = params;
    const item = await ensureItem({ itemId, itemName, category });
    if (!item) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item', message: 'Select an item to adjust.', items: mapItems(items) };
    }

    const location = await resolveLocation({ locationId, locationName });
    if (!location) {
      const locs = await LocationRepository.getAll();
      return {
        status: 'need_location',
        message: 'Select a location for this adjustment.',
        options: mapLocations(locs),
      };
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty === 0) {
      return { status: 'error', message: 'Quantity must be a non-zero number.' };
    }

    const entryType = transactionType || type || (qty > 0 ? 'RECEIVE' : 'CONSUME');
    await LedgerRepository.addEntry({
      type: entryType,
      item_id: item.id,
      location_id: location.id,
      quantity: qty,
      note: note || 'Assistant adjustment',
    });
    await guardSync();
    return {
      status: 'success',
      message: `On-hand adjusted by ${qty} for ${item.name} @ ${location.name}.`,
    };
  },

  async handleTransferInventory(params) {
    const { itemId, itemName, fromLocationId, fromLocationName, toLocationId, toLocationName, quantity, note, batchId, batchName } = params;
    const item = await ensureItem({ itemId, itemName });
    if (!item) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item', message: 'Select an item to transfer.', items: mapItems(items) };
    }

    const fromLoc = await resolveLocation({ locationId: fromLocationId, locationName: fromLocationName });
    const toLoc = await resolveLocation({ locationId: toLocationId, locationName: toLocationName });
    if (!fromLoc || !toLoc) {
      const locs = await LocationRepository.getAll();
      return {
        status: 'need_location',
        message: 'Select source and destination locations.',
        fromOptions: fromLoc ? undefined : mapLocations(locs),
        toOptions: toLoc ? undefined : mapLocations(locs),
      };
    }

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) {
      return { status: 'error', message: 'Quantity must be a positive number.' };
    }

    const batch = await resolveBatch({ batchId, batchName });

    await LedgerRepository.transfer({
      itemId: item.id,
      fromLocationId: fromLoc.id,
      toLocationId: toLoc.id,
      quantity: qty,
      note: note || 'Assistant transfer',
      batchId: batch ? batch.id : undefined,
    });
    await guardSync();
    return {
      status: 'success',
      message: `Transferred ${qty} of ${item.name} from ${fromLoc.name} to ${toLoc.name}.`,
    };
  },

  async handleRecordBatchReading(params) {
    const { batchId, batchName, batchLocationId, batchLocationName, gravity, temperature, ph, volume } = params;
    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }

    let batchLocation = null;
    if (batchLocationId || batchLocationName) {
      batchLocation = await resolveBatchLocation({ batchLocationId, batchLocationName, batchId: batch.id });
    }
    if (!batchLocation) {
      const vessels = await VesselRepository.getAll();
      return { status: 'need_vessel', message: 'Select a vessel/split for the reading.', vessels: mapVessels(vessels) };
    }

    const reading = {
      batch_id: batch.id,
      batch_location_id: batchLocation.id,
      gravity: gravity != null ? Number(gravity) : null,
      temperature: temperature != null ? Number(temperature) : null,
      ph: ph != null ? Number(ph) : null,
      volume: volume != null ? Number(volume) : null,
    };

    await BatchReadingRepository.add(reading);
    await guardSync();
    return {
      status: 'success',
      message: `Reading logged for ${batch.name}${batchLocation ? ` (${batchLocation.name})` : ''}.`,
      data: reading,
    };
  },

  async handleAdjustBatchVolume(params) {
    const { batchLocationId, batchLocationName, batchId, volumeChange, reason } = params;
    const batch = await resolveBatch({ batchId, batchName: null });
    if (!batch && !batchId) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }
    const batchLocation = await resolveBatchLocation({ batchLocationId, batchLocationName, batchId: batch ? batch.id : batchId });
    if (!batchLocation) {
      const vessels = await VesselRepository.getAll();
      return { status: 'need_vessel', message: 'Select a vessel/split for volume adjustment.', vessels: mapVessels(vessels) };
    }

    const delta = Number(volumeChange);
    if (Number.isNaN(delta) || delta === 0) {
      return { status: 'error', message: 'Volume change must be a non-zero number.' };
    }

    await BatchVolumeAdjustmentRepository.create({
      batch_location_id: batchLocation.id,
      volume_change: delta,
      reason: reason || 'Assistant volume adjustment',
    });
    await guardSync();
    return {
      status: 'success',
      message: `Volume adjusted by ${delta} for ${batchLocation.name}.`,
    };
  },

  async handleUpdateBatchStatus(params) {
    const { batchId, batchName, status, timestampField } = params;
    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }
    if (!status) return { status: 'error', message: 'Status is required.' };
    await BatchRepository.updateStatus(batch.id, status, timestampField);
    await guardSync();
    return { status: 'success', message: `Batch ${batch.name} set to ${status}.` };
  },

  async handleTransferSplit(params) {
    const { batchId, batchName, sourceBatchLocationId, sourceBatchLocationName, destinations = [] } = params;
    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }
    const source = await resolveBatchLocation({ batchLocationId: sourceBatchLocationId, batchLocationName: sourceBatchLocationName, batchId: batch.id });
    if (!source) {
      const locs = await BatchLocationRepository.getByBatchId(batch.id);
      return { status: 'need_source', message: 'Select a source vessel/split.', sources: mapBatchLocations(locs) };
    }
    if (!destinations.length) {
      const locs = await BatchLocationRepository.getByBatchId(batch.id);
      return { status: 'need_destination', message: 'Select a destination vessel/split.', destinations: mapBatchLocations(locs) };
    }

    const resolvedDests = [];
    for (const d of destinations) {
      if (d.batchLocationId) {
        resolvedDests.push({ batch_location_id: d.batchLocationId, volume: d.volume });
      } else if (d.batchLocationName) {
        const target = await resolveBatchLocation({ batchLocationName: d.batchLocationName, batchId: batch.id });
        if (target) resolvedDests.push({ batch_location_id: target.id, volume: d.volume });
      } else if (d.vesselId || d.vesselName) {
        const vessel = await resolveVessel({ vesselId: d.vesselId, vesselName: d.vesselName });
        if (vessel) resolvedDests.push({ vessel_id: vessel.id, volume: d.volume });
      }
    }

    if (!resolvedDests.length) return { status: 'error', message: 'No valid destinations resolved.' };

    await BatchLocationRepository.transferSplit({
      sourceBatchLocationId: source.id,
      destinations: resolvedDests,
    });
    await guardSync();
    return { status: 'success', message: `Transferred volume from ${source.name || source.id} to ${resolvedDests.length} destination(s).` };
  },

  async handleCombineSplits(params) {
    const { batchId, batchName, sourceBatchLocationIds = [], destinationBatchLocationId, destinationBatchLocationName, destinationVesselId, destinationVesselName, destinationVolume } = params;
    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }
    if (!sourceBatchLocationIds.length) {
      const locs = await BatchLocationRepository.getByBatchId(batch.id);
      return { status: 'need_source', message: 'Select source splits.', sources: mapBatchLocations(locs) };
    }

    let destBatchLocationId = destinationBatchLocationId;
    if (!destBatchLocationId && destinationBatchLocationName) {
      const dest = await resolveBatchLocation({ batchLocationName: destinationBatchLocationName, batchId: batch.id });
      destBatchLocationId = dest?.id;
    }
    let destVesselId = destinationVesselId;
    if (!destBatchLocationId && !destVesselId && destinationVesselName) {
      const vessel = await resolveVessel({ vesselName: destinationVesselName });
      destVesselId = vessel?.id;
    }

    if (!destBatchLocationId && !destVesselId) {
      const locs = await BatchLocationRepository.getByBatchId(batch.id);
      return { status: 'need_destination', message: 'Select a destination split or vessel.', destinations: mapBatchLocations(locs), vessels: mapVessels(await VesselRepository.getAll()) };
    }

    await BatchLocationRepository.combineSplits({
      sourceBatchLocationIds,
      destinationVesselId: destVesselId,
      destinationBatchLocationId: destBatchLocationId,
      destinationVolume,
    });
    await guardSync();
    return { status: 'success', message: `Combined ${sourceBatchLocationIds.length} splits into destination.` };
  },

  async handleCreateBatchFromRecipe(params) {
    const { recipeId, recipeName, vesselId, vesselName, plannedVolume, batchName } = params;
    const recipe = await resolveRecipe({ recipeId, recipeName });
    if (!recipe && recipeId !== null) {
      const recipes = await RecipeRepository.getAll();
      return {
        status: 'need_recipe',
        message: 'Select a recipe to start the batch.',
        recipes: mapRecipes(recipes),
      };
    }

    const vessel = await resolveVessel({ vesselId, vesselName });
    if (!vessel) {
      const vessels = await VesselRepository.getAll();
      return {
        status: 'need_vessel',
        message: 'Select a vessel for the batch.',
        vessels: mapVessels(vessels),
      };
    }

    const vol = plannedVolume != null ? Number(plannedVolume) : NaN;
    if (!vol || Number.isNaN(vol) || vol <= 0) {
      return { status: 'need_volume', message: 'Provide planned volume for the batch.' };
    }

    const name = batchName || `${recipe ? recipe.name : 'Batch'} ${new Date().toISOString().slice(0, 10)}`;
    await BatchRepository.create({
      name,
      batch_date: new Date().toISOString(),
      status: 'PLANNED',
      total_theoretical_volume: vol,
      splits: [
        {
          vessel_id: vessel.id,
          current_volume: vol,
        }
      ],
      recipe_id: recipe ? recipe.id : null,
    });
    await guardSync();
    return { status: 'success', message: `Batch "${name}" created in ${vessel.name}${recipe ? ` from ${recipe.name}` : ''}.` };
  },

  async handleCreateItem(params) {
    const { name, category, defaultUnitCost } = params;
    if (!name) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item_name', message: 'Provide an item name or pick an existing item.', items: mapItems(items) };
    }
    const cat = category || 'Other';
    const cost = defaultUnitCost != null ? Number(defaultUnitCost) : 0;
    const created = await ItemRepository.create({ name, category: cat, default_unit_cost: cost });
    await guardSync();
    return { status: 'success', message: `Item "${created.name}" created in ${cat}.` };
  },

  async handleCreateLocation(params) {
    const { name, stage } = params;
    if (!name) {
      return { status: 'need_location_name', message: 'Provide a location name.' };
    }
    const st = stage || LOCATION_STAGES[0];
    const created = await LocationRepository.create({ name, stage: st });
    await guardSync();
    return { status: 'success', message: `Location "${created.name}" created (stage: ${st}).` };
  },

  async handleStartCountSession(params) {
    const { locationId, locationName } = params;
    const location = await resolveLocation({ locationId, locationName });
    if (!location) {
      const locs = await LocationRepository.getAll();
      return { status: 'need_location', message: 'Select a location to start count.', options: mapLocations(locs) };
    }
    const open = await CountSessionRepository.getOpenSession(location.id);
    if (open) {
      return { status: 'info', message: `Count session already open for ${location.name}.` };
    }
    await CountSessionRepository.create({ location_id: location.id });
    await guardSync();
    return { status: 'success', message: `Started count session for ${location.name}.` };
  },

  async handleCloseCountSession(params) {
    const { locationId, locationName, sessionId, closedCounts = [] } = params;
    let session = null;
    if (sessionId) session = await CountSessionRepository.getById(sessionId);
    const location = await resolveLocation({ locationId, locationName });
    if (!session && location) session = await CountSessionRepository.getOpenSession(location.id);
    if (!session) {
      const locs = await LocationRepository.getAll();
      return { status: 'need_location', message: 'Select a location to close count.', options: mapLocations(locs) };
    }
    await CountSessionRepository.close(session.id, closedCounts);
    await guardSync();
    return { status: 'success', message: `Closed count session for ${location ? location.name : session.location_id}.` };
  },

  async handleCreatePackagingRun(params) {
    const { batchId, batchName, packagedVolume, packagedUnit, packagedAt, supplies = [] } = params;
    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch for packaging.', batches: mapBatches(batches) };
    }
    const vol = packagedVolume != null ? Number(packagedVolume) : NaN;
    if (!vol || Number.isNaN(vol) || vol <= 0) {
      return { status: 'need_packaging_volume', message: 'Provide packaged volume.' };
    }
    await PackagingRunRepository.create({
      batch_id: batch.id,
      packaged_volume: vol,
      packaged_unit: packagedUnit || 'bbl',
      packaged_at: packagedAt || new Date().toISOString(),
    }, supplies);
    await guardSync();
    return { status: 'success', message: `Packaging run created for ${batch.name} (${vol} ${packagedUnit || 'bbl'}).` };
  },

  async handleAddBatchAddition(params) {
    const { batchId, batchName, itemId, itemName, locationId, locationName, quantity, eventType, batchLocationId, batchLocationName } = params;

    const batch = await resolveBatch({ batchId, batchName });
    if (!batch) {
      const batches = await BatchRepository.getAll();
      return { status: 'need_batch', message: 'Select a batch.', batches: mapBatches(batches) };
    }

    const item = await ensureItem({ itemId, itemName });
    if (!item) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item', message: 'Select an item.', items: mapItems(items) };
    }

    const location = await resolveLocation({ locationId, locationName });
    if (!location) {
      const locs = await LocationRepository.getAll();
      return { status: 'need_location', message: 'Select a location.', options: mapLocations(locs) };
    }

    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty)) {
      return { status: 'need_quantity', message: 'Provide a quantity to add.' };
    }

    const batchLocation = await resolveBatchLocation({ batchLocationId, batchLocationName, batchId: batch.id });

    await BatchAdditionRepository.add({
      batch_id: batch.id,
      item_id: item.id,
      quantity: qty,
      location_id: location.id,
      batch_location_id: batchLocation ? batchLocation.id : null,
      event_type: eventType || null,
    });
    await guardSync();
    return { status: 'success', message: `Added ${Math.abs(qty)} of ${item.name} to batch ${batch.name}.` };
  },

  async handleForecastItem(params) {
    const { itemId, itemName, horizonDays = 30 } = params;
    const item = await resolveItem({ itemId, itemName });
    if (!item) {
      const items = await ItemRepository.getAll();
      return { status: 'need_item', message: 'Select an item to forecast.', items: mapItems(items) };
    }

    // Simple rolling consumption forecast: use ledger entries for CONSUME over horizon.
    const days = Math.max(1, Math.min(Number(horizonDays) || 30, 180));
    const entries = await LedgerRepository.getEntries({ item_id: item.id });
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const recent = entries.filter(e => new Date(e.created_at) >= cutoff);
    const totalConsumed = recent.reduce((sum, e) => {
      const qty = Number(e.quantity) || 0;
      const type = e.type || '';
      if (qty < 0) return sum + Math.abs(qty);
      if (type === 'CONSUME' || type === 'TRANSFER_OUT') return sum + Math.abs(qty);
      return sum;
    }, 0);
    const avgPerDay = totalConsumed / days;
    const onhand = await LedgerRepository.getTotalOnhand(item.id);
    const daysToEmpty = avgPerDay > 0 ? onhand / avgPerDay : null;

    return {
      status: 'info',
      message: `Forecast for ${item.name}: ${onhand.toFixed(2)} on-hand; avg ${avgPerDay.toFixed(2)}/day; ${daysToEmpty ? `${daysToEmpty.toFixed(1)} days to empty` : 'no recent consumption to project'}.`,
      data: { onhand, avgPerDay, daysToEmpty, horizonDays: days },
    };
  },
};
