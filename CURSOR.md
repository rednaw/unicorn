# Ground rules

## Atelier first

**Crisp high-res pan and zoom on large drawings is paramount** — including audio indicators (HMV plaque, near cue) and anything else on the canvas later. Gallery (`/`) optimizes for fast thumbs; don't trade one for the other silently.

## Don't break

- Respect `maxSharpZoomForDrawing()` / `SHARP_DPR` — never cap zoom or leave thumbs as the final zoomed image to fix Lighthouse.
- Full-res JPEGs load lazy via the prefetch coordinator (`drawing/prefetch.svelte.ts`): native `<img>` (no blob cache), one full-res at a time, triggered by viewport coverage. Call `requestDrawing(id, intent)` — never fetch drawing URLs directly outside `DrawingImg`.
- Pan/zoom stays on `translate` + `scale`; no heavy filters on zoomed art.
- Gestures stay smooth while spatial audio runs.

## UX feel

It should feel **high-end**: pan, pinch, and zoom stay locked to the finger with no stutter; focus animations ease cleanly; audio and overlays track the view without hitch. Jank, input lag, or visible “pop-in” of a softer image mid-gesture breaks the illusion — fix those before chasing Lighthouse scores.

## Performance (metrics)

Lighthouse complaints (LCP, cache TTL on GitHub Pages, `ssr = false` on atelier) are real but **secondary** to the feel above. Optimize load order, preload, and right-sized assets — not sharpness.

**Litmus test:** can someone still zoom into pencil texture at max sharp zoom? If no, stop.

## Scale

More drawings and recordings are coming — **multiple tables** (clusters on one continuous floor), not just one scattered layout. Design for that: lazy full-res, coverage-triggered prefetch, serial JPEG queue, and spatial audio must stay smooth as piece count grows. Never load every full-res JPEG on entry.
