# Code review (2026-07-03)

Critical review of the Unicorn (RvA) codebase — atelier stack, audio, prefetch,
service worker, content model, and ops. Replaces the earlier review docs that
described the removed spatial-audio architecture.

**Status at review time:** `pnpm check` and `pnpm build` pass. ~3k lines of
source across 33 TS/Svelte files. Six drawings, two audio tracks.

**Updated 2026-07-03:** Audio memory-pressure fixes shipped (SW `Blob.slice`,
`<audio>` preload policy, buffer release on track switch / leave).

---

## Audio memory requirement

As the catalog grows (longer and more recordings), RAM use must stay **bounded
by one active playback pipeline + read-ahead**, not by catalog size.

Service worker and HTTP cache are implementation details. What matters:

| Rule | Rationale |
|------|-----------|
| Stream compressed audio incrementally | Browser default via Range requests — do not break it |
| Never materialize whole files in JS | `arrayBuffer()`, full-file `fetch` + blob in app code, `decodeAudioData` |
| Load audio only on tap | Unplayed tracks ≈ 0 RAM |
| One `<audio>` element | One decode pipeline at a time |
| Tight preload until play | `metadata` idle; `auto` only while listening |
| Release decode buffer on track switch / leave | Drop previous `src` when switching pieces or resetting |

**Where bytes may live (all acceptable):** disk cache (SW or HTTP), network
stream, browser decode read-ahead buffer. **Not acceptable:** copying an entire
recording into the service worker JS heap per range request.

### Shipped mitigations

- **`scripts/sw.template.js`** — `serveRangeFromCached` uses `blob().slice()`
  instead of `arrayBuffer()` (Workbox-style streaming 206 from cache storage).
  Static-media matcher is extension-guarded so dev paths (`/src/lib/atelier/*.css`,
  `+page.svelte`) and the `/atelier/` HTML route are never cached.
- **`audio-player.svelte.ts`** — `preload='metadata'` by default; `'auto'` only
  in `playDrawing`; `removeAttribute('src')` + `load()` when switching tracks
  or on `stop({ reset: true })`.

### Still to watch as catalog grows

- Do not precache all audio on SW install (currently only hall/thumbs — keep it
  that way; lazy cache on first play is fine).
- Optional: release `src` on fade-out stop (not reset) if resume-across-pan is
  not worth the retained decode buffer.

---

## Executive summary

**Verdict:** Production-ready for a personal artist site at current scale. The
atelier core is coherent and performance-aware. Main risks before the catalog
grows: **no automated tests**, **pointer-only piece selection**, **hit testing
that ignores visual stacking**, and **silent audio failure paths**.

The explicit-listen refactor (`listening.svelte.ts` + `audio-player.svelte.ts`)
is a clear improvement over the old spatial-audio model.

---

## Architecture (current)

```
+page.svelte → createAtelierSession()
  ├── createAtelierView()      — pan/zoom, per-piece sharp zoom cap
  ├── createListening()        — tap-focus + HUD phase
  ├── audio-player (singleton) — one <audio>, gesture-owned play()
  ├── createAtelierGestures()  — pointer/wheel/keyboard
  └── prefetch.svelte          — serial full-res queue
```

| Layer | Files |
|-------|--------|
| Page shell | `src/routes/(site)/atelier/+page.svelte` |
| Orchestration | `src/lib/atelier/atelier-session.svelte.ts` |
| View / pan-zoom | `src/lib/atelier/view.svelte.ts`, `view-math.ts` |
| Gestures | `src/lib/atelier/gestures.svelte.ts` |
| Listening session | `src/lib/atelier/listening.svelte.ts` |
| Audio engine | `src/lib/atelier/audio-player.svelte.ts`, `audio-format.ts` |
| Prefetch | `src/lib/drawing/prefetch.svelte.ts`, `visible-drawings.ts` |
| Content | `src/lib/content.ts`, `content-types.ts`, `content-derive.ts` |
| Service worker | `scripts/sw.template.js`, `service-worker.mjs` |

Agent constraints and file map: [`CURSOR.md`](./CURSOR.md). Workflow and
deployment: [`README.md`](./README.md).

---

## What’s working well

### Layering

