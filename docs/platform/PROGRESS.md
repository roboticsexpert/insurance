# Bime247 MVP — build progress

The single source of truth for **what is done and what is next**. One line = one unit of
work small enough to finish and verify in a single sitting.

Legend: `[x]` done · `[ ]` next · `[!]` blocked (reason on the line)

Domains: **app.bime247.com** (web) · **api.bime247.com** (API).
Full design: [`MVP-PLAN.md`](MVP-PLAN.md).

---

## M0 — monorepo & skeleton

- [x] pnpm workspace, root scripts, prettier/editorconfig, docker-compose Postgres (port 5433)
- [x] Astro research site moved to `apps/docs` — `insurance.zisef.ir` deploy unchanged
- [x] Prisma schema: full MVP data model (identity, catalog, rating, quote, order, payment, policy)
- [x] Iranian validators (national code, mobile, plate) + product zod schemas, inside the API
- [x] No shared package — API owns validation, web keeps its own small display helpers
- [x] API bootstrap: zod-validated env config, PrismaModule, pino logging, helmet + CORS,
      global error filter emitting `{ code, messageFa, requestId }`, ZodValidationPipe, `/health`
- [x] First migration created and applied; `pnpm db:migrate` works end to end
- [x] Web scaffold: Vite + React + TS, Tailwind v4 RTL, Vazirmatn self-hosted, mobile app
      shell (`max-w-[430px]`, safe-area, bottom tab bar), router, TanStack Query, API client
- [x] `.claude/launch.json` entries for api + web; root `README.md`

## M1 — auth (mobile + OTP)

- [x] Notifications module: `SmsSender` interface, `ConsoleSmsSender`, `SmsLog` persistence
- [x] `POST /auth/otp/request` — argon2-hashed code, 2 min TTL, throttle 1/60s per mobile,
      5/hour per mobile, 20/hour per IP; `devCode` in the response outside production only
- [x] `POST /auth/otp/verify` — real code **or** the universal `1234`; boot guard that refuses
      to start in production with `AUTH_MOCK_OTP` set unless `ALLOW_MOCK_AUTH_IN_PROD=true`
- [x] Refresh rotation with family-reuse detection; `POST /auth/refresh`, `POST /auth/logout`;
      cookie `Domain=.bime247.com; SameSite=Lax; Secure` in production
- [x] `JwtAuthGuard`, `OptionalJwtGuard`, `@CurrentUser()`; `GET /me`, `PATCH /me`
- [x] e2e: login happy path, wrong code, expired code, attempt lockout, rate limit
- [x] Web: `/auth` mobile entry screen
- [x] Web: `/auth/otp` code entry, resend countdown, auth store, silent-refresh interceptor
- [x] Web: `/auth/profile` first-login completion + protected-route guard

## M2 — catalog, rating engine, quotes

- [x] Catalog module: `GET /catalog/products`, `/products/:slug`, `/insurers`
- [x] Reference data: `GET /catalog/reference/:key` (cities, vehicle models, travel zones)
- [x] Seed script (idempotent): insurers, products, offerings, cities, travel rate tables —
      every table tagged `data.meta.source: "PLACEHOLDER"`
- [x] Rating engine core: strategy registry, pure `rate(input, table)`, `explain[]` trace
- [x] Travel rating strategy + unit tests against fixture tables (zone × duration × age × limit)
- [x] Populate `Product.fromAmount` from the rating engine (seed leaves it null on purpose —
      a teaser price must be derived, never authored)
- [x] `POST /quotes` + `GET /quotes/:id` — anonymous allowed, expiry, sorted offers, badges
- [x] Web: home screen — product cards and the «از … تومان» teaser
- [x] Web: travel wizard — one question group per screen, progress bar, sticky action bar
- [x] Web: quote comparison — insurer cards, live expiry countdown, «نمونه» sample-rate badge
- [x] Web: offer detail — full coverage table and premium breakdown

## M3 — checkout, mock payment, policy

- [x] Orders module: state machine (illegal transitions throw), idempotency key, 30 min expiry
- [x] `PaymentGateway` interface + `MockGateway` (ZarinPal-shaped two-step choreography)
- [x] Shaparak-style mock bank page served by the API: pay / fail / cancel
- [x] Callback + **idempotent** verify — the only place an order becomes PAID
- [x] Policy issuance: numbering sequence per insurer, `dataSnapshot`, async-shaped code path
- [x] E-policy HTML document + print stylesheet
- [x] `GET /policies`, `GET /policies/:id` (the `/document` route landed with the renderer)
- [x] Web: checkout — insured details confirmation, summary, pay button
- [x] Web: `/payment/callback` result screen (success / failure / pending)
- [x] Web: my policies (active / expired tabs) + policy detail
- [x] Web: active-policy strip on the home screen (needs `GET /policies` from M3)
- [x] e2e: quote → order → mock pay → policy issued, including replayed callback

## M4 — motor third-party liability

- [x] Motor TPL rating strategy: دیه base, group/usage factors, discount ladder,
      property tier, VAT and statutory levies as separate line items + unit tests
- [x] Vehicle model seed data
- [x] Web: Iranian plate input component
- [x] Web: motor wizard (the hardest form in the app) — needs the plate field above, which is
      why the two are in this order and not the plan's
- [x] Web: saved vehicles under profile (needed an API — see notes)

## M5 — home fire

- [x] Home fire rating strategy + tests; city quake-zone seed (already seeded in M2)
- [x] Web: home fire wizard

## M6 — polish & deploy

- [x] PWA: manifest, icons, installable, offline shell
- [x] Designed empty / error / offline states, skeleton loaders, screen transitions
- [x] Dockerfile for the API (`apps/api/Dockerfile` + root `railway.json`)
- [!] Railway staging + production environments — needs the user's explicit go-ahead: provisions paid infrastructure on their account
- [!] `api.bime247.com` on Railway (grey-cloud CNAME → cert issued → proxy on, SSL full-strict) — blocked with the two below: public DNS on a real domain
- [!] `app.bime247.com` static deploy (Cloudflare Workers assets, same pattern as the docs site) — same: publishes the app publicly
- [x] `docs/PROJECT.md` and `MVP-PLAN.md` updated to match what was actually built

---

## Notes & decisions made during the build

- **2026-08-21 — the brand book is published at `brand.bimegold.com`**, Persian with an
  English toggle, as its own Cloudflare Worker (`apps/brand`). It is *generated* from
  `brand/bime-gold/` by `tools/brand-gold/site.py` rather than written as a page, so it
  cannot drift from the package: the logos it displays and the archive it offers are the
  same files. Copy is in `site_copy.py`, both languages beside each other.
  Two things worth remembering. **Inlining the wordmark at every call site cost 327 KB of
  HTML** — sixteen copies of the same 19 KB outline; one `<symbol>` plus `<use>` took it to
  82 KB (13 KB gzipped). And **RTL silently reverses Latin technical strings**: `#D4AF37`
  rendered as `D4AF37#`, `4.9 : 1` as `1 : 4.9`, `--color-brand-600` backwards. The bidi
  algorithm is doing exactly what it should with a paragraph marked Persian; the fix is
  `direction:ltr; unicode-bidi:isolate` on hex codes, tokens, ratios and sizes. Anything
  Latin-and-technical inside Persian copy needs it.
- **2026-08-21 — the `bi` monogram was pulled back to just the browser tab.** It had been
  used for every icon and for the app header, which meant the product introduced itself as
  «bi». The full lockup goes everywhere it can be read. Where that line falls was measured,
  not guessed: the *horizontal* lockup holds to 16px tall because it is allowed to be 53px
  wide, but a square icon constrains width instead, and there the *stacked* lockup holds to
  about 48px, is soft at 32 and unreadable at 16. So app icons, apple-touch and maskable all
  carry the stacked lockup, `favicon.ico` carries the monogram at 16/32 and the stacked
  lockup at 48 — `.ico` is the one format that can hold different artwork per size — and
  only `favicon.svg` is monogram-only. `BrandLogo` joins `BrandMark` as a generated
  component; inlining both costs +3.7kB gzip and buys `currentColor` letterforms.
  One trap on the way in: an `<svg>` that is a flex item stretches to full width, and
  `preserveAspectRatio` then centres the artwork inside it — the auth screen's logo looked
  centred for no visible reason until `self-start` went on.
- **2026-08-21 — `bimegold.com` is live; the cutover broke once, on ordering.** `app.` and
  `api.bimegold.com` are Railway custom domains, `docs.bimegold.com` is a Cloudflare Worker.
  The app came up branded and *empty*: «ارتباط با سرور برقرار نشد» on every product. The
  cause is worth remembering because nothing about it looks like a CORS bug from the outside
  — the preflight answers `204`, it just omits `access-control-allow-origin`, so the browser
  drops the response and the app reports a network failure. `VITE_API_URL` is baked into the
  web image at build time while `CORS_ORIGINS` is read by the API at run time, so pushing the
  Dockerfile change before setting the variables left the new bundle calling a host the API
  would not answer for. Fixed by setting `WEB_URL`/`API_URL`/`CORS_ORIGINS`/`COOKIE_DOMAIN`
  and redeploying the API. It then broke a **second** time on the same symptom for a
  different reason: the `web` service carries its own `VITE_API_URL` Railway variable, and
  Railway feeds service variables into the Docker build as build args, so it silently beat
  the `ARG VITE_API_URL=…` default in `apps/web/Dockerfile`. Editing the Dockerfile did
  nothing; the bundle kept calling `api.bime247.com`, which had just been detached. Read
  the deployed bundle, not the deploy status: `curl` the `/assets/index-*.js` the live HTML
  names and grep it for the API host. `COOKIE_DOMAIN` is the same trap one step later: a value that does
  not match the host is dropped silently, so the login succeeds and the session dies on the
  first refresh — verified instead by reading `Set-Cookie` off a real mock login
  (`bimegold_rt=…; Domain=.bimegold.com`). Old hostnames detached. The `app`/`api` records on
  the `bime247.com` zone are now dangling and should be deleted there.
- **2026-08-21 — the brand became «Bime Gold» and the domain became `bimegold.com`.**
  The approved artwork is a raster render; `tools/brand-gold/trace.py` knocks its white
  background out to real alpha, trims the margin, and traces it to vector, then builds every
  lockup and icon from those outlines and renders each PNG *from* the SVG so raster and vector
  cannot drift. `sync.sh` copies the package into both apps' `public/brand/` and regenerates
  `apps/web/src/components/BrandMark.tsx`; those are generated, do not hand-edit them.
  Decisions worth keeping:
  - **No gradient.** The render carries a faint metallic sheen; the identity is flat `#D4AF37`.
    Reproducing the sheen was tried first and is what the de-matte maths originally broke on —
    a fixed reference ink colour makes α < 1 inside a shaded stroke, which punched holes in the
    trace. The fix was to estimate the ink colour *locally* from each glyph's interior.
  - **Gold is not a text colour.** `#D4AF37` on white is 2.1:1. The docs site's `--accent` is
    `#8A6D1F` in light and `#E5C158` in dark; the app's `--color-brand-*` ramp holds the logo's
    hue at 90 and walks lightness so `bg-brand-600` + white stays at 4.87:1. `--color-gold` is
    the exact logo gold, for marks only. This *raised* the old teal's contrast, it did not
    trade it away.
  - **The mark is `bi`** — the first two letters plus the gold tittle, split out of the traced
    wordmark by connected component. The full lockup dies below 16px; the monogram is legible
    at 16.
  - **The docs Worker changed Cloudflare accounts.** A Workers custom domain must sit on the
    same account as its zone, and `bimegold.com` is on `022e4e5b…` while the old
    `insurance.zisef.ir` was on `45d1cc1b…`. So `docs.bimegold.com` is a new Worker
    (`bimegold-docs`), not a re-routed one. The old Worker still answers the old hostname.
  - **`bime247` → `bimegold` everywhere except the local Postgres**, which keeps its old user
    and database name so existing dev volumes still mount. The refresh cookie is now
    `bimegold_rt`, which signs every session out once.
  - **Railway DNS is the manual step.** The CLI attaches a custom domain but will not write the
    CNAME/TXT, and the deploy token only has Cloudflare `zone:read`. Records are in
    [`DEPLOY.md`](DEPLOY.md); the cutover order matters because `VITE_API_URL` is baked at
    image build time.
