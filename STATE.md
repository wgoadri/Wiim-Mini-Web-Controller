# STATE.md — Current Project State

> Snapshot of where the project stands. Update this at the end of each working session.
> For long-term vision and principles, see `CONTEXT.md`.

**Last updated:** 2026-05-08

---

## What works today

A single-page React app that controls a WiiM Mini on the local network. Running `npm run dev` opens a working remote at `http://localhost:5173`.

### Features

- **Device status display** — name (centered), current source, playback status, current track (artist + title), with a pulsing dot indicator when playing
- **Playback controls** — previous, play/pause, next. Real SVG icons. Play/pause icon swaps based on actual state. Pink/coral central play button as the visual anchor.
- **Volume slider** — 0–100, debounced (150ms). Reads from local state during drag, snaps back to polled value after release.
- **Preset buttons** — 6 buttons triggering preset slots 1–6 via `MCUKeyShortClick`. Labels match the user's actual WiiM Home presets. 2 columns on phone, 3 on desktop.
- **Source switcher** — Network / Line-In / Bluetooth, with the active source highlighted (yellow background + ring).
- **Status polling** — `getPlayerStatus` every 2 seconds with a 3-second per-request timeout to prevent pileup.
- **Connection error indicator** — "Device unreachable" warning when 3+ consecutive polls fail. Friendly startup error pointing to `.env.local` if the device can't be reached on first load.
- **Tailwind v4 styling** — playful warm cream + coral palette. Responsive on phone and desktop.

### Verified behaviors

- Preset buttons trigger Qobuz playlists configured in the WiiM Home app
- Spotify Connect playback is detected (mode `31` → "Spotify" label)
- Hex-decoding of track metadata works for French titles with accents
- Source switching works for all three inputs and the active-source highlight reflects reality
- Volume drags don't flood the network — only the final value is sent
- App keeps showing stale player data when polling fails, with a clear warning, instead of going blank
- Connection errors point the user at the actual fix (`.env.local` + restart)

---

## Architecture

### Stack

- **Vite + React + TypeScript**
- **Tailwind v4** with `@tailwindcss/vite` plugin and a small `@theme` block for the palette
- **No backend** — Vite dev proxy forwards `/api/wiim/*` to the device with `secure: false` to handle the self-signed cert
- **No state library** — `useState` + `useEffect` only
- **No tests** — there's no business logic worth testing yet

### File layout

```
/
├── src/
│   ├── api/
│   │   └── wiim.ts              # All device HTTP calls + types
│   ├── components/
│   │   ├── PlayerView.tsx       # Now-playing card, controls, volume — receives PlayerStatus
│   │   ├── PresetButtons.tsx    # 6 preset buttons
│   │   └── SourceSwitcher.tsx   # Network/Line-In/Bluetooth toggle
│   ├── App.tsx                  # Polls status, renders header, composes views
│   ├── main.tsx                 # Vite entry
│   └── index.css                # Tailwind import + theme tokens
├── scripts/
│   └── smoke.sh                 # Read-only device reachability check
├── .github/workflows/
│   └── ci.yml                   # typecheck + lint + build on push
├── vite.config.ts               # Dev proxy with secure: false
├── .env.local                   # VITE_WIIM_HOST=https://192.168.1.13 (gitignored)
├── CONTEXT.md                   # Long-term vision, principles
└── STATE.md                     # This file
```

### Key technical decisions

| Decision | Why |
|---|---|
| Vite dev proxy is the only path to the device | Wiim's self-signed cert blocks browser fetch. Proxy with `secure: false` handles it. |
| `.env.local` is the single source of truth for the host | One developer, one device. The custom-host UI was removed after multiple bugs and proved to be a speculative feature. To change the IP: edit one line, restart the dev server. |
| Hardcoded preset labels in source | The HTTP API can't read preset names — they live in the WiiM Home app. Editing the array is the simplest workflow. |
| Tailwind v4 | A coherent palette + responsive breakpoints across components without per-component duplication. The `@theme` block keeps tokens in one place. |
| 2-second polling, 3-second fetch timeout | Device only exposes HTTP. Timeout prevents request pileup if anything stalls. |
| No tests yet | Almost no logic to test. `hexDecode` is the first candidate when the second utility appears. |

