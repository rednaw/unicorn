# Unicorn — RvA

A SvelteKit site for one artist's drawings and piano recordings.
The **home page** is a door sketch — click through to the **atelier**, an immersive
studio view where works sit on a pannable canvas with proximity-based audio.

| Route       | Idea                                                       |
| ----------- | ---------------------------------------------------------- |
| `/`         | Threshold — door sketch; click to enter the atelier (Maskers) |
| `/atelier/` | Studio — pan/zoom canvas, spatial audio near each drawing  |
| `/credits/` | Colofon — rights and asset credits                         |

## Prerequisites

**Only Docker and VS Code / Cursor** — no Node, pnpm, or Vite on your host.

- Docker
- VS Code or Cursor with the **Dev Containers** extension

Drawing and audio files in `static/` are tracked with **Git LFS**. The dev
container installs LFS automatically; on the host, install [Git LFS](https://git-lfs.com/)
and run `git lfs install` once before cloning or pulling.

## Development

1. Open this folder in VS Code or Cursor.
2. **Reopen in Container** (Command Palette → `Dev Containers: Reopen in Container`).
3. Wait for `pnpm install` and the dev server — open **http://localhost:5173**.

Common commands (inside the container terminal):

```sh
pnpm dev          # already started on container launch
pnpm check        # type-check
pnpm build        # production build → build/
```

`node_modules/` lives in the project folder (installed by the container's pnpm) so
the editor gets full TypeScript and Svelte IntelliSense.

## Deployment (GitHub Pages)

Push to `main` — GitHub Actions builds and publishes automatically.

1. Create a GitHub repo and push this directory.
2. In the repo's **Settings → Pages**, set **Source: GitHub Actions**.
3. The workflow (`.github/workflows/deploy.yml`) runs `pnpm build` and deploys `build/`.
   `BASE_PATH` is set from the repo name for project Pages sites.

For a custom domain or user/org pages (`username.github.io`), unset `BASE_PATH` in
the workflow.

## Content & assets

The site uses the artist's own drawings and piano recordings.

- `/static/drawings/*.jpg` — drawing pre-scans (final scans TBD)
- `/static/hall/` — door sketch for the home page (`door-ajar-sketch.webp`)
- `/static/audio/` — performances (m4a / ogg)

See `static/CREDITS.md` for sources and licensing.

### Add or replace assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
   (they are stored via Git LFS — patterns live in `.gitattributes`).
2. Run `pnpm assets:thumbs` to generate the `-thumb.webp` placeholders.
3. Edit `src/lib/content.ts` — add or update entries in the `drawings` array
   (paths, titles, metadata, atelier placement, and an optional `track`).

The shape is:

```ts
type DrawingTrack = { id; title; composer; src }
type Drawing = {
  id; title; year; medium; src; thumb; srcWidth; srcHeight; alt;
  rotation?; pos?; width?; track?
}
```

Audio is embedded directly on a drawing via its optional `track`: when present,
that recording plays with proximity-based gain/pan as you approach the work in
the atelier. Drawings without a `track` are silent. `pos`, `rotation`, and
`width` define placement on the atelier canvas.

## Architecture

```
src/
  app.html                  # favicon links, HTML shell
  routes/
    +layout.svelte          # global CSS import
    +layout.ts              # prerender + trailingSlash: 'always'
    layout.css              # Tailwind + theme tokens + view transitions
    (site)/
      +layout.svelte        # mode-aware shell (hall / credits / immersive atelier)
      +page.svelte          # home — door threshold
      credits/+page.svelte  # colofon
      atelier/+page.svelte  # fullscreen studio canvas
  lib/
    content.ts              # drawings (with embedded tracks) + lookups
    drawing/
      asset-cache.ts        # session blob cache (atelier prefetch)
      CachedDrawingImg.svelte
    atelier/                # studio canvas, gestures, spatial audio
      audio-engine.svelte.ts
      view.svelte.ts, gestures.svelte.ts, …
      Canvas.svelte, DrawingPiece.svelte, …
static/
  drawings/, hall/, audio/, .nojekyll, CREDITS.md
.devcontainer/
  Dockerfile, devcontainer.json
```

Cross-route navigation uses the View Transitions API (see `+layout.svelte` and
`layout.css`). The atelier assigns `view-transition-name: piece-<id>` to the
**focused** drawing (`DrawingPiece.svelte`). That enables a shared-element morph
when the same name exists on both the outgoing and incoming page.

The old home page was a grid: each thumbnail carried `piece-<id>`, so clicking a
work morphed it into the matching mat in the atelier. The door home page no longer
shows drawing thumbnails, so navigation to `/atelier/?focus=maskers` gets a
**whole-page crossfade** only — not a morph into Maskers. To restore the morph,
something on `/` would need the matching `view-transition-name` (e.g. a hidden or
decorative element tied to the entry drawing).

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **Web Audio + native `<audio>`** for atelier proximity gain/pan
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds

## Out of scope

- A CMS — content lives in one TS file
- Analytics
