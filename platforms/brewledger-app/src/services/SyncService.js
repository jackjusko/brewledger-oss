import axios from "axios";
import { db } from "../db";
import { AuthService } from "./AuthService";
import { ItemRepository } from "../repositories/ItemRepository";
import { LocationRepository } from "../repositories/LocationRepository";
import { BatchRepository } from "../repositories/BatchRepository";
import { CountSessionRepository } from "../repositories/CountSessionRepository";
import { LedgerRepository } from "../repositories/LedgerRepository";
import { VesselRepository } from "../repositories/VesselRepository";
import { BatchAdditionRepository } from "../repositories/BatchAdditionRepository";
import { BatchReadingRepository } from "../repositories/BatchReadingRepository";
import { PackagingRunRepository } from "../repositories/PackagingRunRepository";
import { CategoryRepository } from "../repositories/CategoryRepository";
import { VarianceEventRepository } from "../repositories/VarianceEventRepository";
import { ParLevelRepository } from "../repositories/ParLevelRepository";
import { AllocationRepository } from "../repositories/AllocationRepository";
import { RecipeRepository } from "../repositories/RecipeRepository";
import { RecipeItemRepository } from "../repositories/RecipeItemRepository";
import { BatchMilestoneRepository } from "../repositories/BatchMilestoneRepository";
import { BatchLocationRepository } from "../repositories/BatchLocationRepository";
import { MilestoneTemplateRepository } from "../repositories/MilestoneTemplateRepository";
import { BatchVolumeAdjustmentRepository } from "../repositories/BatchVolumeAdjustmentRepository";
import { BatchVolumeSnapshotRepository } from "../repositories/BatchVolumeSnapshotRepository";
import { BatchLocationTransferRepository } from "../repositories/BatchLocationTransferRepository";
import { lastSyncTimestamp, isSyncing } from "../composables/useSync";
import { useSession } from "../composables/useSession";
import { API_BASE_URL } from "../config";

