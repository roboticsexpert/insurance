# Deploying the API to Railway

The design lives in [`MVP-PLAN.md` §12](MVP-PLAN.md); this is the runbook. Decisions made while
building it are recorded in [`PROGRESS.md`](PROGRESS.md).

## What is in the repo

| File | Why |
|---|---|
| `apps/api/Dockerfile` | Multi-stage build. **Context is the repo root**, not `apps/api` — the lockfile and `pnpm-workspace.yaml` live there. |
| `.dockerignore` | Excludes `apps/web` / `apps/docs` source but keeps their `package.json`: pnpm reads every manifest in the workspace before it applies `--filter`. |
| `railway.json` | Root-level, so it applies with `rootDirectory` left at `/`. Selects the Dockerfile builder and points the health check at `/health/ready`. |

Verify the image without Railway at all:

```bash
docker build -f apps/api/Dockerfile -t bime247-api:local .
```

## Provisioning

Nothing is on Railway yet. From the repo root:

```bash
railway init --name bime247
```

```bash
railway add --database postgres --json
```

```bash
railway add --service api --json
```

Then the variables. `DATABASE_URL` comes from the Postgres service by reference, so it keeps
working when the database is replaced:

```bash
railway variable set --service api --skip-deploys \
  'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  'NODE_ENV=production' \
  'PORT=3000' \
  'WEB_URL=https://app.bime247.com' \
  'API_URL=https://api.bime247.com' \
  "JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n')" \
  "JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')" \
  'AUTH_MOCK_OTP=1234' \
  'ALLOW_MOCK_AUTH_IN_PROD=true' \
  'ALLOW_MOCK_PAYMENT_IN_PROD=true' \
  'PAYMENT_GATEWAY=mock' \
  'SMS_PROVIDER=console' \
  'CORS_ORIGINS=https://app.bime247.com' \
  'COOKIE_DOMAIN=.bime247.com'
```

`WEB_URL`, `API_URL`, `CORS_ORIGINS` and `COOKIE_DOMAIN` above assume the final domains. Until
those are attached, point them at the generated `*.up.railway.app` host instead — `CORS_ORIGINS`
is rejected when empty in production, and a `COOKIE_DOMAIN` that does not match the host silently
drops the refresh cookie.

Deploy, then wait for a terminal status — `railway up --detach` returning only means the build
was queued:

```bash
railway up --detach --service api -m "initial deploy"
```

```bash
railway deployment list --json
```

The catalog is **not** seeded by the container; `start:prod` runs migrations only. Seed once
against the Railway database:

```bash
railway run --service api pnpm --filter @bime247/api seed
```

## Read this before pointing a domain at it

`NODE_ENV=production` forces both mock escape hatches on, because `apps/api/src/config/env.ts`
refuses to boot otherwise and the `PAYMENT_GATEWAY` enum admits no real gateway yet. The
deployed API therefore has **OTP `1234` logging in as any mobile number**, and a mock bank page
that issues policies without taking money. Keep it on the generated `*.up.railway.app` host and
do not attach `api.bime247.com` until a real gateway and SMS provider land.

## Custom domain, when that time comes

Railway issues its own certificate and cannot do it through a proxied Cloudflare record:

1. Add the domain on the Railway service.
2. Create the CNAME in Cloudflare **DNS-only** (grey cloud).
3. Wait for Railway to issue the certificate.
4. Turn the proxy on (orange cloud) with SSL mode **Full (strict)**.

The proxy is not cosmetic — Railway's edge reachability from inside Iran is unverified, and the
orange cloud means users connect to Cloudflare rather than to Railway directly.
