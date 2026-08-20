# QA findings — purchase flow, all three products

**Run date:** 2026-08-20. **Target:** local stack (`localhost:3000` API, Postgres on 5433,
`PAYMENT_GATEWAY=mock`, `AUTH_MOCK_OTP=1234`). Nothing was run against production.

**Method.** The full purchase chain was driven over HTTP for each product in parallel — OTP →
anonymous quote → order → mock bank page → settle → `/payments/verify` → policy → document →
`/policies`. Then one agent per product attacked its own flow's edge cases (~390 requests, 9
extra policies issued). The web findings, marked *(web)*, started as code reads plus a node repro
of the throw; the checkout ones were later confirmed in a browser, where the fixed screens were
also driven through to two issued policies.

## What works

The happy path is sound for all three products. Verified per product:

| | travel | motor-tpl | home-fire |
|---|---|---|---|
| offers / eligible | 5 / 5 | 5 / 5 | 3 / 3 (intended) |
| paid (Rial) | 6,319,700 | 127,784,400 | 8,836,500 |
| policy | `DEY-TRV-0505-000008` | `DEY-TPL-0505-000009` | `PAS-FIR-0505-000001` |

- The quoted price is frozen on the order and reaches the policy unchanged.
- **Line items sum to the paid amount exactly**, on every issued policy and every offer in the
  fuzz runs — including discounts, fees, the fund levy and the home-fire premium floor.
- Idempotent `POST /orders` returns the original order; `POST /payments/verify` is idempotent.
- Unauthenticated reads of `/orders/:id` and `/policies/:id` are 401; another user's are 403.
- A CANCELLED or FAILED payment issues no policy.
- Rating direction matches the rate tables: travel zone/coverage/age bands, motor group ladder
  and both statutory no-claims ladders, home-fire quake zones and the sum-insured linearity
  (and the documented rule that `areaSqm` does **not** move the premium holds exactly).

## Fixed since this run

`C1`, `C2` and the low-severity travel-link and empty-passport items are fixed and verified —
see the fix notes inline below. **`C3` is not fixed**; it is still the most dangerous one open.

### Critical

**C1 — `vehicleGroup` is never checked against the chosen vehicle model (motor). — FIXED**
`vehicleModelId` is only `z.string().min(1)` (`apps/api/src/products/schemas/motor-tpl.ts:63`) and
nothing on the quote path ever loads the `VehicleModel` row, so the client's `vehicleGroup` — the
biggest price driver — is taken on trust. A Mercedes Actros (`TRUCK`) submitted as `MOTORCYCLE`
quotes, orders, pays and **issues**: policy `DEY-TPL-0505-000012` at 1,061,024 Toman instead of
24,241,214 Toman, a **22.8× under-collection**. A nonexistent model id is accepted too.
The fix already exists as a pattern: `home-fire.strategy.ts:60` uses the `prepare(input, lookups)`
port to resolve `cityId` once per quote and throws on an unknown one. `MotorTplRatingStrategy` has
no `prepare` at all, and `vehicles.service.ts:38` already copies the group from the model row on
the saved-vehicle path.
**Fix:** `RatingLookups` gained `vehicleModelGroup` / `vehicleModelGroups`, and
`MotorTplRatingStrategy.prepare` now resolves the model through it — refusing an unknown id and
refusing a `vehicleGroup` that contradicts the catalog, rather than silently correcting it (the
real client fills the field from the same `meta.group`, so a disagreement is a stale or lying
client and deserves to be heard about). `teaserInputs` had to change with it: it used to send the
literal id `'teaser'`, which `prepare` now rejects, and `cheapestTeaser` swallows throws — so the
home screen would have quietly lost its «از … تومان». It now picks one real catalog model per
group. Verified live: the truck-as-motorcycle attack and a bogus model id both return 422 with a
Persian field message, an honest truck still prices at 242,412,140 and an honest sedan still at
127,784,400 — unchanged from before the fix — and the motor teaser is still 11,743,800.