- **2026-08-20** — `packages/shared` removed. Persian/money formatting is web-only, `roundPremium`
  is API-only, and product validation belongs to the API as the authority. The web does light
  client-side checks and renders the API's field errors. No cross-package build ordering.
- **2026-08-20** — Postgres is on host port **5433** so it cannot collide with a local 5432.
- **2026-08-20** — `apps/web/public/brand/mark.svg` arrived from outside this session; kept as
  the working brand mark until a real one is decided.
- **2026-08-20** — `@nestjs/config` dropped. A 15-line `ConfigModule` providing one zod-parsed
  object is fully typed and needs no `get('KEY')` string lookups. Import `ENV` to inject it.
- **2026-08-20** — `AppException('CODE')` is the only exception thrown on purpose. Status and
  Persian wording come from `ERROR_STATUS` / `ERROR_MESSAGE_FA` in `common/errors.ts`, so a
  throw site only names a code. Add new codes to all three tables together.
- **2026-08-20** — `loadEnv()` is memoised and throws a multi-line report listing every invalid
  var at once. Its production guards are unit-tested: mock OTP, example secrets, empty CORS.
- **2026-08-20** — Nest 11 + Express 5 prints two `Unsupported route path: "/api/v1/*"` warnings
  at boot, from `setGlobalPrefix({ exclude })`. It auto-converts and works; cosmetic only.
- **2026-08-20** — `/health` and `/health/ready` sit outside the `api/v1` prefix on purpose, so
  Railway's probes never break on an API version bump.
- **2026-08-20** — Migration `20260819232119_init` (395 lines): 17 tables, 5 enums. Verified by
  round-tripping real rows through the generated client — Persian text, jsonb, cascade delete,
  and a `P2002` on a duplicate `Offering` all behave. The four unique indexes the money path
  depends on exist: `Order.idempotencyKey`, `Payment.authority`, `Policy.policyNumber`, `User.mobile`.
- **2026-08-20** — `apps/api` is CommonJS, so **`tsx` scripts cannot use top-level await**. The
  seed script must wrap its body in `async function main()`. This bites silently — esbuild fails
  with a wall of "Top-level await is currently not supported" lines.
- **2026-08-20** — Removed the deprecated `package.json#prisma` block (gone in Prisma 7). It only
  declared the seed command, and it pointed at a file that does not exist yet. Consequence:
  `prisma migrate reset` no longer auto-seeds — run `pnpm db:seed` after a reset. Set this up
  properly with `prisma.config.ts` when the seed script lands in M2.
- **2026-08-20** — Staying on **Prisma 6.19** for the MVP although 7.9 is out. Prisma 7 is ESM-first
  and relocates the generated client, which fights a CommonJS Nest build. Revisit after M6.
- **2026-08-20** — Web stack: Vite 6 + React 19 + React Router 7 + TanStack Query 5 + Tailwind 4
  (`@tailwindcss/vite`). Brand tokens live in `@theme`; semantic surfaces are plain CSS variables
  on `:root` re-exported through `@theme inline`, so light values always exist and only the dark
  block overrides them.
- **2026-08-20** — **No icon library and no date library.** Six inline SVGs cover the app, and
  Jalali dates come from `Intl.DateTimeFormat('fa-IR-u-ca-persian')` — built in, already emits
  Persian digits, cannot drift. Verified against Nowruz: `2026-03-21 → ۱ فروردین ۱۴۰۵`.
- **2026-08-20** — Persian number typography: thousands separator is **٬** (U+066C) and the decimal
  is **٫** (U+066B), not a Latin `.` or a Persian comma. `toFixed()` emits a Latin dot, so any new
  decimal formatting must map it. Fixed in both `apps/web/src/lib/fa.ts` and
  `apps/api/src/common/fa.ts` — the two copies must stay in agreement.
- **2026-08-20** — Bundle baseline: **318 KB JS / 102 KB gzip**, CSS 16 KB / 4 KB gzip. Vazirmatn is
  split by subset, so Persian users fetch the 46 KB arabic file only. Watch this number.
- **2026-08-20** — Browser pane: clicking a `ref_N` timed out while the pane was hidden;
  `navigate()` to the URL is the reliable way to move between routes when verifying.
- **2026-08-20** — **`tsx`/esbuild cannot run NestJS.** esbuild does not implement
  `emitDecoratorMetadata`, so the DI graph resolves to `undefined` at every injection point.
  Consequences: the M2 seed script must talk to `PrismaClient` directly rather than booting a
  Nest context, and any throwaway integration probe has to run against `dist/` after `nest build`
  (or through ts-jest, which does emit the metadata).
- **2026-08-20** — `SmsLog` stores a **redacted** body. Each template returns `{ body, logBody }`;
  `OTP_LOGIN` masks the code as `****`. Hashing the code in `OtpChallenge` would be pointless if
  the plaintext sat in an audit table two minutes long. Any new template carrying a credential
  must set `logBody`.
- **2026-08-20** — The OTP SMS uses **Latin digits** — the only place in the product that does.
  iOS and Android only offer one-tap OTP autofill for codes they can recognise, and they do not
  recognise Persian numerals. Note the brand «بیمه ۲۴۷» still contains Persian digits, so a test
  asserting "no Persian digits in the body" is wrong; assert about the code instead.
- **2026-08-20** — `NotificationsService.send()` **never throws**. A dead SMS provider must not
  fail an issued policy; failures land in `SmsLog` with `status=FAILED` for reconciliation.
- **2026-08-20** — `ConsoleSmsSender` prints the live OTP to the log by design. `SMS_PROVIDER` is
  boot-validated, and it must never be `console` in production.
- **2026-08-20** — `POST /auth/otp/request` **never looks the user up**. The response is identical
  whether the number has an account or not, so the endpoint cannot enumerate customers. The `User`
  row is created at verify time. Keep it that way when writing verify.
- **2026-08-20** — `devCode` is gated on `NODE_ENV !== 'production'`, **not** on `AUTH_MOCK_OTP`.
  Returning a live code over the wire is worse than the universal-code shortcut, so it must not
  ride along on the same flag.
- **2026-08-20** — Issuing a code invalidates every older unconsumed challenge for that mobile,
  both writes inside one `$transaction`. Without it, every code issued within the 2-minute TTL
  stays valid at once and the effective guess budget multiplies.
- **2026-08-20** — `app.set('trust proxy', true)` plus `getClientIp()` preferring `CF-Connecting-IP`.
  Without it every user shares one rate-limit bucket behind Cloudflare→Railway. **Caveat:** that
  header is only trustworthy while the origin is reachable *exclusively* through Cloudflare — if
  the Railway host is ever exposed directly, per-IP limits become spoofable.
- **2026-08-20** — Bug found by calling the endpoint rather than reading the code: the cooldown
  message rendered `60 ثانیه` in Latin digits. **Any number inside a `messageFa` must go through
  `toPersianDigits`.** Unit tests asserting on that copy must expect Persian digits too.
- **2026-08-20** — argon2id at OWASP's baseline (m=19456, t=2, p=1). A 4-digit code has only
  10,000 possibilities, so hashing cannot make an offline attack impossible — it keeps a leaked
  table from handing over live codes for free. The real defence is the 5-attempt burn plus the
  2-minute TTL.
- **2026-08-20** — **The mock `1234` is not a master key.** `verify()` requires an active, unexpired
  challenge even when the shortcut is on, so logging in still costs an OTP request and stays behind
  the full throttle ladder. Without that check, `1234` alone would log anyone in as anyone.
- **2026-08-20** — Refresh tokens are 256 random bits hashed with **SHA-256, not argon2**. Argon2
  exists to make *guessable* secrets expensive; against this much entropy it buys nothing and would
  add ~50 ms to every refresh. Verified: the stored value is `sha256(cookie)`, so a database leak
  yields no usable session.
- **2026-08-20** — Refresh cookie: `HttpOnly; SameSite=Lax; Path=/api/v1/auth`, `Secure` only in
  production, 30-day expiry. `Lax` is possible because app/api share the registrable domain
  `bime247.com`. Path-scoping means it is never sent to catalog or quote endpoints.
- **2026-08-20** — `AuthResponse.isNewUser` lets the client route a first-time login straight to
  profile completion without an extra round trip.
- **2026-08-20** — The verify DTO normalises Persian digits, so `۱۲۳۴` typed on a Persian keyboard
  works. Verified end to end.
- **2026-08-20** — Refresh tokens are **single-use**. Presenting one twice means someone holds a
  copy they should not — and there is no way to tell whether it was the user's or a thief's — so
  the entire family is revoked and both are forced to log in again. Verified over HTTP:
  A→B→C rotated fine, replaying A returned 401 *and* killed C, which had been valid a second
  earlier. All three rows end up revoked.
- **2026-08-20** — The rotation claim is an atomic `updateMany` guarded on `revokedAt: null`.
  Two tabs refreshing at once both read the token as live; whoever updates zero rows is treated
  as a replay. Without that guard both would rotate and leave two live tokens in one family.
- **2026-08-20** — A failed refresh **clears the cookie**, so a dead session does not leave a
  cookie behind that fails on every subsequent request.
- **2026-08-20** — `POST /auth/logout` revokes the whole family and is idempotent: `204` whether
  the token is live, already revoked, or absent entirely.
- **2026-08-20** — `JwtAuthGuard` verifies the **signature only** and does not load the user, so a
  deleted or blocked account keeps working until its access token expires — at most 15 minutes.
  The trade is one fewer query per authenticated request. If immediate blocking is ever needed,
  add the lookup in `JwtAuthGuard.verify`.
- **2026-08-20** — `OptionalJwtGuard` treats an **invalid** token as no token, not as a rejection.
  This is what lets the quote wizard run anonymously: a stale token in a long-open tab must never
  break anonymous quoting. It is the guard the M2 quote endpoints need.
- **2026-08-20** — `@CurrentUser()` throws `UNAUTHORIZED` when `req.user` is missing, so forgetting
  `@UseGuards` fails loudly on the first request instead of handing the handler `undefined`.
  Use `@OptionalUser()` on routes where absent is a legitimate answer.
