# BrewLedger

Open-source brewery operations platform for inventory, production, compliance, and taproom workflows. BrewLedger is MIT-licensed and self-hosted—you run the API server and web console on your own hardware.

Brewery operators use BrewLedger to track what they have, what they brewed, and what they served or removed. Developers can clone the repo, run it locally, fork it, or contribute fixes and improvements.

## What's included

| Component | Path | Description |
|-----------|------|-------------|
| API server | `server/` | Express + SQLite backend (auth, sync, ledger, batches, TTB helpers) |
| Web console | `platforms/console/` | Vue 3 desktop web app for day-to-day brewery management |
| Mobile app | `platforms/brewledger-app/` | Capacitor 6 source for iOS and Android (you build and sign binaries) |

## Features

- **Inventory ledger** — Receive, consume, transfer, and count stock with an append-only transaction history
- **Batch tracking** — Recipes, vessels, readings, milestones, and production-complete workflows
- **TTB Form 5130.9** — Tools to aggregate operational data into form field mappings (not legal advice—see [FAQ](FAQ.md))
- **Serving & taproom** — Tank occupancy, volume tracking, and removal workflows
- **Multi-device sync** — Offline-first clients (IndexedDB) sync with the server when online
- **Optional integrations** — Stripe billing, QuickBooks Online, AWS SES email, OpenRouter AI assistant (all degrade gracefully when unset)

## Stack at a glance

| Layer | Technology |
|-------|------------|
| API server | Node.js, Express 5, SQLite |
| Web console | Vue 3, Vite, Tailwind CSS, Dexie (IndexedDB) |
| Mobile app | Vue 3, Capacitor 6, Dexie (IndexedDB) |
| Auth | Token-based sessions with bcrypt password hashing |

See [ARCHITECTURE.md](ARCHITECTURE.md) for a system overview.

## Quick start

**Prerequisites:** Node.js 18+ and npm.

1. **Clone and configure**

   ```bash
   git clone <your-fork-or-upstream-url>
   cd brewledger
   cp .env.example .env
   ```

   Defaults work for local HTTP on port 3000. See [docs/getting-started.md](docs/getting-started.md) for details.

2. **Install dependencies**

   ```bash
   cd server && npm install && cd ..
   cd platforms/console && npm install && cd ../..
   ```

3. **Initialize the database**

   ```bash
   cd server
   node init_db.js
   ```

4. **Start the API server**

   ```bash
   cd server
   npm start
   ```

   Server runs at `http://localhost:3000`.

5. **Start the web console** (second terminal)

   ```bash
   cd platforms/console
   npm run dev
   ```

   Console runs at `http://localhost:5174`. Register an organization, then log in.

For first-login navigation, troubleshooting, and optional mobile setup, see [docs/getting-started.md](docs/getting-started.md).

## Documentation

| Document | Description |
|----------|-------------|
| [docs/getting-started.md](docs/getting-started.md) | Full local setup and first-login tour |
| [docs/deployment.md](docs/deployment.md) | Production checklist (TLS, static build, env vars) |
| [docs/contributing.md](docs/contributing.md) | How to contribute, run tests, submit PRs |
| [docs/README.md](docs/README.md) | Documentation index |
| [FAQ.md](FAQ.md) | Common questions about scope, integrations, and licensing |
| [ARCHITECTURE.md](ARCHITECTURE.md) | High-level system design |
| [SECURITY.md](SECURITY.md) | How to report security issues |

## Optional integrations

Stripe billing, QuickBooks Online, AWS SES email, and the OpenRouter AI assistant are optional. When environment variables are missing, those features return "not configured"—core brewery operations still work.

See [.env.example](.env.example) for all variables.

## Contributing

Pull requests are welcome. See [docs/contributing.md](docs/contributing.md) for setup, test commands, and PR expectations.

## License

MIT — see [LICENSE](LICENSE).
