# STATE.md — Current Project State

> Snapshot of where the project stands. Update this at the end of each working session.
> For long-term vision and principles, see `CONTEXT.md`.

**Last updated:** 2026-05-09

---

## What works today

A deployable web app that controls a WiiM Mini on the local network. Run `npm run serve` (or deploy the Express server) and open from any device on the network.

### Features

- **Device status display** — name, current source, playback status, current track (artist + title + album), pulsing dot when playing
- **Album art** via iTunes Search API, cached in memory, with a styled placeholder fallback
- **Track progress bar** — animated bar + elapsed/total time, handles long tracks (`H:MM:SS`)
- **Collapsible artist bio** — first paragraph from French Wikipedia, with a "Read more" link
- **Playback controls** — previous, play/pause, next, with real SVG icons. Play/pause icon swaps based on actual state.
- **Volume slider** — 0–100, debounced (150ms)
- **Preset buttons** — 6 buttons triggering preset slots 1–6 via `MCUKeyShortClick`. Labels match the user's actual WiiM Home presets.
- **Source switcher** — Network / Line-In / Bluetooth, with active-source highlighting
- **Status polling** — every 2s with a 3s per-request timeout to prevent pileup
- **Connection error indicator** — "Device unreachable" warning after 3 consecutive failures; friendly startup error with config guidance
- **Production deployment** — Express server serves the built React app and proxies `/api/wiim/*` to the device. Single port, single process.
- **Docker support** — multi-stage Dockerfile, `.dockerignore`, ready for NAS or home-server use
- **Tailwind v4 styling** — playful warm cream + coral palette, responsive on phone and desktop

### Verified behaviors

- App accessible from phone and other computers on the network via `http://<server-ip>:3000`
- Album art and Wikipedia bio guards skip lookups for line-in and unknown metadata
- HTML entity decoding via `<textarea>` handles encoded track strings cleanly
- Hex-decoding of track metadata works for French titles with accents
- Preset buttons trigger Qobuz playlists configured in the WiiM Home app
- Spotify Connect playback is detected (mode `31` → "Spotify" label)

---

## Architecture

### Stack

- **Frontend** — Vite + React + TypeScript + Tailwind v4
- **Production server** — Express + `http-proxy-middleware`, single file at `server/index.js`
- **No state library** — `useState` + `useEffect` + small custom hooks
- **No tests** — almost no logic to test; first candidates would be `hexDecode`, `formatTime`, the unknown-metadata helpers
- **No backend (yet)** — the Express server is purely a static-file server + Wiim proxy. Qobuz Phase B will extend it.

### File layout

```
/
├── src/
│   ├── api/
│   │   ├── wiim.ts              # Wiim HTTP calls + types + helpers
│   │   ├── albumArt.ts          # iTunes Search API lookup, cached
│   │   └── artistInfo.ts        # French Wikipedia summary lookup, cached
│   ├── components/
│   │   ├── PlayerView.tsx       # Now-playing card + controls + volume
│   │   ├── PresetButtons.tsx    # 6 preset buttons
│   │   ├── SourceSwitcher.tsx   # Network/Line-In/Bluetooth toggle
│   │   └── TrackProgress.tsx    # Progress bar + time display
│   ├── hooks/
│   │   ├── useAlbumArt.ts
│   │   └── useArtistInfo.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css                # Tailwind import + theme tokens
├── server/
│   └── index.js                 # Express server: static + Wiim proxy
├── scripts/
│   └── smoke.sh                 # Read-only Wiim reachability check
├── .github/workflows/
│   └── ci.yml                   # typecheck + lint + build on push
├── Dockerfile
├── .dockerignore
├── vite.config.ts
├── .env.local                   # VITE_WIIM_HOST=https://192.168.1.13 (gitignored, dev only)
├── CONTEXT.md
├── STATE.md
└── DEPLOY.md
```

### Key technical decisions

