# Unicorn — RvA

A SvelteKit site for one artist's drawings and piano recordings.
The **home page** is a door sketch — click through to the **atelier**, an immersive
studio view where works sit on a pannable canvas with proximity-based audio.

| Route       | Idea                                                       |
| ----------- | ---------------------------------------------------------- |
| `/`         | Threshold — door sketch; click to enter the atelier (fit-all overview) |
| `/atelier/` | Studio — pan/zoom canvas, spatial audio near each drawing (fit-all on entry) |
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
pnpm dev            # already started on container launch
pnpm check          # type-check
pnpm build          # production build → build/
pnpm assets:thumbs  # regenerate -thumb.webp from jpg (also runs before dev/build)
pnpm assets:audio   # regenerate .webm from m4a (also runs before dev/build)
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

- `/static/drawings/*.jpg` — drawing masters (final scans TBD); `-thumb.webp` generated at build, not committed
- `/static/hall/` — door sketch for the home page (`door-ajar-sketch.webp`)
- `/static/audio/` — performances (m4a masters; `.webm` generated at build, not committed)

See `static/CREDITS.md` for sources and licensing.

### Add or replace assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
   (**jpg** drawings and **m4a** audio are stored via Git LFS — patterns live in `.gitattributes`).
2. Run `pnpm assets:thumbs` or `pnpm assets:audio` (or `pnpm build`) to generate derived webp/webm.
3. Edit `src/lib/content.ts` — add or update entries in `atelier.drawings`
   (paths, titles, metadata, `portrait` / `landscape` placement, and an optional `track`).

The shape is:

```ts
type DrawingTrack = { id; title; composer; src }
type Drawing = {
  id; title; year; medium; src; thumb; srcWidth; srcHeight; alt;
  portrait: { x; y }; landscape: { x; y };
  rotation?; width?; track?
}
```

Audio is embedded directly on a drawing via its optional `track`: when present,
that recording plays with proximity-based gain/pan as you approach the work in
the atelier. Drawings without a `track` are silent. `portrait` and `landscape`
set absolute floor coordinates; `resolveLayoutMode` in `atelier-layout.ts` picks
which pair is active (portrait phones vs wider viewports).

### Atelier interaction

- **Tap or click** a drawing to focus it; **drag** or two-finger scroll to pan.
- **Mouse wheel** or pinch zooms at the cursor; **`0`** / **`r`** returns to the full-floor overview.
- Full-resolution JPEGs load on demand when a piece covers enough of the viewport (not all at once).
- At most **one** recording plays at a time, with volume/pan tied to proximity.

Agent-oriented constraints and file map: [`CURSOR.md`](./CURSOR.md).

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
    content.ts              # atelier data + public API (drawings, tracks, lookups)
    content-types.ts        # Drawing / Atelier types + constants
    content-derive.ts       # pure derivations (audio list, sharp zoom)
    drawing/
      prefetch.svelte.ts    # full-res coordinator (native <img>, serial queue)
    atelier/                # studio canvas, gestures, spatial audio
      audio-engine.svelte.ts
      view.svelte.ts, gestures.svelte.ts, …
      visible-drawings.ts   # viewport hit-test + coverage-based prefetch intents
      Canvas.svelte, DrawingPiece.svelte, DrawingImg.svelte, …
static/
  drawings/, hall/, audio/, .nojekyll, CREDITS.md
.devcontainer/
  Dockerfile, devcontainer.json
```

Cross-route navigation uses the View Transitions API (`+layout.svelte`, `layout.css`).
The door home page crossfades into the atelier; piece-level morphs need matching
`view-transition-name: piece-<id>` on both routes.

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **Web Audio + native `<audio>`** for atelier proximity gain/pan
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds

## Out of scope

- A CMS — content lives in one TS file
- Analytics