- **2026-08-20** — `JwtModule.register({ global: true })` in `AuthModule`, so guards outside that
  module can inject `JwtService` without `UsersModule` ↔ `AuthModule` becoming a circular import.
- **2026-08-20** — Profile completion is all-or-nothing: the schema requires every field, so
  `isProfileComplete` is simply set true. Checkout depends on that flag and a half-filled profile
  would fail at the worst possible moment.
- **2026-08-20** — `birthDate` is `@db.Date` and round-trips as `1990-05-20` with no timezone
  drift. Verified over HTTP and in the row.
- **2026-08-20** — e2e harness lives in `apps/api/test/`. Run with `pnpm test:e2e` (root) — it needs
  Postgres up. `globalSetup` creates **`bime247_test`** if missing (catching `42P04`) and runs
  `migrate deploy` against it; `env-setup.ts` repoints `DATABASE_URL` in every worker *before*
  `loadEnv()` runs. The suite `TRUNCATE`s between tests, so it must never point at the dev
  database — verified: 4 users in `bime247`, 0 in `bime247_test`.
- **2026-08-20** — e2e boots the real `AppModule` with the same middleware and prefix as `main.ts`,
  so it exercises what the deployed process runs rather than a stand-in.
- **2026-08-20** — Time-dependent limits are tested by **backdating `createdAt`** rather than
  sleeping, which keeps the whole suite at ~3 s.
- **2026-08-20** — Bug found by the suite, in the test helper rather than the app: `cookieFrom`
  used a truthiness check, so a *cleared* cookie (`name=`, empty value) read as "no cookie at
  all". Needs an explicit `!== undefined`. Worth remembering wherever empty-string values matter.
- **2026-08-20** — Unit and e2e are separate commands on purpose: `pnpm test` needs nothing,
  `pnpm test:e2e` needs Docker. CI can run both; a quick local loop only needs the first.
- **2026-08-20** — Phone entry holds the value in **Latin digits** and renders it in **Persian**.
  The mapping is 1:1 with no grouping separators, so the string length never changes and the
  caret does not jump when editing mid-number — which is exactly what breaks if you ever add
  separators to this field.
- **2026-08-20** — Client-side validation is deliberately thin (`lib/mobile.ts`): enough for
  instant feedback, with the API as the authority. A field-level message from the API always
  wins over the local hint. Confirmed live — the server's «برای دریافت کد جدید ۴۱ ثانیه صبر
  کنید.» renders verbatim, Persian digits and all, with no client-side string building.
- **2026-08-20** — Auth screens live **outside** `AppShell`, so no bottom tab bar during a linear
  task. `AuthLayout` is the shared frame for all three auth screens.
- **2026-08-20** — Browser-pane quirk: `computer left_click` on a `ref` times out while the pane
  is hidden. `form.requestSubmit()` via `javascript_tool` exercises the same handler and works.
  Use `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set` to set controlled
  React inputs — assigning `.value` directly does not notify React.
- **2026-08-20** — **The silent refresh must be single-flight, and this is not optional.** The API
  revokes the whole token family when a refresh token is presented twice, so two components
  hitting 401 together — or React StrictMode double-mounting `AuthProvider` in dev — would look
  exactly like a stolen-token replay and log the user out. `refreshSession()` in `lib/api.ts`
  shares one promise across callers. Verified: a full page reload issues **exactly one**
  `/auth/refresh`. Anything that adds a second refresh path must go through that function.
- **2026-08-20** — The access token lives in a module variable, never `localStorage`, so an XSS
  bug cannot walk off with a 30-day session. The session survives reload because the httpOnly
  refresh cookie does — verified, including that logout does **not** resurrect on reload.
- **2026-08-20** — An anonymous cold load always spends one `/auth/refresh` that 401s. Accepted:
  the alternative is a "probably logged in" flag in localStorage, which is state that can lie.
- **2026-08-20** — OTP entry is **one input with `autocomplete="one-time-code"`**, not four boxes.
  Four boxes look better and cost the user one-tap SMS autofill on iOS and Android; that is also
  why the OTP is sent in Latin digits. It auto-submits on the fourth digit, guarded by a ref so a
  re-render or autofill event cannot fire it twice.
- **2026-08-20** — After login the OTP screen goes to `/`. The profile-completion redirect belongs
  to the route guard in the next task, not to this screen.
- **2026-08-20** — **M1 complete.** Login works end to end in the browser: entry → OTP → profile
  completion → guarded pages, session surviving reload.
- **2026-08-20** — Jalali↔Gregorian (`lib/jalali.ts`) uses **`Intl` as the source of truth and
  searches for the inverse** rather than implementing the Persian calendar a second time. Two
  hand-rolled implementations would eventually disagree on a leap year; this one cannot drift.
  Verified: 1462 days round-tripped exactly across 1399/1400/1403/1405, Esfand is 30 days in
  1399 and 29 in 1400, and `1400/12/30` correctly returns null. `۲ خرداد ۱۳۶۹ → 1990-05-23`
  confirmed in the database.
- **2026-08-20** — Birth date is **three controls** (day input, month *name* select, year input),
  not a text field with separators. Parsing free-text dates on a phone keyboard means fighting
  separators and digit systems for nothing, and people remember month names, not numbers.
- **2026-08-20** — `RequireAuth` renders a spinner while `status === 'loading'`. Redirecting during
  the cookie-restore window would bounce a signed-in user to the login screen on every refresh.
  `requireCompleteProfile={false}` on `/auth/profile` itself, or the redirect chases its own tail.
- **2026-08-20** — Bug caught while wiring: `TextField` spread `{...props}` *before* its own
  `className`, silently dropping any className a caller passed. It now merges. Watch for this in
  any new wrapper component.
- **2026-08-20** — Added `Product.fromAmount` (migration `20260820123526_product_from_amount`): the
  cheapest published premium in Rial, for the «از … تومان» teaser. **Denormalised on purpose** —
  rating every product against every insurer just to draw a home-screen card would be absurd.
  The seed must populate it whenever rate tables change, and it stays null rather than showing
  an invented price.
- **2026-08-20** — Catalog is public and unauthenticated (browsing has to work before login) and
  carries `Cache-Control: public, max-age=60, stale-while-revalidate=300`, so behind Cloudflare
  the home screen is an edge hit rather than a query per visitor.
- **2026-08-20** — An **inactive** product returns 404, indistinguishable from a missing one, and
  inactive insurers are filtered out of a product's insurer list. Verified with both an inactive
  product and an inactive insurer present in the table.
- **2026-08-20** — `faq` is jsonb, so it arrives as `unknown`. Malformed entries are dropped, never
  thrown on — one bad row must not take the product page down. Tested against a string, a null,
  and an array of junk.
- **2026-08-20** — Gotcha: **`docker exec` needs `-i`** to forward a heredoc to `psql`. Without it
  the SQL is silently discarded and psql exits 0, so a seeding step "succeeds" while inserting
  nothing. Cost a confusing round of empty API responses.
- **2026-08-20** — One endpoint, eleven keys, one `ReferenceItem { value, labelFa, groupFa?, meta? }`
  shape — so the web renders every dropdown with a single component. Lists come back whole rather
  than paged: fetch once, cache, filter locally beats a request per keystroke on a phone. `q`
  exists for lists that outgrow that; results are capped at 500.
- **2026-08-20** — **Persian alphabetical order is not Unicode code-point order.** پ is U+067E and
  س is U+0633, so Postgres ordered `سمند` before `پژو ۲۰۶` — backwards to any Persian speaker.
  Ordering now happens in the app with `Intl.Collator('fa')`, which is correct regardless of the
  database's collation (Railway's Postgres will not have a Persian locale). **Any new
  user-facing list must sort this way, not with `ORDER BY` alone.**
- **2026-08-20** — Search terms go through `normalizeFa`, so `كرمان` typed with an Arabic ك matches
  `کرمان` stored with a Persian ک. Verified over HTTP. The same applies to any future text search
  over Persian columns.
- **2026-08-20** — `city.meta.quakeZone` rides along with the city option, because the home-fire
  earthquake add-on is priced off it and the form should not need a second lookup.
- **2026-08-20** — Seed is **idempotent**: every write upserts on a natural unique key. Verified by
  running it three times — 5 insurers, 3 products, 13 offerings, 5 rate tables, 40 cities,
  30 vehicle models, unchanged each run. Bump `RATE_TABLE_VERSION` in `seed.ts` to publish a new
  set of rates rather than overwriting v1.
- **2026-08-20** — **Real insurer names are seeded** (پاسارگاد، سامان، کارآفرین، دی، البرز) because
  a comparison screen full of invented names cannot be evaluated. **No commercial relationship
  with any of them exists.** Solvency and satisfaction figures are placeholders too. If this
  becomes a problem before partnerships are signed, `seed-data/insurers.ts` is the only file to
  change. → still open question #2 in MVP-PLAN.
- **2026-08-20** — Travel rate table shape (`seed-data/travel-rates.ts`), which the rating engine
  consumes: `zoneBase × durationBand × ageBand × coverageFactor`, then `taxRate`, then fixed
  `fees[]` as separate line items. Plus `limits` for hard refusals and `coverages[]` for display.
  Each insurer has a `priceIndex` and `elderlyLoading`, so the cheapest option genuinely changes
  with the traveller's age rather than one insurer always winning.
- **2026-08-20** — Every number in the rate tables is invented. `meta.source: "PLACEHOLDER"` is on
  every row and the UI must show the «نمونه» badge until real insurer tables replace them.
- **2026-08-20** — `City.quakeZone` values are approximate, **not** the official استاندارد ۲۸۰۰
  zoning. That table must be sourced before home-fire earthquake cover is priced for real.
- **2026-08-20** — Rating engine core: `RatingStrategy` (pure `rate(input, table, ctx)`, clock
  passed in so a quote is reproducible), `RatingRegistry` (one strategy per product type, throws
  on duplicates), `RatingService` (loads the effective table per offering and prices every
  insurer), and `PremiumBuilder`/`pickBand` as the shared money primitives.
- **2026-08-20** — **Bug caught by its own test: `netPremium` was rounded but `totalAmount` summed
  the unrounded lines**, so the stated premium and the charged amount disagreed by 400 Rial.
  Rounding now happens **as each line is added**, never on the sum, so what the customer is shown
  always adds up to what they pay. There is a parametrised test asserting
  `Σ lineItems === totalAmount` — do not remove it.
- **2026-08-20** — Tax is computed at `build()` time, not when `withTax()` is called, so adding a
  premium line after declaring tax cannot silently under-charge. The ordering trap is removed by
  the design rather than documented.
- **2026-08-20** — A refusal is a **result**, not an exception: `ineligible(reasonFa)` returns a
  zero-priced result the UI renders next to the priced ones. One insurer refusing must never
  break the comparison.
- **2026-08-20** — An insurer with no effective rate table is **skipped with a warning**, not an
  error — a half-configured insurer must not take the whole comparison down. `NO_ELIGIBLE_OFFERS`
  only when nothing at all can be priced.
- **2026-08-20** — Input is parsed **once**, before any insurer is rated, so a malformed date
  reads as one validation error rather than "every insurer refused you".
