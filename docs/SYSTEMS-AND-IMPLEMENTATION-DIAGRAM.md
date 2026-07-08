# BrewLedger – Systems and Implementation Diagram

## How to view the graphs

The diagrams in this file are **Mermaid** code blocks. To see them as visual graphs:

1. **Open the preview in your browser (quickest)**  
   Open **`docs/diagram-preview.html`** in a browser (double‑click the file or right‑click → Open with → your browser). It renders the master network graph with no extensions or copy‑paste. Requires internet (Mermaid loads from CDN).

2. **Mermaid Live Editor**  
   Open [https://mermaid.live](https://mermaid.live), paste a `mermaid` code block from this file into the editor, and the graph renders on the right. Copy from the first `flowchart` line through the closing ` ``` `.

3. **GitHub**  
   Push this repo and open `docs/SYSTEMS-AND-IMPLEMENTATION-DIAGRAM.md` on GitHub. The rendered markdown preview shows Mermaid diagrams as graphs.

4. **Cursor / VS Code**  
   Use **Markdown: Open Preview** (e.g. right‑click the file → Open Preview, or `Ctrl+Shift+V`). If diagrams still show as code, install the **Markdown Preview Mermaid Support** extension so Mermaid blocks render as graphs.

---

## How to read this document

This document is a **layered tree** from big to small: system context → repository layout → technology stack → subsystems → key flows → UI and API maps. Each level has one or more Mermaid diagrams. Use the **Master tree** below to jump to any level. Cross-references use "See Level X" or "Above: Level X."

**Master tree (at-a-glance navigation):**

| Level | Section | Description |
|-------|---------|-------------|
| — | [**Master network**](#master-network--undirected-node-graph) | **Undirected node graph: one interconnected visual of all components** |
| 0 | [System context](#level-0--system-context) | BrewLedger in the world: users, backend, Stripe, TTB |
| 1 | [Repository and platforms](#level-1--repository-and-platforms) | server/, brewledger-app/, console/ and how they connect |
| 2 | [Technology stack and data stores](#level-2--technology-stack-and-data-stores) | Vue, Capacitor, Express, SQLite, IndexedDB, sync boundary |
| 3 | [Subsystems](#level-3--subsystems) | Auth, Sync, Billing, Inventory/Ledger, Batch/Recipe, TTB |
| 4 | [Key flows](#level-4--key-flows) | Sync–Ledger–cache, TTB data flow, Billing–sync–UI |
| 5 | [UI and API map](#level-5--ui-and-api-map) | Mobile/console views and server API tree |
| — | [Changes and bugs mapping](#changes-and-bugs-mapping) | change docs and BUGS-AND-FIXES-LOG mapped to diagram nodes |

---

## Master network – undirected node graph

One interconnected graph of major system components. Edges are undirected (no arrows); each line means "connects to" or "integrates with." Use this for a single visual overview of the whole system.

```mermaid
flowchart LR
  subgraph server [Server]
    Express
    SQLite
    InitDB
    Migrations
    AuthRoutes
    BillingRoutes
    SyncRoute
    BreweryInfoAPI
    StripeWebhook
    AIChat
  end

  subgraph mobile [Mobile app]
    MobileApp
    MobileViews
    MobileRepos
    MobileAuthService
    MobileSyncService
    IndexedDB
    Dexie
    Capacitor
    Vue
    Vite
  end

  subgraph console [Console app]
    ConsoleApp
    ConsoleViews
    ConsoleRepos
    TTBFormService
    TTBPDFExportService
    BreweryInfoService
    ConsoleAuthService
    ConsoleSyncService
    Blog
    Landing
  end

  subgraph data [Data and entities]
    Ledger
    Items
    Locations
    Batches
    BatchLocations
    BatchReadings
    BatchAdditions
    BatchMilestones
    Recipes
    RecipeItems
    OnhandCache
    ParLevels
    VarianceEvents
    PackagingRuns
    MilestoneTemplates
    Categories
  end

  subgraph auth [Auth and session]
    Token
    Session
    RouterGuards
  end

  subgraph external [External]
    Stripe
    TTB
  end

  Express --- SQLite
  Express --- InitDB
  Express --- AuthRoutes
  Express --- BillingRoutes
  Express --- SyncRoute
  Express --- BreweryInfoAPI
  Express --- StripeWebhook
  Express --- AIChat
  InitDB --- Migrations
  AuthRoutes --- Token
  BillingRoutes --- Stripe
  StripeWebhook --- Stripe
  SyncRoute --- Ledger
  BreweryInfoAPI --- BreweryInfoService

  MobileApp --- MobileViews
  MobileApp --- Vue
  MobileApp --- Capacitor
  MobileViews --- MobileRepos
  MobileRepos --- MobileSyncService
  MobileRepos --- MobileAuthService
  MobileRepos --- IndexedDB
  IndexedDB --- Dexie
  Dexie --- Ledger
  Dexie --- Items
  Dexie --- Locations
  Dexie --- Batches
  Dexie --- BatchLocations
  Dexie --- OnhandCache
  MobileSyncService --- SyncRoute
  MobileAuthService --- AuthRoutes
  MobileAuthService --- Token
  Token --- Session
  Session --- RouterGuards
  Vue --- Vite

  ConsoleApp --- ConsoleViews
  ConsoleApp --- Landing
  ConsoleApp --- Blog
  ConsoleViews --- ConsoleRepos
  ConsoleRepos --- ConsoleSyncService
  ConsoleRepos --- ConsoleAuthService
  ConsoleRepos --- TTBFormService
  ConsoleRepos --- BreweryInfoService
  ConsoleSyncService --- SyncRoute
  ConsoleAuthService --- AuthRoutes
  ConsoleAuthService --- Token
  TTBFormService --- Ledger
  TTBFormService --- OnhandCache
  TTBFormService --- VarianceEvents
  TTBFormService --- PackagingRuns
  TTBFormService --- BatchMilestones
  TTBFormService --- TTBPDFExportService
  TTBPDFExportService --- TTB
  BreweryInfoService --- BreweryInfoAPI

  Ledger --- Items
  Ledger --- Locations
  Ledger --- Batches
  Ledger --- OnhandCache
  Items --- Categories
  Items --- ParLevels
  Locations --- ParLevels
  Batches --- BatchLocations
  Batches --- BatchReadings
  Batches --- BatchAdditions
  Batches --- BatchMilestones
  Batches --- PackagingRuns
  Batches --- MilestoneTemplates
  BatchLocations --- BatchReadings
  BatchLocations --- BatchAdditions
  Recipes --- RecipeItems
  Recipes --- Batches
  VarianceEvents --- Ledger
  PackagingRuns --- Ledger
  OnhandCache --- Ledger
  ParLevels --- Items
  ParLevels --- Locations
```

**Pure network (no subgraphs)** – same nodes as one undirected web:

```mermaid
flowchart LR
  Express --- SQLite
  Express --- AuthRoutes
  Express --- BillingRoutes
  Express --- SyncRoute
  Express --- BreweryInfoAPI
  Express --- StripeWebhook
  Express --- AIChat
  SQLite --- InitDB
  AuthRoutes --- Token
  BillingRoutes --- Stripe
  StripeWebhook --- Stripe
  SyncRoute --- Ledger
  BreweryInfoAPI --- BreweryInfoService
  MobileApp --- MobileViews
  MobileApp --- Vue
  MobileApp --- Capacitor
  MobileViews --- MobileRepos
  MobileRepos --- MobileSyncService
  MobileRepos --- MobileAuthService
  MobileRepos --- IndexedDB
  IndexedDB --- Dexie
  Dexie --- Ledger
  Dexie --- Items
  Dexie --- Locations
  Dexie --- Batches
  Dexie --- OnhandCache
  MobileSyncService --- SyncRoute
  MobileAuthService --- Token
  Token --- Session
  Session --- RouterGuards
  ConsoleApp --- ConsoleViews
  ConsoleApp --- Blog
  ConsoleViews --- ConsoleRepos
  ConsoleRepos --- ConsoleSyncService
  ConsoleRepos --- TTBFormService
  ConsoleRepos --- BreweryInfoService
  ConsoleSyncService --- SyncRoute
  TTBFormService --- Ledger
  TTBFormService --- TTBPDFExportService
  TTBPDFExportService --- TTB
  Ledger --- Items
  Ledger --- Locations
  Ledger --- Batches
  Ledger --- OnhandCache
  Items --- ParLevels
  Locations --- ParLevels
  Batches --- BatchLocations
  Batches --- PackagingRuns
  Batches --- MilestoneTemplates
  VarianceEvents --- Ledger
  PackagingRuns --- Ledger
```

*Below: [Level 0 – System context](#level-0--system-context) (layered tree).*

---

## Level 0 – System context

BrewLedger in the world: mobile and desktop clients, shared backend, Stripe for billing, and TTB as external reporting target.

```mermaid
flowchart TB
  subgraph users [Users]
    MobileUser[Mobile User]
    DesktopUser[Desktop User]
  end

  subgraph clients [Client applications]
    MobileApp[brewledger-app\nCapacitor iOS/Android]
    ConsoleApp[console\nDesktop SPA]
  end

  subgraph backend [Backend]
    Express[Express API]
    SQLite[(SQLite)]
  end

  subgraph external [External]
    Stripe[Stripe\nCheckout / Portal / Webhooks]
    TTB[TTB Form 5130.9\nReporting]
  end

  MobileUser --> MobileApp
  DesktopUser --> ConsoleApp
  MobileApp -->|HTTPS API + Sync| Express
  ConsoleApp -->|HTTPS API + Sync| Express
  Express --> SQLite
  Express -->|Webhooks| Stripe
  MobileApp -->|Checkout / Portal| Stripe
  ConsoleApp -->|Checkout / Portal| Stripe
  ConsoleApp -->|Generate PDF| TTB
```

*Above: Master tree | Next: [Level 1 – Repository and platforms](#level-1--repository-and-platforms)*

---

## Level 1 – Repository and platforms

Repository layout: `server/`, `platforms/brewledger-app/`, `platforms/console/` with key entrypoints and connections.

```mermaid
flowchart TB
  subgraph repo [Repository root]
    ServerDir[server/]
    PlatformsDir[platforms/]
  end

  subgraph serverContent [server/]
    ServerJS[server.js\nExpress routes]
    InitDB[init_db.js\nSchema]
    Migrations[migrate_*.js]
  end

  subgraph mobileContent [platforms/brewledger-app/]
    AppVue[App.vue]
    MobileViews[views/]
    MobileRepos[repositories/]
    MobileServices[services/\nAuthService SyncService]
    MobileRouter[router/]
  end

  subgraph consoleContent [platforms/console/]
    ConsoleApp[App.vue]
    ConsoleViews[views/]
    ConsoleRepos[repositories/]
    ConsoleServices[services/\nAuthService SyncService\nTTBFormService TTBPDFExportService\nBreweryInfoService]
    ConsoleRouter[router/]
    Blog[blog/ posts]
  end

  ServerDir --> ServerJS
  ServerDir --> InitDB
  ServerDir --> Migrations
  PlatformsDir --> mobileContent
  PlatformsDir --> consoleContent
  MobileViews --> MobileRepos
  MobileRepos --> MobileServices
  MobileRouter --> MobileViews
  ConsoleViews --> ConsoleRepos
  ConsoleRepos --> ConsoleServices
  ConsoleRouter --> ConsoleViews
  MobileServices -->|API + Sync| ServerJS
  ConsoleServices -->|API + Sync| ServerJS
```

*Above: [Level 0](#level-0--system-context) | Next: [Level 2 – Technology stack](#level-2--technology-stack-and-data-stores)*

---

## Level 2 – Technology stack and data stores

Stack and persistence: Vue 3, Vite, Capacitor 6, Express, dual database (SQLite server, IndexedDB client via Dexie), Stripe, JWT-like auth.

```mermaid
flowchart LR
  subgraph clientStack [Client stack]
    Vue[Vue 3]
    Vite[Vite]
    Tailwind[Tailwind CSS]
    Dexie[Dexie.js\nIndexedDB]
  end

  subgraph mobileOnly [Mobile only]
    Capacitor[Capacitor 6\niOS / Android]
  end

  subgraph serverStack [Server stack]
    ExpressNode[Express.js]
    SQLiteNode[(SQLite)]
  end

  subgraph externalStack [External]
    StripeAPI[Stripe API]
  end

  subgraph syncBoundary [Sync boundary]
    Push[Push dirty]
    Pull[Pull updates]
  end

  Vue --> Vite
  Vue --> Dexie
  Vue --> Capacitor
  ExpressNode --> SQLiteNode
  ExpressNode --> StripeAPI
  Dexie --> Push
  Pull --> Dexie
  Push --> ExpressNode
  ExpressNode --> Pull
```

*Above: [Level 1](#level-1--repository-and-platforms) | Next: [Level 3 – Subsystems](#level-3--subsystems)*

---

## Level 3 – Subsystems

Orchestrated subsystems: Auth, Sync, Billing, Inventory/Ledger, Batch/Recipe, TTB. Each subsection has one diagram.

### 3.1 Auth and session

Login/register → token → session (localStorage) → router guards → API; org scoping.

```mermaid
flowchart LR
  subgraph authFlow [Auth flow]
    Login[Login / Register]
    Token[Token generation]
    Session[Session\nlocalStorage]
    Guards[Router guards]
    API[API requests\nwith token]
  end
  Login --> Token
  Token --> Session
  Session --> Guards
  Guards --> API
  API -->|org_id filter| Server[Server]
```

*See Level 3 index above | Next: [3.2 Sync](#32-sync-and-replication)*

### 3.2 Sync and replication

Gather dirty → push `/api/sync` → server validate/apply → pull updates → apply locally; server authoritative.

```mermaid
flowchart TB
  subgraph clientSync [Client]
    Gather[Gather dirty\nsync_status pending]
    PushReq[POST /api/sync]
    Apply[Apply server updates\nmark synced]
  end

  subgraph serverSync [Server]
    Validate[Validate entity\nbusiness rules]
    UpdateDB[Update SQLite]
    FetchUpdates[Fetch updates\nsince lastSync]
  end

  Gather --> PushReq
  PushReq --> Validate
  Validate --> UpdateDB
  UpdateDB --> FetchUpdates
  FetchUpdates --> Apply
  Apply --> Gather
```

*Above: [3.1 Auth](#31-auth-and-session) | Next: [3.3 Billing](#33-billing-and-subscription)*

### 3.3 Billing and subscription

Stripe webhook → org status → sync propagation → router guard; checkout, portal, success-redirect, portal-return; single-tier (100 locations).

```mermaid
flowchart TB
  subgraph billingFlow [Billing flow]
    Checkout[Create checkout session]
    StripePay[Stripe Checkout]
    Webhook[Webhook\ncheckout.session.completed\ninvoice.payment_failed]
    OrgUpdate[Update org\nsubscription_status\nsubscription_plan]
    SyncProp[Next sync\npropagates to clients]
    Guard[Router guard\nsubscription check]
  end
  Checkout --> StripePay
  StripePay --> Webhook
  Webhook --> OrgUpdate
  OrgUpdate --> SyncProp
  SyncProp --> Guard
```

*Above: [3.2 Sync](#32-sync-and-replication) | Next: [3.4 Inventory and ledger](#34-inventory-and-ledger)*

### 3.4 Inventory and ledger

Items, Locations, Ledger (RECEIVE, CONSUME, TRANSFER, etc.), onhand_cache, ParLevels (individual + global); connection to sync and TTB.

```mermaid
flowchart TB
  subgraph inventoryEntities [Entities]
    Items[Items]
    Locations[Locations]
    LedgerEntries[ledger_entries]
    OnhandCache[onhand_cache]
    ParLevels[ParLevels\nindividual + global]
  end

  subgraph ledgerTypes [Transaction types]
    RECEIVE[RECEIVE]
    CONSUME[CONSUME]
    TRANSFER[TRANSFER_IN/OUT]
    COUNT[COUNT_ADJUST]
    REVERSAL[REVERSAL]
  end

  LedgerEntries --> OnhandCache
  Items --> LedgerEntries
  Locations --> LedgerEntries
  ParLevels --> Items
  ParLevels --> Locations
  RECEIVE --> LedgerEntries
  CONSUME --> LedgerEntries
  TRANSFER --> LedgerEntries
```

*Above: [3.3 Billing](#33-billing-and-subscription) | Next: [3.5 Batch and recipe](#35-batch-and-recipe)*

### 3.5 Batch and recipe

Batches, batch_locations (vessel splits), batch_readings, batch_additions, batch_volume_adjustments, milestones (forced Production Complete), recipes/recipe_items, packaging runs; link to ledger (beer RECEIVE, batch_id).

```mermaid
flowchart TB
  subgraph batchEntities [Batch entities]
    Batches[Batches]
    BatchLocations[batch_locations\nvessel splits]
    BatchReadings[batch_readings]
    BatchAdditions[batch_additions]
    BatchVolAdj[batch_volume_adjustments]
    Milestones[batch_milestones\nforced Production Complete]
  end

  subgraph recipeEntities [Recipe entities]
    Recipes[Recipes]
    RecipeItems[Recipe items]
  end

  Packaging[Packaging runs]

  Batches --> BatchLocations
  Batches --> BatchReadings
  Batches --> BatchAdditions
  Batches --> BatchVolAdj
  Batches --> Milestones
  Recipes --> RecipeItems
  Batches --> Packaging
  Batches -->|RECEIVE beer\nbatch_id| LedgerRef[Ledger]
  Packaging --> LedgerRef
```

*Above: [3.4 Inventory](#34-inventory-and-ledger) | Next: [3.6 TTB Form 5130.9](#36-ttb-form-51309)*

### 3.6 TTB Form 5130.9

Beer-as-items, Finished Beer category/item, location stage (cellar | racking_keg | bottling_bulk | case), TTBFormService (lines 1–34, columns a–e), TTBPDFExportService, brewery-info API; data flow from BatchDetail / Racking / Removals / Losses / Packaging → ledger → form/PDF.

```mermaid
flowchart TB
  subgraph ttbInputs [Data collection]
    BatchDetail[BatchDetail\nMark Production Complete]
    Racking[Racking view]
    Removals[Removals view]
    Losses[Losses view]
    Packaging[Packaging]
  end

  subgraph ttbData [Ledger and staging]
    LedgerTTB[ledger_entries\nbeer items only]
    LocationStage[locations.stage\ncellar racking_keg bottling_bulk case]
  end

  subgraph ttbServices [Console services]
    TTBFormService[TTBFormService\ngetBeerOnhandByStage\ncolumnsByLine line1 line33]
    TTBPDF[TTBPDFExportService\nfill PDF]
    BreweryInfo[BreweryInfoService\nbrewery-info API]
  end

  subgraph ttbOutput [Output]
    Form5130[Form 5130.9\nrows 1-34 cols a-e]
  end

  BatchDetail -->|RECEIVE beer| LedgerTTB
  Racking --> LedgerTTB
  Removals --> LedgerTTB
  Losses --> LedgerTTB
  Packaging --> LedgerTTB
  LedgerTTB --> TTBFormService
  LocationStage --> TTBFormService
  BreweryInfo --> TTBPDF
  TTBFormService --> TTBPDF
  TTBPDF --> Form5130
```

*Above: [3.5 Batch](#35-batch-and-recipe) | Next: [Level 4 – Key flows](#level-4--key-flows)*

---

## Level 4 – Key flows

Interconnections: Sync–Ledger–cache, TTB data flow, Billing–sync–UI.

### 4.1 Sync ↔ Ledger ↔ cache

User action → Ledger entry → cache update → pending → sync → server → other devices.

```mermaid
flowchart LR
  UserAction[User action]
  LedgerEntry[Ledger entry]
  CacheUpdate[Cache update]
  Pending[sync_status pending]
  SyncPush[Sync push]
  ServerProc[Server validate\nand apply]
  OtherDevices[Other devices\npull and apply]

  UserAction --> LedgerEntry
  LedgerEntry --> CacheUpdate
  CacheUpdate --> Pending
  Pending --> SyncPush
  SyncPush --> ServerProc
  ServerProc --> OtherDevices
```

*Next: [4.2 TTB data flow](#42-ttb-data-flow)*

### 4.2 TTB data flow

BatchDetail (production complete RECEIVE), Racking, Removals, Losses, Packaging → ledger + variance → TTBFormService → columnsByLine / getBeerOnhandByStage → TTBPDFExportService.

```mermaid
flowchart TB
  subgraph sources [Sources]
    ProdComplete[Mark Production Complete\nRECEIVE beer]
    RackingView[Racking]
    RemovalsView[Removals]
    LossesView[Losses]
    PackagingView[Packaging]
  end

  subgraph storage [Storage]
    LedgerFlow[ledger_entries]
    VarianceFlow[variance_events]
  end

  subgraph calc [Calculation]
    TTBForm[TTBFormService\ngenerateForm\ngetBeerOnhandByStage\ncolumnsByLine]
  end

  subgraph export [Export]
    PDFExport[TTBPDFExportService\nfillPDFForm]
  end

  ProdComplete --> LedgerFlow
  RackingView --> LedgerFlow
  RemovalsView --> LedgerFlow
  LossesView --> VarianceFlow
  PackagingView --> LedgerFlow
  LedgerFlow --> TTBForm
  VarianceFlow --> TTBForm
  TTBForm --> PDFExport
```

*Above: [4.1 Sync–Ledger–cache](#41-sync--ledger--cache) | Next: [4.3 Billing–sync–UI](#43-billing--sync--ui)*

### 4.3 Billing ↔ sync ↔ UI

Webhook → DB → next sync → session update → router guard enforcement.

```mermaid
flowchart LR
  Webhook[Stripe webhook]
  DB[Server DB\norg subscription]
  NextSync[Next sync]
  Session[Client session\nlocalStorage]
  RouterGuard[Router guard\nenforce subscription]

  Webhook --> DB
  DB --> NextSync
  NextSync --> Session
  Session --> RouterGuard
```

*Above: [4.2 TTB](#42-ttb-data-flow) | Next: [Level 5 – UI and API map](#level-5--ui-and-api-map)*

---

## Level 5 – UI and API map

### 5.1 Mobile (brewledger-app) view tree

Router → views → repositories → SyncService / AuthService; Capacitor deeplinks (brewledger://settings, brewledger://billing/success).

```mermaid
flowchart TB
  subgraph mobileRoutes [Routes and views]
    Dashboard[Dashboard]
    Inventory[Inventory]
    ItemsList[ItemsList]
    LocationsList[LocationsList]
    BatchesList[BatchesList]
    BatchDetail[BatchDetail]
    BatchForm[BatchForm]
    BatchRecipeConsume[BatchRecipeConsume]
    Receive[Receive]
    Consume[Consume]
    Transfer[Transfer]
    Count[Count]
    CountSession[CountSession]
    Ledger[Ledger]
    RemoveBeer[RemoveBeer]
    ReorderList[ReorderList]
    LowStock[LowStock]
    Export[Export]
    Settings[Settings]
    Billing[Billing]
    MilestoneTemplates[MilestoneTemplates]
    MilestoneTemplateForm[MilestoneTemplateForm]
    VesselsList[VesselsList]
    Login[Login]
    Register[Register]
    ItemForm[ItemForm]
    LocationForm[LocationForm]
    RecipeList[RecipeList]
    RecipeForm[RecipeForm]
  end

  subgraph mobileLayer [Data layer]
    Repos[repositories/]
    AuthService[AuthService]
    SyncService[SyncService]
  end

  mobileRoutes --> Repos
  Repos --> SyncService
  Repos --> AuthService
```

*Next: [5.2 Console view tree](#52-console-view-tree)*

### 5.2 Console view tree

Landing (/), Dashboard, Inventory, Ledger, BatchesList, BatchDetail, BatchForm, Reports (TTBForm), Removals, Racking, Losses, ParLevels, Settings, Blog (The Ledger), AIAssistant, CsvSearch → repositories + TTBFormService / BreweryInfoService / TTBPDFExportService.

```mermaid
flowchart TB
  subgraph consoleRoutes [Routes and views]
    Landing[Landing /]
    DashboardC[Dashboard]
    InventoryC[Inventory]
    LedgerC[Ledger]
    BatchesListC[BatchesList]
    BatchDetailC[BatchDetail]
    BatchFormC[BatchForm]
    BatchRecipeConsumeC[BatchRecipeConsume]
    Reports[Reports]
    TTBForm[TTBForm]
    Removals[Removals]
    Racking[Racking]
    Losses[Losses]
    ParLevels[ParLevels]
    Analytics[Analytics]
    SettingsC[Settings]
    MilestoneTemplatesC[MilestoneTemplates]
    MilestoneTemplateFormC[MilestoneTemplateForm]
    BlogList[BlogList /blog]
    BlogPost[BlogPost /blog/:slug]
    LedgerAbout[LedgerAbout]
    LedgerSubscribe[LedgerSubscribe]
    LedgerSection[LedgerSection]
    CsvSearch[CsvSearch]
    AIAssistant[AIAssistant]
    LoginC[Login]
    RegisterC[Register]
  end

  subgraph consoleLayer [Data and services]
    ReposC[repositories/]
    TTBFormService[TTBFormService]
    TTBPDFExportService[TTBPDFExportService]
    BreweryInfoService[BreweryInfoService]
    AuthServiceC[AuthService]
    SyncServiceC[SyncService]
  end

  consoleRoutes --> ReposC
  consoleRoutes --> TTBFormService
  consoleRoutes --> BreweryInfoService
  TTBForm --> TTBPDFExportService
  ReposC --> SyncServiceC
  ReposC --> AuthServiceC
```

*Above: [5.1 Mobile](#51-mobile-brewledger-app-view-tree) | Next: [5.3 Server API tree](#53-server-api-tree)*

### 5.3 Server API tree

Health, Auth, Billing, Orgs (brewery-info), Item-templates, Locations, Sync, AI, static + SPA fallback.

```mermaid
flowchart TB
  subgraph apiTree [Server API]
    Health[GET /health]
    Auth[Auth]
    BillingAPI[Billing]
    OrgsAPI[Orgs]
    ItemTemplates[Item-templates]
    LocationsAPI[Locations]
    SyncAPI[Sync]
    AIAPI[AI]
    Static[Static + SPA fallback]
  end

  subgraph authRoutes [Auth]
    RegisterOrg[POST /api/auth/register-org]
    LoginRoute[POST /api/auth/login]
    Invite[POST /api/auth/invite]
  end

  subgraph billingRoutes [Billing]
    SuccessRedirect[GET /api/billing/success-redirect]
    PortalReturn[GET /api/billing/portal-return]
    CreateCheckout[POST /api/billing/create-checkout-session]
    ConfirmSub[POST /api/billing/confirm-subscription]
    CancelSub[POST /api/billing/cancel-subscription]
    CreatePortal[POST /api/billing/create-portal-session]
  end

  subgraph webhooks [Webhooks]
    StripeWebhook[POST /api/webhooks/stripe]
  end

  subgraph orgRoutes [Orgs]
    GetBreweryInfo[GET /api/orgs/:orgId/brewery-info]
    PutBreweryInfo[PUT /api/orgs/:orgId/brewery-info]
  end

  subgraph otherRoutes [Other]
    GetItemTemplates[GET /api/item-templates]
    GetItemTemplateId[GET /api/item-templates/:id]
    ImportItemTemplates[POST /api/item-templates/import]
    PostLocations[POST /api/locations]
    PostSync[POST /api/sync]
    PostAIChat[POST /api/ai/chat]
  end

  Auth --> RegisterOrg
  Auth --> LoginRoute
  Auth --> Invite
  BillingAPI --> SuccessRedirect
  BillingAPI --> PortalReturn
  BillingAPI --> CreateCheckout
  BillingAPI --> ConfirmSub
  BillingAPI --> CancelSub
  BillingAPI --> CreatePortal
  BillingAPI --> StripeWebhook
  OrgsAPI --> GetBreweryInfo
  OrgsAPI --> PutBreweryInfo
  ItemTemplates --> GetItemTemplates
  ItemTemplates --> GetItemTemplateId
  ItemTemplates --> ImportItemTemplates
  LocationsAPI --> PostLocations
  SyncAPI --> PostSync
  AIAPI --> PostAIChat
```

*Above: [5.2 Console](#52-console-view-tree) | Next: [Changes and bugs mapping](#changes-and-bugs-mapping)*

---

## Changes and bugs mapping

Major `changes/*` and [BUGS-AND-FIXES-LOG.md](../BUGS-AND-FIXES-LOG.md) mapped to diagram nodes.

| Change or bug | Diagram nodes / subsystems |
|---------------|----------------------------|
| **vessel-split-batch-locations-analysis** | Batch/Recipe: `batch_locations`, BatchLocationRepository, vessel splits, transferSplit |
| **batch-detail-redesign** | Level 5: BatchDetail (mobile + console); Level 3: Batch entities, milestones |
| **batch-tracking-console-migration** | Level 5: Console BatchesList, BatchDetail, BatchForm, BatchRecipeConsume; Level 3: Batch/Recipe |
| **billing-portal-deeplink-return** | Level 4: Billing–sync–UI; Level 5: Server API `portal-return`; mobile brewledger://settings |
| **billing-mobile-cleanup** | Level 3: Billing; Level 5: Mobile Billing view |
| **single-tier-billing-migration** | Level 3: Billing (single-tier, 100 locations, one price) |
| **server-error-handling-billing-overview** | Level 5: Server API (error middleware, billing route guards) |
| **ttb-beer-ledger-implementation** / **TTB-BEER-LEDGER-IMPLEMENTATION-LOG** | Level 3: TTB; Level 4: TTB data flow; beer category, RECEIVE, forced Production Complete milestone |
| **ttb-form-data-gap-analysis** | Level 3: TTB (rows/columns, data requirements) |
| **Milestone template forced Production Complete editable and duplicate** (BUGS-AND-FIXES-LOG) | Level 3: Batch/Recipe (MilestoneTemplateRepository, forced last milestone); strip before append, read-only in form |
| **Brewery name not in API or PDF** (BUGS-AND-FIXES-LOG) | Level 3: TTB; Level 5: Server API brewery-info GET; TTBPDFExportService; BreweryInfoForm |
| **Gap detection brewery name and county** (BUGS-AND-FIXES-LOG) | Level 3: TTB (TTBFormService detectDataGaps) |
| **Removal purpose mapping** (BUGS-AND-FIXES-LOG) | Level 3: TTB; Level 4: TTB data flow (Removals → ledger removal_purpose) |
| **Production-readiness pass** (mobile RemoveBeer beer items, detectDataGaps no-beer-items, formatBarrels clamp, mobile LocationForm TTB stage, server reject category delete) | Level 3: Inventory (getBeerItems), TTB (getBeerOnhandByStage, detectDataGaps); Level 5: Mobile LocationForm; server sync processChange category |
| **individual-global-par-levels-analysis** | Level 3: Inventory (ParLevels individual + global) |
| **promotional-landing-default-view** | Level 5: Console Landing (/), auth redirect to /dashboard |
| **blog-system-analysis**, **the-ledger-rebrand**, **ledger-news-site-redesign** | Level 5: Console Blog (The Ledger, /blog, sections, posts) |
| **sync-integration-verification** | Level 3: Sync; Level 4: Sync–Ledger–cache |

*Above: [Level 5](#level-5--ui-and-api-map) | End of document.*
