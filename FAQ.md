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

Yes. Clone the repo, copy `.env.example` to `.env`, run `node init_db.js` in `server/`, start the server and console. Core features (inventory, batches, ledger, serving, TTB form generation) work without Stripe, QBO, SES, or AI.

## Do I need Stripe?

No for core ops. Stripe powers subscription billing in the original product. If `STRIPE_SECRET_KEY` is unset, billing endpoints return 503 and you can use the app without payment gating (trial logic may still exist in the UI — adjust for your deployment).

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

## Is there a hosted version at getbrewledger.com?

The original author operated a hosted deployment. **This open-source repo is independent** — no hosted service, uptime guarantee, or support is included. Deploy your own instance or run locally.

## What license applies?

MIT. You may use, modify, and distribute the code with attribution. See [LICENSE](LICENSE).

## How do I report security issues?

Open a GitHub Issue. There is no bug bounty program. Do not commit secrets — use `.env` (gitignored) and `.env.example` as a template.

## Will you merge my pull request?

Best-effort. PRs that fix bugs, improve docs, or harden security are welcome. Large feature additions may be reviewed slowly or declined if they don't fit the reference scope.

## Data privacy

Self-hosted: all organization data stays in your SQLite database on your machine or server. You are responsible for backups and access control.

## TTB compliance disclaimer

BrewLedger includes tools to help prepare TTB Form 5130.9 data from your operational records. **This is not legal or tax advice.** You are responsible for accuracy and regulatory compliance. Consult a qualified professional for TTB filings.

## Why was the blog removed?

The blog was editorial content (industry news, guides) separate from the brewery management product. It is not licensed for redistribution in this release and is excluded to keep the public repo focused on application code.

## Relationship to the private repository

This public repository is a **clean export** with fresh git history. It is not a mirror of the private development repo. Internal commit history, blog posts, and dev analysis docs are not included.

## How do I export / update the public repo from a private fork?

If you maintain a private fork with additional changes, run `scripts/prepare-oss-export.ps1` to copy an allowlisted tree to a clean directory, verify no secrets, then commit and push to the public remote.
