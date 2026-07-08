# BrewLedger Web Console

Desktop-oriented Vue 3 SPA for brewery inventory, production, reporting, and settings. The console shares the same backend API and sync protocol as the BrewLedger mobile app.

## Location in the monorepo

```
platforms/console/
├── src/           # Vue components, views, repositories, services
├── dist/          # Production build output (after npm run build)
├── vite.config.js
└── package.json
```

## Prerequisites

The API server must be running before you use the console. See the root [README](../../README.md) and [docs/getting-started.md](../../docs/getting-started.md).

## Development

```bash
cd platforms/console
npm install
npm run dev
```

Runs at `http://localhost:5174`. Vite proxies `/api` requests to `http://localhost:3000` (override with `VITE_PROXY_TARGET`).

## Production build

```bash
npm run build
```

Output is written to `dist/`. Point the server's `STATIC_DIR` environment variable at this directory for production. See [docs/deployment.md](../../docs/deployment.md).

Preview the production build locally:

```bash
npm run preview
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server (port 5174) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm test` | Run Vitest unit tests |
| `npm run test:watch` | Vitest in watch mode |
| `npm run verify-ttb-math` | Verify TTB Form 5130.9 expected math |

## Technology

- Vue 3 + Vue Router + Pinia
- Vite 7
- Tailwind CSS
- Dexie (IndexedDB) for offline-first local storage
- Axios for API calls

## Related documentation

- [Root README](../../README.md)
- [Getting started](../../docs/getting-started.md)
- [Architecture](../../ARCHITECTURE.md)
- [Contributing](../../docs/contributing.md)
