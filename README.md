# Unicorn — Artist Prototype, Four Variants

A SvelteKit prototype presenting one (fictional) artist's drawings, piano recordings,
and poetry through **four contrasting design languages**. The same content runs through
each variant so the design directions can be compared apples-to-apples.

| Route        | Idea                                                     |
| ------------ | -------------------------------------------------------- |
| `/`          | Landing — artist intro and four variant cards            |
| `/scroll/`   | Scroll-driven storytelling (Lenis + GSAP ScrollTrigger)  |
| `/museum/`   | Quiet white-walls gallery with detail pages              |
| `/editorial/`| Magazine-style spreads with drop caps and pull quotes    |
| `/atelier/`  | Pannable + zoomable canvas with proximity-based audio    |

## Prerequisites

**Only Docker.** No Node, no pnpm, no Vite on your host. Everything runs inside the
`unicorn-dev` container.

- Docker (with Compose v2)

## Running it

```sh
make build      # build the dev image (first time only)
make install    # install dependencies inside the container
make dev        # vite dev server -> http://localhost:5173
```

Stop with `Ctrl-C`, then `make down` to remove the container.

| Command | What it does |
| --- | --- |
| `make dev` | Boots the dev server on `:5173` with HMR |
| `make stop` / `make down` | Stop / stop-and-remove the dev container |
| `make install` | `pnpm install` inside the container |
| `make add PKG=foo` | `pnpm add foo` |
| `make add-dev PKG=foo` | `pnpm add -D foo` |
| `make pnpm ARGS='check'` | Run any pnpm command (e.g. `pnpm check`) |
| `make sh` | Open a shell inside the container |
| `make clean` / `make nuke` | Drop build artifacts / also drop `node_modules` |

`node_modules/` lives in the project folder (so Cursor / VS Code can see types
for IntelliSense) but is installed **by** the container's pnpm — your host never
touches Node.

## Building for production

```sh
make pnpm ARGS=build
```

Output goes to `build/`. It's a fully static site (~750 KB) ready for any static
host — see Deployment below.

## Content & assets

The prototype currently uses **procedurally generated placeholder assets**:

- `/static/drawings/*.svg` — six themed line-drawing placeholders
- `/static/audio/*.ogg` — three procedural piano-like tones (ffmpeg)
- Poetry — inlined public-domain verse (Dickinson, Whitman, Blake, Rossetti)

See `static/CREDITS.md` for sources and licensing.

### Regenerate placeholders

```sh
./scripts/fetch-assets.sh
```

(Uses the `jrottenberg/ffmpeg` container for audio. Idempotent — skips files that
already exist.)

### Swap in real assets

1. Drop new files into `/static/drawings/`, `/static/audio/`, etc.
2. Edit `src/lib/content.ts` — update the `drawings`, `tracks`, and `poems`
   arrays to point at the new paths and metadata.
3. That's it. All four variants automatically pick up the new content.

The shape is:

```ts
type Drawing = { id; title; year; medium; src; alt; rotation?; pos?; width? }
type Track   = { id; title; composer; src; pos? }
type Poem    = { id; title; author; lines; pairsWith?; pos?; rotation? }
```

`pos` and `rotation` only matter for `/atelier`. `pairsWith` (a drawing id) is
used by `/editorial` and `/scroll` to associate a poem with a drawing.

## Architecture

```
src/
  app.html              # <head>, Google Fonts
  routes/
    +layout.ts          # prerender + trailingSlash: 'always'
    +layout.svelte      # global head (favicon, CSS)
    layout.css          # Tailwind + theme tokens (fonts, colours)
    +page.svelte        # landing
    scroll/+page.svelte
    museum/
      +layout.svelte    # museum chrome + docked AudioPlayer
      +page.svelte      # grid
      [slug]/+page.ts   # entries() + load()
      [slug]/+page.svelte
      museum-state.svelte.ts  # shared $state for current track
    editorial/+page.svelte
    atelier/+page.svelte
  lib/
    content.ts          # single source of truth
    components/
      AudioPlayer.svelte  # variants: inline | docked | minimal
      Drawing.svelte
      PoemBlock.svelte
static/
  drawings/, audio/, .nojekyll, CREDITS.md
scripts/
  fetch-assets.sh
```

## Deployment (GitHub Pages)

The static adapter is preconfigured. To deploy on push to `main`:

1. Create a new GitHub repo and push this directory:
   ```sh
   git init && git add . && git commit -m "init"
   git remote add origin git@github.com:<you>/<repo>.git
   git push -u origin main
   ```
2. In the repo's **Settings → Pages**, set **Source: GitHub Actions**.
3. The included workflow (`.github/workflows/deploy.yml`) builds the site and
   publishes it. The `BASE_PATH` is set automatically from the repo name.

For a custom domain or user/org pages (`username.github.io`), unset
`BASE_PATH` in the workflow.

## Stack

- **SvelteKit 2 + Svelte 5** (runes mode)
- **Tailwind CSS 4** with `@tailwindcss/typography`
- **GSAP + ScrollTrigger** for the `/scroll` variant
- **Lenis** for smooth scroll
- **Web Audio + native `<audio>`** for the `/atelier` proximity gain
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- All tooling runs in Docker (`Dockerfile.dev`)

## Out of scope

- A CMS — content lives in one TS file
- Mobile-perfect interactions for `/atelier`
- Analytics / A-B comparison instrumentation