- **2026-08-20** — Verified against the seeded tables: a 10-day Schengen trip prices across all
  five insurers (دی ۳۸۳٬۸۱۰ تومان … کارآفرین ۴۶۵٬۳۲۰ تومان), `isSampleRates` true, explain trace
  populated, and line items summing exactly to the total.
- **2026-08-20** — Travel strategy priced against the seeded tables. The comparison genuinely
  reorders with age: at 36 دی is cheapest (۳۸۳٬۸۱۰ تومان) and کارآفرین dearest; at 72 that
  **inverts** — کارآفرین cheapest (۱٬۰۶۲٬۹۵۰) and دی dearest. At 82, سامان and دی refuse with
  their own limits while three still quote. That is the point of `elderlyLoading` in the seed.
- **2026-08-20** — Travel rates on **age at departure**, not age today: a birthday between quote
  and travel changes the price, and `ageOnDeparture` is tested on the exact-birthday boundary.
- **2026-08-20** — `parse()` now receives `RatingContext`, so "trip starts in the past" is a
  single `VALIDATION_FAILED` on `startDate` rather than five identical ineligible cards that
  read as five insurers refusing the customer.
- **2026-08-20** — A malformed rate table makes **that one insurer** ineligible (zod-validated at
  rate time), never an exception. One bad row in the database must not blank the comparison.
- **2026-08-20** — Added `toPersianNumber()`: Persian digits **and** the Persian decimal separator
  ٫ (U+066B). `toPersianDigits` alone leaves a Latin dot, so factors printed as `ضریب ۱.۵`.
  **Use `toPersianNumber` for any number that might not be an integer.** The old test only
  asserted "no Latin digits", which a Latin dot passes — it now rejects `.` outright.
- **2026-08-20** — `RatingService.refreshTeaserPrices()` derives «از … تومان» from the live tables;
  the seed calls it last. Travel resolves to **۱۳۹٬۵۰۰ تومان** (دی، آسیا), verified to equal the
  cheapest actually-quotable price for that basket. Motor and home-fire are `null` — no strategy
  yet, and no price beats a wrong price.
- **2026-08-20** — Strategies expose `teaserInputs()` returning **several candidate baskets**, one
  per zone, so the cheapest is *found* rather than assumed. Hardcoding "Asia is cheapest" would
  go stale the first time a rate table changed.
- **2026-08-20** — The teaser basket is an ordinary **35-year-old on a 7-day trip at the lowest
  cover** — a price a real customer can actually pay. Rating it off a newborn's 0.65 age factor
  would produce a headline nobody could ever reach. There is a test asserting the age is 35 and
  that every basket still parses (i.e. never departs in the past).
- **2026-08-20** — Rerun `pnpm db:seed` after **any** rate-table change, or the teaser goes stale.
  `RatingService` takes plain constructor arguments precisely so the seed can build it without
  Nest DI, which cannot run under tsx.
- **2026-08-20** — **The frozen price is proven, not assumed.** Doubled دی's Schengen base rate in
  the database and re-read an existing quote: still ۳٬۸۳۸٬۱۰۰ ریال and still CHEAPEST, while a
  *new* quote dropped دی out of the top three and promoted سامان. Orders reference `QuoteOffer`,
  so nothing can reprice a customer mid-checkout.
- **2026-08-20** — Added `Quote.isSampleRates` (migration `20260820131631_quote_sample_rates`).
  It has to be frozen with the quote: the tables can be swapped after the customer saw the price,
  so looking it up at read time would misreport what they were actually shown.
- **2026-08-20** — Quote TTL is **30 minutes**. `GET` on an expired quote still returns it with
  `isExpired: true` rather than erroring — the UI needs something to render for
  "expired, quote again". Refusing the *order* is M3's job.
- **2026-08-20** — Badges are computed from transparent rules and **never sold**: `CHEAPEST` is the
  lowest total, `RECOMMENDED` is the best claims record among offers within 20% of it. There is
  deliberately **no `BEST_COVERAGE`** — every travel insurer grants identical coverage keys, so it
  would be a badge with nothing behind it. Add it when a product's coverages actually differ.
- **2026-08-20** — Refused insurers stay in the list, sorted last, unbadged. "This company will not
  cover an 82-year-old" is information the customer wants; hiding it makes the comparison look
  incomplete.
- **2026-08-20** — An anonymous quote is **claimed by the first signed-in caller** that presents its
  id. That is what makes "quote before login" survive the OTP wall at checkout. Verified: claimed
  on read, then `QUOTE_NOT_YOURS` for both a different user and an anonymous caller.
- **2026-08-20** — Home screen done: product cards, derived teaser, «نرخ نمونه» badge, skeletons,
  and a real error state. **Split out the active-policy strip** — it needs `GET /policies`, which
  does not exist until M3, and a strip with no data source would be placeholder UI.
- **2026-08-20** — Added `Product.fromAmountIsSample` (migration `20260820132256_...`), stored
  beside the number it describes. A headline price and "is this real" must travel together, or a
  teaser keeps claiming to be real after the rates behind it were swapped. The flag follows the
  offer that actually **won** the teaser, not any offer in the set.
- **2026-08-20** — A product with `fromAmount === null` renders as «به‌زودی» and is not a link.
  Derived from the data — the engine genuinely cannot quote motor or home fire yet — rather than
  a hardcoded list of "ready" products, so the cards light up on their own when a strategy lands.
- **2026-08-20** — **Transient:** the travel card links to `/p/travel/form`, which the next task
  builds. It 404s until then.
- **2026-08-20** — The catalog's `Cache-Control` means the home screen keeps rendering from browser
  cache for ~60s after the API dies — good behaviour, but it hides the error state. To verify
  error UI, point `VITE_API_URL` at a dead port and restart Vite; stopping the API is not enough.
- **2026-08-20** — **Quoting no longer asks for identity.** The travel input required names,
  national codes and passport numbers *to see a price*; nobody types a passport number to get a
  quote, so the funnel would have died at the first step. `travelInputSchema.travelers` is now
  `[{ birthDate }]` — rating needs age and nothing else. Identity is collected at checkout, on
  the order, where it is actually needed to issue. Premium lines are numbered («حق بیمه — مسافر ۱»)
  because travellers are anonymous at quote time. **Apply the same rule to motor and home fire:
  ask only what changes the price.**
- **2026-08-20** — Travel wizard: 4 steps (مقصد → تاریخ → مسافران → سقف پوشش), progress bar, sticky
  action bar, back-to-previous-step. Verified end to end in the browser — it created a real quote
  and navigated to `/quotes/:id`.
- **2026-08-20** — Jalali entry verified inside the wizard: ۱۰ مهر ۱۴۰۵ → `2026-10-02` and
  ۲۰ مهر → `2026-10-12`, with the live «مدت سفر: ۱۰ روز» summary.
- **2026-08-20** — Two travelers aged ۳۶ and ۷۲ priced across all five insurers
  (کارآفرین ۱٬۵۲۶٬۲۷۰ … دی ۱٬۷۲۳٬۹۴۰ تومان), with age factors 1 and 2.6/3.07 visible in the
  stored explain trace.
- **2026-08-20** — **Transient:** the wizard lands on `/quotes/:id`, which the next task builds.
- **2026-08-20** — Gotcha when inspecting data by hand: Postgres renders a **concatenated**
  boolean as `true`/`false`, not `t`/`f`. Comparing against `'t'` after `||` silently takes the
  wrong branch — it made correct offers look ineligible. Use `::int` or a separate column.
- **2026-08-20** — **Race condition fixed, and it would have broken every authenticated screen.**
  React runs child effects *before* parent effects, so a `useQuery` inside the tree fired its
  request before `AuthProvider` could restore the session. The request went out anonymous and the
  API answered correctly — 403 on someone else's quote. The session restore now starts at
  **module load** in `lib/api.ts` (`sessionBootstrap`), and every request awaits it. Fixing it
  per-query would have left the same trap for the next screen.
  `AuthProvider` awaits that same promise instead of calling `refreshSession()` again — a second
  refresh would rotate the token for nothing.
- **2026-08-20** — Comparison screen: trip summary with «ویرایش», live countdown (verified ticking
  ۲۹:۳۰ → ۲۹:۲۸), «نمونه» notice, badges «ارزان‌ترین»/«پیشنهاد ما», solvency and claims-satisfaction
  as trust signals, and refusals shown with their own reason («این شرکت مسافر بالای ۸۰ سال را
  پوشش نمی‌دهد»).
- **2026-08-20** — The countdown recomputes from the deadline every tick rather than decrementing,
  so a backgrounded tab that misses timer ticks still shows the truth when the user returns.
- **2026-08-20** — Expired quote: banner + «استعلام دوباره», countdown hidden, offers dimmed and
  `pointer-events: none` — visible for reference but not purchasable. Verified in the browser.
- **2026-08-20** — **Transient:** offer cards link to `/quotes/:id/offers/:offerId`, which the next
  task builds.
- **2026-08-20** — **M2 complete.** A visitor can open the app, pick a product, run the travel
  wizard, compare five real insurers on frozen prices, and inspect a full premium breakdown.
- **2026-08-20** — Offer detail shows the invoice as a real one reads: a premium line per
  traveller, levies and tax as their own rows, then the payable total. Verified on screen that
  ۴۲۱٬۲۰۰ + ۱٬۸۵۳٬۳۰۰ + ۲٬۰۰۰ + ۲۲۷٬۴۵۰ = ۲٬۵۰۳٬۹۵۰ — the `Σ lineItems === totalAmount`
  invariant holding all the way to the pixel.
- **2026-08-20** — A refused insurer's detail page shows the reason and **no price and no buy
  button** — there is nothing to sell, so nothing is offered.
- **2026-08-20** — The buy button is **disabled with an honest note** («پرداخت آنلاین به‌زودی فعال
  می‌شود») because ordering does not exist until M3. A button that 404s would be worse than one
  that says why it cannot work yet. Enable it in the M3 checkout task.
- **2026-08-20** — Order state machine is a **table**, not scattered `if`s (`order-status.ts`).
  Refuses: issuing without paying, un-paying, cancelling a paid or issued order, re-issuing.
  Allows the two retries that matter — `PAYMENT_FAILED → PENDING_PAYMENT` (a declined card is a
  retry) and `ISSUE_FAILED → ISSUING` (the money is already taken, support must be able to
  re-drive). A test asserts **every non-terminal status has a way out**, so a paid order can
  never become a dead end.
- **2026-08-20** — `transition()` guards its `updateMany` on the **current** status, so two
  concurrent callers cannot both move one order; the loser updates zero rows and is refused.
  Payment callbacks arrive twice far more often than anyone expects.
- **2026-08-20** — **Idempotency is checked before any validation.** A retried request must return
  the original order even if the quote has since expired, or a flaky network turns one purchase
  into an error the customer cannot resolve. Verified: two identical POSTs → one order row.
- **2026-08-20** — **The insured must be exactly who was priced** — same count, same dates of
  birth (order-insensitive). Age drives the premium, so quoting a 30-year-old and insuring an
  80-year-old would sell cover the insurer never agreed to. Verified over HTTP.
