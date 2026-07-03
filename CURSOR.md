# Ground rules

## Atelier first

Crisp pan/zoom on **full-res drawings** is paramount — HMV plaque, near cue, anything on the canvas. Home (`/`) is a fast door sketch; don't trade atelier sharpness for metrics.

**Litmus:** still sharp at max zoom? If no, stop. Lighthouse / GH Pages TTL are secondary.

## Don't break

- **Zoom:** `maxSharpZoomForDrawing()` per piece — never a global cap from the smallest drawing.
- **Images:** full-res only via `requestDrawing(id, intent)` → `DrawingImg`. Native `<img>`, serial queue, coverage gate (`ATELIER_PREFETCH`). No blob cache, no fetching drawing URLs elsewhere.
- **Motion:** pan/zoom on `translate` + `scale` only; no heavy filters on zoomed art. Gestures must stay smooth during playback.
- **Audio:** explicit listen — tap to play; one `<audio>` element; `play()` in tap gesture only; resume positions per drawing; m4a masters (LFS) + WebM at build; `pickAudioSrc()` at runtime. Design: `docs/explicit-listen-audio.md`.
- **SW:** revisit cache for drawings/hall/audio; media-hash bucket; precache hall webp + thumbs only. Core path works without SW.

**Input:** tap piece → focus; wheel/pinch → zoom at cursor; drag / two-finger → pan; `0`/`r` → fit-all. No double-tap zoom.

## Reach

Safari, Chrome, Firefox — slow networks, budget phones. Native `<img>` / `<audio>`, Web Audio + gesture unlock. SW and view transitions are enhancements, not requirements. No Chrome-only APIs (Speculation Rules, HLS/MSE, etc.) without a universal fallback.

## Scale

More drawings/recordings coming. `portrait` / `landscape` coords in `content.ts`; never load all full-res JPEGs on entry.

## Where to edit

| Change | Files |
|--------|--------|
| Content, placement, tracks | `src/lib/content.ts` |
| Types, sharp zoom | `content-types.ts`, `content-derive.ts` |
| Layout mode | `atelier-layout.ts` |
| Pan/zoom/focus | `view.svelte.ts`, `gestures.svelte.ts` |
| Prefetch | `drawing/prefetch.svelte.ts`, `visible-drawings.ts` |
| Explicit listen audio | `listening.svelte.ts`, `audio-player.svelte.ts`, `audio-format.ts` |
| Tunables | `atelier/constants.ts` |
| Encode (build) | `scripts/encode-audio.mjs`, `encode-thumbs.mjs`, `content-drawings.mjs` |
| Service worker | `scripts/sw.template.js`, `service-worker.mjs`, `media-cache-key.mjs` |

Workflow and architecture: `README.md`.
