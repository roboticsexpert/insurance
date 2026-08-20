# Go-to-market plan — online insurance platform

Internal working plan. Written in English to match `PROJECT.md`; the public research
content stays Persian. Derived from the research in `src/content/topics/`, mainly
`matris-foroosh-online-bime`, `andaze-bazar-va-forsat`, and
`bazigaran-va-mogharrarat-foroosh-online`.

## The finding, in one line

Online insurance in Iran covers ~13 products (≈30% of premium, mostly third-party motor)
fully, ~6 products semi-online (≈55% of premium: health, life, motor own-damage), and
leaves **50+ products (≈15% of premium, ~40–50 T tomans/yr) with no digital channel at
all** — and no marketplace competes there.

## Strategy

Do **not** fight Azki / Bimeh.com / BimeBazar on the saturated 10–15 simple products.
Enter through **Layer 3** (complex/commercial lines) with a *request → multi-insurer
quote → track → pay → e-policy* workflow, not one-click checkout.

### Beachhead: non-medical professional liability

The research flags it explicitly as the best candidate: **standardized product, fixed-ish
rates, low inspection need, but zero digital channel**. Targets: engineers (نظام مهندسی),
lawyers, notaries (سردفتران), veterinarians, pharmacists, accountants.

Why this first:
- Product is standard → can reach **level A** (truly instant online) after rate tables
  are collected, unlike engineering/marine.
- Buyers are **licensed professionals in registered guilds** → reachable list, no mass ad
  spend needed. Guild/association partnerships are the acquisition channel.
- Annual renewal → recurring commission, real LTV.
- Compare: medical liability is already online everywhere. Everything *around* it is not.

### Second wave: the contractor bundle

Same customer (contractor / workshop / factory), three policies they already buy yearly:
`مسئولیت کارفرما` + `CAR/EAR` + `آتش‌سوزی صنعتی`. These stay level B/C (needs
underwriter in the loop) — the product is the **workflow and transparency**, not
automation.

### Later: traffic layer

Add third-party motor / travel / home fire only once the B2B engine works, purely as an
acquisition funnel. Adding it first means a head-on price war we lose.

## Phases

### Phase 0 — validate before building (4–6 weeks, no code)

Blocking unknowns, all already listed as open questions in the research:

| # | Question | How to answer |
|---|---|---|
| 1 | Broker commission % per line (liability, engineering, cargo) | Talk to 2–3 licensed brokers; commission on complex lines is the whole financial model |
| 2 | Annual policy count & premium for non-medical liability + engineering | Central Insurance / Shada statistical yearbook |
| 3 | Will insurers quote via API or at least a shared kartabl? | Direct conversations with 3–5 mid-size insurers (Saman, Karafarin, Pasargad, Fardā) |
| 4 | Exact capital / guarantee / documentation for an online broker licence (آیین‌نامه ۹۲/۲) | Central Insurance executive directive + درگاه ملی مجوزها |
| 5 | Is e-signature accepted for the proposal form and health questionnaire? | Central Insurance enquiry |
| 6 | Buy/partner with an existing licensed broker vs. apply independently | Cost comparison; partnering is the fast path |

Also do **20 customer interviews** with target professionals: how they buy today, what
they pay, what annoys them. If the pain is not "phone calls and visits", the thesis is wrong.

**Go/no-go gate:** commission on the beachhead line ≥ a level that makes ~200 policies/month
sustainable, and at least 2 insurers willing to quote.

### Phase 1 — licence + first insurer (parallel with Phase 2)

Fastest route is partnership with an existing licensed broker (revenue share) while an
independent licence application runs in the background. Note the hard requirement: the CEO
or a board member needs **3+ years of relevant insurance experience** — if nobody on the
team has it, this dictates the first hire or co-founder.

### Phase 2 — MVP (8–12 weeks)

Deliberately **not** a core insurance system. A broker-side workflow platform:

1. Product catalog + interactive coverage guide (what cover do I actually need?)
2. Structured intake form per product + document upload
3. Internal kartabl: request → sent to N insurers → quotes collected → comparison view
4. Customer dashboard: quote comparison, accept, online payment
5. E-policy delivery + renewal reminders (renewals are the compounding asset)
6. Notifications: SMS + in-app

Explicitly out of scope for MVP: own rating engine, reserving, claims, reinsurance,
direct SANHAB integration (the partner insurer issues and registers the policy).

**Manual is fine at the start.** If "send to insurers" is a human emailing three
underwriters, that is still a 10× better customer experience than today. Automate only
after volume proves the path.

### Phase 3 — from level C to level A (months 6–12)

For the beachhead line, collect the rate tables from partner insurers and cache them →
instant quote → instant issue. This is the moment the business stops being a digital
broker and becomes a product. Only then does direct core/SANHAB integration pay off
(see `anatomy-of-core-insurance`).

## Metrics

- Phase 0: 20 interviews, 3 insurer conversations, commission table filled in
- Phase 2: time from request to quote (target < 24h vs. days today), quote→purchase rate
- Phase 3: share of requests quoted with zero human touch; renewal retention

## Main risks

| Risk | Mitigation |
|---|---|
| No traffic without the simple products | Guild/association partnerships and direct B2B sales instead of paid search |
| Insurers refuse to quote a newcomer | Start via an existing broker's relationships |
| Complex lines can't be fully automated | Accept it — sell the workflow; keep an expert in the loop |
| Licence timeline slips | Partner-first, licence in parallel |
| A big player copies the wedge | Depth in one vertical + guild relationships is the moat, not the software |

## Open items feeding back into the research

Everything in Phase 0 should land back in `src/content/topics/` as it gets answered —
especially the commission table and the licence requirements, which are currently the
biggest gaps in `andaze-bazar-va-forsat` and `bazigaran-va-mogharrarat-foroosh-online`.