**C2 — motor-tpl and home-fire cannot be bought in the web app at all. — FIXED** *(web)*
`CheckoutPage` is travel-only, and `app/router.tsx:50` routes every product to it.
`CheckoutPage.tsx:119` renders `formatJalali(input.endDate)` unconditionally; neither motor nor
home-fire has an `endDate`, so it is `formatJalali(undefined)` → `new Date(undefined)` →
`Intl.DateTimeFormat.format` throws `RangeError: Invalid time value`. Reproduced in node against
the real formatter from `apps/web/src/lib/fa.ts:51`. There is no ErrorBoundary in `apps/web/src`,
so `/checkout/:quoteId/:offerId` is a white screen.
Past that throw the page is travel-shaped three more ways: `initial` (`:39-49`) builds the insured
list from `input.travelers` only, so `drafts` is `[]` and the pay button is permanently disabled
(`:55-56`); `complete` (`:62`) demands a passport number for a domestic motor policy; and the
expiry fallbacks (`:127`, `:236`) link to `/p/travel/form`. There is also no source for the
API-required `insured[].birthDate` in either wizard — this needs product-specific checkout, not a
null guard.
**Fix:** the per-product differences moved out of the component into `apps/web/src/lib/checkout.ts`
as data — how many people the policy names, whether their birth dates come from the quote (travel,
where age set the price) or must be collected (motor and home, via `JalaliDateField`), whether a
passport is asked for, and how the cover period reads. `CheckoutPage` renders whatever it is
handed and never formats a date it has not checked is one. Two related bugs fell out: an empty
`passportNo` was being sent as `''`, which the server's `.min(5)` rejects, so it is now omitted;
and the screen printed only `messageFa`, throwing away the per-field Persian errors (that was M9).
Verified end to end in the browser: **both a motor-tpl and a home-fire policy were bought through
the UI** — `DEY-TPL-0505-000013` and `PAS-FIR-0505-000004` — checkout → bank page → callback
(«بیمه‌نامه شما صادر شد») → both listed under «بیمه‌نامه‌های من». Travel checkout is unchanged:
two insured cards, birth dates locked and shown, passport fields present.

**C3 — a paid order can be orphaned permanently: money taken, no policy, no way back. — OPEN**
`PoliciesService.issueForOrder` re-runs request-time validation at issuance
(`policies.service.ts:161` calls `strategy.parse(quote.input, { now })`), and every strategy's
`parse` rejects a start date before today. A same-day-departure order whose payment settles after
the UTC day rolls over therefore throws inside issuance and lands in `ISSUE_FAILED`.
`order-status.ts:11-12` explicitly says `ISSUE_FAILED` is non-terminal "because support re-drives
issuance" and the table allows `ISSUE_FAILED → ISSUING` — but `policies.service.ts:154` guards on
`status === PAID`, so the re-drive is blocked; `payments.service.ts:96-99` short-circuits once the
payment is SUCCEEDED; and `payments.service.ts:140` is the only production caller. The order is
stuck for good, while `PaymentCallbackPage.tsx:99-108` promises the customer an SMS when the
policy is ready.

### High

**H1 — a skipped peril is still promised on the issued home-fire policy.**
`rate()` correctly skips a peril whose rating basis is zero (`home-fire.strategy.ts:117`), but
`coverages()` maps `input.extraPerils` unconditionally (`:208-212`). Buying with
`contentsValue: 0` + `extraPerils: ["THEFT", …]` issues a policy whose document reads
«سرقت با شکست حرز: دارد» with no theft premium charged and no basis to pay a claim from
(reproduced: `PAS-FIR-0505-000003`). Reachable from the wizard, which offers THEFT regardless of
contents value and whose hint actively encourages renters to leave the building side empty.
`home-fire.strategy.spec.ts:118` asserts the line item is gone but never checks the coverage row.

**H2 — duplicate perils are charged N times (home-fire).** `extraPerils` is a plain
`z.array` with no dedupe (`schemas/home-fire.ts:39`) and `rate()` loops the raw array. Sending
`["THEFT","THEFT","THEFT"]` produces three identical premium lines and three identical coverage
rows. Totals stay internally consistent, so nothing downstream catches it.

**H3 — a saved motorcycle silently loses its no-claims discount (motor).** *(web)*
`MotorWizardPage.tsx:76` computes the target step from `steps`, which is the closure value from
the render before `modelId` changed. Applying a saved motorcycle jumps to index 3 of the 6-step
list, but the next render collapses `steps` to the 5-step motorcycle list where index 3 is
`'tier'` — the history screen is skipped, `hasPrevious` stays `null`, and the quote submits
`hasPreviousPolicy: false`. A returning motorcycle owner is quoted the no-discount price, up to
**70% bodily / 60% property** over the top, without ever being asked.

**H4 — a travel policy can be issued with no passport number.**
`passportNo` is `.optional()` (`schemas/common.ts:37`); only `CheckoutPage.tsx:62` enforces it,
client-side. A direct `POST /orders` without it issues a policy whose document shows `—` in the
passport column — the identifier the insurer and the embassy actually use.

**H5 — the travel policy document pairs the wrong premium with the wrong person.**
`assertInsuredMatchesQuote` sorts both lists before comparing
(`orders.service.ts:131-139`), so travelers may be submitted in any order, but the document pairs
the insured table with the position-labelled premium lines («حق بیمه — مسافر ۱») by index. The
total is right; the per-person breakdown on the customer's own policy contradicts itself.

