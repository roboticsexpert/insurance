# bime247 brand assets

Everything here is generated. Do not hand-edit an SVG in this folder — change
`tools/brand/build.py` and re-run:

```bash
tools/brand/build.sh
```

## The mark

An unbroken ring around a shield. The ring is the 24/7 in the name — a cycle with no
start and no end — and the shield is the cover. It is deliberately *closed*: an open
ring with two round caps reads as a power button, which is what the earlier drafts did.

Two cuts of the same mark:

| File | Use |
|---|---|
| `mark.svg` | Primary. Outline ring, solid shield. Anything 24px and up. |
| `mark-solid.svg` | Small sizes. Filled disc with the shield knocked out — holds its shape down to 16px, where the outline version silts up. |

Both are drawn on a 64-unit grid and painted with `currentColor`, so they take the
colour of whatever they sit in and follow light/dark mode for free. Inline the primary
mark rather than linking it when it needs to inherit a theme colour — see
`apps/docs/src/layouts/BaseLayout.astro`.

## Lockups

| File | Use |
|---|---|
| `logo-fa.svg` | Persian, horizontal. Mark on the **right** — RTL reading order. The default. |
| `logo-en.svg` | Latin, horizontal. Mark on the left. For English surfaces and the domain. |
| `logo-stacked-fa.svg` | Persian, mark above the wordmark. Square-ish slots, share cards, print. |
| `wordmark-fa.svg` / `wordmark-en.svg` | Type only, no mark. |

The wordmarks are Vazirmatn Bold **outlined to paths**, so no font has to be present
wherever the file lands. `بیمه۲۴۷` is shaped as two bidi runs — the word RTL, the
numerals LTR — because HarfBuzz does not apply the bidi algorithm itself; shaping the
whole string RTL renders the digits as `۷۴۲`.

The mark is sized against the wordmark's **cap height**, not its bounding box, so it
looks identical across both lockups even though Persian hangs dots below the baseline
and Latin does not.

Clear space: keep the mark's own radius free on every side. Never redraw the lockup by
setting the text yourself — use these files.

## Icons

| File | Use |
|---|---|
| `favicon.svg` | Modern browsers. Carries its own `prefers-color-scheme` swap. |
| `favicon.ico` | 16/32/48, transparent. Legacy and Windows. Served from the site root. |
| `apple-touch-icon.png` | 180px, full bleed. iOS rounds the corners itself. |
| `icon-192.png`, `icon-512.png` | Web manifest, rounded tile. |
| `icon-maskable-512.png` | Android adaptive. Mark sits inside the 80% safe zone. |

`favicon.svg` cannot use `currentColor` — a browser tab has no inherited colour — so it
hardcodes both palette values in an inline `<style>`.

## Colour

| Token | Light | Dark |
|---|---|---|
| brand | `#0b7c7c` | `#3fd0d0` |
| brand tint | `#e2f2f2` | `#0d2b2b` |

Firouzeh — Persian turquoise. Chosen to sit clear of the two colours that already own
Iranian insurance search results: Azki's orange and Bimeh.com's blue. These are the same
values as `--accent` / `--accent-soft` in `apps/docs/src/styles/global.css`.

## Regenerating

`tools/brand/build.sh` needs `rsvg-convert`, ImageMagick, and a Python with
`fonttools`, `uharfbuzz` and `brotli`. It reads Vazirmatn straight out of the pnpm
store, rebuilds every SVG, rasterises the icons, and mirrors the web-facing set into
`apps/docs/public/`. Point it at a specific interpreter with `BRAND_PYTHON=...`.