- **2026-08-20** — Order TTL (30 min) is independent of the quote's. Once someone commits to
  buying, the price is frozen on the `QuoteOffer`, so the quote expiring mid-payment is harmless.
  `isExpired` only applies while still `PENDING_PAYMENT`.
- **2026-08-20** — Orders are created straight into `PENDING_PAYMENT`; `DRAFT` has no producer and
  is reserved for a future save-and-return flow.
- **2026-08-20** — Test-data trap hit twice while verifying by hand: `insuredPersonSchema` requires
  `passportNo` ≥ 5 chars and names ≥ 2 chars, so `'A1'` or a one-letter first name fails zod
  *before* the business checks run and looks like the wrong error.
- **2026-08-20** — **The mock gateway ignores the callback's `Status` parameter on purpose.** The
  customer's browser controls that URL, so a gateway that believes `Status=OK` hands out free
  policies to anyone who can edit a query string. `verify()` reads the outcome the mock bank page
  recorded server-side — standing in for the PSP ledger a real `verify` would query. Two tests
  pin this: `Status=OK` on an unsettled or declined payment stays refused, and `Status=NOK` on a
  genuinely paid one still confirms. **Any real IPG adapter must keep this property.**
- **2026-08-20** — Authorities are ZarinPal-shaped (36 chars, leading `A`), so nothing downstream
  changes when a real gateway replaces the mock. Verified unique across 50 concurrent requests.
- **2026-08-20** — `POST /orders/:id/pay` allows **multiple attempts per order** — a declined card
  must not cost the customer their quote. Each attempt is its own `Payment` row with its own
  authority, so the history stays auditable. `PAYMENT_FAILED` moves back to `PENDING_PAYMENT` on
  retry. Verified: two attempts → two rows, one order.
- **2026-08-20** — Refuses to charge an order that is already paid/issued (`ORDER_ALREADY_PAID`),
  mid-issuance or cancelled (`ORDER_INVALID_TRANSITION`), expired (`ORDER_EXPIRED`), or somebody
  else's (`FORBIDDEN` — verified over HTTP).
- **2026-08-20** — Amounts go to the gateway in **Rial**. Some Iranian PSPs take Toman; check the
  unit when swapping in a real one, or every charge is off by 10×.
- **2026-08-20** — Mock bank page at `GET /mock-gateway?Authority=…` (outside the `api/v1` prefix),
  settling via a plain form POST to `/mock-gateway/settle`. All three outcomes verified: PAID
  writes a `refId` + masked card and returns `Status=OK`; FAILED and CANCELLED write no receipt
  and return `Status=NOK`. Unknown or missing authority → 404.
- **2026-08-20** — **The card fields are readonly with fake values on purpose.** A mock bank page
  that accepts card input is a liability: sooner or later somebody types a real PAN into it
  during a demo and it lands in a request log. The page needs to *look* like Shaparak, not to
  collect anything. Keep it that way.
- **2026-08-20** — **New production boot guard: `PAYMENT_GATEWAY=mock` refuses to start in
  production** unless `ALLOW_MOCK_PAYMENT_IN_PROD=true`. Same risk shape as the universal OTP —
  anyone reaching the bank page could click «پرداخت موفق» and be issued a policy without paying.
  Verified: the guard bites with a production env, and dev still boots. The M6 demo deployment
  will need that flag set deliberately.
- **2026-08-20** — `express.urlencoded` is now mounted in `main.ts`; the bank page posts a normal
  HTML form rather than JSON.
- **2026-08-20** — **Transient:** settling redirects to `${WEB_URL}/payment/callback`, which the
  web app does not route yet — the callback/verify task builds it.
- **2026-08-20** — `POST /payments/verify` is the **only** place an order becomes PAID, and it is
  **unauthenticated on purpose**. The money moved whether or not the customer's browser came
  back — they may have closed the tab, lost signal, or paid in a banking app that never returns.
  The authority is an unguessable capability, so a retry, a second tab, or a future
  reconciliation job can all drive the same path. It reports what the gateway decided; it cannot
  make a payment succeed.
- **2026-08-20** — Verified over HTTP, the four cases that matter:
  · forged `Status=OK` **before** paying → FAILED, no policy
  · genuine payment verified **three times** → same refId each time, order PAID once, 1 payment row
  · bank declined then forged `Status=OK` → FAILED, order left **retryable**
  · two callbacks racing concurrently → both report the same refId, order PAID once
- **2026-08-20** — The atomic claim is `updateMany` guarded on the payment still being
  CREATED/REDIRECTED. The loser reads the winner's outcome instead of moving the order again —
  which is what stops a double callback issuing two policies.
- **2026-08-20** — A declined payment leaves the order `PAYMENT_FAILED`, not cancelled, so the
  customer can try another card. Known minor exposure: someone holding an authority could force
  that state — but it is unguessable and the order is retryable, so the impact is nil.
- **2026-08-20** — `OrdersModule` ↔ `PaymentsModule` is a genuine cycle (orders expose `/pay`,
  payments transition orders). Resolved with `forwardRef` on both sides.
- **2026-08-20** — Verify currently stops at PAID; issuance is the next task and hooks in there.
- **2026-08-20** — **A customer can now buy a policy end to end.** Three purchases verified:
  `DEY-TRV-0505-000001/2/3`, cover `2026-10-02 → 2026-10-12` (the trip, not today), counter at 3,
  SMS delivered with the policy number.
- **2026-08-20** — Policy numbers are `INSURER-PRODUCT-yymm-NNNNNN` on a **Jalali** period, and the
  sequence is reserved by a single `INSERT … ON CONFLICT DO UPDATE … RETURNING` against
  `PolicyCounter`. A read-then-write would eventually hand two concurrent issuances the same
  number, and a duplicate policy number is the kind of thing an insurer notices. The sequence is
  zero-padded so numbers sort lexicographically.
- **2026-08-20** — Cover dates come from `RatingStrategy.coveragePeriod(input)` — the product knows
  its own term. Travel runs for the trip; motor will run a year from its start date. **Every new
  strategy must implement it.**
- **2026-08-20** — `Policy.dataSnapshot` copies the product, insurer, insured, coverages, line
  items and totals. Rate tables get replaced and profiles get edited; an issued policy must keep
  showing exactly what was sold.
- **2026-08-20** — **Issuance failing does not fail the payment response.** The money is already
  taken, so `verify` reports SUCCEEDED and the order is parked in `ISSUE_FAILED` for support.
  Telling the customer their payment failed would be a lie that also costs them their receipt.
- **2026-08-20** — Issuance is idempotent: an order that already has a policy returns it untouched,
  and a replayed callback never re-issues.
- **2026-08-20** — `issueWithInsurer()` is deliberately async with its own failure path, so the
  real insurer/SANHAB call drops in without restructuring anything around it.
- **2026-08-20** — Test-shape note: Prisma's `$queryRaw` tagged template passes the **strings
  array itself** as the first mock argument — there is no `.strings` property to read.
- **2026-08-20** — E-policy renders from **`dataSnapshot` only**, never live joins. If the renderer
  ever needs another table, the snapshot is missing something. Verified on a real two-traveller
  policy: `DEY-TRV-0505-000004`, Jalali throughout (صدور ۲۹ مرداد ۱۴۰۵، اعتبار ۱۰ تا ۲۰ مهر ۱۴۰۵),
  both insured with national codes and passports, and a premium breakdown that adds up —
  ۳۴۷٬۱۰۰ + ۲۲۵٬۶۰۰ + ۲٬۰۰۰ + ۵۷٬۲۷۰ = ۶۳۱٬۹۷۰ تومان. The child's line is 0.65× the adult's,
  visible on the document.
- **2026-08-20** — Served as HTML with an `@page`/`@media print` stylesheet: the browser's own
  print dialog produces the PDF a customer needs for a visa appointment. `renderDocument` returns
  a string — when a real PDF matters it becomes a Buffer and callers do not change. Headless
  Chromium would roughly triple the deployment image for something print already does.
- **2026-08-20** — The document is `Cache-Control: private, no-store` and behind auth+ownership: it
  contains national codes and passport numbers. Verified 401 unauthenticated.
- **2026-08-20** — All snapshot fields are treated as optional. A policy issued a year ago was
  written by older code; a missing field must render `—`, not crash the one document someone
  needs at an embassy. Names are HTML-escaped — tested against `<script>` injection.
- **2026-08-20** — The document carries an explicit «این سند نمونه است و ارزش قانونی ندارد» notice
  while rates are placeholders. Remove it only when real rates and a real licence are in place.
- **2026-08-20** — Policies have **three states, not two**: `UPCOMING` / `ACTIVE` / `EXPIRED`
  («شروع نشده» / «معتبر» / «منقضی»). A trip policy bought in August for October is neither
  expired nor in force — calling it active is a lie the customer discovers at the airport.
  Verified with two real policies, one of each. The web tabs should group UPCOMING with ACTIVE.
- **2026-08-20** — List and detail read titles and insurer names from **`dataSnapshot`**, falling
  back to live rows only when a field is absent — so a policy still reads correctly after its
  product was renamed or withdrawn from sale.
- **2026-08-20** — Ownership verified over HTTP: another customer gets `FORBIDDEN` on the detail
  and an empty list of their own.
- **2026-08-20** — Local end-to-end testing hits the **per-IP OTP cap (20/hour)** because every
  request comes from `127.0.0.1`. The guard is working; to keep testing, backdate the window:
  `UPDATE "OtpChallenge" SET "createdAt" = "createdAt" - interval '2 hours' WHERE ip = '127.0.0.1';`
  Do not weaken the limit for convenience.
- **2026-08-20** — **"Quote before login" now works end to end in the browser**: quoted anonymously,
  tapped buy, hit the OTP wall, signed in, and landed **back on checkout** with the anonymous
  quote claimed — not on the home screen.
- **2026-08-20** — `from` is threaded through **login and profile completion**. Previously a
  first-time buyer went auth → profile → `/` and had to start the whole wizard again. That is a
  funnel killer, and it only shows up when you test as a *new* customer rather than a signed-in
  one. `RequireAuth` sets it, `OtpPage` forwards it through profile completion, and
  `ProfileCompletionPage` returns to it.
- **2026-08-20** — Checkout prefills the buyer from their profile and shows each insured's birth
  date **read-only** («متولد ۲ خرداد ۱۳۶۹») straight from the quote. Age set the price, so an
  editable field here could only ever produce a server rejection.
- **2026-08-20** — The idempotency key is generated **once** in a ref and reused across retries. A
  regenerated key would defeat the server's guard and let a flaky connection create two orders.
- **2026-08-20** — Checkout errors now repeat the API's own `messageFa` — «این استعلام متعلق به
  حساب شما نیست» instead of a vague "not available". The API already knows why.
- **2026-08-20** — Verified: checkout → `POST /orders` → `POST /orders/:id/pay` → real redirect to
  the bank page. After paying, the order correctly stays `PENDING_PAYMENT` until `/payments/verify`
  runs — that is the callback screen's job, the next task.
