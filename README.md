# Unicorn — V. Solenne

A SvelteKit site for one artist's drawings and piano recordings.
The **gallery** is the default experience; the **atelier** is an immersive studio
view where works sit on a pannable canvas with proximity-based audio.

| Route       | Idea                                                       |
| ----------- | ---------------------------------------------------------- |
| `/`         | Gallery — grid of drawings; click a work to open the atelier |
| `/atelier/` | Studio — pan/zoom canvas, spatial audio near each speaker  |

## Prerequisites

**Only Docker and VS Code / Cursor** — no Node, pnpm, or Vite on your host.

- Docker
- VS Code or Cursor with the **Dev Containers** extension

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

The site uses the artist's own drawings and curated audio:

- `/static/drawings/*.jpg` — drawing pre-scans (final scans TBD)
- `/static/audio/` — Chopin performances (m4a / ogg)

See `static/CREDITS.md` for sources and licensing.

### Add or replace assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
2. Edit `src/lib/content.ts` — update the `drawings` and `tracks` arrays
   (paths, titles, metadata, and atelier placement).
3. Optionally add or remove rows in the `pairings` array in the same file.

The shape is:

```ts
type Drawing = { id; title; year; medium; src; alt; rotation?; pos?; width? }
type Track   = { id; title; composer; src; pos? }
```

**Pairings** link drawings to recordings (`drawingId` ↔ `trackId`). Either side
may be unpaired as assets arrive at different times — add or remove pairing rows
only; unpaired drawings still appear in the gallery and on the atelier table,
unpaired tracks still appear as speakers.

`pos`, `rotation`, and `width` define placement on the atelier canvas.

## Architecture

```
src/
  app.html
  routes/
    +layout.svelte          # global head (favicon, CSS)
    +layout.ts              # prerender + trailingSlash: 'always'
    layout.css              # Tailwind + theme tokens + view transitions
    (site)/
      +layout.svelte        # mode-aware shell (gallery vs immersive atelier)
      +page.svelte          # gallery grid
      atelier/+page.svelte  # fullscreen studio canvas
  lib/
    content.ts              # drawings, tracks, pairings, lookups
    audio-engine.svelte.ts  # spatial Web Audio (atelier only)
    components/
      BackLink.svelte
static/
  drawings/, audio/, .nojekyll, CREDITS.md
scripts/
  fetch-assets.sh           # optional yt-dlp helper for audio
.devcontainer/
  Dockerfile, devcontainer.json
```

Gallery → atelier navigation uses the View Transitions API with a shared-element
morph on the focused drawing (`view-transition-name: piece-<id>`).

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **Web Audio + native `<audio>`** for atelier proximity gain/pan
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds

## Out of scope

- A CMS — content lives in one TS file
- Mobile-perfect atelier gestures
- Analytics
