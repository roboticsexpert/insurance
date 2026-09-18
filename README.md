# بیمه گلد

مونوریپوی کسب‌وکار بیمه‌ای **بیمه گلد** (Bime Gold).

| اپلیکیشن | چیست | کجا |
|---|---|---|
| [`apps/web`](apps/web) | اپ مشتری — React SPA، فارسی، راست‌به‌چپ، **فقط موبایل** | app.bimegold.com |
| [`apps/api`](apps/api) | NestJS + PostgreSQL — کاتالوگ، موتور نرخ‌دهی، سفارش‌ها، بیمه‌نامه‌ها | api.bimegold.com |
| [`apps/docs`](apps/docs) | سایت پژوهشی Astro درباره صنعت بیمه ایران | docs.bimegold.com |
| [`apps/site`](apps/site) | سایت بازاریابی — Payload CMS + Next.js، لندینگ بلوکی و مجله | bimegold.com *(هنوز مستقر نشده)* |
| [`apps/brand`](apps/brand) | کتاب برند — فارسی/انگلیسی، ساخته‌شده از `brand/bime-gold/` | brand.bimegold.com |

## شروع کار

```bash
pnpm install
pnpm db:up          # Postgres روی :5433
pnpm db:migrate
pnpm db:seed
pnpm dev            # api روی :3000، web روی :5173
```

سایت بازاریابی دیتابیس خودش را دارد و جدا بالا می‌آید:

```bash
pnpm site:db                      # دیتابیس bimegold_cms در همان Postgres
cp apps/site/.env.example apps/site/.env
pnpm --filter @bimegold/site seed
pnpm dev:site                     # :3100، پیشخان روی /admin
```

## مستندات

- [`docs/platform/MVP-PLAN.md`](docs/platform/MVP-PLAN.md) — طراحی کامل پلتفرم
- [`docs/platform/PROGRESS.md`](docs/platform/PROGRESS.md) — چه چیزی ساخته شده و قدم بعدی چیست
- [`docs/platform/DEPLOY.md`](docs/platform/DEPLOY.md) — دستورالعمل اجرایی Railway برای API
- [`docs/website/LANDING-PAGES.md`](docs/website/LANDING-PAGES.md) — طراحی سایت بازاریابی
- [`docs/PROJECT.md`](docs/PROJECT.md) — سایت پژوهشی
- [`docs/PLAN.md`](docs/PLAN.md) — برنامه ورود به بازار کسب‌وکار

MVP عمداً روی ماک‌ها کار می‌کند: درگاه پرداخت، پیامک و کد یک‌بارمصرف `1234`.
جدول‌های نرخ موقت‌اند و رابط کاربری همین را به کاربر نشان می‌دهد.
