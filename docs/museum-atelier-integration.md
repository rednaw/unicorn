# Museum ↔ Atelier integration

Status: **Implemented** (simplified)
Last updated: 2026-06-23

This document records what was built. The original Level 2 plan (unified shell,
shared audio with playlist + spatial modes, `/werk/` detail pages) was trimmed
during implementation to match the desired UX: a minimal gallery and a
self-contained atelier.

## Current experience

| | Gallery | Atelier |
|---|---|---|
| Route | `/` | `/atelier/` |
| Layout | Header with artist name | Immersive — no header, full viewport |
| Audio | None | Spatial — proximity + zoom gate, all tracks loaded |
| Navigation | Click drawing → `/atelier/?focus=<id>` | Back arrow → `/` |
| Transitions | View Transitions API; focused piece morphs | Same |

Legacy `/museum/` and `/museum/<slug>/` redirect to `/` and `/atelier/?focus=<slug>`.

## File map

| Concern | Location |
|---|---|
| Content (drawings, tracks, pairings) | [`src/lib/content.ts`](../src/lib/content.ts) |
| Spatial audio engine | [`src/lib/audio-engine.svelte.ts`](../src/lib/audio-engine.svelte.ts) |
| Mode-aware shell + "nu dichtbij" cue | [`src/routes/(site)/+layout.svelte`](../src/routes/(site)/+layout.svelte) |
| Gallery | [`src/routes/(site)/+page.svelte`](../src/routes/(site)/+page.svelte) |
| Atelier canvas | [`src/routes/(site)/atelier/+page.svelte`](../src/routes/(site)/atelier/+page.svelte) |
| View transition CSS | [`src/routes/layout.css`](../src/routes/layout.css) |

## Pairings

Drawings and tracks are maintained as separate lists. The `pairings` array in
`content.ts` links them when both exist. Either side may be unpaired while assets
are added at uneven pace. At most one track per drawing and one drawing per track
(convention — duplicate ids in `pairings` silently keep the last row).

## Deliberately not built

- `/werk/[slug]/` detail pages
- Docked playlist player or gallery audio
- Continuous playback when crossing gallery ↔ atelier (audio exists only in the atelier)
- Atelier → werk links

## Verification

```sh
pnpm check
pnpm build
```

Manual pass: gallery → atelier transition, `?focus=` deep-link, pan/zoom/momentum,
proximity audio, reduced-motion transitions, legacy `/museum/` redirects.
