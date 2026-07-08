# BrewLedger Mobile App

Capacitor 6 mobile application for iOS and Android. Offline-first brewery management with IndexedDB local storage and sync to the BrewLedger API server.

## Location in the monorepo

```
platforms/brewledger-app/
├── src/              # Vue 3 app source
├── android/          # Android native project
├── ios/              # iOS native project
├── capacitor.config.json
└── package.json
```

## Prerequisites

- Node.js 18+
- API server running (see root [README](../../README.md))
- For device builds: Android Studio and/or Xcode

## Development (web)

Run the app in a browser during development:

```bash
cd platforms/brewledger-app
npm install
npm run dev
```

## Build and sync native projects

```bash
npm run build
npm run cap:sync
```

Open in native IDEs:

```bash
npm run cap:open          # Android (default)
npx cap open ios          # iOS
```

## Device testing with live reload

For live reload against the Vite dev server on a physical device:

1. Ensure `host: true` in `vite.config.js` (or use your machine's LAN IP).
2. Add a `server` block to `capacitor.config.json` pointing at your dev server:

```json
"server": {
  "url": "http://YOUR_LAN_IP:5173/",
  "androidScheme": "http",
  "cleartext": true
}
```

Replace `YOUR_LAN_IP` with your machine's local network address. Remove the `server` block before production builds.

3. Set `VITE_API_BASE_URL` to your API server (use LAN IP for physical devices, not `localhost`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production web build |
| `npm run preview` | Preview production build |
| `npm test` | Frontend Vitest tests |
| `npm run test:backend` | Backend integration tests |
| `npm run test:all` | Frontend + backend tests |
| `npm run cap:sync` | Sync web build to native projects |
| `npm run cap:open` | Open Android project in Android Studio |

## App Store distribution

This repository includes source only. You are responsible for code signing, store listings, and publishing binaries. See the mobile build section in [FAQ.md](../../FAQ.md).

## Related documentation

- [Root README](../../README.md)
- [Getting started](../../docs/getting-started.md)
- [Architecture](../../ARCHITECTURE.md)
