# Code quality review (2026-07-01)

Systematic walkthrough of the atelier stack — gestures, focus flow, audio engine, prefetch, service worker, and encode scripts.

**Progress:** work through tiers in order; check items off as decided or shipped. Update this file when status changes.

**Shipped on `main`:** #1 (unified focus path, `ad7fe81`), #3 removed (`?focus=` deep link, `0e59c2f`), CSP `script-src-attr` (`77c7ef6`).

**Shipped locally (pending commit / prod retest):** atelier-session orchestration, piece-focus pin, audio incognito fixes, `resolve`/`asset` path migration.

**Next up:** #2 (iOS inertia priming — partial A done).

Overall: layered architecture (`atelier-session` → view / piece-focus / spatial-audio-loop / audio-engine / gestures), thin `+page.svelte`, sensible perf choices (CSS transform pan/zoom, lazy audio, serial full-res prefetch). `pnpm check` clean.

### Architecture (current)

```
+page.svelte (shell)
  └── createAtelierSession()
        ├── createAtelierView()         — pan/zoom/canvas
        ├── createPieceFocus()          — tap highlight + pin until explore
        ├── createSpatialAudioLoop()    — RAF, displayNearDrawingId, nearCueDrawingId
        │     └── spatial-mix.ts        — pure proximity math + applyPinnedAudioFocus
        │     └── audio-engine          — singleton AudioContext, unlock, solo-near gain
        └── createAtelierGestures()     — onGestureAudio + onExplore
```

**Files:** `atelier-session.svelte.ts`, `piece-focus.svelte.ts`, `spatial-audio-loop.svelte.ts`, `spatial-mix.ts`, `audio-engine.svelte.ts`, `gestures.svelte.ts`.

---

## Tier 1 — Real behavioral gaps

### 1. Tap-to-focus bypasses unified focus path

- [x] **Shipped** (`ad7fe81`) — tap routes through `onFocusPiece` → `focusDrawing`; `suppressNextPieceButtonClick` kept.

All piece focus (tap, keyboard) goes through `atelier-session` `focusDrawing`: `unlock([id])`, `pieceFocus.focus(id)`, immediate `armSpatial()`, full-res prefetch, view animation.

- [x] **Decided:** Tap and keyboard use identical focus semantics.

**Files:** `gestures.svelte.ts`, `atelier-session.svelte.ts` (was `+page.svelte`).

---

### 2. iOS priming gap after gesture ends

- [ ] **Open** — **next**

`onGestureAudio(primeDrawingIds)` runs on `pointerdown` / `wheel` / `keydown` using **current** spatial state. After release, **inertia** can land on a new dominant piece with no new gesture — lazy track created in `applyMix`, `play()` may fail on iOS.

- [x] **Partial A** — `pointerdown` passes `pieceId` as hint into `onGestureAudio` / `unlock` (gestures ~line 100; session `primeDrawingIds`).

**Remaining options:**

- [ ] **B.** On failed `play()`, do not arm that track until the next gesture (graceful degradation).
- [ ] **C.** Accept as edge case at 2 tracks / 6 drawings.

---

## Tier 2 — Medium polish

### 3. ~~`?focus=` deep-link~~ — removed

- [x] **Shipped** (`0e59c2f`) — removed `?focus=` URL param, mount-time auto-focus, and `nearLockId`.

Replaced by `createPieceFocus()` (`focusedId` + `pinnedDrawingId` until `releasePin()` on explore). Entry is always fit-all overview; piece focus is tap/keyboard only.

---

### 4. `audioIndexForDrawing` re-filters every RAF frame

- [ ] **Open**

`src/lib/content-derive.ts` — `audioIndexForDrawing` calls `audioDrawingsFrom(flat).findIndex(...)` on every lookup. Called from `applyMix` every frame and from `indicesFor` on unlock.

Trivial at 6 pieces; wasteful as the catalog grows.

**Recommendation:** Precompute `Map<drawingId, audioIndex>` once in `content.ts` or `content-derive.ts`.

---

### 5. HMV plaque outside SW media coverage

- [ ] **Open**

`HMV_PLAQUE.src` = `/atelier/hmv-plaque.webp` (`hmv-plaque.ts`). SW `MEDIA_DIRS` only covers `drawings`, `audio`, `hall`. Template now uses `asset(HMV_PLAQUE.src)`.

**Options:**

- [ ] Add `static/atelier/` to media walk
- [ ] Move plaque under `static/hall/`
- [ ] Leave as-is (offline plaque not important)

---

## Tier 3 — Nice to have (low urgency at current scale)

- [ ] **Constants sync** — `HMV_PLAQUE_CSS_WIDTH`, `DRAWING_SLOT_PADDING_X`, mat padding spread across files
- [ ] **`listenPoints()` twice/frame** — `spatial-mix.ts`; irrelevant at n=6
- [ ] **Hit test vs paint order** — array order vs z-index on overlap
- [ ] **Background tab audio** — RAF skips `applyMix` when hidden but does not pause
- [x] ~~**RAF while disarmed**~~ — tap-focus arms immediately; pin holds dominant via `applyPinnedAudioFocus`
- [ ] **`DrawingImg` no `onerror`** — edge case
- [ ] **Thumb double-warm** — home warmup + SW precache; intentional, harmless
- [ ] **`clamp01` duplication** — `spatial-mix.ts` vs `math.ts`
- [ ] **`content-drawings.mjs` regex** — brittle but fails loudly at build; acceptable

