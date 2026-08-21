---
description: Build the next unchecked task in the Bime247 MVP plan, verify it, and tick it off
---

You are building the **Bime247** online insurance platform in this monorepo.

## Do this, once, per run

1. Read `docs/platform/PROGRESS.md`. Read `docs/platform/MVP-PLAN.md` for design detail on the
   area you are about to touch (do not re-read the whole plan every run — only the relevant part).
2. Take the **first `[ ]` task** in `PROGRESS.md`, top to bottom. Do not skip ahead, do not
   cherry-pick an easier one, do not do several at once. If a task is genuinely too large,
   split it into smaller `[ ]` lines in place and do the first one.
3. Implement it completely — no TODOs, no stubbed functions, no placeholder UI standing in for
   real behaviour.
4. **Verify before ticking.** At minimum `pnpm --filter @bimegold/api typecheck` (and `test` when
   you touched the API) or `pnpm --filter @bimegold/web typecheck && build` for web work. For a
   UI task, run the dev server through the Browser pane and look at it on a mobile viewport
   (375×812) — screenshot it. A task is not done because the code compiles.
5. Change `[ ]` to `[x]` on that line, and append anything future-you would want to know to the
   **Notes & decisions** section at the bottom of `PROGRESS.md`.
6. Stop. Report in a few lines: what you built, how you verified it, what is next.

If the task turns out to be blocked, mark it `[!]` with the reason on the same line, then move
to the next `[ ]` task in the same run rather than stopping.

## Standing rules for this project

- **No shared packages.** The API owns validation and is the authority; the web keeps its own
  small display helpers. Duplicating forty lines of formatting beats a cross-package build step.
- **Persian, RTL, mobile only.** No desktop layout, no i18n library, no English UI. Every number
  the user sees is in Persian digits, every date Jalali, every price in Tomans with the unit word.
- **Money is an integer count of Rial** everywhere in the backend. No floats, no strings.
- **A quoted price is frozen.** Orders reference a stored `QuoteOffer`; nothing is ever repriced.
- **Rate tables are data**, versioned in Postgres, tagged `meta.source: "PLACEHOLDER"` until real
  insurer rates exist — and the UI must show the «نمونه» badge while they are placeholders.
- Errors return `{ statusCode, code, messageFa, requestId }`. The API owns all Persian wording.
- Mock only what the plan says to mock: the payment gateway, SMS, the OTP `1234`, policy issuance.
  Everything else is real.
- Follow the existing file's conventions — comment density, naming, structure — over your defaults.
- Do not commit unless asked.

## Useful commands

```
pnpm db:up                              # Postgres on :5433
pnpm db:migrate                         # prisma migrate dev
pnpm db:seed
pnpm dev:api                            # :3000
pnpm dev:web                            # :5173
pnpm --filter @bimegold/api typecheck
pnpm --filter @bimegold/api test
```
