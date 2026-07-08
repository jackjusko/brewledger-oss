# Brewster - Local-First Brewery Inventory MVP

This is an offline-only, local-first inventory management app for breweries. It runs entirely in the browser using IndexedDB (via Dexie.js) for persistent storage.

**NEW (MVP #2)**: Now supports Organizational Accounts and Multi-Device Sync via a minimal Express backend.

## Features
- **Locations & Items**: Manage your inventory locations (Grain Room, Walk-in, etc.) and items (Malt, Hops, Yeast, etc.).
- **Receiving**: Easily receive shipments into specific locations.
- **Counting**: Perform physical inventory counts per location. The app calculates adjustments automatically.
- **Batches & Consumption**: Track usage by assigning consumed inventory to specific batches.
- **Ledger**: Immutable record of all transactions (Receives, Consumptions, Count Adjustments).
- **Low Stock Alerts**: Dashboard indicator and dedicated view for items below reorder threshold.
- **Export**: Download CSV files for current On-Hand inventory and full Ledger history.
- **Sync & Multi-User**: Register an organization, invite users, and sync data across devices.

## Architecture
- **Client**: Vue 3 + Dexie (IndexedDB). Acts as the source of truth for the device.
- **Server**: Express (Node.js). Acts as an append-only operation log relay.
- **Sync Protocol**: Operation-based sync.
    - **Push**: Client sends local operations (Upserts, Ledger adds) to server.
    - **Pull**: Client requests new operations from server since last sequence number.
    - **Conflict Resolution**: Last-Write-Wins (LWW) based on `updated_at` timestamps.

## How to Run

### 1. Backend (Sync Server)
The backend is in-memory only. **Restarting the server wipes all account/sync data.**

```bash
cd backend
npm install
node server.js
```
Runs on `http://localhost:3000`.

### 2. Frontend (App)
```bash
# In project root
npm install
npm run dev
```
Runs on `http://localhost:5173`.

## Multi-Device Testing
1. Open Browser A (e.g. Chrome).
2. Register a new Organization.
3. Add some Items and Locations.
4. Open Browser B (e.g. Firefox or Incognito).
5. Login with the same credentials.
6. Go to **Dashboard > Sync Status** and click **Sync Now**.
7. Data should appear!

## Data Storage
- All data is stored in your browser's **IndexedDB**.
- Data persists across reloads and browser restarts.
- **Warning**: Clearing your browser cache/site data will delete the local database!

## Sync Rules
- **Idempotency**: Operations are deduped by UUID (`opId`) on the server.
- **Conflicts**: If two users edit the same item, the one with the later timestamp wins.
- **Offline**: You can work offline indefinitely. Operations are queued in an "Outbox" and sent when you next sync.