- **2026-08-20** — **A customer can now buy a policy entirely in the browser.** Full run:
  anonymous quote → login → checkout → bank page → «پرداخت موفق» → callback →
  «بیمه‌نامه شما صادر شد» with ۳۸۳٬۸۱۰ تومان and receipt ۶۱۶۹۴۰۴۳۸. Database confirms
  `ISSUED / SUCCEEDED / DEY-TRV-0505-000007`.
- **2026-08-20** — **Verification is a `useQuery`, not a `useMutation` fired from an effect.**
  A mutation's result is discarded when StrictMode unmounts, so the screen sat on
  «در حال بررسی پرداخت…» *after the request had already returned 200* — the worst possible place
  to hang, since the customer has paid. Verification is idempotent, so it has query semantics;
  keyed by authority it survives remounts and refuses to fire twice. **Do not model it as a
  mutation again.**
- **2026-08-20** — `verify` now also returns `quoteId`, `quoteOfferId`, `productTitleFa` and
  `amount`, so a declined payment can offer «پرداخت دوباره» straight back to checkout. Verified:
  the retry link lands on the right checkout URL. A failure screen with no route forward just
  loses the sale.
- **2026-08-20** — Three outcomes, all distinct: succeeded+policy → «بیمه‌نامه شما صادر شد»;
  succeeded+no policy (ISSUE_FAILED) → «پرداخت انجام شد … در حال صدور» rather than a false
  success; declined → the bank's own reason plus a retry.
- **2026-08-20** — The callback route sits outside `RequireAuth` deliberately: it must work when
  the session did not survive the round trip through a banking app.
- **2026-08-20** — **Transient:** «مشاهده بیمه‌نامه» links to `/policies/:id`, which the next
  task builds.
- **2026-08-20** — **Timezone bug caught and fixed, and it would have hit every Iranian customer.**
  The app showed «تا ۲۱ مهر» while the policy document said «۲۰ مهر» — same policy, two end dates.
  The API renders dates in UTC; the web was formatting in local time, and `endsAt` is
  `…T23:59:59Z`, which rolls to the next day anywhere east of Greenwich. Iran is UTC+3:30, so
  **every** policy would have displayed a wrong end date in the app. `lib/fa.ts` now formats
  Jalali in UTC. **Every date the API sends is date-only in meaning — never format it locally.**
  (The test browser was Asia/Yerevan, UTC+4, which is what surfaced it.)
- **2026-08-20** — My-policies groups **UPCOMING with ACTIVE** under «معتبر»: the customer has
  bought them and they will run. Only EXPIRED goes under «منقضی».
- **2026-08-20** — The e-policy cannot be a plain `<a href>` — the route needs an Authorization
  header, so a link arrives unauthenticated. `apiFetchText` fetches it with the token and the
  page opens it as a blob URL. Verified from inside the app: 4 KB of real HTML, right policy
  number, print CSS, sample notice.
- **2026-08-20** — When a popup blocker returns null from `window.open`, the document opens in the
  **same tab** instead. Telling a customer to change a browser setting is a bad answer when the
  SPA's back button already returns them where they were.
- **2026-08-20** — Policy detail sits **outside** `AppShell`: it brings its own full-height layout
  and sticky action bar, which would fight the bottom tab bar.

- **2026-08-20** — Home active-policy strip (`ActivePolicyStrip`). Shares the `['policies']`
  query key with `/policies`, so arriving on the home screen after visiting the tab costs no
  second request. Shows non-expired policies only, the same `status !== 'EXPIRED'` rule the
  «معتبر» tab uses, so an upcoming policy appears in both places or neither. Renders `null`
  while pending or on error — the home screen belongs to the product list, and a spinner or an
  error card above it would push the thing people came for off the fold. Cards are `w-[82%]`
  in a snap-scroll row so the next one peeks past the edge; on a touch-only screen that peek is
  the only scroll affordance there is.
- **2026-08-20** — `queryClient.clear()` added to `signOut`. Found while building the strip:
  TanStack's `enabled: false` stops the *fetch*, not the cache read, so a disabled query still
  returns whatever the previous session cached. Every screen that reads user data was behind
  `RequireAuth` until the strip, which renders on a public route — so a signed-out phone showed
  the previous user's policies on the home screen. The strip also gates on `status` directly;
  the two together mean neither fix alone is load-bearing.
- **2026-08-20** — `daysUntil` in `fa.ts` reduces both ends to their **UTC calendar date**
  before subtracting, rather than differencing the raw timestamps. Policies end at `23:59:59`,
  so a timestamp subtraction measures the leftover part-day and `Math.ceil` turned a policy
  twelve calendar days out into «۱۳ روز». Same date-only reasoning as the Jalali formatters
  directly above it.

- **2026-08-20** — `test/checkout.e2e-spec.ts`, 15 cases over the whole funnel: quote signed
  out → order → `/orders/:id/pay` → the mock bank page → settle → verify → policy → document.
  Two setup changes it needed: `global-setup.ts` now runs `prisma/seed.ts` against the test
  database (catalog and rate tables are *reference* data, which is why `resetDatabase` already
  left them standing), and `test/helpers/app.ts` had drifted from `main.ts` — it was missing
  `mock-gateway` from the prefix exclusions, so the bank routes only worked in production.
- **2026-08-20** — **Concurrent callbacks may legitimately answer `policyId: null`.** Three
  simultaneous verifies produce exactly one policy and one `POLICY_ISSUED` SMS, and all three
  callers are told `SUCCEEDED` — but a loser can reply before the winner's issuance has
  committed, so it reports the payment without the policy. That is the pending branch of the
  callback screen, not a bug; the first assertion written here demanded all three carry the id
  and was wrong. The invariant to hold onto: **never two different policy ids**, and a later
  read always sees the issued one.

- **2026-08-20** — Motor TPL rating strategy, 29 unit tests against a round fixture table.
  **Everything derives from `diyeAmount`**: the bodily premium is a fraction of دیه, and the
  property limit is a regulator-set percentage of the same figure, so next year's tables change
  one number. Premiums are rounded to 1,000 Rial *before* their discounts come off, which is
  what makes each discount line an exact percentage of the line above it — discounting the
  unrounded figure leaves an invoice whose own arithmetic does not check out. The صندوق levy
  rides on the **discounted** bodily premium, so a no-claims record reduces it too.
  Not modelled, deliberately: دیه rises by a third in the four ماه‌های حرام — a real rule that
  would only look authoritative sitting on top of invented numbers.
- **2026-08-20** — `productionYear` is a **Jalali** year (it is what the green sheet says), so
  vehicle age uses `jalaliYear()` off `Intl`, never a Gregorian subtraction — that would age
  every car by 621. Age is taken at the policy start date, not today.
- **2026-08-20** — `seedTravelRates` generalised to `seedRateTables(productSlug, entries, …)`;
  motor tables seeded from `seed-data/motor-tpl-rates.ts` for the same five insurers. The
  motorcycle group factor was tuned from 0.22 to 0.08 after the first seed put the teaser at
  ۳٬۱۵۶٬۱۰۰ تومان — roughly triple a real motorcycle third-party premium, and it is the headline
  number on the home screen. Now ۱٬۱۷۴٬۳۸۰ تومان.
- **2026-08-20** — **`hasWizard()` in the web** (`src/lib/wizards.ts`). Seeding motor rates gave
  the product a `fromAmount`, which made its home card a link to `/p/motor-tpl/form` — a route
  that does not exist until the wizard task. Priceability is the API's business and follows the
  data; whether a *form* exists is this app's business, and the two ship in different releases.
  The router builds its wizard routes from the same list, typed so adding a wizard to one and
  forgetting the other is a compile error. **Add `'motor-tpl'` to `WIZARD_SLUGS` when the motor
  wizard lands** — until then the card correctly reads «به‌زودی».

- **2026-08-20** — Vehicle catalog grown from 30 rows to **115 across 24 brands**. Thirty was a
  sample; the wizard needs a catalog, because `vehicleGroup` is a rate driver and so there is no
  free-text escape hatch by design — a customer who cannot find their car has nowhere to go.
  Hence the trim-level tail (پراید ۱۱۱ as well as ۱۳۱) and the legacy models still on the road.
  **Every one of the original 30 keys was preserved verbatim**: the seed upserts on
  `(brandFa, modelFa)`, so renaming a row creates a second one and orphans any `Vehicle`
  pointing at the first. Verified against the live table before re-seeding.
- **2026-08-20** — `prisma/seed-data/vehicle-models.spec.ts` guards the data itself: unique
  keys, every `group` a real `VehicleGroup`, every group reachable, no Latin digits in a Persian
  label («پژو 206»), no stray whitespace. Hand-written Persian data is exactly what drifts, and
  nothing else in the build was looking at it.
- **2026-08-20** — **`tsconfig.typecheck.json` added, and `typecheck` now points at it.** The
  build config pins `rootDir: ./src` so `dist/main.js` lands where the start script expects —
  which also meant `tsc` never saw `prisma/` *or* `test/`. The e2e specs had been going
  uncompiled until ts-jest reached them at run time. The new config checks src + prisma + test
  and emits nothing; the build keeps its narrow rootDir, verified by `dist/main.js` still
  landing in the right place. `jest.config.js` rooted at the package for the same reason.

- **2026-08-20** — **The plate component was moved ahead of the motor wizard.** The wizard has
  to collect a plate, so building it first would have meant either a stub field or quietly doing
  the next task inside this one. Swapping two adjacent lines was the smaller change.
- **2026-08-20** — `PlateField` draws the **plate**, not four labelled inputs, and is `dir="ltr"`
  inside an otherwise RTL app. Nobody reads their plate as «دو رقم، حرف، سه رقم، کد استان» — they
  copy the object in their hand, left to right, so the boxes have to sit where the characters
  sit. Reading order would put the province code first and quietly invite a wrong plate. Focus
  advances as each box fills and Backspace on an empty box steps back, so the whole plate is one
  uninterrupted run on the numeric keypad. Verified in the browser: `12` → `ج` → `678` → `99`
  typed straight through with no taps between fields.
- **2026-08-20** — The plate's white body and black text are **literal colours, not tokens**,
  and stay white in dark mode. A physical licence plate does not have a dark mode; theming it
  would make it stop reading as the object being copied.
- **2026-08-20** — Red border is reserved for a real `error`. The first version went red as soon
  as any box had content and stayed red until the last one filled — telling the user they were
  failing for the entire time they were succeeding. A half-typed plate now gets a grey hint that
  names the missing part («حرف پلاک را انتخاب کنید») instead.
- **2026-08-20** — `src/lib/plate.ts` duplicates the letter list and validity rules from the API,
  which MVP-PLAN §10 explicitly sanctions for plate logic. The alphabet is frozen by regulation,
  and a select that cannot populate without a round-trip is a worse form. `D`, `S` and
  `تشریفات` are correct as written — diplomatic and service plates, not transliteration slips.
- **2026-08-20** — **The web still has no test runner, on purpose.** MVP-PLAN §12 puts unit
  tests on the rating strategies and supertest on the funnel; web work is verified in the
  browser. Adding vitest for `plate.ts` would have been a tooling decision this task did not
  carry — flagging it rather than making it unilaterally.

- **2026-08-20** — Motor wizard shipped; `'motor-tpl'` added to `WIZARD_SLUGS`, so the home card
  is now a live link and only home fire still reads «به‌زودی».
