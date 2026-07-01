# Ground rules

## Atelier first

**Crisp high-res pan and zoom on large drawings is paramount** — including audio indicators (HMV plaque, near cue) and anything else on the canvas later. Gallery (`/`) optimizes for fast thumbs; don't trade one for the other silently.

## Don't break

- Respect `maxSharpZoomForDrawing()` / `SHARP_DPR` — never cap zoom globally by the smallest piece. Zoom ceiling is **per drawing** at the pinch/wheel anchor (fallback: peak across all pieces on empty floor).
- Full-res JPEGs load lazy via the prefetch coordinator (`drawing/prefetch.svelte.ts`): native `<img>` (no blob cache), serial queue (`fullMaxConcurrent: 1`), triggered by viewport **coverage** (`ATELIER_PREFETCH.fullResCoverage`). Call `requestDrawing(id, intent)` — never fetch drawing URLs outside `DrawingImg`.
- Media revisit cache: `sw.js` (drawings, hall, audio) via Cache API — cache key hashes media files (`scripts/media-cache-key.mjs`); code-only deploys keep the bucket. Audio handles Range requests for `<audio>` streaming.
- Pan/zoom stays on `translate` + `scale`; no heavy filters on zoomed art.
- Gestures stay smooth while spatial audio runs.
- Audio is **solo-near**: at most one track audible; lazy `ensureTrack` on proximity; `unlock(primeIds)` during user gestures for iOS autoplay.

## UX feel

It should feel **high-end**: pan, pinch, and zoom stay locked to the finger with no stutter; focus animations ease cleanly; audio and overlays track the view without hitch. Jank, input lag, or visible “pop-in” of a softer image mid-gesture breaks the illusion — fix those before chasing Lighthouse scores.

**Input model:** tap/click a piece → focus (~90% fill); mouse wheel / pinch → zoom at cursor; trackpad two-finger scroll → pan; drag → pan; `0` / `r` → fit-all overview. No double-tap or double-click zoom.

## Performance (metrics)

Lighthouse complaints (LCP, cache TTL on GitHub Pages, `ssr = false` on atelier) are real but **secondary** to the feel above. Optimize load order, preload, and right-sized assets — not sharpness.

**Litmus test:** can someone still zoom into pencil texture at max sharp zoom? If no, stop.

## Scale

More drawings and recordings are coming. Each drawing carries **`portrait` and `landscape` floor coordinates** in `content.ts`; `atelier-layout.ts` picks the active set from viewport shape. Keep lazy full-res, coverage-triggered prefetch, the serial JPEG queue, and spatial audio smooth as piece count grows. Never load every full-res JPEG on entry.

## Where to edit

| Change | Files |
|--------|--------|
| Drawing data, placement, tracks | `src/lib/content.ts` |
| Types, sharp-zoom math | `content-types.ts`, `content-derive.ts` |
| Layout mode (portrait vs landscape) | `atelier-layout.ts` |
| Pan/zoom/focus | `view.svelte.ts`, `gestures.svelte.ts` |
| Full-res loading policy | `drawing/prefetch.svelte.ts`, `visible-drawings.ts`, `constants.ts` (`ATELIER_PREFETCH`) |
| Spatial audio | `audio-engine.svelte.ts`, `spatial-audio-loop.svelte.ts`, `spatial-mix.ts` |
| Tunables (zoom, gestures, audio, prefetch) | `atelier/constants.ts` |

Tunables live in `constants.ts` — adjust there rather than scattering magic numbers.
