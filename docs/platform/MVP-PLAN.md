# Online insurance platform — MVP plan

Working plan for the **customer-facing online insurance purchase platform** (the second of the
two parts of this project; the first is the core insurance engine, researched in
`src/content/topics/anatomy-of-core-insurance.md`).

Written in English to match the rest of `docs/`. **All product UI is Persian, RTL** — the
customers are Iranian.

Status: plan approved at the high level (2026-08-20), not yet implemented.

---

## 1. Locked decisions

| # | Decision | Value |
|---|---|---|
| 1 | MVP product line | **Simple products, instant buy** (level A: pick → price → pay → e-policy) |
| 2 | Repo | **Monorepo in this repo**, pnpm workspaces; the Astro research site becomes `apps/docs` |
| 3 | Hosting | **Railway** (API + Postgres; web served from Railway static or Cloudflare) |
| 4 | Back office | **None in MVP** — customer app only |
| 5 | Backend | **NestJS** (TypeScript, Node 22) |
| 6 | Frontend | **React SPA, no SSR** (Vite) |
| 7 | Design | **Mobile only.** No desktop layout until explicitly requested |
| 8 | Payment | **Mock gateway**, shaped exactly like a real Iranian IPG |
| 9 | Auth | **Mobile number + OTP**, mock code `1234` always accepted |
| 10 | Domains | **app.bime247.com** (web) · **api.bime247.com** (API) — zone already active on Cloudflare |
| 11 | Shared code | **None.** No shared package; see §10 |

### The one strategic note

`docs/PLAN.md` argues *against* entering on the simple products — Azki, Bimeh.com and
BimeBazar own that space and compete on price. This MVP goes there anyway, by decision.

Mitigation baked into the architecture, at zero extra cost today:

- Products are **data, not code**. A product = a JSON field schema + a rate table + a set of
  insurer offerings. Adding a product means seeding a row, not writing a module.
- The quote pipeline has an explicit `fulfillment` mode on each product:
  `INSTANT` (MVP) or `MANUAL_QUOTE` (Layer 3). Only the second one is unimplemented — the
  data model, the order, the payment and the policy stages are shared.

So the beachhead pivot stays one sprint away instead of a rewrite.

---

## 2. Product scope

Three products, built in this order. Travel first because it exercises the entire pipeline
with the simplest inputs; third-party motor second because its input model is the hardest.

### 2.1 بیمه مسافرتی (travel) — build first

| Field | Type | Notes |
|---|---|---|
| destinationZone | enum | `SCHENGEN` / `ASIA` / `AMERICAS` / `WORLDWIDE` / `HAJJ_OMRAH` |
| startDate / endDate | jalali date | duration in days is the main rate driver |
| travelers[] | array | each: firstName, lastName, nationalCode, birthDate, passportNo |
| coverageLimit | enum | `EUR_15K` / `EUR_30K` / `EUR_50K` / `EUR_100K` |

Rate drivers: zone × duration band × age band × coverage limit. Age bands matter a lot
(0–12, 13–65, 66–75, 76+ with heavy loading).

### 2.2 بیمه شخص ثالث خودرو (motor third-party liability) — build second

| Field | Type | Notes |
|---|---|---|
| vehicleUsage | enum | `PERSONAL` / `COMMERCIAL` / `TAXI` |
| vehicleGroup | enum | `SEDAN` / `PICKUP` / `MOTORCYCLE` / `VAN` / `TRUCK` |
| vehicleBrandModelId | ref | from seeded reference data |
| productionYear | int | |
| plate | object | `{ twoDigit, letter, threeDigit, iranCode }` — the standard Iranian plate |
| bodilyDiscountYears | int 0–14 | تخفیف عدم خسارت جانی |
| propertyDiscountYears | int 0–8 | تخفیف عدم خسارت مالی |
| propertyCoverageTier | enum | تعهد مالی: 2.5% / 4% / 5.5% / 7% / 8% of the bodily limit |
| startDate | jalali date | policies are annual |
| hasPreviousPolicy | bool | drives the discount fields |

