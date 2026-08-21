# Insurance Docs — project notes

Notes on **`apps/docs`**, the static research site at `docs.bimegold.com`. Each research topic
is one Markdown file and the homepage lists them.

This is one of three apps in the workspace — see *The two parts of the project* below. The
platform being built lives in `apps/api` and `apps/web`; its own notes are
[`docs/platform/MVP-PLAN.md`](platform/MVP-PLAN.md) and
[`PROGRESS.md`](platform/PROGRESS.md).

## Decisions

- **Content language: Persian, RTL.** Audience is the Iranian insurance/insurtech market.
  Font is Vazirmatn Variable, self-hosted via `@fontsource-variable/vazirmatn` (no CDN —
  works offline and inside Iran).
- **Stack: Astro (latest, currently 7.x)**, static output, content collections. No client-side
  JS shipped. Keep `astro` on `latest` — do not pin to an old major.
- **Single source of truth:** the research content lives in `src/content/topics/`, not in
  a separate `docs/` copy. This file documents the project itself, not its subject matter.

## Structure

Paths below are relative to **`apps/docs/`**.

```
src/
  content.config.ts          collection schema (title, summary, order, updated, tags, status)
  content/topics/*.md        one file per research topic  ← the actual content
  layouts/BaseLayout.astro   html shell, lang="fa" dir="rtl", header/footer
  pages/index.astro          homepage: topic cards sorted by `order`
  pages/topics/[...slug].astro   topic page
  styles/global.css          the whole design system (light + dark via prefers-color-scheme)
```

## Adding a new topic

Create `src/content/topics/<slug>.md`. The URL becomes `/topics/<slug>/`.

```yaml
---
title: 'عنوان موضوع'
summary: 'یک تا دو جمله توضیح که در کارت صفحه اصلی نمایش داده می‌شود.'
order: 2                  # ترتیب نمایش در صفحه اصلی
updated: '۲۸ مرداد ۱۴۰۵'
tags: ['برچسب']
status: 'in-progress'     # draft | in-progress | reviewed
---
```

Conventions used in the existing topic:

- Markdown tables are written as **raw HTML wrapped in `<div class="table-scroll">`** so
  they scroll inside their own box on mobile instead of breaking the page layout.
- Latin text/URLs inside Persian prose go in `<span class="ltr">…</span>` to stop bidi
  from scrambling them.
- Every topic ends with a **منابع** section of real links, and unverified claims are
  explicitly marked as such (see the 60% vs 90% market-share note).

## Commands

From the repo root:

```bash
pnpm dev:docs                      # http://localhost:4321
pnpm --filter @bimegold/docs build  # → apps/docs/dist/
```

## Deployment

Live at **https://docs.bimegold.com** — Cloudflare Workers static assets (no Worker
script), config in `wrangler.jsonc`.

- Account: `Hallehesmaeelnejad@gmail.com's Account` (`022e4e5b87a14dc3d0e17772f66b5d6b`);
  zone `bimegold.com`. **Moved here on 2026-08-21** from the `Mahdi Youseftabar` account
  (`45d1cc1b…`, zone `zisef.ir`) when the brand became Bime Gold: a Workers custom domain
  has to sit on the same account as its zone, so the Worker had to move accounts, not just
  change its route. The old `insurance-docs` Worker still exists on the old account and
  still answers `insurance.zisef.ir`; delete it once nothing links there.
- The custom domain is declared as a route in `wrangler.jsonc`, so `wrangler deploy`
  creates and keeps the DNS record — do not add it by hand in the dashboard.
- `not_found_handling: "404-page"` is served by `src/pages/404.astro`.

```bash
pnpm --filter @bimegold/docs build && cd apps/docs && npx wrangler deploy
```

**Verifying from inside Iran:** the Cloudflare edge is not reachable directly from the
local network, and the SOCKS proxy resolves the site's hostname to a different origin, so `curl`
and `WebFetch` both give misleading results. Verify from Cloudflare's own side instead:

```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/browser-rendering/content" \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"url":"https://docs.bimegold.com/"}'
```

## Content status

| Topic | order | Status |
|---|---|---|
| `core-insurance-va-sanhab` | 1 | in-progress — open questions at article end |
| `anatomy-of-core-insurance` | 2 | in-progress — build-oriented anatomy of a core; the project's focus area |
| `anvae-bime-dar-iran` | 3 | in-progress |
| `sherkathaye-bime-iran` | 4 | in-progress |
| `matris-foroosh-online-bime` | 5 | in-progress |
| `bazigaran-va-mogharrarat-foroosh-online` | 6 | in-progress |
| `andaze-bazar-va-forsat` | 7 | in-progress |
| `barnameh-shoroo-platform` | 8 | in-progress — the actionable conclusion of the other topics |

