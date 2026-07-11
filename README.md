# Unicorn — RvA

A SvelteKit site for one artist's drawings and piano recordings.
The **home page** is a door sketch — click through to the **atelier**, an immersive
studio view where works sit on a pannable canvas — tap a drawing to listen to its recording.

| Route       | Idea                                                       |
| ----------- | ---------------------------------------------------------- |
| `/`         | Threshold — door sketch; click to enter the atelier (fit-all overview) |
| `/atelier/` | Studio — pan/zoom canvas; tap a piece to play its recording (fit-all on entry) |
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
pnpm assets:encode  # regenerate webm + thumbs (also runs before dev/build)
pnpm assets:thumbs  # thumbs only
pnpm assets:audio   # webm only
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

### Simple Analytics

Production only — reports under **`unicorn.rednaw.github.io`**
(`app.html` + `site-config.ts`). The script is stripped during `pnpm dev`.

1. In [Simple Analytics](https://simpleanalytics.com/) → **Websites** → add `unicorn.rednaw.github.io`.
2. Deploy — page views appear after the first visit (SPA navigation is tracked automatically).

## Content & assets

The site uses the artist's own drawings and piano recordings.

- `/static/drawings/*.jpg` — drawing masters (final scans TBD); `-thumb.webp` generated at build, not committed
- `/static/hall/` — door sketch for the home page (`door-ajar-sketch.webp`)
- `/static/audio/` — performances (m4a masters; `.webm` generated at build, not committed)

Credits and rights: [`/credits/`](/credits/) (rendered from `content.ts`).

### Add or replace assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
   (**jpg** drawings and **m4a** audio are stored via Git LFS — patterns live in `.gitattributes`).
2. Run `pnpm assets:encode` (or `pnpm build`) to generate derived webp/webm.
3. Edit `src/lib/content.ts` — add or update `drawings` entries
   (paths, titles, metadata, `portrait` / `landscape` placement, and an optional `track`).

The shape is:

```ts
type DrawingTrack = { id; title; composer; src }
type Drawing = {
  id; title; year; medium; src; thumb; srcWidth; srcHeight;
  portrait: { x; y }; landscape: { x; y };
  rotation?; width?; track?
}
```

Audio is embedded directly on a drawing via its optional `track`: tap the piece in
the atelier to play that recording (one piece at a time; resume on re-tap).
Drawings without a `track` are silent. `portrait` and `landscape`
set absolute floor coordinates; `resolveLayoutMode` in `atelier-layout.ts` picks
which pair is active (portrait phones vs wider viewports).

### Atelier interaction

- **Tap or click** a drawing to focus it and play its recording (if it has a `track`).
- **Drag** or two-finger scroll to pan; playback continues while you explore.
- **Mouse wheel** or pinch zooms at the cursor.
- **Keyboard:** Tab to the canvas (pan/zoom) or through works; **arrow keys** / WASD pan when the canvas is focused; **+** / **−** zoom; **Escape** back (same as ←).
- Full-resolution JPEGs load on demand when a piece covers enough of the viewport (not all at once).
- At most **one** recording plays at a time; tap another audio piece to switch (crossfade).

Agent-oriented constraints and file map: [`CURSOR.md`](./CURSOR.md).

## Architecture

```
src/
  app.html                  # favicon links, HTML shell
  routes/
    +layout.svelte          # global CSS, service worker registration
    +layout.ts              # prerender + trailingSlash: 'always'
    layout.css              # Tailwind + theme tokens + view transitions
    (site)/
      +layout.svelte        # mode-aware shell (hall / credits / immersive atelier)
      +page.svelte          # home — door threshold
      credits/+page.svelte  # colofon
      atelier/+page.svelte  # fullscreen studio canvas
  lib/
    content.ts              # site data (drawings, lookups)
    content-types.ts        # Drawing / Atelier types + constants
    content-derive.ts       # pure derivations (audio list, sharp zoom)
    drawing/
      prefetch.svelte.ts    # thumb warmup + full-res coordinator
    atelier/                # studio canvas, gestures, explicit listen audio
      listening.svelte.ts, audio-player.svelte.ts
      view.svelte.ts, gestures.svelte.ts, …
      visible-drawings.ts   # viewport hit-test + coverage-based prefetch intents
      Canvas.svelte, DrawingPiece.svelte, DrawingImg.svelte, …
scripts/
  encode-audio.mjs, encode-thumbs.mjs, content-drawings.mjs
  service-worker.mjs, sw.template.js, media-cache-key.mjs
static/
  drawings/, hall/, audio/, .nojekyll
.devcontainer/
  Dockerfile, devcontainer.json
```

Cross-route navigation uses the View Transitions API (`+layout.svelte`, `layout.css`).
The door home page crossfades into the atelier. Piece-level morphs use
`view-transition-name: piece-<id>` on the focused drawing in the atelier.

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4**
- **Web Audio + native `<audio>`** for explicit listen playback (`audio-player.svelte.ts`)
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds
- **Simple Analytics** — privacy-first page views (`app.html` + `site-config.ts`)

## Out of scope

- A CMS — content lives in one TS file
