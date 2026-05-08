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