# BrewLedger — Frequently Asked Questions

## Why open source?

BrewLedger was built as a full brewery operations platform but did not gain enough commercial traction to justify continued private development. Open-sourcing it lets the code serve as a portfolio piece, a reference for other builders, and a starting point for anyone who wants to self-host brewery management software.

## What is included in this repository?

- **API server** (`server/`) — Express backend with SQLite, auth, sync, batches, inventory ledger, TTB reporting helpers, and optional integrations.
- **Web console** (`platforms/console/`) — Vue 3 desktop-oriented SPA for managers.
- **Mobile app source** (`platforms/brewledger-app/`) — Capacitor app for iOS and Android (you build and sign binaries yourself).

## What is NOT included?

- **Blog / editorial content** — "The Ledger" news blog was removed from this release. It was separate editorial content, not part of the product.
- **Production database** — Your data lives in local SQLite; no hosted multi-tenant service is provided.
- **API keys** — Stripe, AWS SES, QuickBooks, OpenRouter keys are yours to obtain and configure.
- **App Store binaries** — Source only; you build and publish mobile apps yourself if desired.
- **Internal development notes** — Feature analysis docs from private development are not exported.

## Can I run this locally without paying for anything?

Yes. Clone the repo, copy `.env.example` to `.env`, run `node init_db.js` in `server/`, then start the server and console. See [docs/getting-started.md](docs/getting-started.md) for the full walkthrough.

Core features (inventory, batches, ledger, serving, TTB form generation) work without Stripe, QBO, SES, or AI.

## Do I need Stripe?

No for core ops. Stripe powers subscription billing in the original product. If `STRIPE_SECRET_KEY` is unset, billing endpoints return 503 and you can use the app without payment gating (trial logic may still exist in the UI—adjust for your deployment).

## Do I need QuickBooks Online?

No. QBO integration is optional for sales orders and invoicing sync.

## Do I need AWS SES?

No. Email (password reset, invites) requires SES env vars. Without them, the server logs a warning and skips sending mail.

## Do I need OpenRouter / AI?

No. The AI assistant returns 503 when `OPENROUTER_API_KEY` is unset.

## How do I build the mobile app?

1. Install dependencies in `platforms/brewledger-app/`.
2. Set `VITE_API_BASE_URL` to your server (LAN IP for physical devices).
3. `npm run build` then `npx cap sync`.
4. Open `android/` in Android Studio or `ios/` in Xcode.
5. Configure signing and deploy to devices or stores.

Capacitor native folders are included; `node_modules`, `Pods/`, and `build/` artifacts are gitignored.

## How do I deploy to production?

See [docs/deployment.md](docs/deployment.md) for the production checklist: build the console, set `STATIC_DIR`, configure TLS, and update URL-related environment variables.

## How does this repo relate to getbrewledger.com?

[getbrewledger.com](https://getbrewledger.com) is the commercial / hosted BrewLedger product. **This repository is the self-hosted open-source edition** (GPLv3). You can run the code here on your own hardware with no hosted service, uptime guarantee, or support included. Screenshots and branding in the docs may match the hosted product because they share the same application lineage.

## What license applies?

GNU General Public License v3.0 (GPLv3). You may use, modify, and distribute the code under the terms of the license, including sharing source when you distribute modified versions. See [LICENSE](LICENSE).

## How do I report security issues?

See [SECURITY.md](SECURITY.md). There is no bug bounty program. Do not commit secrets—use `.env` (gitignored) and `.env.example` as a template.

## Will you merge my pull request?

Best-effort. PRs that fix bugs, improve docs, or harden security are welcome. Large feature additions may be reviewed slowly or declined if they don't fit the reference scope. See [docs/contributing.md](docs/contributing.md).

## Data privacy

Self-hosted: all organization data stays in your SQLite database on your machine or server. You are responsible for backups and access control.

## TTB compliance disclaimer

BrewLedger includes tools to help prepare TTB Form 5130.9 data from your operational records. **This is not legal or tax advice.** You are responsible for accuracy and regulatory compliance. Consult a qualified professional for TTB filings.

## Why was the blog removed?

The blog was editorial content (industry news, guides) separate from the brewery management product. It is not licensed for redistribution in this release and is excluded to keep the public repo focused on application code.
