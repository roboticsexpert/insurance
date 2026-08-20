# bime247

Monorepo for the **bime247** insurance business.

| App | What | Where |
|---|---|---|
| [`apps/web`](apps/web) | Customer app — React SPA, Persian, RTL, **mobile only** | app.bime247.com |
| [`apps/api`](apps/api) | NestJS + PostgreSQL — catalog, rating engine, orders, policies | api.bime247.com |
| [`apps/docs`](apps/docs) | Astro research site on the Iranian insurance industry | insurance.zisef.ir |

## Getting started

```bash
pnpm install
pnpm db:up          # Postgres on :5433
pnpm db:migrate
pnpm db:seed
pnpm dev            # api on :3000, web on :5173
```

## Docs

- [`docs/platform/MVP-PLAN.md`](docs/platform/MVP-PLAN.md) — the full design of the platform
- [`docs/platform/PROGRESS.md`](docs/platform/PROGRESS.md) — what is built, what is next
- [`docs/platform/DEPLOY.md`](docs/platform/DEPLOY.md) — the Railway runbook for the API
- [`docs/PROJECT.md`](docs/PROJECT.md) — the research site
- [`docs/PLAN.md`](docs/PLAN.md) — go-to-market plan for the business

The MVP runs on mocks by design: payment gateway, SMS, and the OTP code `1234`.
Rate tables are placeholders and the UI marks them as such.