| Decision | Why |
|---|---|
| Vite dev proxy in dev, Express in production | Both ignore the Wiim's self-signed cert (`secure: false`). Same shape, different host. The frontend code is identical. |
| `WIIM_HOST` (production) / `VITE_WIIM_HOST` (dev) | Single source of truth for the device URL, set per environment. No UI for it. |
| Server in plain JS with ES modules | One file, no build step, no extra TS toolchain for the server. The frontend stays in TypeScript. |
| `<details>` for the artist bio toggle | Native HTML element, no toggle state to manage, accessible by default. |
| In-memory cache (24h TTL) for iTunes + Wikipedia | Page reload re-fetches; that's fine. Avoids localStorage drift. |
| The `state.x === x` pattern in hooks | Avoids `setState`-in-effect lint errors. State stores both the input and the result; the visible value is derived. |

---

## Known mode codes

Discovered empirically on the WiiM Mini. Used in `readableMode()` and `SourceSwitcher`.

| Code | Meaning |
|---|---|
| `0`  | Idle |
| `10` | Network streaming (Qobuz, Tidal, generic) |
| `31` | Spotify Connect |
| `40` | Line-In |
| `41` | Bluetooth |

---

## How to work on it

```bash
npm run dev          # Vite dev server with hot reload
npm run check        # typecheck + lint + build
npm run smoke        # Hit the real Wiim with read-only commands
npm run serve        # Build + start production server
npm start            # Start production server (assumes dist/ exists)
```

**Configuration**
- Dev: `VITE_WIIM_HOST` in `.env.local`, restart `npm run dev` to pick it up.
- Production: `WIIM_HOST` env var passed to the Express server.

**Deployment**: see `DEPLOY.md` for Express direct, systemd, and Docker paths.

---

## Open issues / rough edges

- **`Wiim error 502`** would surface generically if the proxy ever can't reach the device. Friendly enough; the underlying error string isn't pretty.
- **Artist bio is French Wikipedia only.** Some international artists have an English entry but no French one. We hide the section silently when nothing's found — no fallback yet.

---

## What's next

### Phase B — Qobuz integration (active)

The user's Qobuz developer notes (`Gobuz_API`) shape the realistic scope here. Important constraint:

> "Use Qobuz mainly for: metadata, search, browsing, favorites, playlists.
> Avoid: direct stream extraction, download APIs, undocumented playback endpoints."

Search and metadata are stable. **Playback** is the hard part — turning a Qobuz track into something the Wiim plays requires either fragile stream-URL extraction or a UPnP/private-API path we haven't validated yet.

Phase 0 (discovery, no code) answers two questions:

1. **Does Qobuz auth + search still work today** with a current `app_id`?
2. **Can we bridge a Qobuz selection to Wiim playback** in a way we control?

If both yes → full Qobuz search-and-play feature.
If (1) yes and (2) no → smaller "search and browse Qobuz from the app" feature with no direct playback (limited but still useful).
If (1) no → stop. Don't build on broken foundations.

Phase 1 and beyond are deferred until Phase 0 produces clear answers.

---

## Maybe later

- **Keyboard shortcuts** — space, arrows. Nice on desktop. Cheap.
- **Mute toggle button.** The `mute` field is already there.
- **Lyrics** via lyrics.ovh (free, mediocre catalog). Fun, low value.
- **PWA / install prompt.** Add only if used daily on mobile.
- **English Wikipedia fallback** for artist bios when French has no entry.
- **Multi-device support.** Only relevant once a second WiiM exists.

---

## Probably not

- **Spotify Web API integration.** Spotify Connect already does the job.
- **Web Bluetooth.** No concrete use case, unsupported on iOS Safari.
- **Custom host UI.** Removed; `.env.local` / `WIIM_HOST` cover the need.
- **Wikipedia / tabs / decorative integrations.** Considered and skipped.

---

## Updating this file

After each feature ships, update three sections: **What works today**, **Open issues**, **What's next**. Keep it under 300 lines.