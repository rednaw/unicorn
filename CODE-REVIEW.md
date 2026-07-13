# Code review (2026-07-13)

Critical review of the Unicorn (RvA) codebase — atelier stack, audio, prefetch,
service worker, content model, themes, and ops. Replaces the earlier review docs that
described the removed spatial-audio architecture.

**Status at review time:** `pnpm test` (41 tests) and `pnpm build` pass. `pnpm check`
has one known typing error in `vite.config.ts` (`simpleAnalyticsDevPlugin` —
`order: 'pre'` must be `as const` for Vite 7 plugin types). ~4k lines of source
across 47 TS/Svelte files plus 7 test files. Eight drawings, three with audio tracks.

**Updated 2026-07-13:** Vite pinned to 7.x and theme bootstrap moved to pre-built
`ATELIER_THEME_BOOTSTRAP_HTML` (Vite 8 Rolldown dep scan failed on inline
`{@html \`<script>${…}</script>\`}` in atelier `+page.svelte`, causing ~50s dev
starts). Vitest config split from `vite.config.ts` (`mergeConfig` + `ViteUserConfig`
cast). Hit testing now respects paint order. Prior updates: Vitest suite and CI
`test` job, catalog, room themes, Simple Analytics, `ssr = false`, accessibility
corrections, audio memory fixes.

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
- **Piece switch** — `atelier-session.svelte.ts` fades out the current track
  (`crossfadeMs`) before starting the next, matching pause/stop behaviour.

### Still to watch as catalog grows

- Do not precache all audio on SW install (currently only hall/thumbs — keep it
  that way; lazy cache on first play is fine).
- Optional: release `src` on fade-out stop (not reset) if resume-across-pan is
  not worth the retained decode buffer.

---

## Executive summary

**Verdict:** Production-ready for a personal artist site at current scale. The
atelier core is coherent and performance-aware. Main remaining risk before the
catalog grows: **limited keyboard navigation between pieces** (Tab order only —
no roving arrow keys).

**41 Vitest tests** cover pure modules and the audio-player state machine; CI runs
`pnpm test` on every push and pull request to `main`.

---

## Architecture (current)

```
+page.svelte → createAtelierSession()
  ├── createAtelierView()      — pan/zoom, per-piece sharp zoom cap, portrait/landscape
  ├── createListening()        — tap-focus + HUD phase
  ├── audio-player (singleton) — one <audio>, gesture-owned play()
  ├── createAtelierGestures()  — pointer/wheel/keyboard (canvas pan/zoom)
  └── prefetch.svelte          — serial full-res queue
```

| Layer | Files |
|-------|--------|
| Page shell | `src/routes/(site)/atelier/+page.svelte`, `+page.ts` (`ssr = false`) |
| Orchestration | `src/lib/atelier/atelier-session.svelte.ts` |
| View / pan-zoom | `src/lib/atelier/view.svelte.ts`, `view-math.ts`, `atelier-layout.ts` |
| Gestures | `src/lib/atelier/gestures.svelte.ts` |
| Listening session | `src/lib/atelier/listening.svelte.ts` |
| Audio engine | `src/lib/atelier/audio-player.svelte.ts`, `audio-format.ts` |
| Prefetch | `src/lib/drawing/prefetch.svelte.ts`, `visible-drawings.ts` |
| Room themes | `atelier-themes.ts`, `atelier-theme.svelte.ts`, `ThemePicker.svelte`, `backgrounds/` |
| Content | `src/lib/content.ts`, `content-types.ts`, `content-derive.ts` |
| Analytics | `src/lib/site-config.ts`, `src/app.html` |
| Service worker | `scripts/sw.template.js`, `service-worker.mjs`, `media-cache-key.mjs` |
| Tests | `vitest.config.ts` (merges `vite.config.ts`), `src/test/*`, `src/**/*.test.ts` |
| Tooling | Vite `^7.3.0` (pinned — see Dev tooling below) |