---

## Known mode codes

Discovered empirically on the WiiM Mini. Used in `readableMode()` and `SourceSwitcher`.

| Code | Meaning |
|---|---|
| `0`  | Idle (nothing selected) |
| `10` | Network streaming (Qobuz, Tidal, generic) |
| `31` | Spotify Connect |
| `40` | Line-In |
| `41` | Bluetooth |

If a new mode shows up as `Mode XX`, log it and add it to the mapping.

---

## How to work on it

```bash
npm run dev        # Start dev server
npm run check      # typecheck + lint + build (run before committing)
npm run smoke      # Hit the real Wiim with read-only commands
```

CI runs `npm run check` on every push to `main`. Smoke test only runs locally — the GitHub runner can't reach your Wiim.

To change the device IP: edit `VITE_WIIM_HOST` in `.env.local` and restart the dev server. There is intentionally no UI for this.

---

## Open issues / rough edges

- **`Wiim error 502`** would surface generically if the proxy ever can't reach the device. The user-facing message is fine, but the underlying error string isn't pretty.
- **Wiim Mini occasionally goes idle** between polls; the warning correctly fires, but a brief "reconnecting…" treatment instead of a static red message would feel calmer.

---

## What's next

Two phases agreed:

### Phase A — Polish round (next)

Frontend-only, no architectural change. Goal: turn a functional remote into something that feels good to use.

- **Album art** via iTunes Search API. Free, no auth, surprisingly good coverage from artist + album. The single biggest visual win.
- **Track progress bar.** `curpos` and `totlen` are already in `PlayerStatus`. Read-only at first; consider seeking later.
- **Track info panel (collapsible).** Optional dropdown under the now-playing card showing album, year, and a short artist/album description. Source TBD — possibly Wikipedia summaries, MusicBrainz, or Last.fm. Pick the simplest free option.
- **Design refinement pass.** Now that album art changes the visual weight of the now-playing card, the surrounding layout (controls, presets, source) should be re-balanced. Possibly: bigger artwork, tighter control row, more breathing room.

### Phase B — Qobuz integration

Real architecture change: introduces a backend. Plan as 3 sessions, not one.

- **Phase 0 — Discovery.** Find a working `app_id`/`app_secret` pair. Validate the auth flow (user token via username + password hash) with `curl`. Confirm we can hit `track/getFileUrl` and get a playable stream URL. **No code in the project until this works.**
- **Phase 1 — Backend skeleton.** Smallest possible Express server. Endpoints: `/qobuz/login`, `/qobuz/search`, `/qobuz/track-url/:id`. Secrets stay server-side. Process runs alongside the Vite dev server.
- **Phase 2 — Frontend wiring.** Search UI, results list, "play this" button that calls our backend, gets a stream URL, and sends it to the Wiim via `setPlayerCmd:play:{url}`.

Risks to flag now: Qobuz has no official public API; auth and endpoints can break without notice. The first session's job is to find out whether it currently works at all before committing.

---

## Maybe later

- **Keyboard shortcuts** — space, arrows. Nice on desktop. Cheap.
- **Mute toggle button.** The `mute` field is already there.
- **Lyrics** via lyrics.ovh (free, mediocre catalog). Fun, low value.
- **PWA / install prompt.** Add only if used daily on mobile.
- **Multi-device support.** Only relevant once a second WiiM exists.

---

## Probably not

- **Spotify Web API integration.** Spotify Connect already does the job — open Spotify, pick the WiiM as the device, control from there. Building it into our app duplicates working functionality.
- **Web Bluetooth.** No concrete use case, unsupported on iOS Safari.
- **Custom host UI** (already removed). Don't re-add unless we deploy this somewhere with multiple devices.
- **Wikipedia / tabs / decorative integrations.** All considered and skipped.

---

## Updating this file

After each feature ships, update three sections:

1. **What works today** — add the new behavior
2. **Open issues** — note anything new that's rough but not blocking
3. **What's next** — re-rank based on what changed

Keep it under 300 lines. If it grows beyond that, something's wrong with the project, not the doc.