export const SyncService = {
  isSyncing: false,

  error: null,

  syncIntervalId: null, // Track interval to prevent multiple loops

  async startSyncLoop(intervalMs = 30000) {
    // Prevent multiple sync loops
    if (this.syncIntervalId !== null) {
      console.warn("Sync loop already running, skipping start");
      return;
    }

    await this.sync();

    this.syncIntervalId = setInterval(() => {
      this.sync();
    }, intervalMs);
  },

  stopSyncLoop() {
    if (this.syncIntervalId !== null) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  },

  async sync() {
    if (this.isSyncing) return;

    const session = await AuthService.getSession();
    if (!session || !session.token) return;

    this.isSyncing = true;
    this.error = null;
    isSyncing.value = true;

    try {
      // 1. Gather Dirty Records
      const changes = {
        items: await db.items.where("sync_status").equals("pending").toArray(),
        locations: await db.locations
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batches: await db.batches
          .where("sync_status")
          .equals("pending")
          .toArray(),
        count_sessions: await db.count_sessions
          .where("sync_status")
          .equals("pending")
          .toArray(),
        ledger_entries: await db.ledger_entries
          .where("sync_status")
          .equals("pending")
          .toArray(),
        vessels: await db.vessels
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_additions: await db.batch_additions
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_readings: await db.batch_readings
          .where("sync_status")
          .equals("pending")
          .toArray(),
        packaging_runs: await db.packaging_runs
          .where("sync_status")
          .equals("pending")
          .toArray(),
        categories: await db.categories
          .where("sync_status")
          .equals("pending")
          .toArray(),
        variance_events: await db.variance_events
          .where("sync_status")
          .equals("pending")
          .toArray(),
        par_levels: await db.par_levels
          .where("sync_status")
          .equals("pending")
          .toArray(),
        allocations: await db.allocations
          .where("sync_status")
          .equals("pending")
          .toArray(),
        recipes: await db.recipes
          .where("sync_status")
          .equals("pending")
          .toArray(),
        recipe_items: await db.recipe_items
          .where("sync_status")
          .equals("pending")
          .toArray(),
        milestone_templates: await db.milestone_templates
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_milestones: await db.batch_milestones
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_locations: await db.batch_locations
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_volume_adjustments: await db.batch_volume_adjustments
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_volume_snapshots: await db.batch_volume_snapshots
          .where("sync_status")
          .equals("pending")
          .toArray(),
        batch_location_transfers: await db.batch_location_transfers
          .where("sync_status")
          .equals("pending")
          .toArray(),
      };

      const hasChanges = Object.values(changes).some((arr) => arr.length > 0);

      // 2. Send to Server
      const response = await axios.post(
        `${API_BASE_URL}/sync`,
        {
          changes: hasChanges ? changes : undefined,
          lastSyncTimestamp: session.lastSyncTimestamp,
        },
        {
          headers: { Authorization: `Bearer ${session.token}` },
        }
      );

      const { updates, serverTimestamp, inventory_snapshot, orgStatus } =
        response.data;

      // Update Org Status if present
      if (orgStatus) {
        session.subscriptionPlan = orgStatus.subscriptionPlan;
        session.subscriptionStatus = orgStatus.subscriptionStatus;
        session.trialEndsAt = orgStatus.trialEndsAt;

        // Use the composable to update reactive state if available,
        // otherwise fallback to AuthService which just updates localStorage
        const { setSession } = useSession();
        await setSession(session);
      }

      // 3. Apply Updates from Server
      await this.applyServerUpdates(updates, inventory_snapshot);

      // 4. Mark sent records as synced
      if (hasChanges) {
        await this.markAsSynced(changes);
      }

      await AuthService.updateLastSync(serverTimestamp);
      lastSyncTimestamp.value = serverTimestamp || new Date().toISOString();
    } catch (e) {
      console.error("Sync failed", e);
      this.error = e.message;
    } finally {
      this.isSyncing = false;
      isSyncing.value = false;
    }
  },

  async markAsSynced(changes) {
    const mark = async (table, items) => {
      if (!items || items.length === 0) return;
      const ids = items.map((i) => i.id);
      await db
        .table(table)
        .where("id")
        .anyOf(ids)
        .modify({ sync_status: "synced" });
    };

    await mark("items", changes.items);
    await mark("locations", changes.locations);
    await mark("batches", changes.batches);
    await mark("count_sessions", changes.count_sessions);
    await mark("ledger_entries", changes.ledger_entries);
    await mark("vessels", changes.vessels);
    await mark("batch_additions", changes.batch_additions);
    await mark("batch_readings", changes.batch_readings);
    await mark("packaging_runs", changes.packaging_runs);
    await mark("categories", changes.categories);
    await mark("variance_events", changes.variance_events);
    await mark("par_levels", changes.par_levels);
    await mark("allocations", changes.allocations);
    await mark("recipes", changes.recipes);
    await mark("recipe_items", changes.recipe_items);
    await mark("milestone_templates", changes.milestone_templates);
    await mark("batch_milestones", changes.batch_milestones);
    await mark("batch_locations", changes.batch_locations);
    await mark("batch_volume_adjustments", changes.batch_volume_adjustments);
    await mark("batch_volume_snapshots", changes.batch_volume_snapshots);
    await mark("batch_location_transfers", changes.batch_location_transfers);
  },

  async applyServerUpdates(updates, inventory_snapshot = null) {
    if (!updates) return;

    // Handle Snapshot First (Critical for accurate balance)
    if (inventory_snapshot) {
      await LedgerRepository.setCacheFromSnapshot(inventory_snapshot);
    }

    const apply = async (repo, items) => {
      if (!items) return;
      for (const item of items) {
        await repo.applyRemoteUpsert({ ...item, sync_status: "synced" });
      }
    };

    await apply(ItemRepository, updates.items);
    await apply(LocationRepository, updates.locations);
    await apply(BatchRepository, updates.batches);
    await apply(CountSessionRepository, updates.count_sessions);
    await apply(VesselRepository, updates.vessels);
    await apply(BatchAdditionRepository, updates.batch_additions);
    await apply(BatchReadingRepository, updates.batch_readings);
    await apply(PackagingRunRepository, updates.packaging_runs);
    await apply(CategoryRepository, updates.categories);
    await apply(VarianceEventRepository, updates.variance_events);
    await apply(ParLevelRepository, updates.par_levels);
    await apply(AllocationRepository, updates.allocations);
    await apply(RecipeRepository, updates.recipes);
    await apply(RecipeItemRepository, updates.recipe_items);
    await apply(MilestoneTemplateRepository, updates.milestone_templates);
    // Remove duplicate milestone templates: if we received templates from the server with the same
    // name (e.g. "Default"), drop any local-only copy so we don't show duplicates after login.
    if (updates.milestone_templates?.length) {
      const session = await AuthService.getSession();
      if (session?.orgId) {
        const appliedIds = new Set(updates.milestone_templates.map((t) => t.id));
        const appliedNames = new Set(updates.milestone_templates.map((t) => t.name));
        const local = await db.milestone_templates
          .where("org_id")
          .equals(session.orgId)
          .toArray();
        for (const t of local) {
          if (appliedNames.has(t.name) && !appliedIds.has(t.id)) {
            await db.milestone_templates.delete(t.id);
          }
        }
      }
    }
    await apply(BatchMilestoneRepository, updates.batch_milestones);
    await apply(BatchLocationRepository, updates.batch_locations);
    await apply(
      BatchVolumeAdjustmentRepository,
      updates.batch_volume_adjustments
    );
    await apply(BatchVolumeSnapshotRepository, updates.batch_volume_snapshots);
    await apply(
      BatchLocationTransferRepository,
      updates.batch_location_transfers
    );

    // Ledger is special
    if (updates.ledger_entries) {
      for (const entry of updates.ledger_entries) {
        if (inventory_snapshot) {
          // If we have a snapshot, the cache is already correct.
          // Just save the history for display, do NOT update cache incrementally.
          // We use db directly or a modified repo method to avoid cache trigger
          const existing = await db.ledger_entries.get(entry.id);
          if (!existing) {
            await db.ledger_entries.put({ ...entry, sync_status: "synced" });
          }
        } else {
          // Standard behavior: apply entry and update cache
          await LedgerRepository.applyRemoteEntry({
            ...entry,
            sync_status: "synced",
          });
        }
      }
    }
  },
};
