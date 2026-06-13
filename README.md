# Unicorn — V. Solenne

A SvelteKit site for one artist's drawings, piano recordings, and poetry.
The **gallery** is the default experience; the **atelier** is an optional immersive
studio view where works are scattered on a pannable canvas with proximity-based audio.

| Route          | Idea                                                        |
| -------------- | ----------------------------------------------------------- |
| `/`            | Gallery — grid of works and listening room                  |
| `/werk/[slug]/`| Work detail — one drawing, paired poem, prev/next navigation  |
| `/atelier/`    | Studio — pannable canvas with proximity-based audio         |
| `/museum/`     | Redirects to `/` or `/werk/[slug]/` (legacy URLs)           |

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

The site currently uses a curated public-domain-inspired set:

- `/static/drawings/*.svg` — six drawing placeholders
- `/static/audio/*.ogg` — three one-minute solo piano fragments
- Poetry — Dutch public-domain excerpts in `src/lib/content.ts`

See `static/CREDITS.md` for sources and licensing.

### Regenerate drawing placeholders

```sh
./scripts/fetch-assets.sh
```

Generates SVG placeholders (idempotent). The audio step in that script uses host
Docker (`docker run` for yt-dlp) — only needed if you want to re-fetch audio files.

### Swap in real assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
2. Edit `src/lib/content.ts` — update the `drawings`, `tracks`, and `poems`
   arrays to point at the new paths and metadata.
3. That's it. Both gallery and atelier automatically pick up the new content.

The shape is:

```ts
type Drawing = { id; title; year; medium; src; alt; rotation?; pos?; width? }
type Track   = { id; title; composer; src; pos? }
type Poem    = { id; title; author; lines; pairsWith?; pos?; rotation? }
```

`pos` and `rotation` define placement on the atelier canvas. `pairsWith` (a drawing id)
associates a poem with a work on detail pages.

## Architecture

```
src/
  app.html
  routes/
    +layout.svelte          # global head (favicon, CSS)
    +layout.ts              # prerender + trailingSlash: 'always'
    layout.css              # Tailwind + theme tokens
    (site)/
      +layout.svelte        # gallery chrome + docked AudioPlayer
      +page.svelte          # gallery grid
      werk/[slug]/          # work detail pages
    atelier/+page.svelte    # fullscreen studio canvas
    museum/                 # legacy redirects
  lib/
    content.ts              # single source of truth
    site-state.svelte.ts    # shared audio player state
    components/
      AudioPlayer.svelte
      PoemBlock.svelte
      BackLink.svelte
static/
  drawings/, audio/, .nojekyll, CREDITS.md
scripts/
  fetch-assets.sh
.devcontainer/
  Dockerfile, devcontainer.json
```

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **Web Audio + native `<audio>`** for atelier proximity gain
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds

## Out of scope

- A CMS — content lives in one TS file
- Mobile-perfect atelier gestures
- Analytics
