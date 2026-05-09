# Deployment

The app is a static React frontend plus a small Node/Express server that
proxies the Wiim API. The server has to run on a machine that can reach
the Wiim on your local network.

## Configuration

Two environment variables, both optional:

- `WIIM_HOST` — full URL to your Wiim, e.g. `https://192.168.1.13`.
  Defaults to `https://192.168.1.13`. Override if your device sits at a
  different IP.
- `PORT` — port the server listens on. Defaults to `3000`.

## Qobuz integration (optional)

Three additional environment variables enable Qobuz search and (later)
playback. If any are missing, the app runs normally without Qobuz
features.

- `QOBUZ_APP_ID` — application identifier the Qobuz web player uses.
- `QOBUZ_APP_SECRET` — paired secret, required for stream URL signing
  (used in a later phase, not yet by search).
- `QOBUZ_USER_AUTH_TOKEN` — your personal session token.

### How to get them

**App ID and App Secret.** The Qobuz web player has them embedded.
The simplest way: open `https://play.qobuz.com` in Chrome, log in,
open DevTools → Network → click any request to `*.qobuz.com`. The
`x-app-id` request header is your app_id. The app_secret is harder —
it's obscured in the JS bundle; either extract it manually following
a project like `qobuz-dl` (look at how their `bundle.js` parser
works), or borrow from a recent commit of an active downloader project.
Both values rotate occasionally; if Qobuz endpoints start failing
mysteriously, the rotation is usually why.

**User Auth Token.** Qobuz now uses an OAuth-style flow that's hard
to script directly. Easiest path: log in at `https://play.qobuz.com`,
open DevTools → Application → Local Storage → look for an entry
containing `user_auth_token` or `userAuthToken`. Copy the value.
Alternatively, look at any authenticated request's `x-user-auth-token`
request header. Tokens last for months but eventually expire — when
search starts returning 401s, repeat this step.

### Setting the variables

Add to your environment (or `docker run -e`, or systemd `Environment=`):

```
  QOBUZ_APP_ID=798273057
  QOBUZ_APP_SECRET=...
  QOBUZ_USER_AUTH_TOKEN=...
```

For local dev, you can also create a `.env` file in the repo root and
load it with a small change to `server/index.js` if needed — but env
vars passed directly to `npm start` work without any extra setup.

## Quick start (without Docker)

On any machine with Node 20+ that can reach the Wiim:
```sh
  git clone <your-repo>
  cd wiim-controller
  npm ci
  npm run build
  WIIM_HOST=https://192.168.1.13 npm start
```

Open `http://<server-ip>:3000` from any device on your network.

## Running it permanently

A simple way to keep the server running on a Linux box (Pi, NAS, old
laptop) is `systemd`. Create `/etc/systemd/system/wiim-controller.service`:

```yml
  [Unit]
  Description=Wiim Controller
  After=network.target
  [Service]
  Type=simple
  User=youruser
  WorkingDirectory=/home/youruser/wiim-controller
  Environment="WIIM_HOST=https://192.168.1.13"
  Environment="PORT=3000"
  ExecStart=/usr/bin/node server/index.js
  Restart=on-failure
  [Install]
  WantedBy=multi-user.target
```

Then:
```sh
  sudo systemctl daemon-reload
  sudo systemctl enable --now wiim-controller
  sudo systemctl status wiim-controller
```

## Running with Docker

```sh
  docker build -t wiim-controller .
  docker run -d 
  --name wiim-controller 
  --restart unless-stopped 
  -p 3000:3000 
  -e WIIM_HOST=https://192.168.1.13 
  wiim-controller
```

Or with `docker-compose.yml`:

```yml
  services:
  wiim-controller:
  build: .
  ports:
  - "3000:3000"
  environment:
  WIIM_HOST: https://192.168.1.13
  restart: unless-stopped
```

## Updating
```sh
  git pull
  npm ci
  npm run build
  sudo systemctl restart wiim-controller   # or docker restart wiim-controller
```

## Troubleshooting

**The app loads but says "Device unreachable."**
The server can't reach the Wiim. Check that `WIIM_HOST` is correct and
that the server machine can ping the device:

```sh
  curl -k https://192.168.1.13/httpapi.asp?command=getStatusEx
```

**Other devices on the network can't reach the server.**
The server binds to all interfaces by default, so this is usually a
firewall issue on the server machine, not an app issue. Ensure inbound
traffic to port 3000 is allowed.

**The Wiim's IP changed after a router restart.**
Either set a DHCP reservation on the router, or update `WIIM_HOST` and
restart the service.