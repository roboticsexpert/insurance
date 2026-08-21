# Deploying Bime Gold

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
docker build -f apps/api/Dockerfile -t bimegold-api:local .
```

## What is provisioned

| | |
|---|---|
| Project | `bime247` — `24480e21-2aa9-401f-9f9f-561135f02e12` (Railway project still carries the old name) |
| Environment | `production` — `12a54ba8-1f6a-4381-9009-88f9999df531` |
| Services | `api` (Dockerfile, GitHub source) · `Postgres` (`postgres-ssl:18`) |
| Public URL | `https://api-production-21b4.up.railway.app` |

The `api` service deploys from **`roboticsexpert/insurance`, branch `main`** — a push to `main`
is a deploy. There is no `railway up` in the loop; running one would upload the local directory
and shadow the repo as the source of truth.

## Re-creating it from scratch

From the repo root:

```bash
railway init --name bimegold
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
  'WEB_URL=https://app.bimegold.com' \
  'API_URL=https://api.bimegold.com' \
  "JWT_ACCESS_SECRET=$(openssl rand -base64 48 | tr -d '\n')" \
  "JWT_REFRESH_SECRET=$(openssl rand -base64 48 | tr -d '\n')" \
  'AUTH_MOCK_OTP=1234' \
  'ALLOW_MOCK_AUTH_IN_PROD=true' \
  'ALLOW_MOCK_PAYMENT_IN_PROD=true' \
  'PAYMENT_GATEWAY=mock' \
  'SMS_PROVIDER=console' \
  'CORS_ORIGINS=https://app.bimegold.com' \
  'COOKIE_DOMAIN=.bimegold.com'
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
do not attach `api.bimegold.com` until a real gateway and SMS provider land.

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

## Domains

Both public hostnames are Railway custom domains on the `bimegold.com` zone
(Cloudflare account `022e4e5b87a14dc3d0e17772f66b5d6b`), live since 2026-08-21.
**The Railway CLI cannot create the DNS records** — they go in by hand, or through a
Cloudflare token with `DNS:Edit`. The wrangler OAuth token only has `zone:read`.

| Type | Name | Value |
|---|---|---|
| CNAME | `api` | `0jb0nr94.up.railway.app` |
| TXT | `_railway-verify.api` | `railway-verify=f70ce4a02f2d3b050e6c2ca485ea488a6a180679d9b33573cf7b7c4385bad324` |
| CNAME | `app` | `qn6ipqxk.up.railway.app` |
| TXT | `_railway-verify.app` | `railway-verify=e4f9c3b12de3213fa9b1f542418bb00b3237968b2367cad538b258e6fe307f07` |

Railway cannot issue its certificate through a proxied record, so each CNAME starts
**DNS-only** (grey cloud) and only goes orange once the certificate is issued — then set
the zone's SSL mode to **Full (strict)**. Check with:

```bash
railway domain status --service api
```

The docs site is different: it is a Cloudflare Worker, its custom domain is declared as a
route in `apps/docs/wrangler.jsonc`, and `wrangler deploy` creates the DNS record itself.

### The bime247.com → bimegold.com cutover — done 2026-08-21

Kept because the failure mode it describes will recur on the next domain move.

`VITE_API_URL` is baked into the web bundle at **build** time; the API's env vars are read
at **run** time. Worse, the Dockerfile's `ARG VITE_API_URL=…` default is **not** what gets
used: the `web` service sets `VITE_API_URL` as a Railway variable, and Railway passes
service variables into the Docker build as build args, so the service variable wins. The
Dockerfile default only applies to a plain `docker build` with no `--build-arg`.

    railway variables --service web --kv | grep VITE_API_URL

Check that before assuming a push moved the API host. It did not here. Change the Dockerfile without changing the
API's `CORS_ORIGINS` in the same window and you get an app that renders perfectly and
cannot fetch anything: the preflight returns `204` with no `access-control-allow-origin`,
and the UI shows «ارتباط با سرور برقرار نشد». That is exactly what happened here, twice:
first because the push landed before `CORS_ORIGINS` moved, and then again because the
`web` service's `VITE_API_URL` variable still named `api.bime247.com`, so the bundle went
on calling a hostname that had just been detached.

The order that avoids it:

1. Add the four records above; wait for `railway domain status --service api <domain>` to
   report `Certificate status: …_VALID`.
2. Point **both** services at the new host — the API at run time, the web bundle at build
   time. Do the API first, so it already accepts the new origin when the new bundle ships:

   ```bash
   railway variables --service api --skip-deploys \
     --set 'WEB_URL=https://app.bimegold.com' \
     --set 'API_URL=https://api.bimegold.com' \
     --set 'CORS_ORIGINS=https://app.bimegold.com' \
     --set 'COOKIE_DOMAIN=.bimegold.com'
   railway redeploy --service api --yes

   railway variables --service web --set 'VITE_API_URL=https://api.bimegold.com/api/v1'
   ```

3. Push `main`. Both services rebuild; the web bundle picks up the new `VITE_API_URL`.
   Confirm it actually did, rather than trusting the deploy status — the bundle is the
   only evidence that counts:

   ```bash
   curl -s https://app.bimegold.com/ | grep -o '/assets/index-[^"]*\.js'
   curl -s https://app.bimegold.com/assets/index-XXXX.js | grep -o 'https://api\.[a-z0-9.]*/api/v1'
   ```
4. Verify the two things the variables actually control — CORS and the cookie scope:

   ```bash
   curl -sI -X OPTIONS https://api.bimegold.com/api/v1/catalog/products \
     -H 'Origin: https://app.bimegold.com' -H 'Access-Control-Request-Method: GET' \
     | grep -i access-control-allow-origin
   ```

   Then a mock login, checking the `Set-Cookie` reads
   `bimegold_rt=…; Domain=.bimegold.com; HttpOnly; Secure; SameSite=Lax`. A
   `COOKIE_DOMAIN` that does not match the host is dropped silently — the login looks
   fine and the session dies on the first refresh.

5. Drop the old hostnames:

   ```bash
   railway domain delete --service web --yes app.bime247.com
   railway domain delete --service api --yes api.bime247.com
   ```

The `app` and `api` records still exist on the **bime247.com** zone and now point at a
Railway service that no longer answers for them. Delete them there when convenient.

Renaming the refresh cookie to `bimegold_rt` signed every existing session out once. With
mock OTP that cost nothing.

## Historical: the original Cloudflare → Railway move

`apps/web` used to deploy to Cloudflare Workers; `apps/web/wrangler.jsonc` is the leftover
config and can be deleted. A Workers custom domain and a CNAME cannot both own a hostname,
so that cutover needed the Workers binding removed first:

```bash
wrangler triggers delete --name bimegold-web
```