`createAtelierSession` is a good orchestration boundary; route pages stay thin.
Session composes view, listening, gestures, prefetch, and the audio singleton
without circular dependencies.

### Performance choices

- Pan/zoom via CSS `translate` + `scale` only — correct for GPU compositing.
- Full-res JPEGs gated by **viewport coverage** (`ATELIER_PREFETCH.fullResCoverage`), not raw zoom — scales better as the catalog grows.
- Serial full-res decode (`fullMaxConcurrent: 1`) — sensible on slow networks.
- Per-drawing `maxSharpZoomForDrawing()` — honors the “still sharp at max zoom?” litmus test in CURSOR.md.
- `box-shadow` instead of `filter: drop-shadow` on pieces — avoids GPU raster blow-up when zoomed (`DrawingPiece.svelte`).

### Audio engine

`audio-player.svelte.ts` is thoughtfully built:

- `playGeneration` invalidates stale async metadata handlers.
- Resume positions per drawing when switching mid-recording.
- Web Audio gain crossfade instead of relying on `<audio>` volume alone.
- `pickAudioSrc()` handles WebM vs m4a per browser.

### Ops and security

- GitHub Actions with LFS, ffmpeg, frozen lockfile, Pages artifact upload.
- CSP configured in `svelte.config.js` (including Svelte `script-src-attr` hash).
- Static adapter with SPA fallback — appropriate for GitHub Pages.

---

## Critical issues

### 1. No automated tests

There are zero test files. Highest-risk logic:

| Area | Why it matters |
|------|----------------|
| `drawingAtCanvasPoint` | Rotated hit boxes; wrong piece → wrong audio |
| `playDrawing` / `stop` state machine | Crossfade, resume, stale callbacks, `fromStart` |
| `prefetchIntentsForView` | Coverage threshold, visible-set math |
| `maxSharpZoomForDrawing` | Regressions break the core product promise |
| `pickAudioSrc` | Browser format selection |

**Recommendation:** Add Vitest (or similar) for pure modules first
(`drawing-geometry`, `view-math`, `content-derive`, `audio-format`,
`visible-drawings`). Audio player can be tested with mocked `AudioContext` /
`HTMLAudioElement`.

---

### 2. Hit testing ignores z-order

`drawingAtCanvasPoint` walks `content.ts` array order and returns the **first**
intersection. Pieces use `z-index: 1` normally and `z-index: 10` on hover, but
hit testing does not match DOM stacking.

Overlapping or rotated pieces can focus/play the wrong one as placements get
denser.

**Recommendation:** Iterate in reverse paint order (or track an explicit
`zIndex` in content), matching visual stacking.

**Files:** `src/lib/atelier/drawing-geometry.ts`, `src/lib/atelier/gestures.svelte.ts`.

---

### 3. ~~Accessibility — canvas is pointer-first~~ — shipped

**Fixed:** Full keyboard support in the atelier.

- **Tab order:** Terug → canvas (pan/zoom) → werken (roving `tabindex`).
- **Canvas focused:** pijltjestoetsen / WASD pan, `+`/`−` zoom, Escape terug.
- **Werk focused:** pijltjestoetsen / Home / End roven tussen werken (top→bottom, links→rechts); canvas schuift het werk in beeld (`revealDrawing`); Enter/Space activeert (zoom + audio).
- **Focus rings** on viewport and piece buttons.

**Files:** `Canvas.svelte`, `DrawingPiece.svelte`, `keyboard-pieces.ts`, `view.svelte.ts` (`revealDrawing`), `gestures.svelte.ts`.

---

### 4. Silent audio failures

Failure paths are swallowed in `audio-player.svelte.ts`:

- `void el.play().catch(() => {})`
- Empty `catch {}` around `currentTime` assignment and `ctx.resume()`

If playback fails (missing WebM on deploy, iOS gesture timing, corrupt file),
the UI shows “playing” via `listening.focus()` but nothing is heard.

**Recommendation:** On `play()` rejection or `error` event, call
`listening.markEnded()` or surface a non-blocking error state in `NearCue`. At
minimum, `console.warn` in dev builds.

---

### 5. ~~Service worker audio caching — memory pressure~~ — shipped

~~In `scripts/sw.template.js`, `serveRangeFromCached` loads the **entire cached
audio file into an `ArrayBuffer`** to slice range responses.~~