- **2026-08-20** — **The step list is built per render, not a constant.** A motorcycle can only
  be insured for personal use, so the wizard drops the کاربری screen entirely for one and runs
  five steps instead of six — a disabled step or a one-option list would leave the progress bar
  lying about how much is left. `stepIndex` is clamped on read, because choosing a motorcycle on
  the *first* screen pulls a later step out from under the current index.
- **2026-08-20** — `SearchableOptions` fetches all 115 models once and filters in the browser.
  Search folds Arabic ي/ك onto Persian ی/ک and strips the ZWNJ: a phone keyboard may send
  either code point, and without folding «كوير» finds nothing while «کویر» finds the models.
  Options keep their brand heading while filtered — «جک S3» means nothing without «کرمان موتور»
  above it, and more than one brand sells an S3.
- **2026-08-20** — **`QuotePage` crashed on the first motor quote.** `QuoteBody` cast
  `quote.input as TravelInput` and read `input.travelers.length` off it, so a motor quote took
  the whole comparison screen down with `undefined.length`; the edit link was a hardcoded
  `/p/travel/form` in three places. Now `QuoteSummary` switches on `productType` and falls
  through to the product title rather than guessing, and the edit link is
  `/p/${quote.productSlug}/form`. **Home fire will need a branch here too.**
- **2026-08-20** — The plate is `dir="ltr"` in the *input* and plain RTL in *prose*, and that is
  not an inconsistency. The widget mimics a physical object that is read left to right; the
  summary strip is running Persian, where a plate is written «۴۴ ص ۸۲۱ ایران ۱۱» and read right
  to left with everything around it. Forcing LTR there reordered the leading digits to the far
  end — «ص ۸۲۱ ایران ۱۱ ۴۴».

- **2026-08-20** — Saved vehicles. The `Vehicle` table had been in the schema since M0 but had
  **no API at all**, so this task was half backend: new `VehiclesModule` serving
  `GET/POST/DELETE /me/vehicles`, 10 unit tests, then the web on top. Not a separate PROGRESS
  line because a "web" task whose endpoint does not exist is not a web task.
- **2026-08-20** — **The group is copied from the catalog, never accepted from the client.**
  `group` is a rate driver, so a caller who could assert it could put a truck in the motorcycle
  band. `POST /me/vehicles` takes `vehicleModelId` and reads the group off the model row.
- **2026-08-20** — Saving the same **plate** twice updates the row instead of adding a second.
  The plate is what identifies a car to its owner, not the row id, and a customer re-quoting the
  same car should not accumulate duplicates. Deliberately still allowed once the 20-vehicle cap
  is reached — otherwise a full list would lock someone out of correcting a car already saved.
  `plate` is jsonb so this cannot be a DB unique constraint; the match is done in memory on the
  four canonical fields, because Postgres does not normalise `jsonb` key order for equality.
- **2026-08-20** — A saved vehicle is a **convenience copy, not a source of truth**. The wizard
  still sends every field explicitly on every quote, so a stale saved row can never silently
  move a price. For the same reason the save after a successful quote is fire-and-forget: it
  must not delay or fail the prices the customer just waited for, and a failure costs them one
  retyped plate rather than the quote.
- **2026-08-20** — Picking a saved vehicle jumps the wizard straight to **سابقه عدم خسارت**,
  skipping the three screens it just answered. The steps after it are cover choices, which are
  per-policy and not per-car, so they are always asked. Deleting takes two taps — a stored plate
  is tedious to retype and there is no undo.

- **2026-08-20** — Home fire rating strategy, 25 unit tests. The quake-zone half of this task
  was already done — `cities.ts` has carried `quakeZone` for all 40 cities since M2.
- **2026-08-20** — **`RatingLookups` + an optional `prepare()` hook on the strategy interface.**
  Home fire rates on the seismic zone of the city the customer picked, which lives in the
  database — but `rate()` must stay pure, and letting the client send the zone would let them
  choose their own price band (the same rule as `vehicleGroup`). So `prepare()` resolves it
  **once per quote, before any insurer is priced**, through a narrow port; strategies never see
  Prisma. `TPrepared` defaults to `TInput`, so travel and motor needed no changes.
  `teaserInputs` gained the same port — a home-fire teaser basket has to name a real city by id,
  and it returns one basket per *zone* rather than per city.
- **2026-08-20** — **Fire is rated on the sum insured, not floor area.** A 200m² flat full of
  nothing is a smaller loss than a 60m² one full of everything. `areaSqm` is an eligibility
  limit only, and there is a test asserting the premium does not move with it.
- **2026-08-20** — Each add-on peril attaches to the half of the sum insured it can actually
  damage: THEFT is contents-only (thieves take belongings, not walls), earthquake and flood are
  both. A peril whose basis the customer insured for nothing is silently skipped rather than
  charged at zero. The premium floor is a **visible top-up line**, not a silent replacement of
  the total — a customer comparing insurers is entitled to see they are paying a minimum.
- **2026-08-20** — Home fire is sold by **three** insurers, not five (`products.ts` decides).
  The first rate tables listed all five and the seed died on Prisma's "No record was found for
  an update", which names neither product nor insurer. `seedRateTables` now fails with the pair
  and what to do about it.

- **2026-08-20** — Home fire wizard, five steps. **M5 done: all three products now quote from
  the UI**, `WIZARD_SLUGS` holds all three slugs and no product card reads «به‌زودی» any more.
  `QuoteSummary` gained its HOME_FIRE branch — the one the MOTOR_TPL note said would be needed.
- **2026-08-20** — `MoneyField` asks in **Toman and stores Rial**, because nobody says a number
  in Rial out loud. It groups digits as they are typed and echoes a compact form underneath
  («۱٫۸ میلیارد تومان»): a customer who insures their home for the wrong power of ten will not
  notice from the digits alone, and that echo is the only representation where a stray zero is
  obvious at a glance.
- **2026-08-20** — **`MultiOptionList` reports what was tapped, not the next array.** The first
  version computed `values.includes(v) ? … : …` inside the component, which reads a prop that is
  one render stale whenever two toggles land in the same React batch — the second toggle then
  silently undid the first. Caught by clicking زلزله and سرقت in one tick and getting only
  سرقت. The parent now owns the set and merges with a functional update.
- **2026-08-20** — `formatTomanCompact` no longer prints a trailing `٫۰`. «۴۰۰ میلیون» is how
  the number is said; «۴۰۰٫۰ میلیون» reads like a measurement. Affects every call site.

- **2026-08-20** — **`express` was imported but never declared.** `main.ts` does
  `import express from 'express'` for `express.urlencoded()` — a *value* import, unlike the
  `import type { Request, Response }` everywhere else, which erases at compile time. With
  `shamefully-hoist=false` the package sat in the pnpm store as a transitive of
  `@nestjs/platform-express` and was not linked into `apps/api`, so `node dist/main.js` died on
  `Cannot find module 'express'`. **The built API could not boot at all** — `nest start` never
  showed it because the dev server resolves through a different tree. Fixed by declaring
  `express@^5.2.1` in `apps/api/package.json`, which is what `.npmrc`'s "a package can only
  import what it declares" was there to catch.
- **2026-08-20** — `apps/api/Dockerfile` builds **from the repo root**, not from `apps/api`: the
  lockfile and `pnpm-workspace.yaml` live at the root. All three workspace manifests are copied
  before the install because pnpm reads `pnpm-workspace.yaml` before it applies `--filter`, and a
  missing sibling manifest fails the install. `.dockerignore` therefore excludes `apps/web` and
  `apps/docs` but re-includes their `package.json`.
- **2026-08-20** — The runtime stage keeps **the whole `node_modules`** rather than pruning to
  prod deps. `start:prod` runs `prisma migrate deploy`, so the Prisma CLI — a devDependency — has
  to survive, and the generated client lives in `node_modules/.prisma` from the build stage.
  Pruning and re-generating in the runner buys little and adds a second generate. Worth
  revisiting only if image size becomes a real cost.
- **2026-08-20** — **`node:22-slim` ships without libssl**, and Prisma's query engine links
  against it. The first image built fine and then logged "Prisma failed to detect the
  libssl/openssl version" and could not connect. The base stage installs `openssl` and
  `ca-certificates`. Verified end to end against the local Postgres: migrations applied,
  `/health/ready` returned `{"status":"ok","database":"up"}`, catalog served Persian rows.
- **2026-08-20** — Health check is **`/health/ready`**, not `/health`. `/health` answers before
  the database is reachable, so Railway would route traffic at a container that 500s every query.
- **2026-08-20** — **Provisioning is blocked on a Railway incident, not on this repo.** `railway
  init` fails with "Deploys have been paused due to an upstream issue"; status.railway.com reports
  a Google Cloud problem from 14:53 UTC congesting the deployment pipeline. Nothing exists on
  Railway yet — no project, no Postgres, no service.
- **2026-08-20** — When the deploy does happen, `NODE_ENV=production` **forces both mock
  escape hatches on**: `env.ts` refuses to boot with `AUTH_MOCK_OTP` set unless
  `ALLOW_MOCK_AUTH_IN_PROD=true`, and refuses `PAYMENT_GATEWAY=mock` unless
  `ALLOW_MOCK_PAYMENT_IN_PROD=true` — and the enum admits no other gateway. So the first Railway
  deploy is **a public URL where OTP `1234` logs in as any mobile number and the bank page issues
  policies for free**. That is the MVP working as designed, but it must not carry
  `api.bime247.com` or be shared beyond the people building it until a real gateway and SMS
  provider land.

- **2026-08-20** — PWA. The manifest and the icon set already existed from the brand build;
  what was missing was that **`index.html` never linked the manifest**, so nothing was ever
  installable. Added the manifest link, `apple-touch-icon` and the iOS standalone meta.
- **2026-08-20** — **`public/sw.js` is hand-written, not generated by a plugin**, because the
  rule that matters here is a judgement no default strategy makes: **nothing from the API is
  ever cached**. This app quotes insurance — a price is good for minutes, an OTP for two, a
  session until it rotates. A cached one shows a customer a number they can no longer buy at.
  The worker leaves every non-same-origin and every `/api/` request completely alone: no read,
  no write, no handler. Being offline has to read as offline.
  Shell: navigations are **network-first** so a deploy lands on the next load, falling back to
  the cached document; `/assets/*` is cache-first because Vite hashes every filename.
- **2026-08-20** — **Service workers do not register in the Claude browser pane.** A three-line
  worker fails there identically to the real one — «An unknown error occurred when fetching the
  script» — with correct MIME, 200 status and valid syntax. Verified in real Chrome instead:
  registered, activated, shell precached, `/assets` filled on reload, **no API response in any
  cache**. Then killed the preview server outright and reloaded `/policies`: the app booted from
  cache, the router ran, and `RequireAuth` sent it to `/auth` because the session refresh could
  not reach the network. That is the offline shell working, not a simulation of it.
- **2026-08-20** — Manifest `theme_color`/`background_color` and the two `theme-color` metas
  were all stale — none matched the tokens. Measured the real page colours off the running app
  (`#f4f5f7` light, `#0f1216` dark) rather than eyeballing, and aligned all four. A splash
  screen in the wrong shade flashes a different colour before first paint.

