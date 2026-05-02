# CONTEXT.md — Wiim Mini Web Controller

## Mission

Build a browser-based web app to control a Wiim Mini multiroom streamer from desktop, tablet, or mobile. The app integrates with:

- the **Wiim Mini local HTTP API** (LinkPlay-based)
- the **Qobuz API** for streaming
- the **Web Bluetooth API** as a later enhancement

The project deliberately stays small and focused: a personal-scale tool, built incrementally, optimized for clarity and correctness — not cleverness.

---

## Guiding Principles (Reminder)

The full behavior rules live in the project's behavior document. The short version:

- **Simplicity first.** Build the smallest thing that works, then iterate.
- **No premature abstraction.** No speculative features. No frameworks-inside-the-app.
- **Refactor continuously**, in small steps, when real complexity (not imagined complexity) appears.
- **Prefer a refactorable simple solution today** over a "perfect" architecture that slows everything down.

---

## Key Technical Questions to Answer First

These are the unknowns that shape the architecture. They get answered in **Phase 0** before any production code is written.

1. **Does the Wiim Mini local API support CORS?**
   If not, the browser cannot call the device directly — we will need a small local proxy (Node.js/Express, single file). This is the single biggest architectural decision and it cascades everywhere else.

2. **How is the device discovered?**
   Options, simplest first: manual IP entry → mDNS/Bonjour (needs backend) → UPnP/SSDP (needs backend). Start with manual entry unless we discover a trivially better path.

3. **What Qobuz API endpoints are usable, and how is auth done?**
   Qobuz has no fully official public API. We need to validate the auth flow (`app_id` + `app_secret` + user token) and that the endpoints we need (search, track URL resolution) work reliably. CORS will hit here too — likely the same proxy as Wiim.

4. **Does Web Bluetooth give us anything we actually need?**
   Probably a "nice to have." Note it is **not supported on iOS Safari**. Defer the decision until the core app works.

> If a backend proxy is needed for (1) or (3), accept it early and move on. A minimal Express server is not over-engineering — it is the simplest viable solution to a real browser constraint.

---

## Proposed Stack (Initial, Simple)

- **Frontend:** React + Vite + TypeScript
- **Styling:** Tailwind **or** CSS Modules — pick one, don't add both
- **State:** React's built-in state. Add Zustand only when global state actually appears.
- **Backend (if required):** Node.js + Express, one file to start, used only as a proxy
- **HTTP client:** `fetch`. No `axios` unless a real reason emerges.

No test framework on day one. Add Vitest when there's something worth testing — typically when refactoring becomes risky.

---

## Repository Structure (Flat to Start)

```
/
├── src/
│   ├── api/            # Wiim + Qobuz HTTP calls (one file each to start)
│   ├── components/     # UI components
│   ├── features/       # Feature folders, only when they grow
│   ├── hooks/          # Custom hooks, only when reused
│   └── utils/
├── server/             # Only if proxy is needed
│   └── index.ts
├── CONTEXT.md          # This file
└── README.md
```

Don't pre-create empty folders. Add them when the first file lands inside.

---

## Phased Plan

### Phase 0 — Discovery (½ to 1 day)

**Goal:** answer the key technical questions. No production code.

- Manual `curl` / Postman against a Wiim Mini on the local network
- Test CORS behavior from a blank browser tab
- Test Qobuz auth + a few endpoints with a real account
- Quick Web Bluetooth feasibility check (`navigator.bluetooth` availability)
- **Decide:** backend proxy yes/no?

**Deliverable:** a short notes file (`docs/discovery.md`) documenting findings and the proxy decision.

---

### Phase 1 — Wiim Core Control (MVP)

**Goal:** the smallest useful thing — control a single Wiim Mini from the browser.

- Connect to a device by IP (manual input, persisted in `localStorage`)
- Show current status: playing/paused, current track, volume
- Controls: play, pause, next, previous, volume up/down
- Status polling — simple `setInterval`, every 2–3 seconds

No accounts. No multi-device. No streaming services.

**Done when:** you can play, pause, and adjust volume on a real Wiim Mini from a browser, on both desktop and mobile.

---

### Phase 2 — Qobuz Integration

**Goal:** search Qobuz and play results on the Wiim.

- Qobuz auth (login screen, token in memory or `localStorage`)
- Search UI (track / album / artist)
- Send a resolved stream URL to the Wiim via its API
- Display "now playing" with Qobuz metadata (title, artist, artwork)

Keep the Qobuz module isolated under `src/api/qobuz.ts`. Resist generalizing for "any streaming service" yet — the abstraction will be wrong until we have a second concrete service.

---

### Phase 3 — UX Polish

**Goal:** make it pleasant to use, especially on mobile.

- Responsive layout
- Useful error states (device unreachable, auth expired, network down)
- Loading states
- Optional: device picker if multiple Wiims are detected on the network

---

### Phase 4 — Web Bluetooth (Optional, Progressive Enhancement)

**Goal:** only if a concrete user-facing benefit is identified.

Define the use case **before** building. If there is no clear benefit beyond "we can," skip it.

---

### Phase 5 — Maybe Later

Don't build now. Don't block either.

- Multiroom (multiple Wiim devices, grouping, sync)
- Other streaming services (Tidal, Spotify Connect)
- PWA (offline shell, install prompt)
- Playback queue management
- Server-side device discovery (mDNS)

---

## Open Decisions

- [ ] Backend proxy or pure frontend? *(Phase 0)*
- [ ] Tailwind vs. CSS Modules? *(before first component)*
- [ ] Where does Qobuz auth live — frontend `localStorage` or backend session? *(Phase 2)*
- [ ] Hosting plan — localhost only, or deployable somewhere?

---

## What We're Explicitly NOT Building (Yet)

- A plugin system for streaming services
- A unified "media library" abstraction
- User accounts or multi-tenant support
- A full Wiim/LinkPlay SDK
- Tests for code that hasn't been written

If one of these starts to feel necessary, that's a signal to revisit — but the default answer is **"not yet."**

---

## Definition of Done (Per Feature)

A feature ships when:

1. It works reliably on a real device.
2. The code is readable by someone seeing it for the first time.
3. It can be modified without rewriting surrounding code.
4. There is no obvious unnecessary complexity.

That's the bar. Nothing more.