**Atelier `ssr = false`:** desk layout depends on viewport (portrait vs landscape
piece coordinates). Prerender would bake the wrong mode into HTML and worsen CLS.
Simple Analytics lives in `app.html` so the script is present in the static shell
for all routes, including client-only atelier.

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
- Portrait-specific `minPortrait` zoom floor — tall/narrow canvas can overview without hitting desktop `min` too early.
- `box-shadow` instead of `filter: drop-shadow` on pieces — avoids GPU raster blow-up when zoomed (`DrawingPiece.svelte`).

### Audio engine

`audio-player.svelte.ts` is thoughtfully built:

- `playGeneration` invalidates stale async metadata handlers.
- Resume positions per drawing when switching mid-recording.
- Web Audio gain crossfade instead of relying on `<audio>` volume alone.
- `pickAudioSrc()` handles WebM vs m4a per browser.
- Consistent fade-out when switching pieces or pausing (`atelier-session` + `stop({ fadeMs })`).
- `fromStart` replay resets `currentTime` on the same loaded element (fixed via test).

### Test coverage

Vitest + happy-dom (`pnpm test` / `pnpm test:watch`):

| File | What it guards |
|------|----------------|
| `content-derive.test.ts` | Audio list/index map, `maxSharpZoomForDrawing` |
| `audio-format.test.ts` | WebM vs m4a per browser / UA |
| `drawing-geometry.test.ts` | Bounds, hit test, current z-order behaviour |
| `view-math.test.ts` | Clamp, zoom-at-point, fit, coordinate transforms |
| `atelier-layout.test.ts` | Portrait/landscape mode, canvas dimensions |
| `visible-drawings.test.ts` | Visibility, prefetch coverage threshold |
| `audio-player.test.ts` | Play/stop/switch/resume/stale-callback state machine |

Audio tests mock `Audio` / `AudioContext` via `src/test/mock-audio.ts` and reset
the singleton through `resetAudioPlayerForTests()` between cases.

**Not yet covered:** gesture integration, Svelte components, listening session,
service worker, build scripts, E2E.

### Room themes

Nine CSS room themes with `localStorage` persistence and a blocking bootstrap
script in `<svelte:head>` to avoid a flash of the default theme. The script body
is exported as `ATELIER_THEME_BOOTSTRAP_HTML` from `atelier-themes.ts` and
injected via `{@html …}` — **not** an inline template literal in the Svelte file
(Vite 8’s Rolldown dependency scanner parses virtual module script blocks and
chokes on `${…}` interpolation). Theme picker is a native `<select>` with
safe-area and browser-chrome inset offsets.

### Ops and security

- GitHub Actions: dedicated **`test` job** (`pnpm test`) on push/PR; **`build`**
  (ffmpeg + `pnpm build`) and deploy only on push to `main`.
- LFS, frozen lockfile, Pages artifact upload.
- CSP configured in `svelte.config.js` (including Svelte `script-src-attr` hash
  and Simple Analytics domains).
- Static adapter with SPA fallback — appropriate for GitHub Pages.
- SW cache bucket keyed by media content hash (`media-cache-key.mjs`) — stale
  drawing filenames don't linger across deploys.
- Simple Analytics (prod only) via pseudo-hostname `unicorn.rednaw.github.io`;
  script stripped in `pnpm dev`.

---

## Critical issues

### 1. ~~No automated tests~~ — shipped (partial)

**Added:** 41 Vitest tests across seven files (see Test coverage above). CI blocks
merge/deploy on failure.

**Still missing:** component/E2E tests, gesture path integration, SW behaviour,
build-time content validation. Highest-value next additions:

| Area | Why it matters |
|------|----------------|
| `gestures.svelte.ts` + `piece-activation.ts` | Dual activation path regressions |
| `listening.svelte.ts` | HUD phase vs audio desync |
| Build scripts | Content/asset drift |

---

### 2. ~~Hit testing ignores z-order~~ — shipped

`drawingAtCanvasPoint` now walks the drawings list **top-down** (reverse paint
order), matching DOM stacking for equal `z-index` siblings in `Canvas.svelte`.

**Note:** `:hover` / `:focus-visible` still raise a piece to `z-index` 10/11 in
CSS; geometry hit tests do not model that (pointer-down on a piece uses
`data-drawing-id` from the DOM instead).

