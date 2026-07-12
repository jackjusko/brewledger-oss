# Getting started

This guide walks you through running BrewLedger locally for development or evaluation.

## Prerequisites

- **Node.js 18+**
- **npm** (included with Node.js)

No database server is required—the API uses SQLite on disk.

## 1. Clone the repository

```bash
git clone https://github.com/jackjusko/brewledger-oss.git
cd brewledger-oss
```

## 2. Configure environment variables

Copy the example environment file to the repository root:

```bash
cp .env.example .env
```

The server reads `.env` from the repo root. Defaults work for local HTTP:

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | API server port |
| `HOST` | `0.0.0.0` | Bind address |
| `DB_PATH` | `./server/database.sqlite` | SQLite database file |
| `API_BASE_URL` | `http://localhost:3000` | Server URL for email links |
| `RESET_BASE_URL` | `http://localhost:5174/reset` | Password reset page URL |

You do not need Stripe, QuickBooks, SES, or OpenRouter keys for core brewery features. See [.env.example](../.env.example) for optional integrations.

### Console-specific variables (optional)

During local development, the Vite dev server proxies `/api` requests to `http://localhost:3000`—you usually do not need a separate console `.env` file.

For production builds or custom API URLs, you can set Vite variables in `platforms/console/.env.local` or your shell:

```bash
# platforms/console/.env.local (optional)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_PROXY_TARGET=http://localhost:3000
```

## 3. Install dependencies

Install packages for the server and web console:

```bash
cd server && npm install && cd ..
cd platforms/console && npm install && cd ../..
```

**Mobile app (optional):**

```bash
cd platforms/brewledger-app && npm install && cd ../..
```

## 4. Initialize the database

From the `server/` directory, create the SQLite schema:

```bash
cd server
node init_db.js
```

This creates `database.sqlite` (or the path set in `DB_PATH`). Re-running on an existing database is safe for schema setup; see server migration scripts if you are upgrading an older deployment.

## 5. Start the API server

```bash
cd server
npm start
```

The API listens at `http://localhost:3000`. Leave this terminal running.

## 6. Start the web console

Open a second terminal:

```bash
cd platforms/console
npm run dev
```

The console opens at `http://localhost:5174`.

## 7. First login

1. Open `http://localhost:5174` in your browser.
2. **Register** a new organization (brewery name, your email, password).
3. **Log in** with the credentials you just created.
4. Explore the main areas:
   - **Dashboard** — Overview, quick actions, low stock, recent activity
   - **Inventory** — Items, locations, receive, consume, transfer, par levels
   - **Batches** — Production batches, recipes, vessels, readings
   - **Reports** — TTB Form 5130.9, removals, losses, serving rollup
   - **Settings** — Organization, users, billing (if Stripe configured), integrations

New organizations start with an empty inventory. Add locations and items under Inventory, or receive stock to begin tracking.

## Troubleshooting

### Port already in use

If port 3000 or 5174 is taken, either stop the conflicting process or change `PORT` in `.env` (server) and update `VITE_PROXY_TARGET` in the console if needed.

### Console cannot reach the API

- Confirm the server is running (`npm start` in `server/`).
- In dev mode, the console proxies `/api` to `http://localhost:3000` via Vite. If you changed the server port, set `VITE_PROXY_TARGET` accordingly.
- For production builds served separately from the API, set `VITE_API_BASE_URL` to your API origin (e.g. `https://brewery.example.com/api`).

### Blank page or build errors in console

Run `npm install` again in `platforms/console/`. Ensure Node.js is 18 or newer (`node -v`).

### Database errors on first run

Run `node init_db.js` from `server/` before starting the server. Check that `DB_PATH` in `.env` points to a writable location.

## Next steps

- [deployment.md](deployment.md) — Run BrewLedger in production
- [contributing.md](contributing.md) — Run tests and submit changes
- [../FAQ.md](../FAQ.md) — Optional integrations and mobile builds
