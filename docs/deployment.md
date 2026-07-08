# Deployment

Checklist for running BrewLedger in production on your own server. This guide covers serving the built console from the API server with TLS. It does not include reverse-proxy or platform-specific instructions.

For local evaluation, see [getting-started.md](getting-started.md).

## Overview

In production, a single Node.js process typically:

1. Serves the REST API and sync endpoints
2. Serves the built web console as static files from `platforms/console/dist`
3. Terminates TLS directly (or sits behind a load balancer that terminates TLS upstream)

## Checklist

### 1. Build the web console

```bash
cd platforms/console
npm install
npm run build
```

Output is written to `platforms/console/dist/`.

If your API is on a different origin than the console, set `VITE_API_BASE_URL` before building:

```bash
VITE_API_BASE_URL=https://your-domain.example.com/api npm run build
```

### 2. Configure static file serving

In your root `.env`:

```bash
STATIC_DIR=./platforms/console/dist
```

When `STATIC_DIR` is set, the server serves the console SPA from that directory.

### 3. Enable HTTPS

Set TLS certificate paths in `.env`:

```bash
TLS_KEY_PATH=/path/to/privkey.pem
TLS_CERT_PATH=/path/to/fullchain.pem
```

Leave both empty for local HTTP only.

If TLS is terminated by a reverse proxy or load balancer in front of Node, you may run the API on HTTP internally and configure the proxy separately—that setup is outside this checklist.

### 4. Set production URLs

Update URL-related variables so email links and redirects point at your deployment:

```bash
API_BASE_URL=https://your-domain.example.com
RESET_BASE_URL=https://your-domain.example.com/reset
BILLING_RETURN_BASE_URL=https://your-domain.example.com
```

Adjust hostnames and paths to match how users reach your console.

### 5. Secure the server

- **Leave `MASTER_PASSWORD` empty** in production. It is for local testing only and allows login with any email plus that password.
- Restrict network access to the host (firewall, private network, or VPN as appropriate).
- Run the process under a dedicated system user, not root.

### 6. Database and backups

Data is stored in SQLite at the path set by `DB_PATH` (default `./server/database.sqlite`).

- Back up this file regularly.
- Ensure the directory is writable by the server process.
- Test restore procedures before you depend on backups.

### 7. Initialize or migrate the database

On a fresh server:

```bash
cd server
node init_db.js
```

If upgrading from an older BrewLedger version, run the relevant `migrate_*.js` scripts in `server/` in order before starting the server.

### 8. Start the server

```bash
cd server
npm install
npm start
```

Use a process manager (systemd, PM2, etc.) to keep the server running and restart on failure.

### 9. Optional integrations

Configure only what you need in `.env`:

| Integration | Key variables |
|-------------|---------------|
| Stripe billing | `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` |
| AWS SES email | `AWS_SES_REGION`, `AWS_SES_ACCESS_KEY_ID`, `AWS_SES_SECRET_ACCESS_KEY`, `AWS_SES_FROM_EMAIL` |
| QuickBooks Online | `QBO_CLIENT_ID`, `QBO_CLIENT_SECRET`, `QBO_REDIRECT_URI`, etc. |
| OpenRouter AI | `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` |

When unset, optional features return "not configured" and core brewery operations continue to work. See [.env.example](../.env.example).

## Mobile clients

Mobile apps connect to your API over HTTPS. Set `VITE_API_BASE_URL` when building the Capacitor app to your production API URL. See [../FAQ.md](../FAQ.md#how-do-i-build-the-mobile-app).

## Related documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) — System components and data model
- [SECURITY.md](../SECURITY.md) — Reporting security issues
