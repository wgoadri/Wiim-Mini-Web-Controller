# STATE.md — Current Project State

> Snapshot of where the project stands. Update this at the end of each working session.
> For long-term vision and principles, see `CONTEXT.md`.

**Last updated:** 2026-05-02

---

## What works today

A single-page React app that controls a WiiM Mini on the local network. Running `npm run dev` opens a working remote at `http://localhost:5173`.

### Features

- **Device status display** — name, current source, playback status, current track (artist + title)
- **Playback controls** — previous, play/pause toggle, next
- **Volume slider** — 0–100, applied immediately
- **Preset buttons** — 6 buttons triggering preset slots 1–6 via `MCUKeyShortClick`. Slot labels are hardcoded.
- **Source switcher** — Network / Line-In / Bluetooth, with the active source highlighted based on the device's reported mode
- **Status polling** — `getPlayerStatus` every 2 seconds, drives the UI live

### Verified behaviors

- Preset buttons trigger Qobuz playlists configured in the WiiM Home app
- Spotify Connect playback is detected (mode `31` → "Spotify" label)
- Hex-decoding of track metadata works for French titles with accents
- Source switching works for all three inputs and the active-source highlight reflects reality

---

## Architecture

### Stack

- **Vite + React + TypeScript** (Vite template, no extras)
- **No backend** — Vite dev proxy forwards `/api/wiim/*` to the device
- **No state library** — `useState` + `useEffect` only
- **No CSS framework** — inline styles, scoped per component
- **No tests** — there's no business logic worth testing yet

### File layout

```
/
├── src/
│   ├── api/
│   │   └── wiim.ts              # All device HTTP calls + types
│   ├── components/
│   │   ├── PresetButtons.tsx    # 6 preset buttons (hardcoded labels)
│   │   └── SourceSwitcher.tsx   # Network/Line-In/Bluetooth toggle
│   └── App.tsx                  # Single page, polls status, composes UI
├── scripts/
│   └── smoke.sh                 # Read-only device reachability check
├── .github/workflows/
│   └── ci.yml                   # typecheck + lint + build on push
├── vite.config.ts               # Dev proxy with secure: false (self-signed cert)
├── .env.local                   # VITE_WIIM_HOST=https://192.168.1.13 (gitignored)
├── CONTEXT.md                   # Long-term vision, principles
└── STATE.md                     # This file
```

### Key technical decisions

| Decision | Why |
|---|---|
| Vite dev proxy instead of a Node backend | Wiim's self-signed cert blocks browser fetch. Proxy is one config block; a separate Express server would be more code to maintain. |
| Device IP via `.env.local`, no UI | Simplest thing that works for one user on one network. Move to UI when actually needed. |
| Hardcoded preset labels | The HTTP API can't read preset names — they live in the WiiM Home app. Hardcoding is honest. |
| Inline styles | One developer, small app. Migrating to Tailwind/CSS Modules later is mechanical and cheap. |
| 2-second polling, no WebSocket | Device only exposes HTTP. 2s feels responsive enough for a remote. |
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

---

## Open issues / rough edges

- **Volume slider has no debounce.** Dragging it sends a burst of HTTP requests. Hasn't caused problems yet but it's wasteful. Add debounce when it matters.
- **No error UI for transient failures.** A single failed poll silently does nothing. Acceptable for now; revisit if "is it stuck or just slow?" becomes a real question.
- **Preset labels are placeholders** (`Preset 1`, `Preset 2`…). Should be edited to match what's actually in each slot.
- **Hardcoded device IP.** If the Wiim's DHCP lease changes, the app breaks until `.env.local` is updated and the dev server is restarted.

---

## What's next

In rough priority order. Pick what's most useful, not what's listed first.

### Likely next

- **Rename preset buttons** to match what's actually in each slot. 30-second change. Probably do this immediately.
- **Device IP in the UI** — input field + `localStorage` persistence + a "test connection" button. Removes the `.env.local` dependency and makes the app shareable. Half a day.
- **Volume debounce** — single `setTimeout` in the slider's onChange, 150ms. 5-minute fix.
- **Better error states** — show "Device unreachable" if 3 consecutive polls fail. Small but improves trust in the UI.

### Maybe later

- **Styling pass** — pick Tailwind or CSS Modules, do it in one go. Worth doing once everything else is stable.
- **Album art** — the API doesn't expose it directly, but there might be UPnP metadata we can pull. Investigate before committing.
- **Seek bar** — `curpos` and `totlen` are already in `PlayerStatus`. Mostly useful for non-streaming sources where seek makes sense.
- **Multiple device support** — switch between several WiiMs. Only relevant once a second device exists.

### Probably not

- **Qobuz API integration** — presets cover the use case. Only revisit if "search Qobuz from this app" becomes a real need.
- **Web Bluetooth** — no concrete use case has emerged. Skip unless one does.
- **PWA / install prompt** — works fine as a regular page. Add only if used daily on mobile.

---

## Updating this file

After each feature ships, update three sections:

1. **What works today** — add the new behavior
2. **Open issues** — note anything new that's rough but not blocking
3. **What's next** — re-rank based on what changed

Keep it under 300 lines. If it grows beyond that, something's wrong with the project, not the doc.