## The two parts of the project

1. **هسته بیمه‌گری (core insurance)** — research only so far; see the Focus section below.
2. **Online insurance purchase platform** — the product being built. Plan:
   [`docs/platform/MVP-PLAN.md`](platform/MVP-PLAN.md). MVP is a mobile-only React SPA +
   NestJS API, simple instant-buy products, mock payment and mock OTP, deployed on Railway.
   **This has happened**: the repo is now a pnpm workspace (`apps/api`, `apps/web`,
   `apps/docs`), and the Astro site described above lives in `apps/docs/`. The deployment of
   the docs site was unaffected, as planned. M0–M5 are built — all three products quote,
   and **all three can be bought end to end against the mock gateway, over the API and through
   the web app alike**. Progress and every decision made along the way:
   [`docs/platform/PROGRESS.md`](platform/PROGRESS.md); the purchase-flow test run that found
   this and 25 other defects: [`docs/platform/QA-FINDINGS.md`](platform/QA-FINDINGS.md).

## Plan

The go-to-market plan for the business itself (which line to enter first, phases,
validation questions) exists in two places:

- `docs/PLAN.md` — internal notes, English, the working version.
- `src/content/topics/barnameh-shoroo-platform.md` — the published Persian version on the
  site (order 8). Keep the two in sync when the plan changes.

## Focus

The project's stated focus is **هسته بیمه‌گری (Core Insurance)** — specifically what it is
made of and how each part works, from the perspective of building one. That thread lives in
`anatomy-of-core-insurance.md`; its open-questions section is the current research backlog.

## Brand

**2026-08-21 — the name changed to «Bime Gold».** It replaces **bime247 / بیمه ۲۴۷**.
The new identity is a typography-only lockup: lowercase `bimegold`, `bime` in charcoal,
`gold` in flat gold, with a gold dot on the *i* standing in for a separate mark.

- Approved artwork, cleaned and vectorised: `brand/bime-gold/traced/` — **this is the logo**.
- Editable re-typesetting in Plus Jakarta Sans Bold, plus icons/tiles/favicon:
  `brand/bime-gold/svg/` and `png/`.
- Both are generated by `tools/brand-gold/build.sh`; the spec is
  `brand/bime-gold/README.md`, published at **https://brand.bimegold.com**
  (`apps/brand`, Persian with an English toggle, built by `tools/brand-gold/site.py`).
- Colour: charcoal `#2B2B2B`, gold `#D4AF37`, navy field `#0F172A`.
  **Flat — no gradient.** The reference render carried a faint metallic gradient; it is
  deliberately not reproduced.

Not yet done: nothing in `apps/` has been renamed. The docs site, `apps/web`, the old
turquoise accent and `apps/web/public/brand/` still carry bime247. Migrating them is a
separate pass.

### Previous identity — bime247 (superseded, kept for context)

The old name was **bime247.com** — «بیمه» plus 24/7. Its identity lives in
`apps/web/public/brand/`, generated by `tools/brand/build.sh`; that folder's `README.md`
is its spec (mark, lockups, icons, clear space, colour).

Decisions worth keeping from it:

- **Mark: a closed ring around a shield.** Ring = the 24/7 cycle, shield = the cover.
  Earlier drafts left a gap at the top of the ring; with two round caps it reads as a
  power button, so the ring is deliberately unbroken. A second solid cut of the mark
  (filled disc, shield knocked out) exists purely because the outline version silts up
  below ~20px.
- **Colour: firouzeh `#0b7c7c` / `#3fd0d0`.** Persian turquoise, picked to sit clear of
  Azki's orange and Bimeh.com's blue. This replaced the old `#0f6b5c` teal as `--accent`
  in the docs site, so the two surfaces share one accent.
  **The app does not use it yet.** `apps/web/src/styles.css` defines `--color-brand-*` as an
  oklch ramp whose 600 resolves to `#00897b`, and its own comment marks it a placeholder until
  the brand book settles. So the docs site and the app are currently *not* the same teal —
  reconciling them is one edit to that token block, and nothing else follows the value.
- **Wordmarks are outlined Vazirmatn Bold, not live text**, so the files carry no font
  dependency. `بیمه۲۴۷` must be shaped as two bidi runs (word RTL, numerals LTR) —
  HarfBuzz does not run the bidi algorithm, and shaping the whole string RTL silently
  renders the digits reversed as `۷۴۲`.
- **The Persian lockup puts the mark on the right**, matching RTL reading order.
