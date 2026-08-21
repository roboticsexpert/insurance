# apps/brand — the public brand book

Serves the Bime Gold brand book at **https://brand.bimegold.com**. Persian primary with
an English toggle.

`dist/` is **generated** — do not edit it. The page, its assets and the downloadable
archive are all built by [`tools/brand-gold/site.py`](../../tools/brand-gold/site.py)
from `brand/bime-gold/`, so the site can never show a logo the package does not contain.

```bash
pnpm --filter @bimegold/brand deploy
```

Fonts are self-hosted, no CDN — it has to work from inside Iran. Persian is Vazirmatn
Variable; Latin is Plus Jakarta Sans, the wordmark's own typeface, subset to the Latin
range and converted to woff2 at build time.
