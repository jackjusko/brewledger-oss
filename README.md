# BrewLedger

Open-source brewery operations platform: inventory ledger, batch tracking, recipes, TTB Form 5130.9 reporting, serving/taproom workflows, and optional billing integrations.

This repository is a **reference implementation** and portfolio project. It is not a hosted SaaS — you run it yourself.

## What's included

| Component | Path | Description |
|-----------|------|-------------|
| API server | `server/` | Express + SQLite backend |
| Web console | `platforms/console/` | Vue 3 + Vite desktop web app |
| Mobile app | `platforms/brewledger-app/` | Capacitor 6 (iOS/Android) source |

See [ARCHITECTURE.md](ARCHITECTURE.md) for a system overview and [FAQ.md](FAQ.md) for detailed answers.

## Quick start (local development)

### Prerequisites

- Node.js 18+
- npm

### 1. Clone and configure

```bash
git clone https://github.com/YOUR_USER/brewledger.git
cd brewledger
cp .env.example .env
```

Edit `.env` if needed. Defaults work for local HTTP on port 3000.

### 2. Install dependencies

```bash
cd server && npm install && cd ..
cd platforms/console && npm install && cd ../..
cd platforms/brewledger-app && npm install && cd ../..
```

### 3. Initialize the database

```bash
cd server
node init_db.js
```

### 4. Start the API server

```bash
cd server
npm start
```

Server runs at `http://localhost:3000`.

### 5. Start the web console

In a second terminal:

```bash
cd platforms/console
npm run dev
```

Console runs at `http://localhost:5174`. Register an account, then log in.

### 6. Mobile app (optional)

```bash
cd platforms/brewledger-app
npm run build
npx cap sync
```

Open in Android Studio or Xcode. Point `VITE_API_BASE_URL` at your server (use your LAN IP for device testing).

## Optional integrations

Stripe billing, QuickBooks Online, AWS SES email, and the OpenRouter AI assistant are **optional**. When env vars are missing, those features return "not configured" — core brewery ops still work.

See `.env.example` for all variables.

## Publish to GitHub

After running the export script:

```powershell
cd oss-export
git -c safe.directory="$PWD" init   # if on a network share
git add .
git commit -m "Initial open-source release"
git branch -M main
git remote add origin https://github.com/YOUR_USER/brewledger.git
git push -u origin main
```

Create the public repo on GitHub first (empty, no README). Use `scripts/prepare-oss-export.ps1 -Force` to refresh the export before each publish.


## Contributing

Pull requests welcome. This is best-effort maintenance; no SLA on issues or features.

Report security concerns via GitHub Issues (no bug bounty).
