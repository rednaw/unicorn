# Drawing assets

## Goal

Sharp atelier zoom (**4.5×**, no browser upscaling). Gallery and atelier entry stay
light; full JPEGs load only when a piece is viewed.

---

## What lives in git

```
static/drawings/
  image001.jpg
  image001-thumb.webp
  image002.jpg
  image002-thumb.webp
  image003.jpg
  image003-thumb.webp
```

| File | Commit | Used for |
|---|---|---|
| `image00X.jpg` | Yes | Atelier lazy-load (full resolution, sharp zoom) |
| `image00X-thumb.webp` | Yes | Gallery + atelier placeholder (~640 px long edge) |

No other derivatives. No re-encoded atelier copies.

Thumb names mirror the original: `image001.jpg` → `image001-thumb.webp`.

---

## What loads where

| Context | Asset | When |
|---|---|---|
| Gallery | `image00X-thumb.webp` → fallback `image00X.jpg` | Page load (`loading="lazy"`) |
| Atelier entry | `image00X-thumb.webp` in piece frame | First paint |
| Atelier zoom | `image00X.jpg` | Viewport or `?focus=` / tap (lazy) |

---

## Sharp zoom

Original long edge ~4400 px. Piece slot width `W` in `content.ts` (280–300 px).

```
maxSharpZoom(W) = 4400 ÷ (W × DPR)    use DPR = 3
MAX_ZOOM = min(4.5, …)                 atelierMaxZoom() in content.ts
```

Pinch past the cap is blocked in code.

---

## Generate thumbnails

```bash
pnpm install          # once — adds sharp
pnpm assets:thumbs    # reads content.ts → writes image00X-thumb.webp
```

Re-run after replacing an original. Add the drawing in `content.ts` first.

Optional: `DRAWINGS_DIR=/path/to/drawings pnpm assets:thumbs`

---

## Workflow

### Add or replace a drawing

1. Put `image00X.jpg` in `static/drawings/`.
2. Register it in `src/lib/content.ts` (`drawingPaths` or equivalent).
3. Run `pnpm assets:thumbs`.
4. Commit the JPEG and the new `-thumb.webp`.

### Deploy

Everything in `static/drawings/` at build time is published. No CI asset step.

---

## Implementation checklist

- [x] `content.ts` — `src` → `image00X.jpg`, `thumb` → `image00X-thumb.webp` (drop `atelier` tier)
- [x] `scripts/assets-thumbs.mjs` — thumbs only; output `{basename}-thumb.webp` from each source file
- [x] `package.json` — `assets:thumbs` script
- [x] Gallery — `<img src={drawing.thumb}>` with fallback to `drawing.src`
- [x] `AtelierDrawingImg` — placeholder thumb; lazy-load `drawing.src`
- [x] Remove stale `*-atelier.*` and id-based `*-thumb.webp` files from `static/drawings/`

---

## Verify

- [ ] `pnpm assets:thumbs` — one `image00X-thumb.webp` per original
- [ ] Gallery network tab — thumbs only (no full JPEGs)
- [ ] Atelier entry — thumbs only
- [ ] Pan to piece / `?focus=` — `image00X.jpg` loads once
- [ ] Pinch to **4.5×** — sharp on DPR 2–3; past **4.5×** — clamped