- **2026-08-20** — **Three screens reported a failed fetch through `EmptyState`, which has no
  action.** A customer whose policies or vehicles did not load had nothing to tap and no way
  back but guessing at the tab bar. New `ErrorState` carries the retry itself rather than
  leaving each caller to remember one, and it prints the API's `messageFa` — the API owns the
  Persian wording, and a generic «خطایی رخ داد» throws away a sentence written to be read.
  `HomePage`'s private `ErrorCard` and `QuotePage`'s private `ErrorState` (which also carried
  yet another hardcoded `/p/travel/form`) are both gone.
- **2026-08-20** — `OfflineBanner` + `useOnline`. **`navigator.onLine` is only trustworthy in
  one direction**: `false` means definitely offline, `true` merely means an interface is up —
  captive hotel wifi reports `true` and routes nothing. So it drives a *banner* and never a
  decision to skip a request. Requests still go out and still fail honestly; the banner only
  explains why. It sits above the content rather than floating over it, because a bar that
  covers the header is a bar people dismiss without reading.
- **2026-08-20** — Skeletons consolidated: **zero ad-hoc `animate-pulse` left in `routes/`**.
  The shared `Skeleton` box is `aria-hidden` and the `SkeletonScreen` wrapper carries one
  `role="status"` for the whole region — twenty pulsing rectangles announced individually is
  worse than silence. Bespoke shapes stayed bespoke: a skeleton that mirrors the real layout is
  the entire point, so only the box and the announcement were shared.
- **2026-08-20** — Screen transition: 8px and 180ms, keyed on `pathname` so React remounts and
  replays it. Deliberately small — a tabbed app changes screens constantly and anything showier
  is a tax paid on every tap. Under `prefers-reduced-motion` the translate is dropped entirely
  and only opacity remains; verified the rule ships in the built CSS, not just in source.

- **2026-08-20** — Docs reconciled with reality. `PROJECT.md` still described the monorepo move
  in the **future tense** and documented `npm run dev` from a repo root that no longer holds the
  Astro site; its paths are now relative to `apps/docs/` and its commands are the workspace ones
  — and I ran `pnpm --filter @bime247/docs build` to check, which caught that I had first
  written the filter as `docs` rather than the package's real name.
- **2026-08-20** — `MVP-PLAN.md`: five stale references to `packages/shared` / `packages/config`
  corrected (neither exists — §10 decided against them), the §5 strategy interface replaced with
  the one that shipped (`parse`/`prepare`/`rate`/`teaserInputs`/`coveragePeriod`), and §4.3
  extended with `/me/vehicles` and the two `mock-gateway` routes that live outside the API prefix.
- **2026-08-20** — New **§16, "What the build changed"**: the decisions that came out of building
  and were not foreseen in the plan, plus an explicit *not built, and why* table
  (`/me/insured-persons`, ماه‌های حرام, web unit tests, Sentry). A plan that quietly disagrees
  with the code is worse than no plan.
- **2026-08-20** — Recorded a live inconsistency rather than hiding it: the brand book says the
  brand colour is `#0b7c7c`, while `apps/web/src/styles.css` resolves `--color-brand-600` to
  `#00897b` and calls itself a placeholder. The docs site and the app are **not** currently the
  same teal. One token block reconciles them.

- **2026-08-20** — **Deployed.** Project `bime247`, environment `production`, two services: `api`
  (Dockerfile, source `roboticsexpert/insurance` @ `main`) and `Postgres` (`postgres-ssl:18`).
  Live on `https://api-production-21b4.up.railway.app` — `/health/ready` returns
  `{"status":"ok","database":"up"}` from outside, and the catalog serves the seeded Persian rows.
  Railway's own reachability from inside Iran is still **unverified**; that check is what the
  Cloudflare proxy in MVP-PLAN §12 exists for.
- **2026-08-20** — The service deploys **from GitHub, not from `railway up`**. An upload deploy
  makes whatever is on a laptop the source of truth; the repo has to be. A push to `main` is a
  deploy.
- **2026-08-20** — **The runtime image carries `src/` and `tsconfig.json` purely for the seed.**
  `prisma/seed.ts` imports the rating strategies from `../src` — it builds the real teaser prices
  by running the strategies rather than hardcoding them — and tsx needs the tsconfig for
  `experimentalDecorators`. The first seed attempt inside the container failed twice for exactly
  these two reasons. The alternative was exposing Postgres on a public TCP proxy to seed from a
  laptop, which is a worse trade than 660K of TypeScript in the image.
- **2026-08-20** — `COOKIE_DOMAIN` is deliberately **empty**. The API is on `*.up.railway.app`
  and the web is destined for `app.bime247.com`; a browser rejects a `.bime247.com` cookie set
  from a railway.app host, so the refresh cookie is host-only until the real domain is attached.
  Setting it early would have failed silently — the cookie is simply not stored, and every
  refresh 401s.

- **2026-08-20** — **The web is published: `app.bime247.com`, Cloudflare Workers assets.** It is
  *not* on Railway and never should be — Railway carries the API and Postgres only (MVP-PLAN §12).
  `apps/web/wrangler.jsonc` mirrors the docs site's config with one deliberate difference below.
- **2026-08-20** — **`bime247.com` is on a different Cloudflare account than `insurance.zisef.ir`.**
  The zone belongs to `022e4e5b87a14dc3d0e17772f66b5d6b`; `apps/docs` deploys to
  `45d1cc1b84fce346e3b17965f6669181`. Copying the docs site's `account_id` looked right and would
  have failed at the custom-domain step — a Workers custom domain has to sit on the account that
  owns the zone.
- **2026-08-20** — `not_found_handling: "single-page-application"`, not the docs site's
  `404-page`. Without it a hard refresh on `/p/travel/form` 404s at the edge before react-router
  ever loads.
- **2026-08-20** — `VITE_API_URL` is baked in **at build time** (`apps/web/src/lib/api.ts` reads
  `import.meta.env`). Changing the API host means rebuilding and redeploying the web, not editing
  a runtime variable. Built with `https://api.bime247.com/api/v1`.
- **2026-08-20** — With both hosts finally under `bime247.com`, `COOKIE_DOMAIN` moved from empty
  to `.bime247.com` and `API_URL` to the custom domain. This is the arrangement
  `token.service.ts` was written for: `SameSite=Lax` is same-site across `app.` and `api.`
  because they share the registrable domain. Verified: preflight from `https://app.bime247.com`
  returns `access-control-allow-credentials: true`, and an unknown origin gets no
  `access-control-allow-origin` at all.
- **2026-08-20** — **Untested: the login round-trip.** Requesting an OTP writes rows, and that was
  not mine to do unasked on the live database. CORS, TLS, DNS and the catalog are verified;
  `POST /auth/otp/request` → verify → refresh is not.

- **2026-08-20** — **The web moved from Cloudflare Workers to Railway**, on request, reversing
  MVP-PLAN §12. Recorded because the plan's reasoning still stands and this is the trade being
  accepted: Cloudflare's edge is *proven* reachable from inside Iran (`insurance.zisef.ir`),
  Railway's is **unverified** — §12 calls that the single biggest deployment risk. Everything now
  rides on one platform whose reachability has not been tested from the market being sold to.
  `apps/web/wrangler.jsonc` is kept until the DNS cutover is verified, so the move is reversible
  with one `wrangler deploy`.
- **2026-08-20** — **The root `railway.json` had to go.** Railway reads it for *every* service in
  the project, so the moment a second service existed the web would have built
  `apps/api/Dockerfile`. Each service now names its own file through a `RAILWAY_DOCKERFILE_PATH`
  variable. Casualty: the API's `/health/ready` healthcheck lived in that file and is currently
  **unset** — `railway environment edit --service-config` returns "No changes to apply" for every
  path on CLI 5.41.2, service name or ID alike, so it could not be moved to per-service config.
  Until that is fixed in the dashboard, a deploy goes live when the container starts rather than
  when the database is reachable.
- **2026-08-20** — nginx over Railpack's static server, because the SPA fallback and the cache
  headers both matter: `try_files $uri $uri/ /index.html` (a hard refresh on `/p/travel/form`
  otherwise 404s at the edge), immutable caching on Vite's fingerprinted `/assets/`, and
  `no-cache` on `index.html` and `sw.js` so a deploy does not leave clients on the old bundle.

- **2026-08-20** — **The purchase flow was tested end to end for all three products**, in parallel,
  against the local stack. All three buy successfully over the API and every issued policy's line
  items sum to the paid amount exactly. Three critical defects came out of it, written up with the
  other 23 in [`QA-FINDINGS.md`](QA-FINDINGS.md): **motor-tpl and home-fire cannot be bought in the
  web app at all** (`CheckoutPage` is travel-only and throws `RangeError` on an input with no
  `endDate`); **`vehicleGroup` is never checked against the chosen vehicle model**, so a truck buys
  TPL at the motorcycle rate — 22.8× under-collection, and it survives to an issued policy; and a
  **paid order that fails issuance is orphaned for good** — `order-status.ts` declares
  `ISSUE_FAILED → ISSUING` legal so support can re-drive it, but `policies.service.ts:154` guards on
  `PAID` and `payments.service.ts:96` short-circuits a settled payment, so nothing can.
  The first of those makes `PROJECT.md`'s "travel and motor can be bought end to end" wrong for the
  web app; that line has been corrected rather than left to be discovered again.

- **2026-08-20** — **C1 and C2 fixed; C3 still open.**
- **`prepare` is now motor-tpl's too.** `vehicleGroup` — a factor of 24 between a motorcycle and a
  truck — was taken on the client's word because `vehicleModelId` was never looked up. It goes
  through `RatingLookups.vehicleModelGroup` now, and a claim that contradicts the catalog is
  **refused rather than silently corrected**: the real wizard fills that field from the same
  `meta.group`, so the two can only disagree if the client is stale or lying. The catch was the
  teaser — it passed the literal id `'teaser'`, which the new lookup rejects, and `cheapestTeaser`
  swallows throws, so the fix would have quietly emptied «از … تومان» on the home screen instead of
  failing. `teaserInputs` now names one real catalog model per group.
- **Checkout stopped being travel-shaped.** The per-product differences live in
  `apps/web/src/lib/checkout.ts` as data — who the policy names, whether their birth dates come
  from the quote or have to be asked for, whether a passport is wanted, how the period reads — and
  `CheckoutPage` renders what it is handed. The rule that matters: **it never formats a date it has
  not first checked is one.** Two smaller things fell out: an empty `passportNo` was being sent as
  `''` and the server's `.min(5)` rejects that, so it is omitted now; and the screen threw away the
  API's per-field Persian errors in favour of the generic sentence.
- **The app had no error boundary at all**, which is the only reason a single bad read during
  render could take the whole screen white. `RouteErrorPage` is attached to every top-level route.
  It says the money was not taken, because at that point in the flow that is the question.
- Verified by buying **both** previously-unbuyable products through the UI end to end:
  `DEY-TPL-0505-000013` and `PAS-FIR-0505-000004`. Travel checkout is untouched by eye and by
  behaviour. 352 API unit tests pass, both typechecks pass, the web production build passes.