Rate drivers: base bodily limit (دیه, a national figure updated yearly) × vehicle group ×
usage × property tier, then discount ladder, then 10% VAT + fixed legal fees
(عوارض راهنمایی و رانندگی, صندوق تأمین خسارت‌های بدنی). **These fixed levies must be modelled
as separate line items**, not folded into the premium — a real invoice shows them separately.

### 2.3 بیمه آتش‌سوزی منزل (home fire) — build third

| Field | Type | Notes |
|---|---|---|
| propertyType | enum | `APARTMENT` / `VILLA` |
| province / city | ref | earthquake zone factor comes from here |
| areaSqm | int | |
| buildingValue | int (rial) | |
| contentsValue | int (rial) | |
| extraPerils | multi | `EARTHQUAKE` / `FLOOD` / `THEFT` / `WATER_DAMAGE` — each a rate add-on |
| durationMonths | enum | 12 (MVP) |

### Explicitly out of MVP

بدنه (own-damage: needs vehicle valuation tables), عمر و سرمایه‌گذاری (life: needs a health
questionnaire and underwriting), درمان تکمیلی (supplementary health: group product),
مسئولیت‌ها (all liability lines — that's the Layer-3 pivot), renewals, claims, refunds.

---

## 3. Monorepo layout

```
insurance/
  package.json                # pnpm workspace root + all dev scripts
  pnpm-workspace.yaml         # apps/* only
  docker-compose.yml          # local postgres on :5433
  docs/                       # research + this plan + PROGRESS.md
  apps/
    docs/                     # ← the existing Astro site, moved as-is
    api/                      # NestJS — owns the data model and all validation
    web/                      # React SPA — owns everything the user sees
```

There is deliberately **no `packages/` directory**. See §10.

Moving the Astro site is a `git mv` plus a path fix in `wrangler.jsonc` and
`astro.config.mjs`. `insurance.zisef.ir` keeps deploying exactly as it does now — the deploy
command becomes `pnpm --filter docs build && wrangler deploy` from `apps/docs`.

---

## 4. Backend — NestJS

**Stack:** NestJS 11 · Node 22 · PostgreSQL 16 · Prisma · zod (via `nestjs-zod`) ·
`@nestjs/throttler` · `@nestjs/jwt` · pino · Jest.

Prisma over TypeORM: the schema is the readable source of truth, migrations are
deterministic, and the generated types feed `packages/shared` for free.

### 4.1 Modules

```
src/
  main.ts, app.module.ts
  common/            filters, interceptors (request-id, logging), guards, pipes, decorators
  config/            typed env config (zod-validated at boot — fail fast on missing vars)
  prisma/            PrismaService + module
  auth/              OTP request/verify, JWT issue/refresh, JwtAuthGuard, CurrentUser
  users/             profile, national code, saved vehicles, saved insured persons
  catalog/           products, insurers, offerings, reference data (brands, cities, zones)
  rating/            the rating engine — one strategy per product type
  quotes/            create quote → returns priced offers, quote expiry
  orders/            order lifecycle state machine
  payments/          PaymentGateway interface + MockGateway + callback verification
  policies/          issuance, policy numbering, e-policy document
  notifications/     SmsSender interface + ConsoleSmsSender (mock) + templates
  health/            /health (liveness), /health/ready (db check)
```

### 4.2 Data model (Prisma, abbreviated)

```
User            id, mobile(unique), firstName, lastName, nationalCode, birthDate,
                email, isProfileComplete, createdAt
OtpChallenge    id, mobile, codeHash, purpose, expiresAt, attempts, consumedAt, ip
RefreshToken    id, userId, tokenHash, family, expiresAt, revokedAt, userAgent

Insurer         id, slug, name, logoUrl, solvencyLevel(توانگری ۱..۵),
                claimSatisfaction, branchCount, isActive
Product         id, slug, type(TRAVEL|MOTOR_TPL|HOME_FIRE), titleFa, subtitleFa,
                iconKey, fulfillment(INSTANT|MANUAL_QUOTE), fieldSchemaVersion, isActive
Offering        id, productId, insurerId, isActive, sortWeight, featuresFa[]  -- insurer × product
RateTable       id, offeringId, version, effectiveFrom, effectiveTo, data(jsonb)
                -- the whole rate structure lives here; engine reads, never hardcodes

Vehicle         id, userId, plate(json), brandModelId, productionYear, usage, group
InsuredPerson   id, userId, firstName, lastName, nationalCode, birthDate, passportNo

Quote           id, userId?, productId, input(jsonb), status, expiresAt, createdAt
QuoteOffer      id, quoteId, offeringId, insurerId, netPremium, taxAmount, feesJson,
                totalAmount, coveragesJson, breakdownJson, isEligible, ineligibleReasonFa
Order           id, userId, quoteOfferId, status, amount, insuredSnapshot(jsonb),
                idempotencyKey(unique), createdAt
Payment         id, orderId, gateway, authority, refId, cardMask, status,
                requestedAt, verifiedAt, rawCallback(jsonb)
Policy          id, orderId, policyNumber(unique), insurerId, startsAt, endsAt,
                issuedAt, documentUrl, dataSnapshot(jsonb)
SmsLog          id, mobile, template, body, status, providerRef, createdAt
```

Design rules that matter:

- **`QuoteOffer` stores the frozen price.** An order always references a stored offer, never a
  recomputation. Rates change; a quoted price must not.
- **Snapshots everywhere.** `Order.insuredSnapshot` and `Policy.dataSnapshot` copy the data as
  it was at purchase. Editing a profile must never mutate an issued policy.
- **All money in integer Rials.** No floats anywhere. The UI displays Tomans (÷10) and
  formats with Persian digits. One shared `formatMoney` in `packages/shared`.
- **`idempotencyKey` on Order**, sent by the client, so a double-tapped "buy" button cannot
  create two orders.

### 4.3 API surface

```
POST   /auth/otp/request        { mobile }                → { expiresIn, retryAfter }
POST   /auth/otp/verify         { mobile, code }          → { accessToken, user } + refresh cookie
POST   /auth/refresh                                      → { accessToken }
POST   /auth/logout
GET    /me                                                → user profile
PATCH  /me                      { firstName, lastName, nationalCode, birthDate, email }

GET    /catalog/products                                  → cards for the home screen
GET    /catalog/products/:slug                            → product + field schema + options
GET    /catalog/reference/:key                            → vehicle-brands | cities | zones …
GET    /catalog/insurers

POST   /quotes                  { productSlug, input }    → { quoteId, expiresAt, offers[] }
GET    /quotes/:id                                        → same, re-read

POST   /orders                  { quoteOfferId, insured, idempotencyKey } → { orderId }
GET    /orders/:id
POST   /orders/:id/pay                                    → { redirectUrl }   (mock gateway)
GET    /payments/callback                                 → 302 to web callback route
POST   /payments/verify         { authority, status }     → { orderId, policyId? }

GET    /policies                                          → my policies (list)
GET    /policies/:id                                      → e-policy detail
GET    /policies/:id/document                             → HTML e-policy (PDF: fast-follow)
```

Conventions: `/api/v1` prefix, envelope-free responses (data at the top level, errors via a
consistent error shape), cursor-less pagination (`page`/`pageSize`) — the MVP has no list big
enough to need cursors.

Error shape, used by every failure:

```json
{ "statusCode": 422, "code": "QUOTE_EXPIRED",
  "messageFa": "مهلت این استعلام تمام شده است. لطفاً دوباره استعلام بگیرید.",
  "requestId": "01J…" }
```

`code` is for the client to branch on, `messageFa` is what the user sees. **The API owns the
Persian error text** — one place to fix wording.

---

## 5. Rating engine

The piece that decides whether this codebase is a toy or the seed of the core insurance
engine. It gets its own module with no dependency on HTTP or Prisma models beyond a loader.

```ts
interface RatingStrategy<TInput> {
  productType: ProductType
  validate(input: unknown): TInput                    // zod schema from packages/shared
  rate(input: TInput, table: RateTable): RatingResult // pure function, fully unit-testable
}

interface RatingResult {
  eligible: boolean
  ineligibleReasonFa?: string
  netPremium: number                 // rial
  lineItems: { key: string; labelFa: string; amount: number; kind: 'PREMIUM'|'DISCOUNT'|'TAX'|'FEE' }[]
  totalAmount: number
  coverages: { key: string; labelFa: string; valueFa: string }[]
  explain: string[]                  // human-readable trace of every factor applied
}
```

Rules:

- `rate()` is **pure**: `(input, table) → result`. No I/O, no clock (the date comes in the
  input), no randomness. This makes the entire pricing surface testable with fixture tables.
- Rate tables are **versioned rows in Postgres**, selected by `effectiveFrom/effectiveTo`.
  Changing a price is a data change with an audit trail, never a deploy.
- `explain[]` is populated on every run and stored on `QuoteOffer.breakdownJson`. When a
  customer asks "why is this 4.2 million?", the answer is retrievable a year later.
- Quoting all insurers for a product runs the same input through each active offering's table
  and returns the array sorted by `totalAmount` — with a "cheapest" and "most recommended"
  badge computed server-side.

**Rate data honesty:** MVP tables are *placeholder numbers shaped like the real thing* — the
motor third-party table follows the real structure (دیه base, vehicle group multipliers, the
statutory discount ladder, separate levies), with values that are plausible but not sourced.
Every seeded table carries `data.meta.source: "PLACEHOLDER"` and the UI shows a clear
"نمونه/آزمایشی" badge until real insurer rates replace them. Shipping fake prices as if they
were real is the one thing that would kill this project's credibility with insurers.

---

## 6. Auth — mobile + OTP

Flow: `mobile → OTP → (first time) complete profile → home`.

- Mobile normalized to `9XXXXXXXXX` (strip `+98`, `0098`, leading `0`); validated against
  Iranian operator prefixes.
- `POST /auth/otp/request` creates an `OtpChallenge` with a **hashed** code, 2-minute TTL,
  and sends via `SmsSender`. In mock mode `ConsoleSmsSender` logs it and the response
  includes `devCode` **only when `NODE_ENV !== 'production'`**.
- `POST /auth/otp/verify` accepts the real code, and — while `AUTH_MOCK_OTP=1234` is set —
  also accepts `1234` for any mobile. This env var is the single switch to turn the mock off;
  the app **refuses to boot in production with it set** unless `ALLOW_MOCK_AUTH_IN_PROD=true`
  is also explicitly present. A leftover universal OTP in production is a total account
  takeover, so it needs two deliberate mistakes, not one.
- Rate limits: 1 request per mobile per 60s, 5 per mobile per hour, 20 per IP per hour,
  5 wrong verify attempts then the challenge is burned.
- Tokens: access JWT 15 min (in memory on the client), refresh token 30 days in an
  `httpOnly; Secure; SameSite=None` cookie, **rotated on every use with family-reuse
  detection** (reuse of a rotated token revokes the whole family).
- No password anywhere. No email login. No social login.

---

## 7. Payment — mock gateway with a real gateway's shape

`PaymentGateway` is an interface. `MockGateway` implements it with the exact ZarinPal /
Saman two-step choreography, so swapping in the real one later touches one provider file and
one env var.

```ts
interface PaymentGateway {
  request(order: Order): Promise<{ authority: string; redirectUrl: string }>
  verify(params: Record<string,string>): Promise<{ ok: boolean; refId?: string; cardMask?: string; reason?: string }>
}
```

Mock flow:

1. `POST /orders/:id/pay` → creates a `Payment` row, returns
   `redirectUrl = ${API_URL}/mock-gateway?authority=…`
2. The API serves a **standalone mock bank page** at that URL — deliberately styled like a
   Shaparak page, showing amount, merchant, a fake card form, and three buttons:
   **پرداخت موفق** / **پرداخت ناموفق** / **انصراف**. This makes demos convincing and lets
   QA exercise every branch.
3. It redirects to `${WEB_URL}/payment/callback?authority=…&status=…`
4. The web app calls `POST /payments/verify`, which is **the only place that flips an order to
   PAID**. Verification is idempotent — replaying the callback returns the same result and
   never issues a second policy.
5. On success the order moves `PENDING_PAYMENT → PAID → ISSUING → ISSUED`, a policy is
   created, an SMS is queued.

Order state machine, enforced in a service (illegal transitions throw):

```
DRAFT → PENDING_PAYMENT → PAID → ISSUING → ISSUED
             ↓                       ↓
      PAYMENT_FAILED            ISSUE_FAILED
             ↓
         CANCELLED (expired after 30 min)
```

---

## 8. Policy issuance & the e-policy document

- Policy number: `{insurerCode}-{productCode}-{yymm}-{sequence}`, sequence from a Postgres
  sequence per insurer. Unique constraint enforced.
- Issuance in MVP is **simulated**: no SANHAB, no insurer API. `ISSUING` completes
  immediately with a generated number, and the code path is written as if it were an async
  external call (a service returning a promise, a retry, a failure state) so the real
  integration drops in without restructuring.
- Document: an **HTML e-policy page** with a print stylesheet, matching the visual language of
  a real بیمه‌نامه (header with insurer logo, policy number, insured details, coverage table,
  premium breakdown, terms footer, QR to the verification URL).
- **PDF is a fast-follow**, not MVP: Persian RTL text in PDF needs headless Chromium, which
  bloats the Railway image. The seam is `PolicyDocumentService.render(policyId): Buffer`;
  today it returns HTML, later it returns a PDF, and callers do not change.

---

## 9. Frontend — React SPA, mobile only

**Stack:** Vite 7 · React 19 · TypeScript · React Router 7 (declarative, no SSR) ·
TanStack Query 5 · Zustand (auth only) · Tailwind CSS 4 · react-hook-form + zod ·
`date-fns-jalali` · `framer-motion` (transitions only).

### 9.1 Mobile-only rules

- App shell is `max-w-[430px] mx-auto min-h-dvh` with a neutral backdrop, so it looks
  deliberate — not a broken desktop site — when opened on a laptop.
- `dvh` units, `env(safe-area-inset-*)` padding, no hover-dependent affordances,
  44px minimum tap targets, bottom sheets instead of modals.
- Sticky bottom **primary action bar** on every step of a purchase flow — the thumb never
  travels.
- Bottom tab bar: **خانه · بیمه‌نامه‌های من · پشتیبانی · پروفایل**.
- PWA: manifest, icons, installable, offline shell. No push notifications in MVP.
- `dir="rtl"`, `lang="fa"`, Vazirmatn Variable self-hosted via `@fontsource-variable/vazirmatn`
  (same reason as the docs site — must work inside Iran, no CDN).
- All digits rendered as Persian numerals; all dates Jalali; money in Tomans with thousand
  separators and the unit word, never a bare number.

### 9.2 Routes

```
/                         home — product cards, active policies strip
/auth                     mobile entry
/auth/otp                 code entry, resend timer
/auth/profile             first-login profile completion
/p/:productSlug           product landing (what it covers, FAQ)
/p/:productSlug/form      multi-step wizard (one question group per screen, progress bar)
/quotes/:id               comparison list — insurer cards, price, badges, filter/sort
/quotes/:id/offers/:oid   offer detail — full coverage table, breakdown, terms
/checkout/:orderId        insured details confirmation + summary + pay
/payment/callback         result screen (success / failure / pending)
/policies                 my policies (active / expired tabs)
/policies/:id             e-policy detail + share + download
/profile, /profile/vehicles, /profile/insured-persons
/support                  FAQ + contact
```

### 9.3 UX decisions worth stating

- **Quote before login.** The wizard and the price comparison work anonymously; the OTP wall
  is at *checkout*, not at the door. Anonymous quotes attach to the user on login.
  This roughly doubles funnel completion versus login-first, and costs one nullable
  `Quote.userId`.
- **The wizard is one question-group per screen**, not a long form. Mobile forms die on
  scroll length.
- Every input is validated client-side with the *same zod schema the API uses*, so the user
  never round-trips to learn a national code is invalid.
- Quote results show a **live countdown** to `expiresAt` — real, because the stored price is
  what gets charged.
- Skeleton loaders, never spinners, on the quote screen — it is the slowest call and the one
  where users bail.
- Empty states, error states and the offline state are designed, not afterthoughts.

### 9.4 Design system

A small token set in Tailwind config: one brand colour + accent, 4 surface levels, semantic
success/warning/danger, radius scale, 3 shadow levels, type scale bound to Vazirmatn's
weights. Components: `Button`, `Field`, `Select`, `Sheet`, `Card`, `Badge`, `Stepper`,
`PriceTag`, `InsurerLogo`, `EmptyState`, `Skeleton`, `Toast`. Dark mode from day one
(`prefers-color-scheme`), same as the docs site.

---

## 10. Why there is no shared package

The obvious monorepo move is a `packages/shared` holding zod schemas, DTO types and validators
for both sides. It was built, then removed on 2026-08-20. The split turned out to be clean
enough that sharing bought almost nothing and cost real friction:

| Concern | Actually needed by |
|---|---|
| Persian digits, Toman formatting, Jalali dates | **Web only** (plus a copy in the API for SMS text and the e-policy document) |
| `roundPremium`, Rial arithmetic, rate tables | **API only** |
| Product input schemas (travel, motor, home fire) | **API only** — it is the authority on what a valid quote request is |
| National code / mobile / plate validation | Both, but ~60 lines of frozen logic |
| API response types | Web reads them; hand-written and small |

What a shared package would have added: a build step ordered before both apps, dual ESM/CJS
output for a CommonJS Nest and an ESM Vite, `.js`-extension import rules that differ per
consumer, and a rebuild between editing a schema and seeing the API pick it up.

**The rule instead:** the API validates authoritatively and returns field-level Persian errors;
the web does light client-side checks (required, length, digit count) purely for instant
feedback and renders whatever the API says. The user never sees a worse message for it, and a
new field on a product form is a one-file change on the server.

The one accepted duplication is the display formatting helpers (~40 lines, unchanged since
written). That is the cheaper side of the trade.

## 11. Non-functional

| Concern | Approach |
|---|---|
| Config | zod-validated env at boot; the app refuses to start with a missing/invalid var |
| Security | helmet, CORS allowlist (no `*`), throttler, argon2 for OTP/refresh hashes, no PII in logs |
| Logging | pino, JSON, request-id propagated end to end and returned in every error |
| Observability | `/health`, `/health/ready`, Railway metrics; Sentry optional and off by default |
| Migrations | Prisma Migrate, `migrate deploy` on release; no `db push` outside local dev |
| Seeding | idempotent seed script: insurers, products, offerings, rate tables, vehicle brands, cities, travel zones |
| Testing | Jest unit tests for every rating strategy against fixture tables (the critical path), plus supertest e2e for: OTP login, quote, order, mock pay, policy issued |
| Lint/format | eslint + prettier shared from `packages/config`; strict TS, `noUncheckedIndexedAccess` |
| CI | GitHub Actions: install → lint → typecheck → test → build on PR |
| i18n | Persian only, hardcoded. No i18n library — it would be premature and adds a lookup layer to every string |
| Shared code | None. The API validates authoritatively; the web keeps its own display helpers (§10) |

---

## 12. Deployment — Railway

| Host | Service |
|---|---|
| **api.bime247.com** | NestJS on Railway, `prisma migrate deploy && node dist/main.js` |
| — | Postgres, Railway plugin, `DATABASE_URL` injected |
| **app.bime247.com** | Vite static build on Cloudflare Workers assets — the same pattern that already serves `insurance.zisef.ir`, which is proven to work from inside Iran |

`bime247.com` is already an active zone on the Cloudflare account
(`b9ce446f3cf5fbe49db85ce94e284a8f`), so no domain setup is pending.

**Two consequences of putting both hosts under one registrable domain**, both good:

- The refresh cookie can be `Domain=.bime247.com; SameSite=Lax; Secure` instead of
  `SameSite=None`. Same-site, different origin — stricter, and it survives browsers tightening
  third-party cookie rules.
- CORS stays a simple allowlist of exactly one origin.

**Railway TLS for `api.bime247.com`** has an ordering trap: Railway issues its own certificate
and cannot do so through a proxied (orange-cloud) Cloudflare record. Sequence: create the CNAME
**DNS-only** → let Railway issue → then turn the proxy on with SSL mode **Full (strict)**.

Proxying the API through Cloudflare is not cosmetic. Railway's edge being reachable from inside
Iran is **unverified**, and Railway may geo-block Iranian IPs outright; with the orange cloud on,
users connect to Cloudflare and Cloudflare connects to Railway. Verify this early — it is the
single biggest deployment risk in the plan, and the fallback (an Iranian VPS) is the same
fallback the real payment gateway will force later anyway.

Environments: `staging` and `production` as separate Railway environments off the same repo,
production deploying from `main` only.

Required env vars (all zod-validated): `DATABASE_URL`, `JWT_ACCESS_SECRET`,
`JWT_REFRESH_SECRET`, `WEB_URL`, `API_URL`, `AUTH_MOCK_OTP`, `PAYMENT_GATEWAY=mock`,
`SMS_PROVIDER=console`, `NODE_ENV`.

Note: the Railway MCP connector is not authorized in this workspace yet, so the actual
provisioning needs an interactive session (`claude mcp` / `/mcp`) or the Railway CLI. Not a
blocker for building.

Deferred to when a real gateway arrives: an Iranian IP is required for most Iranian IPGs'
callback allowlists, so production will likely need to move (or proxy) to an Iranian host at
that point. Worth knowing now, not worth solving now.

---

## 13. Milestones

| # | Milestone | Deliverable | Rough size |
|---|---|---|---|
| M0 | Monorepo | pnpm workspaces, Astro site moved to `apps/docs` (deploy unchanged), NestJS + Vite scaffolds, docker-compose postgres, shared package, lint/TS bases | 1 |
| M1 | Auth | OTP request/verify with mock `1234`, JWT + rotating refresh, rate limits, `/me`, profile completion. Web: entry → OTP → profile → home | 2 |
| M2 | Catalog + rating | Products/insurers/offerings/rate tables + seed, rating engine + travel strategy with unit tests, `POST /quotes`. Web: home, travel wizard, comparison screen | 3 |
| M3 | Checkout | Order state machine, mock gateway page, callback, idempotent verify, policy issuance, e-policy HTML. Web: checkout, payment result, my policies | 3 |
| M4 | Motor TPL | Third-party rating strategy + reference data (brands, plate input, discount ladder, levies). Web: the motor wizard, which is the hardest form in the app | 2 |
| M5 | Home fire | Third product end to end | 1 |
| M6 | Polish + deploy | PWA, empty/error/offline states, transitions, e2e suite green, Railway staging + production, `docs/` updated | 2 |

Sizes are relative, not days. M0–M3 is the real MVP: one product bought end to end.
M4–M5 are repetitions of a proven pattern.

---

## 14. Explicitly out of scope for the MVP

Back office / کارتابل · real insurer or SANHAB integration · real payment gateway · real SMS
provider · claims · renewals and renewal reminders · refunds and cancellations · discount
codes · referrals · desktop layout · English UI · own rating for complex lines · reserving ·
reinsurance · accounting/commission reconciliation.

Every one of these has a seam left for it. None of them is stubbed with fake UI.

---

## 15. Open questions (not blocking M0–M1)

1. **Brand**: the name is settled (**bime247 / بیمه ۲۴۷**) and a working mark exists at
   `apps/web/public/brand/mark.svg`. Still open: the brand colour, which the design system
   needs — a placeholder is in use until it is chosen.
2. **Which insurers to show** as the seeded comparison set — real names (Iran, Pasargad,
   Saman, Karafarin, Dey, Alborz…) with a clear "نمونه" badge, or invented names? Real names
   make demos land better but imply relationships that do not exist yet.
3. **Rate realism**: is anyone able to get one real rate table (even just motor third-party,
   which is publicly regulated) for M2? It would make the whole thing credible.
4. Legal footer requirements for a site selling insurance without a licence yet — at minimum
   the app should not claim to be a licensed broker.

---

*Kept in sync with `docs/PROJECT.md` (project structure) and `docs/PLAN.md` (go-to-market).
When this plan changes, update those.*