---

## Shipped outside tier list (this session)

### Atelier session orchestration

- [x] **`createAtelierSession()`** — composes view, piece-focus, spatial loop, gestures, prefetch, mount lifecycle. `+page.svelte` is shell-only.

### Audio — prod incognito tap cutoff

- [x] **Gain-only `applyMix`** — no `pause()` in mix loop (`pauseThreshold` / `fadeOutPauseSec` removed from constants).
- [x] **`assertPlayback()`** — `unlock()` calls `play()` on already-primed tracks every gesture (door-primed maskers).
- [x] **`applyPinnedAudioFocus()`** — pinned piece stays dominant at ≥ `playThreshold` during tap-focus.
- [x] **Immediate `armSpatial()` on tap-focus** — no deferred play past gesture window.
- [x] **`preload = 'auto'`** on lazy `<audio>` elements.

**Retest:** incognito → door → atelier → single tap maskers / lachend-portret (no pan/zoom); music should play through.

### Paths API

- [x] **`base` → `resolve` / `asset`** — all four `import { base } from '$app/paths'` removed (`+page.svelte`, `atelier/+page.svelte`, `BackLink.svelte`, `DrawingPiece.svelte`).

---

## Performance (hot paths) — mostly fine

Reference only — no action items.

| Path | Assessment |
|------|------------|
| Pan/zoom transform | CSS `translate` + `scale` only — good |
| `computeSpatialMix` | ~12 listen-point calcs/frame — fine at 6 drawings |
| `drawingAtCanvasPoint` | O(n), n=6 — fine |
| Prefetch queue | Serial, coverage-gated — good for slow networks |
| `fullReady` Set spread | Re-renders all `DrawingImg` per completion — acceptable at 6 |
| SW range serving | Full `arrayBuffer` per range — OK for short piano tracks |

---

## Type safety — solid

Reference only — no action items.

- `strict: true`, `satisfies Atelier`, Svelte 5 runes
- Scripts use `@ts-nocheck` — acceptable for build tooling
- Minor: `onGestureAudio` not awaited by gesture callers (intentional fire-and-forget)

---

## Test gaps (high value only)

- [ ] **`spatial-mix.ts`** — zoom gate, near vs dominant, `applyPinnedAudioFocus`
- [ ] **`view-math.ts`** — `zoomAtPoint`, `clampView`, `fitViewToCanvas`
- [ ] **`drawing-geometry.ts`** — rotated hit test, `pieceBounds`
- [ ] **`pickAudioSrc`** — WebKit vs Chromium (mock `canPlayType`)
- [ ] **Focus flow integration** — tap → `session.focusDrawing` side effects (unlock, pin, arm)
- [ ] **SW `serveRangeFromCached`** — 206/416 edge cases

---

## Leave alone

- Singleton `AudioContext`, lazy tracks, solo-near mix
- `ssr = false` on atelier
- SW design (media-hash, thumbs-only precache, range audio)
- Gesture wheel/trackpad split
- `prefersReducedMotion` respected
- Content model (`portrait`/`landscape`, optional `track`)
- Encode scripts, CSP config (`script-src-attr` + Svelte delegation hash)
- `box-shadow` over `filter: drop-shadow` in `DrawingPiece.svelte`
- Current scale (6 drawings, 2 tracks)

---

## Implementation order

- [x] **1. Unify focus paths** — shipped (`ad7fe81`); refactored into `atelier-session`
- [ ] **2. iOS priming strategy** — **next** (hint on pointerdown done; inertia gap open)
- [x] **3. Remove `?focus=` deep-link** — shipped (`0e59c2f`); `piece-focus` module
- [ ] **4. Precompute audio index map**
- [ ] **5. SW coverage for `/atelier/` assets**
- [ ] **6. Tests**

---

## Session decisions (closed)

- [x] Fix #1 only (minimal) — focus path shipped; gain-only re-applied after prod incognito repro
- [x] Tap vs keyboard: identical focus semantics
- [x] Remove legacy `?focus=` deep-link entirely (not validate — delete)
- [x] Unify pin state in `piece-focus.svelte.ts` (was split `nearCuePinned` + getter into spatial loop)
- [x] Centralize orchestration in `atelier-session.svelte.ts`
- [x] Gestures: `onGestureAudio` + `onExplore` instead of `unlock` / `armSpatial` / `releasePin`
- [x] Migrate deprecated `base` to `resolve` / `asset`

## Session decisions (open)

- [ ] **#2:** B or C for remaining iOS inertia priming gap?
- [ ] **Audio retest** — confirm incognito tap cutoff fixed on prod after session audio changes

---

## Deferred / out of scope

- [x] **Audio `applyMix` gain-only** — shipped (incognito cutout from `pause()` in mix loop)
- [x] **Pin split across page + spatial loop** — consolidated in `piece-focus` + session
- [ ] **iPhone dev ~10s audio cutoff** — retest on `pnpm preview` / prod after full audio stack
