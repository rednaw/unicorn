# Unicorn — Artist Prototype, Two Variants

A SvelteKit prototype presenting one (fictional) artist's drawings, piano recordings,
and poetry through **two contrasting design languages**. The same content runs through
each variant so the design directions can be compared apples-to-apples.

| Route          | Idea                                                        |
| -------------- | ----------------------------------------------------------- |
| `/`            | Landing — artist intro and the two variant cards            |
| `/museum/`     | Quiet white-walls gallery with detail pages                 |
| `/atelier/`    | Pannable + zoomable canvas with proximity-based audio       |

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

### Git push

The devcontainer mounts your host `~/.ssh` (read-only) so `git push` works with
SSH remotes like `git@github.com:…`. Commit inside the container, then:

```sh
git push
```

If your SSH key has a passphrase or lives only in the macOS Keychain agent (not in
`~/.ssh`), run `git push` from a **host** terminal in this same folder instead — commits
are already on disk via the bind mount.

## Deployment (GitHub Pages)

Push to `main` — GitHub Actions builds and publishes automatically.

1. Create a GitHub repo and push this directory.
2. In the repo's **Settings → Pages**, set **Source: GitHub Actions**.
3. The workflow (`.github/workflows/deploy.yml`) runs `pnpm build` and deploys `build/`.
   `BASE_PATH` is set from the repo name for project Pages sites.

For a custom domain or user/org pages (`username.github.io`), unset `BASE_PATH` in
the workflow.

## Content & assets

The prototype currently uses a curated public-domain-inspired set:

- `/static/drawings/*.svg` — six drawing placeholders used across all variants
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
3. That's it. Both variants automatically pick up the new content.

The shape is:

```ts
type Drawing = { id; title; year; medium; src; alt; rotation?; pos?; width? }
type Track   = { id; title; composer; src; pos? }
type Poem    = { id; title; author; lines; pairsWith?; pos?; rotation? }
```

`pos` and `rotation` only matter for `/atelier`. `pairsWith` (a drawing id) is
used by `/museum` detail pages to associate a poem with a drawing.

## Architecture

```
src/
  app.html              # <head>, Google Fonts
  routes/
    +layout.ts          # prerender + trailingSlash: 'always'
    +layout.svelte      # global head (favicon, CSS)
    layout.css          # Tailwind + theme tokens (fonts, colours)
    +page.svelte        # landing
    museum/
      +layout.svelte    # museum chrome + docked AudioPlayer
      +page.svelte      # grid
      [slug]/+page.ts   # entries() + load()
      [slug]/+page.svelte
      museum-state.svelte.ts  # shared $state for current track
    atelier/+page.svelte
  lib/
    content.ts          # single source of truth
    components/
      AudioPlayer.svelte  # variants: inline | docked | minimal
      PoemBlock.svelte
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
- **Web Audio + native `<audio>`** for the `/atelier` proximity gain
- **@sveltejs/adapter-static** with `404.html` SPA fallback
- Dev tooling in `.devcontainer/` — GitHub Actions for production builds

## Out of scope

- A CMS — content lives in one TS file
- Mobile-perfect interactions for `/atelier`
- Analytics / A-B comparison instrumentation