**Files:** `src/lib/atelier/drawing-geometry.ts`, `drawing-geometry.test.ts`.

---

### 3. Accessibility — partial keyboard support

**Shipped:**

- **Canvas focused:** arrow keys / WASD pan, `+`/`−` zoom (`gestures.svelte.ts`).
- **Tab order:** BackLink → theme picker → canvas → piece buttons (native `<button>`).
- **Escape** returns toward overview (`+page.svelte` capture handler + `goBack`).
- **Focus rings** on viewport and piece buttons; `aria-label` / `aria-pressed` on pieces.

**Not shipped** (do not assume these exist):

- Roving `tabindex` between pieces.
- Arrow keys to move focus from piece to piece.
- `revealDrawing` / auto-pan when a piece receives keyboard focus.

Keyboard users can Tab to each work and activate with Enter/Space, but dense
layouts remain tedious without roving navigation.

**Recommendation:** Add roving tabindex + arrow navigation between pieces, with
`view.focusDrawing` / `revealDrawing` to keep the focused work in view.

**Files:** `Canvas.svelte`, `DrawingPiece.svelte`, `view.svelte.ts`, `gestures.svelte.ts`.

---

### 4. ~~Service worker audio caching — memory pressure~~ — shipped

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
exist. Drawing `id` slugs and `title` labels are maintained separately (title
doubles as image `alt` text).

**Recommendation:** Extend build scripts (e.g. `content-drawings.mjs`) to probe
image dimensions and assert file presence, similar to thumb generation.

---

### 8. Magic-number sync between CSS and TS

`PIECE_MAT` in `drawing-geometry.ts` must stay aligned with `.piece__mat`
padding and plaque height in `DrawingPiece.svelte`. Same for `LEATHER_PAD_INSET`
vs `backgrounds.css`. Comments call this out; there is no compile-time guard.

---

### 9. Theme / layout CSS duplication

Nine theme files under `backgrounds/themes/` share structure via `shared.css`
but each duplicates leather-pad geometry tokens. Adding a theme means a new CSS
file plus an entry in `atelier-themes.ts` and `backgrounds.css` imports.

**Recommendation:** Document the checklist in README (already partial) or
generate theme imports from `atelier-themes.ts` at build time if the set keeps growing.

---

### 10. Tooling gap

`pnpm test` (Vitest) runs in CI. `pnpm check` (svelte-check) is available locally
but currently fails on one `vite.config.ts` plugin typing issue (`order: 'pre'`).
No ESLint, Prettier, or format gate yet. Fine for a solo project today; consider
adding as edits accumulate.

**Dev config split:** `vitest.config.ts` merges the main Vite config via
`mergeConfig(viteConfig as ViteUserConfig, …)` so `$app/*` aliases resolve in
tests without pulling Vitest types into `vite.config.ts` (which broke `pnpm dev`
when both were combined).

**Vite 7 pin:** `package.json` pins `vite` to `^7.3.0`. Vite 8.0.x reintroduced
Rolldown for dependency pre-bundling; the atelier theme bootstrap pattern above
triggered `PARSE_ERROR` during dep scan and very slow cold starts (~50s) with
repeated re-optimization. Revisit when upgrading to Vite 8+.

---

### 11. Silent audio failures — low priority (hardening)

Failure paths are swallowed in `audio-player.svelte.ts`:

- `void el.play().catch(() => {})`
- Empty `catch {}` around `currentTime` assignment and `ctx.resume()`
- `error` on load shares the `loadedmetadata` handler and can still call `fadeIn()`

If playback fails (missing file on deploy, offline tap, corrupt asset), the UI
can show “playing” via optimistic `listening.focus()` before `playDrawing`
succeeds — but nothing is heard.

**Not reproducible in normal use:** On a real iPhone, door → tap → switch pieces
while playing, and direct `/atelier/` entry all work. The crossfade `setTimeout`
and skip-door paths are theoretical; iOS Safari allows them when assets load.
Only forced failures (broken URL, airplane mode) reliably trigger the desync.