**H6 — issued policies do not identify the risk.** A motor TPL policy never states the plate,
model or year, and a fire policy never states the city, property type or area — the data is in
`dataSnapshot` but neither `PolicyDetailDto` (`policies.dto.ts:33-46`) nor
`policy-document.ts:22-31` declares or renders it. Both documents still carry the travel-shaped
«تاریخ تولد» / «شماره گذرنامه» columns instead. A شخص ثالث policy without a plate is not a usable
document.

### Medium

- **M1 — no upper bound on `startDate`** (all products). `startDate: "9999-12-31"` quotes and
  orders normally; a motor policy can be sold to start in 2030 at today's دیه, which the rate
  table's own comment says resets annually. Only the past is guarded.
- **M2 — nonexistent calendar dates roll forward silently** (all products). `isoDate`
  (`schemas/common.ts:9-12`) regex-matches then `Date.parse`s, and V8 rolls `2027-02-30` to
  `2027-03-02`. The quote echoes the impossible date back, the policy is issued from the rolled
  one — the customer sees one start date and is covered from another.
- **M3 — `assertInsuredMatchesQuote` is a no-op for motor and home-fire**
  (`orders.service.ts:121-123` returns early when the input has no `travelers`). Ten insured
  people all born `2050-01-01` are accepted on a motor order.
- **M4 — future birth dates are priced as children** (travel). No past-date constraint on
  `travelers[].birthDate`; `ageOnDeparture` goes negative and `pickBand` falls into the `max: 12`
  band, so a traveler born in 2028 gets the 0.65 child factor.
- **M5 — future production years priced as brand new** (motor). `vehicleAgeYears` clamps at 0 and
  `.max(1420)` is a hardcoded constant rather than relative to `ctx.now`.
- **M6 — seed rounding collapses five insurers onto two bodily rates** (motor).
  `prisma/seed-data/motor-tpl-rates.ts:104` does `Number(value.toFixed(3))` on
  `0.0085 × priceIndex`, so dey/saman both land on 0.008 and pasargad/alborz/karafarin on 0.009.
  Bodily is ~85% of the premium, so the intended 4% spread vanishes and the comparison screen
  shows pairs of insurers at identical headline prices.
- **M7 — coverage periods are computed in UTC** although dates are chosen in the Tehran calendar
  (`travel.strategy.ts:147-152`). Cover starts 03:30 local on the departure day, so an early
  flight is uncovered; the same assumption makes the past-date guard accept yesterday between
  00:00 and 03:30 Tehran.
- **M8 — English zod messages reach the Persian UI** (all three). `errors.ts:43-45` states the API
  owns every Persian string, but fields without an explicit `message` return e.g.
  «Number must be less than or equal to 2000», «Invalid enum value. Expected 'APARTMENT' |
  'VILLA'…», and all three wizards render `Object.values(error.fields)` verbatim.
- **M9 — `CheckoutPage` discards `fields`** (`:206` prints only `messageFa`), so a national code
  that passes the client's length check but fails the mod-11 checksum yields a generic error with
  no indication of which traveler or which field. The wizards already do this correctly.

### Low

Dead-end «استعلام دوباره» links hardcoded to `/p/travel/form` for every product — **fixed**: they
follow the quote's own `productSlug` now, and the two fallbacks that render *because* there is no
quote to read a slug from go to the product list instead of guessing; the same national code accepted twice on
one policy; zero-value premium and coverage rows rendered for a sum of 0 or 1;
`hasPreviousPolicy` refinement always blaming `bodilyDiscountYears` regardless of which field was
wrong (`schemas/motor-tpl.ts:79`); Persian-digit plates rejected by `plateSchema`'s raw regex
before the `isValidPlate` refine that was written to normalise them; the home-fire teaser basket
pricing below every insurer's floor in every zone, so the advertised «از ۱۵۰٬۵۰۰ تومان» is the
minimum premium and the per-zone teaser machinery is inert (and no seeded city has
`quakeZone: 4`, making that factor dead data).

## Remaining work, in order

1. **C3** — the only defect left that takes money and gives nothing back. Two parts: stop
   re-running request-time validation at issuance, and give the `ISSUE_FAILED → ISSUING`
   transition the state machine already allows an actual caller.
2. **H1, H2, H4, H5, H6** — all of them put a wrong or unusable document in the customer's hands.
3. **M1, M2, M3** — one shared root each (a forward cap, a real calendar check, a per-product
   insured rule); cheap to fix together.
4. **M8** — Persian messages on the schema fields that lack them; mechanical, and all three
   wizards render these strings verbatim.

Also landed alongside C2, unasked but cheap: **the app now has a route-level error boundary**
(`apps/web/src/routes/RouteErrorPage.tsx`). There was none anywhere, which is why a single bad
read during render took the whole screen white with no message and no way back.