**Fixed:** Range responses from cache use `Blob.slice()` so the 206 body streams
from cache storage without a full JS heap copy. Paired with `<audio>`
`preload='metadata'` until play and `src` release on track switch / leave.

**Files:** `scripts/sw.template.js`, `src/lib/atelier/audio-player.svelte.ts`.

---

## Medium issues

### 6. Dual activation path (pointer + button)

Focus can arrive from:

1. Pointer-up hit test in `gestures.svelte.ts`
2. `<button onclick>` in `DrawingPiece.svelte`

`piece-activation.ts` suppresses duplicate clicks via a microtask flag. It
works but is fragile — easy to break with a third entry point (e.g. keyboard
focus).

**Recommendation:** Single activation funnel: buttons handle activation;
viewport pointer-up only starts pan/zoom unless the target is the button (or
drop buttons and use one path).

---

### 7. Manual content maintenance is error-prone

Each drawing requires hand-entered:

- `srcWidth` / `srcHeight` (must match actual JPEG dimensions for sharp zoom)
- `portrait` / `landscape` coordinates
- Optional `rotation`, `width`, `track`

Nothing validates that coordinates fit the computed canvas or that filenames
exist.

**Recommendation:** Extend build scripts (e.g. `content-drawings.mjs`) to probe
image dimensions and assert file presence, similar to thumb generation.

---

### 8. Magic-number sync between CSS and TS

`PIECE_MAT` in `drawing-geometry.ts` must stay aligned with `.piece__mat`
padding and plaque height in `DrawingPiece.svelte`. Same for `LEATHER_PAD_INSET`
vs `backgrounds.css`. Comments call this out; there is no compile-time guard.

---

### 9. Tooling gap

Only `pnpm check` (svelte-check). No ESLint, Prettier, or CI lint step. Fine for
a solo project today; will drift as edits accumulate.

---

## Minor observations

| Topic | Note |
|-------|------|
| Zoom cap off-piece | `maxZoomAt` falls back to `peakMaxZoom` when the cursor is not over a drawing — you can zoom past one piece’s sharp limit while inspecting another. Probably intentional. |
| Audio preload | `metadata` until tap; `auto` only during playback — see Audio memory requirement above. |
| TypeScript 6.0.2 | Very new; watch for ecosystem friction. |
| Silent pieces | Focusing a drawing without `track` still shows `NearCue` and requests full-res — coherent “look but don’t listen” behavior. |
| View Transitions | Gracefully skipped when `prefers-reduced-motion` — good. |
| `audioIndexForDrawing` | Precomputed `Map` in `content.ts` — no longer a per-frame cost (fixed since earlier review). |

---

## Priority recommendations

1. **Tests** — geometry, view math, prefetch intents, audio format selection, audio player state transitions.
2. **Hit-test stacking** — before adding overlapping placements.
3. **Keyboard-accessible piece selection** — minimum viable for operable UX.
4. **Surface audio errors** — instead of silent `catch`.
5. **Build-time content validation** — image dimensions, audio file presence, coordinate bounds.
6. **Optional:** ESLint + format in CI as the codebase grows.

---

## Review checklist (track progress)

### Tier 1 — behavioral / reliability

- [ ] Automated tests for pure modules and audio state machine
- [ ] Hit testing respects visual z-order
- [x] Keyboard path to focus any drawing (roving tabindex + arrows + Enter)
- [ ] Audio play/error feedback when `play()` or load fails
- [x] Low RAM audio: SW `Blob.slice` range serving, tight preload, buffer release on switch/leave

### Tier 2 — maintainability

- [ ] Single piece-activation funnel (pointer vs button)
- [ ] Build-time validation of content.ts vs static assets
- [ ] Lint/format in CI (optional)

---

## Bottom line

Well-crafted, constraint-driven implementation for an immersive drawing gallery.
The atelier stack shows real attention to sharpness, gesture feel, and mobile
networks. Gaps are mostly **scale and resilience**: no tests, pointer-first UX,
stacking bugs waiting on denser layouts, and silent failure modes in audio. Audio
memory pressure for long/many recordings is addressed; fine for six pieces —
address remaining Tier 1 before the catalog grows significantly.
