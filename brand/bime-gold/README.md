# Bime Gold — brand book

The identity is typographic. There is no illustrated symbol: the lockup is the brand,
and the gold tittle over the *i* is the only ornament. Flat colour throughout — the
identity uses **no gradients**.

| | |
|---|---|
| Name (Latin) | **Bime Gold** — written `bimegold` in the lockup, always lowercase, no space |
| Name (Persian) | **بیمه گلد** |
| Domain | `bimegold.com` |
| Source artwork | `reference/bime-gold-type-10-compact.png` |
| Rebuild everything | `tools/brand-gold/build.sh` |

## 1. Logo

The approved artwork, cleaned and vectorised, lives in **[`traced/`](traced/README.md)**.
Those files are the logo. `traced/README.md` documents how they were derived from the
render; this section is how to use them.

| Asset | When |
|---|---|
| `traced/svg/logo.svg` | **Primary.** Horizontal lockup, light backgrounds. |
| `traced/svg/logo-on-dark.svg` | Dark backgrounds — `bime` lightens to `#F0F0F0`, gold is unchanged. |
| `traced/svg/logo-clearspace.svg` | Primary with the clear space already padded in. |
| `traced/svg/logo-stacked.svg` | `bime` over `gold`. Square slots, social avatars, tall spaces. |
| `traced/svg/logo-mono-dark.svg` · `-mono-light.svg` | One ink. Engraving, fax, stamps, a photo background. |
| `traced/svg/mark.svg` · `mark-on-dark.svg` | The `bi` monogram — the logo reduced. |

Ship SVG wherever the medium allows. `traced/png/` carries 128–1024 px raster fallbacks;
every one is rendered from the SVG above it, so they cannot disagree.

### Clear space and minimum size

Keep free space equal to **22 % of the lockup height** on all four sides — roughly the
height of the gold tittle. Nothing else enters that band.

The horizontal lockup stays legible down to **16 px tall** — at that height it is still
53 px wide, which is the space it needs. Below that, switch to the `bi` monogram.

Square slots are a different question, because the constraint is width, not height. In a
square the stacked lockup holds to about **48 px**; at 32 it is soft and at 16 it is a
smudge. So every app icon uses the full lockup and only the browser tab falls back to the
monogram.

### Misuse

Do not recolour the wordmark, add a gradient, outline it, set it in a different typeface,
change the spacing between `bime` and `gold`, add a drop shadow, rotate it, or place the
light-background version on a dark field. Use the file for the background you have.

## 2. The mark

`bi` — the first two letters of the wordmark with the gold tittle — is the reduced form.
**Use it only where the full lockup cannot be read**, which in practice means the 16 and
32 px browser-tab icon. Everywhere with room for the name — app icons, the app header, the
auth screen, avatars — takes the full lockup.

The letterforms take the surrounding text colour; **the tittle is always `#D4AF37`**.

In the web app both are generated React components with `currentColor` letterforms:
`BrandLogo` (`apps/web/src/components/BrandLogo.tsx`) is the default,
`BrandMark` is the reduced form. Size them with a height and `w-auto`. Inside a flex
column add `self-start` — as a flex item the `<svg>` stretches to full width and
`preserveAspectRatio` then centres the artwork inside it, which reads as a centring bug.

## 3. Colour

| Token | Hex | Use |
|---|---|---|
| charcoal | `#2B2B2B` | `bime` on light backgrounds |
| charcoal on dark | `#F0F0F0` | `bime` on dark backgrounds |
| **gold** | `#D4AF37` | the tittle and the word `gold`. Flat, never a gradient. |
| navy | `#0F172A` | brand field: app icons, tiles, dark lockups |

Machine-readable: [`colors.json`](colors.json).

**The gold is not a text colour.** `#D4AF37` on white is 2.1:1 and fails WCAG AA. Where
gold has to carry text or a UI state, use a darkened step of the same hue:

| Surface | Token | Contrast |
|---|---|---|
| Docs site links, light | `#8A6D1F` (`--accent`) | 4.9:1 on `#fbfaf8` |
| Docs site links, dark | `#E5C158` (`--accent`) | 10.5:1 on `#14161a` |
| App, white on solid | `--color-brand-600` `oklch(0.55 0.102 90)` | 4.87:1 |
| App, brand text on page | `--color-brand-600` | 4.55:1 |

The app's full ramp is `--color-brand-50…900` in `apps/web/src/styles.css`: the logo's
hue held constant at 90 while lightness walks, so every pairing stays legible.
`--color-gold` in the same file is the exact logo gold, for marks only.

## 4. Typography

The wordmark is drawn artwork, not live text — nothing needs the original font to render it.

For running text the products use **Vazirmatn Variable**, self-hosted (no CDN — it has to
work inside Iran). `traced/` is accompanied by a re-typesetting of the wordmark in
**Plus Jakarta Sans Bold** under `svg/` and `png/`; that set is editable and useful for
setting new lockups in the same voice, but it is *not* letter-for-letter the approved
artwork. Never substitute it for the logo.

## 5. Application

Generated icon set:

| File | Size | Artwork | Where |
|---|---|---|---|
| `traced/svg/favicon.svg` | 16–32 | `bi` monogram | Browser tab |
| `traced/favicon.ico` | 16 / 32 / 48 | monogram at 16 and 32, **stacked lockup at 48** | Browser tab, bookmarks |
| `traced/png/apple-touch-icon-180.png` | 180 | stacked lockup | iOS home screen |
| `traced/png/icon-192.png` · `icon-512.png` | 192 / 512 | stacked lockup | PWA manifest |
| `traced/png/icon-maskable-512.png` | 512 | stacked lockup | Android adaptive (48 % safe zone) |

All on the navy field. The `.ico` carries different artwork per size on purpose — it is
the one format that can, and 48 px is where the full name becomes readable.

`tools/brand-gold/sync.sh` copies this package into `apps/web/public/brand/` and
`apps/docs/public/brand/` and regenerates `BrandMark.tsx`. **Those folders are generated —
do not hand-edit them.** Change the artwork here, run `tools/brand-gold/build.sh`, commit.

## 6. Open

- **No Persian lockup yet.** «بیمه گلد» appears as live Vazirmatn text in the products;
  a drawn Persian wordmark to sit beside the Latin one has not been designed.
- The old **bime247** identity — turquoise, ring-and-shield mark — is superseded.
  Its files are still in `apps/web/public/brand/`'s git history and `tools/brand/`.
