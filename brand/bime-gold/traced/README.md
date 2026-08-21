# Bime Gold — logo, traced from the reference render

These files are the **artwork you approved**, cleaned up: the white background is gone,
the empty margin is trimmed to zero, and the shapes are real vector outlines.

Source: `../reference/bime-gold-type-10-compact.png` (1536×1024, wordmark on white).
The wordmark occupies only 1093×328 of it — everything else was blank.

Rebuild: `tools/brand-gold/build.sh` (or `trace.py` alone). Needs `potrace` + `rsvg-convert`.

## How it was made

1. **De-matte** — every pixel is modelled as `pixel = α·ink + (1−α)·white`. The local ink
   colour is estimated from deeply-interior pixels and spread outward, so α comes out
   right even where the render shaded a letter. Result: true alpha, no white fringe.
2. **Trim** — cropped to the alpha bounding box. No padding in the tight files.
3. **Classify** — each connected glyph is labelled charcoal or gold by its own mean hue,
   so the dot on the *i* stays gold and antialiased rims never split between layers.
4. **Trace** — the mask is supersampled 4× and vectorised with potrace, one path per
   colour. Mean difference against the source render: **2.9 %** (colour change only).
5. **Export** — every PNG is rendered *from the SVG*, so raster and vector cannot drift.

## Files

| File | Use |
|---|---|
| `svg/logo.svg` | **Primary.** 1093×328, transparent, tight crop. |
| `svg/logo-clearspace.svg` | Same lockup with the required clear space baked in. |
| `svg/logo-on-dark.svg` | `bime` in `#F0F0F0` for dark backgrounds. Transparent. |
| `svg/logo-mono-dark.svg` | One-colour charcoal — stamps, faxes, single-ink print. |
| `svg/logo-mono-light.svg` | One-colour white — photos, dark solids. |
| `png/logo-{128,256,512,1024}.png` | Transparent raster, light backgrounds. |
| `png/logo-on-dark-*.png` | Transparent raster, dark backgrounds. |
| `png/logo-clearspace-1024.png` | Padded raster for slide decks and social avatars. |

## Colour — flat, no gradient

| Token | Hex |
|---|---|
| charcoal (`bime`) | `#2B2B2B` |
| charcoal on dark | `#F0F0F0` |
| gold (dot + `gold`) | `#D4AF37` |

The reference render carried a faint metallic gradient. It is deliberately **not**
reproduced — the identity is flat colour. The render's gold measures `#D8AE4B` on
average; `#D4AF37` is the brand token and reads the same at any size.

## Clear space

Keep at least 22 % of the lockup height free on every side — roughly the height of the
gold dot. `logo-clearspace.svg` already has it.

## Relationship to `../svg/`

`../svg/` is a **re-typesetting** of the wordmark in Plus Jakarta Sans Bold. It is
editable (change the text, retune the tracking) but is not letter-for-letter identical
to the approved render. The files in this folder *are* the approved render. Use these
for the logo; use the font-based set when you need to typeset new lockups in the same
voice.