**Priority:** Low — hardening for deploy/network mistakes, not a live UX bug at
current scale. When addressed: split load `error` from `onReady`, roll back
listening on failure, optional NearCue error state. Dev `console.warn` is enough
for a first pass.

**Files:** `audio-player.svelte.ts`, `atelier-session.svelte.ts`, `listening.svelte.ts`, `NearCue.svelte`.

---

## Minor observations

| Topic | Note |
|-------|------|
| Zoom cap off-piece | `maxZoomAt` falls back to `peakMaxZoom` when the cursor is not over a drawing — you can zoom past one piece’s sharp limit while inspecting another. Probably intentional. |
| Audio preload | `metadata` until tap; `auto` only during playback — see Audio memory requirement above. |
| TypeScript 6.0.2 | Very new; watch for ecosystem friction. |
| Silent pieces | Focusing a drawing without `track` still zooms and requests full-res — coherent “look but don’t listen” behaviour. |
| View Transitions | Gracefully skipped when `prefers-reduced-motion` — good. |
| `audioIndexForDrawing` | Precomputed `Map` in `content.ts` — no per-frame cost. |
| Theme picker opacity | CSS comment calls it a “temporary dev control” at 0.22 opacity — consider whether it should stay subtle or become a first-class UI element. |
| `ssr = false` | Atelier meta tags (`<title>`, description) only appear after JS on that route. Acceptable trade-off for correct desk layout. |
| Content model | Eight drawings; three with audio (`maskers`, `buste-van-een-gevallen-keizer`, `claudio-abbado`). Entry prefetch targets `maskers`. Drawing `title` is the image `alt` on the full-res layer (`DrawingImg.svelte`). |
| Dev cold start | First `pnpm dev` after lockfile change can take ~15–60s in the container while deps re-optimize; avoid Vite 8 until theme bootstrap / Rolldown issue is resolved. |
| `pnpm check` | One `vite.config.ts` plugin overload error (`order: 'pre'` → needs `as const`). Build unaffected. |
| Test reset hook | `resetAudioPlayerForTests()` in `audio-player.svelte.ts` — Vitest-only singleton reset. |

---

## Priority recommendations

1. **Roving keyboard navigation between pieces** — build on existing Tab + button activation.
2. **Build-time content validation** — image dimensions, audio file presence, coordinate bounds.
3. **Fix `vite.config.ts` plugin typing** — `order: 'pre' as const` so `pnpm check` is clean.
4. **Optional:** ESLint + format in CI; component tests for gestures/listening.
5. **Low priority:** Surface audio errors on load/`play()` failure (hardening only).

---

## Review checklist (track progress)

### Tier 1 — behavioral / reliability

- [x] Automated tests for pure modules and audio state machine
- [x] Hit testing respects visual z-order (reverse paint order)
- [~] Keyboard path to focus any drawing (Tab + Enter on buttons; no roving arrows)
- [ ] Audio play/error feedback when `play()` or load fails *(low priority — hardening)*
- [x] Low RAM audio: SW `Blob.slice` range serving, tight preload, buffer release on switch/leave
- [x] Consistent crossfade when switching audio pieces

### Tier 2 — maintainability

- [ ] Single piece-activation funnel (pointer vs button)
- [ ] Build-time validation of content.ts vs static assets
- [ ] Lint/format in CI (optional)
- [~] `pnpm check` clean (`vite.config.ts` plugin `order` typing — one error)
- [x] Vitest in CI (`test` job on push/PR)
- [x] Room themes with persistence
- [x] SW cache busting via media content hash
- [x] Simple Analytics (production only)

---

## Bottom line

Well-crafted, constraint-driven implementation for an immersive drawing gallery.
The atelier stack shows real attention to sharpness, gesture feel, and mobile
networks. Pure-module and audio state-machine regressions are now guarded by
Vitest and CI. Remaining gap for many pieces: **keyboard navigation** (Tab works;
roving arrows would help). Audio memory pressure for long/many recordings is
addressed. Silent audio failure handling is documented hardening — not observed
on iPhone in normal use. Dev tooling is stable on Vite 7; upgrade to Vite 8
only after validating the theme-bootstrap / dep-scan path.
