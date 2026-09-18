# قاعده‌های این مخزن

مستندها فارسی‌اند (`docs/`، README‌ها). شناسه‌های کد، مسیر فایل‌ها، دستورها و نام دامنه‌ها
لاتین می‌مانند.

## مدیریت محیط عملیاتیِ سایت بازاریابی فقط از راه MCP

سایت بازاریابی (`apps/site` — Payload CMS روی Next.js) روی Railway مستقر است. **هر کاری
با محیط عملیاتی این سرویس باید با ابزارهای Railway MCP انجام شود** — نه با `railway` CLI،
نه با `curl`، نه با داشبورد Railway و نه با حدس زدن از روی کد.

| کجا هست | |
|---|---|
| پروژه | `bime247` — `24480e21-2aa9-401f-9f9f-561135f02e12` |
| محیط | `production` — `12a54ba8-1f6a-4381-9009-88f9999df531` |
| سرویس | `site` — `93d5dc27-b1e1-41fd-acd0-4673756ff04a` |
| دامنه‌ها | `bimegold.com`، `www.bimegold.com` |

| کار | ابزار MCP |
|---|---|
| دیدن وضعیت سرویس و پیکربندی‌اش | `describe-service`، `get-service-config`، `get-status` |
| وضعیت استقرارها | `list-deployments`، `environment-status`، `get-deployment-diagnosis` |
| لاگ بیلد و اجرا | `get-logs` |
| متغیرهای محیطی | `list-variables`، `set-variables` |
| دامنه‌ها | `list-domains`، `domain-status`، `generate-domain` |
| راه‌اندازی دوباره | `redeploy`، `restart-service` |
| سلامت و ترافیک | `get-service-metrics`، `http-error-rate`، `http-requests`، `http-response-time` |
| کار چندمرحله‌ای یا عیب‌یابی باز | `railway-agent` |

قاعده‌های جانبی:

- **استقرار همچنان با push روی `main` است.** سرویس به `roboticsexpert/insurance` وصل است؛
  `railway up` اجرا نشود. MCP برای دیدن، تنظیم‌کردن و دوباره‌فرستادن است، نه برای آپلود
  پوشه محلی.
- **نتیجه هیچ‌وقت از `curl` گرفته نشود.** شبکه این لپ‌تاپ به لبه Cloudflare نمی‌رسد و
  `curl`/`WebFetch` سایتِ سالم را خراب گزارش می‌کنند — گاهی برای یک هاست جواب می‌دهند و
  یک ثانیه بعد برای هاست کناری نه. حقیقت از `get-logs`، `get-service-metrics` و
  `http-error-rate` می‌آید؛ برای دیدن خودِ صفحه، endpoint مربوط به `browser-rendering`
  در حساب Cloudflare.
- **کارهای مخرب اول تأیید بگیرند**: `delete-service`، `delete-volume`، `delete-tcp-proxy`،
  `accept-deploy`، و هر `set-variables` که یک راز موجود را بازنویسی می‌کند. volume به نام
  `site-media` روی `/app/apps/site/public/media` سوار است و آپلودهای ویراستار آنجایند —
  پاک شدنش یعنی از دست رفتن همه رسانه‌ها.
- **دیتابیس از بیرون در دسترس نیست** و قرار هم نیست باشد. برای seed یا هر کار یک‌بارمصرفی
  روی داده، نقطه اتصال عمومی یا TCP proxy باز نشود؛ روش ثبت‌شده در
  [`docs/platform/DEPLOY.md`](docs/platform/DEPLOY.md) دنبال شود.

جزئیات کامل استقرار — Dockerfile، اسکیمای `cms`، مهاجرت‌ها، رکوردهای DNS — در
[`docs/platform/DEPLOY.md`](docs/platform/DEPLOY.md) است.
