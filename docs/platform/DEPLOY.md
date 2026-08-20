# Deploying bime247

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

## What is provisioned

| | |
|---|---|
| Project | `bime247` — `24480e21-2aa9-401f-9f9f-561135f02e12` |
| Environment | `production` — `12a54ba8-1f6a-4381-9009-88f9999df531` |
| Services | `api` (Dockerfile, GitHub source) · `Postgres` (`postgres-ssl:18`) |
| Public URL | `https://api-production-21b4.up.railway.app` |

The `api` service deploys from **`roboticsexpert/insurance`, branch `main`** — a push to `main`
is a deploy. There is no `railway up` in the loop; running one would upload the local directory
and shadow the repo as the source of truth.

## Re-creating it from scratch

From the repo root:

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

Point the service at GitHub rather than uploading from the working directory. This creates the
deployment trigger and immediately queues a build:

```bash
railway service source connect --repo roboticsexpert/insurance --branch main --service api
```

Wait for a terminal status — a queued build is not a deploy:

```bash
railway service status --json
```

The catalog is **not** seeded by the container; `start:prod` runs migrations only, so a fresh
deploy answers `/api/v1/catalog/products` with `[]`. The Postgres service has no
`DATABASE_PUBLIC_URL`, so the seed cannot be run from a laptop — run it inside the container:

```bash
railway ssh --service api -- sh -lc 'cd /app/apps/api && node_modules/.bin/tsx prisma/seed.ts'
```

Seeded rows live on the Postgres volume, so this is once per database, not once per deploy.

## Deploying a change

Push to `main`. To watch it:

```bash
railway service status --json
```

```bash
railway logs --service api --lines 200
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

---

# Deploying the web to Railway

`apps/web` is a Vite SPA built by `apps/web/Dockerfile` and served by nginx. It moved off
Cloudflare Workers — see PROGRESS for why that reverses MVP-PLAN §12.

| | |
|---|---|
| Service | `web` — `1ef779be-40ce-459d-859f-983e4ecb775b` |
| Test URL | `https://web-production-b407f.up.railway.app` |
| Port | 8080 (`PORT`, substituted into the nginx template at boot) |

**There is no root `railway.json` any more.** It applied to every service in the project, so the
web service would have built the API's Dockerfile. Each service names its own file through a
`RAILWAY_DOCKERFILE_PATH` variable instead:

```bash
railway variable set --service web 'RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile'
```

`VITE_API_URL` is inlined by Vite **at build time**, so it is a Dockerfile `ARG`, not a runtime
setting. Changing the API host means rebuilding the image.

nginx serves the SPA with `try_files $uri $uri/ /index.html` — without it a hard refresh on
`/p/travel/form` 404s before react-router ever loads. `/assets/` is immutable-cached because Vite
fingerprints it; `index.html` and `sw.js` are `no-cache`, or a deploy leaves clients pinned to the
previous bundle.

## Cutting app.bime247.com over from Cloudflare

A Workers custom domain and a CNAME cannot both own the hostname, so the Cloudflare binding has
to go first and the site is dark in between. Records Railway needs:

| Type | Name | Value |
|---|---|---|
| CNAME | `app` | `4362o88f.up.railway.app` |
| TXT | `_railway-verify.app` | `railway-verify=fda294eebf4bdd78b94e5f9de3ca6b550e8904896951969b2d868eab6ce5900e` |

The TXT record has no conflict and can be added first. Then, in one go: delete the Workers
binding, add the CNAME **DNS-only** (grey cloud), wait for Railway's certificate, then turn the
proxy on with SSL **Full (strict)**.

```bash
wrangler triggers delete --name bime247-web
```

Once the cutover is verified, `apps/web/wrangler.jsonc` should be deleted too.

## The api.bime247.com records

Railway needs two records on the zone, and the Railway CLI will not create them:

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `2bvl8ct4.up.railway.app` |
| TXT | `_railway-verify.api` | `railway-verify=4cadf53bff5878ecc18ba62583871b4816435b21ef379eddcdcd48c817fb5ba7` |

Railway cannot issue its certificate through a proxied record, so the CNAME starts **DNS-only**
(grey cloud) and only goes orange once the certificate is issued — then set SSL mode to
**Full (strict)**.
