## Created with Capacitor Create App

This app was created using [`@capacitor/create-app`](https://github.com/ionic-team/create-capacitor-app),
and comes with a very minimal shell for building an app.

### Running this example

To run the provided example, you can use `npm start` command.

```bash
npm start
```

### Capacitor live reload (device testing)

For live reload against the Vite dev server on a physical device:

1. Set `host: true` in `vite.config.js` (or use your machine's LAN IP).
2. Add a `server` block to `capacitor.config.json` pointing at your dev server:

```json
"server": {
  "url": "http://YOUR_LAN_IP:5173/",
  "androidScheme": "http",
  "cleartext": true
}
```

Replace `YOUR_LAN_IP` with your machine's local network address. Remove the `server` block before production builds.
