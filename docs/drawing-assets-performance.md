# Drawing assets

## Goal

Sharp atelier zoom (**4.5×**, no browser upscaling). Gallery and atelier entry stay
light; full JPEGs load when a piece is likely to be viewed.

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
| `image00X.jpg` | Yes | Atelier sharp zoom (lazy) |
| `image00X-thumb.webp` | Yes | Gallery + atelier placeholder (**960 px** long edge) |

Thumb names mirror the original: `image001.jpg` → `image001-thumb.webp`.

---

## Session cache

`drawing-asset-cache.ts` fetches each URL once per tab session and reuses blob URLs
for gallery, atelier thumbs, and full JPEGs. Needed when private mode or DevTools
“disable cache” prevents HTTP caching on navigation.

Thumbs prefetch in parallel on layout mount. Full JPEGs download one at a time.

---

## Progressive loading (atelier)

Two layers per piece:

1. **Thumb** — visible immediately; canvas zoom may upscale it (soft) while waiting.
2. **Full JPEG** — downloaded in background; crossfades in when ready (sharp zoom).

Prefetch triggers (one full JPEG at a time via download queue):

| Trigger | When |
|---|---|
| Gallery plate `pointerdown` | Before navigation |
| `?focus=` / tap drawing | Focus on atelier |
| Pinch / wheel / double-tap zoom | Piece under zoom focal point |
| Touch on a piece | Pointer down on drawing |

Viewport intersection does **not** prefetch — at overview zoom all pieces are visible
and would compete on slow connections.

---

## Sharp zoom

Original long edge ~4400 px. Piece slot width `W` in `content.ts` (280–300 px).

```
maxSharpZoom(W) = 4400 ÷ (W × DPR)    use DPR = 3
MAX_ZOOM = min(4.5, …)                 atelierMaxZoom() in content.ts
```

Pinch past the cap is blocked in code. Softness before full load is expected.

---

## Generate thumbnails

```bash
pnpm install          # once — adds sharp
pnpm assets:thumbs    # reads content.ts → writes image00X-thumb.webp (960 px)
```

Re-run after replacing an original. Add the drawing in `content.ts` first.

---

## Workflow

### Add or replace a drawing

1. Put `image00X.jpg` in `static/drawings/`.
2. Register it in `src/lib/content.ts`.
3. Run `pnpm assets:thumbs`.
4. Commit the JPEG and the new `-thumb.webp`.

### Deploy

Everything in `static/drawings/` at build time is published. No CI asset step.

---

## Verify

- [ ] `pnpm assets:thumbs` — thumbs ~960 px long edge
- [ ] Gallery click → full JPEG starts before atelier paints
- [ ] Atelier entry — thumbs only
- [ ] Zoom on piece → full fetch starts; thumb stays visible until load
- [ ] Full loaded → crossfade; pinch to **4.5×** sharp
