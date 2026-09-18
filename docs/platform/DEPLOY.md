# استقرار بیمه گلد

طراحی در [`MVP-PLAN.md` §۱۲](MVP-PLAN.md) است؛ این‌جا دستورالعمل اجرایی است. تصمیم‌هایی که حین
ساختنش گرفته شده در [`PROGRESS.md`](PROGRESS.md) ثبت شده‌اند.

## چه چیزی در مخزن هست

| فایل | چرا |
|---|---|
| `apps/api/Dockerfile` | بیلد چندمرحله‌ای. **کانتکست، ریشه مخزن است** نه `apps/api` — فایل قفل و `pnpm-workspace.yaml` آنجا هستند. |
| `.dockerignore` | سورس `apps/web` و `apps/docs` را کنار می‌گذارد اما `package.json` آن‌ها را نگه می‌دارد: pnpm پیش از اعمال `--filter` همه مانیفست‌های workspace را می‌خواند. |
| `apps/site/Dockerfile` | همین شکل، برای سایت بازاریابی. کانتکست باز هم ریشه مخزن است؛ Railway با متغیر `RAILWAY_DOCKERFILE_PATH` روی سرویس به آن می‌رسد. |
| ~~`railway.json`~~ | دیگر نیست — در `6cdab4b` برداشته شد. هر سه سرویس `rootDirectory` را روی `/` دارند، پس یک فایل مشترک در ریشه هر سه را با هم عوض می‌کرد. بیلدر، health check و بقیه تنظیمات استقرار حالا per-service و از راه MCP (`get-service-config` / `update-service`) ست می‌شوند. |

بررسی ایمیج بدون هیچ دخالتی از Railway:

```bash
docker build -f apps/api/Dockerfile -t bimegold-api:local .
```

## چه چیزی تأمین شده است

| | |
|---|---|
| پروژه | `bime247` — `24480e21-2aa9-401f-9f9f-561135f02e12` (پروژه Railway هنوز نام قدیمی را دارد) |
| محیط | `production` — `12a54ba8-1f6a-4381-9009-88f9999df531` |
| سرویس‌ها | `api` (Dockerfile، منبع GitHub) · `Postgres` (`postgres-ssl:18`) |
| آدرس عمومی | `https://api-production-21b4.up.railway.app` |

سرویس `api` از **`roboticsexpert/insurance`، شاخه `main`** مستقر می‌شود — هر push روی `main` یک
استقرار است. `railway up` در این چرخه نیست؛ اجرای آن، پوشه محلی را آپلود می‌کند و منبع حقیقت بودنِ
مخزن را تحت‌الشعاع قرار می‌دهد.

## ساختن دوباره‌اش از صفر

از ریشه مخزن:

```bash
railway init --name bimegold
```

```bash
railway add --database postgres --json
```

```bash
railway add --service api --json
```

بعد نوبت متغیرهاست. `DATABASE_URL` با ارجاع از سرویس Postgres می‌آید، تا وقتی پایگاه‌داده عوض شد
هم کار کند:

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

مقدارهای `WEB_URL`، `API_URL`، `CORS_ORIGINS` و `COOKIE_DOMAIN` بالا دامنه‌های نهایی را فرض
می‌گیرند. تا وقتی آن دامنه‌ها وصل نشده‌اند، این‌ها را به میزبان تولیدشده `*.up.railway.app` اشاره
دهید — `CORS_ORIGINS` خالی در محیط عملیاتی رد می‌شود، و `COOKIE_DOMAIN`ی که با میزبان نخواند
بی‌صدا کوکی refresh را می‌اندازد.

سرویس را به GitHub وصل کنید نه به آپلود از پوشه کاری. این کار تریگر استقرار را می‌سازد و بی‌درنگ
یک بیلد در صف می‌گذارد:

```bash
railway service source connect --repo roboticsexpert/insurance --branch main --service api
```

منتظر یک وضعیت نهایی بمانید — بیلدِ در صف، استقرار نیست:

```bash
railway service status --json
```

کاتالوگ توسط کانتینر seed **نمی‌شود**؛ `start:prod` فقط migration اجرا می‌کند، پس یک استقرار تازه
به `/api/v1/catalog/products` جواب `[]` می‌دهد. سرویس Postgres آدرس `DATABASE_PUBLIC_URL` ندارد،
پس seed را نمی‌شود از لپ‌تاپ اجرا کرد — داخل کانتینر اجرایش کنید:

```bash
railway ssh --service api -- sh -lc 'cd /app/apps/api && node_modules/.bin/tsx prisma/seed.ts'
```

رکوردهای seed روی volume مربوط به Postgres می‌مانند، پس این کار یک‌بار به‌ازای هر پایگاه‌داده است،
نه یک‌بار به‌ازای هر استقرار.

## استقرار یک تغییر

روی `main` پوش کنید. برای تماشایش:

```bash
railway service status --json
```

```bash
railway logs --service api --lines 200
```

## پیش از اینکه دامنه‌ای را به آن اشاره دهید این را بخوانید

`NODE_ENV=production` هر دو دریچه فرار ماک را روشن نگه می‌دارد، چون `apps/api/src/config/env.ts`
در غیر این صورت اصلاً بالا نمی‌آید و enum مربوط به `PAYMENT_GATEWAY` هنوز هیچ درگاه واقعی‌ای را
نمی‌پذیرد. بنابراین API مستقرشده کد یک‌بارمصرف **`1234` را برای ورود با هر شماره موبایلی** قبول
می‌کند و یک صفحه بانک ماک دارد که بدون گرفتن پول بیمه‌نامه صادر می‌کند. آن را روی همان میزبان
تولیدشده `*.up.railway.app` نگه دارید و تا وقتی درگاه و سرویس پیامک واقعی نیامده‌اند
`api.bimegold.com` را به آن وصل نکنید.

## دامنه اختصاصی، وقتی زمانش رسید

Railway گواهی خودش را صادر می‌کند و از پس یک رکورد پراکسی‌شده Cloudflare نمی‌تواند:

۱. دامنه را روی سرویس Railway اضافه کنید.
۲. رکورد CNAME را در Cloudflare به‌صورت **DNS-only** بسازید (ابر خاکستری).
۳. صبر کنید Railway گواهی را صادر کند.
۴. پراکسی را روشن کنید (ابر نارنجی) با حالت SSL روی **Full (strict)**.

پراکسی تزئینی نیست — در دسترس بودن لبه Railway از داخل ایران راستی‌آزمایی نشده، و ابر نارنجی یعنی
کاربر به Cloudflare وصل می‌شود نه مستقیم به Railway.

---

# استقرار وب روی Railway

`apps/web` یک SPA روی Vite است که `apps/web/Dockerfile` می‌سازدش و nginx سروش می‌کند. از
Cloudflare Workers جابه‌جا شد — دلیل اینکه چرا این تصمیم §۱۲ از MVP-PLAN را برمی‌گرداند در
PROGRESS آمده است.

| | |
|---|---|
| سرویس | `web` — `1ef779be-40ce-459d-859f-983e4ecb775b` |
| آدرس تست | `https://web-production-b407f.up.railway.app` |
| پورت | 8080 (`PORT`، که هنگام بالا آمدن در قالب nginx جایگذاری می‌شود) |

**دیگر `railway.json` در ریشه وجود ندارد.** آن فایل روی همه سرویس‌های پروژه اعمال می‌شد، پس سرویس
وب Dockerfile مربوط به API را می‌ساخت. حالا هر سرویس فایل خودش را با متغیر
`RAILWAY_DOCKERFILE_PATH` نام می‌برد:

```bash
railway variable set --service web 'RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile'
```

`VITE_API_URL` را Vite **در زمان بیلد** داخل کد می‌نشاند، پس یک `ARG` در Dockerfile است نه تنظیم
زمان اجرا. عوض کردن میزبان API یعنی ساختن دوباره ایمیج.

nginx این SPA را با `try_files $uri $uri/ /index.html` سرو می‌کند — بدون آن، رفرش سخت روی
`/p/travel/form` پیش از اینکه react-router اصلاً لود شود ۴۰۴ می‌دهد. مسیر `/assets/` با کش
immutable سرو می‌شود چون Vite اثر انگشت روی نامش می‌گذارد؛ `index.html` و `sw.js` روی `no-cache`
هستند وگرنه یک استقرار، کلاینت‌ها را روی باندل قبلی میخکوب می‌کند.

## دامنه‌ها

هر دو نام میزبان عمومی، دامنه اختصاصی Railway روی زون `bimegold.com` هستند
(حساب Cloudflare `022e4e5b87a14dc3d0e17772f66b5d6b`) و از ۳۰ مرداد ۱۴۰۵ بالا آمده‌اند.
**CLI مربوط به Railway نمی‌تواند رکوردهای DNS را بسازد** — یا دستی وارد می‌شوند یا با یک توکن
Cloudflare که `DNS:Edit` دارد. توکن OAuth مربوط به wrangler فقط `zone:read` دارد.

| نوع | نام | مقدار |
|---|---|---|
| CNAME | `api` | `0jb0nr94.up.railway.app` |
| TXT | `_railway-verify.api` | `railway-verify=f70ce4a02f2d3b050e6c2ca485ea488a6a180679d9b33573cf7b7c4385bad324` |
| CNAME | `app` | `qn6ipqxk.up.railway.app` |
| TXT | `_railway-verify.app` | `railway-verify=e4f9c3b12de3213fa9b1f542418bb00b3237968b2367cad538b258e6fe307f07` |

Railway نمی‌تواند گواهی‌اش را از پس یک رکورد پراکسی‌شده صادر کند، پس هر CNAME **DNS-only** (ابر
خاکستری) شروع می‌شود و فقط بعد از صدور گواهی نارنجی می‌شود — و آن‌وقت حالت SSL زون را روی
**Full (strict)** بگذارید. بررسی با:

```bash
railway domain status --service api
```

سایت مستندات فرق دارد: یک Worker روی Cloudflare است، دامنه اختصاصی‌اش به‌صورت route در
`apps/docs/wrangler.jsonc` تعریف شده و `wrangler deploy` خودش رکورد DNS را می‌سازد.

### جابه‌جایی bime247.com → bimegold.com — انجام‌شده در ۳۰ مرداد ۱۴۰۵

نگه داشته شده چون حالت خرابی‌ای که توصیف می‌کند در جابه‌جایی دامنه بعدی دوباره تکرار می‌شود.

`VITE_API_URL` در زمان **بیلد** داخل باندل وب پخته می‌شود؛ متغیرهای محیطی API در زمان **اجرا**
خوانده می‌شوند. بدتر اینکه مقدار پیش‌فرض `ARG VITE_API_URL=…` در Dockerfile آن چیزی **نیست** که
استفاده می‌شود: سرویس `web` مقدار `VITE_API_URL` را به‌عنوان متغیر Railway تنظیم می‌کند، و Railway
متغیرهای سرویس را به‌عنوان build arg وارد بیلد داکر می‌کند، پس متغیر سرویس برنده است. پیش‌فرض
Dockerfile فقط برای یک `docker build` ساده و بدون `--build-arg` اعمال می‌شود.

    railway variables --service web --kv | grep VITE_API_URL

قبل از اینکه فرض کنید یک push میزبان API را جابه‌جا کرده، این را بررسی کنید. اینجا نکرده بود.
اگر Dockerfile را عوض کنید و در همان بازه `CORS_ORIGINS` مربوط به API را عوض نکنید، اپی خواهید
داشت که بی‌نقص رندر می‌شود و هیچ‌چیزی نمی‌تواند بگیرد: درخواست preflight با `204` و بدون
`access-control-allow-origin` برمی‌گردد و رابط کاربری «ارتباط با سرور برقرار نشد» نشان می‌دهد.
دقیقاً همین‌جا دو بار اتفاق افتاد: یک‌بار چون push پیش از جابه‌جایی `CORS_ORIGINS` رسید، و بار
دیگر چون متغیر `VITE_API_URL` سرویس `web` هنوز `api.bime247.com` را نام می‌برد، پس باندل هم‌چنان
نام میزبانی را صدا می‌زد که همان لحظه جدا شده بود.

ترتیبی که از این اتفاق جلوگیری می‌کند:

۱. چهار رکورد بالا را اضافه کنید؛ صبر کنید `railway domain status --service api <domain>` وضعیت
   `Certificate status: …_VALID` گزارش کند.
۲. **هر دو** سرویس را به میزبان تازه اشاره دهید — API در زمان اجرا، باندل وب در زمان بیلد. اول
   API را انجام دهید تا وقتی باندل تازه منتشر می‌شود، مبدأ جدید را از پیش پذیرفته باشد:

   ```bash
   railway variables --service api --skip-deploys \
     --set 'WEB_URL=https://app.bimegold.com' \
     --set 'API_URL=https://api.bimegold.com' \
     --set 'CORS_ORIGINS=https://app.bimegold.com' \
     --set 'COOKIE_DOMAIN=.bimegold.com'
   railway redeploy --service api --yes

   railway variables --service web --set 'VITE_API_URL=https://api.bimegold.com/api/v1'
   ```

۳. روی `main` پوش کنید. هر دو سرویس دوباره ساخته می‌شوند؛ باندل وب `VITE_API_URL` تازه را
   برمی‌دارد. به‌جای اعتماد به وضعیت استقرار، تأیید کنید که واقعاً این کار را کرده — تنها مدرکی که
   به حساب می‌آید خود باندل است:

   ```bash
   curl -s https://app.bimegold.com/ | grep -o '/assets/index-[^"]*\.js'
   curl -s https://app.bimegold.com/assets/index-XXXX.js | grep -o 'https://api\.[a-z0-9.]*/api/v1'
   ```
۴. آن دو چیزی که این متغیرها واقعاً کنترلشان می‌کنند را بررسی کنید — CORS و دامنه کوکی:

   ```bash
   curl -sI -X OPTIONS https://api.bimegold.com/api/v1/catalog/products \
     -H 'Origin: https://app.bimegold.com' -H 'Access-Control-Request-Method: GET' \
     | grep -i access-control-allow-origin
   ```

   بعد یک ورود ماک بزنید و ببینید `Set-Cookie` این‌طور خوانده می‌شود:
   `bimegold_rt=…; Domain=.bimegold.com; HttpOnly; Secure; SameSite=Lax`. مقدار
   `COOKIE_DOMAIN`ی که با میزبان نخواند بی‌صدا انداخته می‌شود — ورود درست به نظر می‌رسد و نشست
   با اولین refresh می‌میرد.

۵. نام‌های میزبان قدیمی را حذف کنید:

   ```bash
   railway domain delete --service web --yes app.bime247.com
   railway domain delete --service api --yes api.bime247.com
   ```

رکوردهای `app` و `api` هنوز روی زون **bime247.com** وجود دارند و حالا به سرویسی از Railway اشاره
می‌کنند که دیگر برایشان جواب نمی‌دهد. هر وقت شد، آنجا حذفشان کنید.

تغییر نام کوکی refresh به `bimegold_rt` یک‌بار همه نشست‌های موجود را خارج کرد. با کد یک‌بارمصرف
ماک، این هزینه‌ای نداشت.

---

# استقرار سایت بازاریابی روی Railway

`apps/site` یک اپ Payload CMS روی Next.js است که `apps/site/Dockerfile` می‌سازدش. در ۱۴۰۵/۰۶/۲۷
اضافه شد.

| | |
|---|---|
| سرویس | `site` — `93d5dc27-b1e1-41fd-acd0-4673756ff04a` |
| دامنه‌ها | `bimegold.com`، `www.bimegold.com` |
| پورت | 3000 |
| volume | `site-media` روی `/app/apps/site/public/media` |

```bash
railway variables --service site \
  --set 'RAILWAY_DOCKERFILE_PATH=apps/site/Dockerfile' \
  --set 'DATABASE_URL=${{Postgres.DATABASE_URL}}' \
  --set 'NEXT_PUBLIC_SERVER_URL=https://bimegold.com' \
  --set 'NEXT_PUBLIC_APP_URL=https://app.bimegold.com'
```
به‌علاوه `PAYLOAD_SECRET`، `PREVIEW_SECRET` و `CRON_SECRET` که مقدارهایشان فقط روی Railway‌اند.

## مدیریت این سرویس فقط از راه MCP

هر کاری با محیط عملیاتی `site` — وضعیت، لاگ، متغیر، دامنه، استقرار دوباره، متریک — با ابزارهای
Railway MCP انجام می‌شود، نه با `railway` CLI و نه از داشبورد. دلیلش این است که خروجی MCP همان
چیزی است که در گفتگو ثبت می‌شود و قابل بازخوانی است، و `curl` از این شبکه درباره این هاست‌ها
دروغ می‌گوید. جدول ابزارها در [`CLAUDE.md`](../../CLAUDE.md) ریشه مخزن است.

استقرار خودش استثناست: سرویس به GitHub وصل است و push روی `main` استقرار می‌سازد.

## همان Postgres، اسکیمای جدا

سایت هیچ دیتابیس تازه‌ای نمی‌خواهد: `DATABASE_URL` همان ارجاع به سرویس `Postgres` است و
جدول‌های CMS در اسکیمای **`cms`** می‌نشینند (`schemaName` در `payload.config.ts`). Prisma فقط
`public` را می‌شناسد، پس دو مهاجرت‌ساز هرگز به هم نمی‌خورند.

این تصمیم از سر ناچاری هم هست: Postgres روی Railway هیچ نقطه اتصال عمومی و هیچ TCP proxy ندارد،
پس برای ساختن یک دیتابیس تازه باید موقتاً در معرض اینترنت می‌گذاشتیمش. یک اسکیما را خودِ مهاجرت
می‌سازد.

## مهاجرت‌ها هنگام بالا آمدن اجرا می‌شوند

در محیط عملیاتی `push: false` است. مهاجرت‌ها از راه `prodMigrations` در `payload.config.ts` — که
یک import استاتیک از `src/migrations` است — داخل باندل می‌آیند و Payload خودش موقع init اجرایشان
می‌کند. یعنی ایمیج نه به `payload` CLI نیاز دارد نه به یک نصب کامل، و خروجی standalone حدود
۱۱۰ مگابایت می‌ماند به‌جای یک node_modules چندگیگابایتی.

**`migrate:create` خود Payload اسکیما را نمی‌سازد.** اولین مهاجرت یک
`CREATE SCHEMA IF NOT EXISTS "cms"` دستی در ابتدای `up` دارد؛ بدون آن اولین
`CREATE TYPE "cms".…` روی یک دیتابیس خالی می‌افتد. مهاجرت‌های بعدی لازمش ندارند.

## health check همان چیزی است که جلوی قطعی حین استقرار را می‌گیرد

تا پیش از این سرویس `site` هیچ health check نداشت، و قطعیِ چنددقیقه‌ایِ هر استقرار از همین‌جا
می‌آمد. بدون مسیر health، تنها چیزی که Railway می‌بیند باز شدن پورت است — و سرور standalone
مربوط به Next بی‌درنگ روی پورت می‌نشیند و `✓ Ready in 0ms` را چاپ می‌کند، در حالی که Payload
هنوز هیچ کاری نکرده. Payload تنبل بالا می‌آید: اتصال به Postgres و اجرای `prodMigrations` روی
**اولین درخواست** اتفاق می‌افتد، نه هنگام بوت.

نتیجه‌اش در استقرار `e97d6d63` (۲۷ شهریور ۱۴۰۵) دیده می‌شود: کانتینر در ۱۳:۲۳:۰۳ بالا آمد،
Railway در ۱۳:۲۳:۱۴ استقرار را SUCCESS اعلام کرد و در ۱۳:۲۳:۱۷ کانتینر قبلی را برداشت — در
حالی که کانتینر تازه هنوز نمی‌توانست حتی یک صفحه را render کند. اولین بازدیدکننده بعد از آن
هزینه‌اش را می‌داد.

حالا دو مسیر هست، با همان قرارداد `apps/api`:

| مسیر | چه می‌کند |
|---|---|
| `/health` | زنده‌بودن. فقط `process.uptime()`؛ به دیتابیس دست نمی‌زند. |
| `/health/ready` | آمادگی. `getPayload` را صدا می‌زند (init کامل: اتصال + `prodMigrations`)، بعد یک `count` واقعی روی `pages` می‌زند تا معلوم شود اسکیمای `cms` هم سر جایش است. |

و پیکربندی سرویس — با `update-service` از راه MCP ست شده، نه `railway.json`، چون `api` و `site`
هر دو `rootDirectory` را روی `/` دارند و یک فایل مشترک در ریشه هر دو را با هم عوض می‌کند:

| | |
|---|---|
| `healthcheckPath` | `/health/ready` |
| `healthcheckTimeout` | ۳۰۰ ثانیه |

`/health/ready` وقتی آماده نیست باید **۵۰۳** برگرداند، نه ۲۰۰ با بدنه‌ای که می‌گوید خراب است:
Railway فقط به کد وضعیت نگاه می‌کند و هر ۲xx یعنی «این استقرار را زنده کن». برخلاف
`GET /health/ready` در `apps/api` که ۲۰۰ با `degraded` می‌دهد — آن یکی قرارداد مانیتورینگ است،
این یکی دروازه استقرار.

اندازه‌گیری‌شده روی همین ایمیج با یک دیتابیس خالی (تا مهاجرت‌ها واقعاً اجرا شوند):

| | |
|---|---|
| `/health` | ۰ ثانیه — پورت بی‌درنگ باز است. همان سیگنال بی‌معنایی که Railway قبلاً به آن تکیه می‌کرد. |
| `/health/ready`، بار اول | ۲٫۳ ثانیه — init به‌علاوه هر دو مهاجرت. |
| `/health/ready`، بار دوم | ۳ میلی‌ثانیه. |

یعنی آن ۲٫۳ ثانیه را حالا health check می‌دهد، پیش از آن‌که Railway کانتینر قبلی را بردارد،
نه اولین بازدیدکننده بعد از استقرار.

**یک قطعیِ باقی‌مانده، که با health check حل نمی‌شود:** سرویسی که volume دارد نمی‌تواند دو
استقرار را هم‌زمان اجرا کند، چون volume فقط به یک کانتینر وصل می‌شود. پس `site` — که
`site-media` روی آن سوار است — همیشه یک پنجره چندثانیه‌ای تحویل‌وتحول دارد.
[مستند خود Railway](https://docs.railway.com/guides/ship-on-merge-pr-canaries#step-4-cut-over-with-zero-downtime)
همین را می‌گوید. برای رسیدن به صفرِ واقعی باید رسانه‌ها از volume به object storage بروند
(`@payloadcms/storage-s3` روی یک bucket)، تا سرویس بی‌حالت شود و Railway اجازه هم‌پوشانی بدهد.

## بیلد به دیتابیس دسترسی ندارد

بیلد داکر نمی‌تواند به Postgres وصل شود (شبکه خصوصی، فقط هنگام اجرا). برای همین هیچ صفحه‌ای در
زمان بیلد prerender نمی‌شود — مسیرهای وابسته به دیتابیس `force-dynamic`اند. برای یک سایت CMS
درست‌تر هم هست: ویراستار منتشر می‌کند و صفحه عوض می‌شود، بدون بیلد دوباره. کش لبه کار Cloudflare است.

## آپلودها روی volume‌اند

Payload آپلودها را روی دیسک می‌نویسد و دیسک کانتینر با هر استقرار پاک می‌شود. volume به نام
`site-media` دقیقاً روی `/app/apps/site/public/media` سوار است. بدون آن هر عکسی که ویراستار
بالا داده با استقرار بعدی ناپدید می‌شود.

## پر کردن محتوا روی محیط عملیاتی

دیتابیس Railway از بیرون در دسترس نیست، پس `pnpm seed` از روی لپ‌تاپ به آن نمی‌رسد.
در ۱۴۰۵/۰۶/۲۷ یک مسیر موقت `POST /next/seed` اضافه شد که همان `seedContent` را از داخل
شبکه Railway صدا می‌زد، پشت `Authorization: Bearer $CRON_SECRET`، و **بلافاصله بعد از
یک‌بار اجرا حذف شد**.

جایگزینش — باز کردن موقت یک TCP proxy روی Postgres — کل دیتابیس پلتفرم را با سفارش‌ها و
بیمه‌نامه‌های واقعی مشتری‌ها در معرض اینترنت می‌گذاشت. اگر باز لازم شد، همان مسیر را
برگردانید، یک‌بار صدا بزنید و دوباره برش دارید:

```bash
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://bimegold.com/next/seed
```

## اولین کاربر پیشخان

`src/seed/index.ts` در محیط عملیاتی کاربر نمی‌سازد (مگر `SEED_ADMIN_PASSWORD` صریحاً داده شود) —
رمز پیش‌فرض روی یک دامنه عمومی یعنی پیشخان باز است. اولین کاربر را خودِ Payload در `/admin`
می‌سازد؛ بعد از آن ثبت‌نام بسته می‌شود.

## رکوردهای DNS

| نوع | نام | مقدار |
|---|---|---|
| CNAME | `@` (bimegold.com) | `2ii3coyt.up.railway.app` |
| CNAME | `www` | `2r1yb6wo.up.railway.app` |

همان قاعده `app` و `api`: **DNS-only (ابر خاکستری)** شروع می‌شود تا Railway گواهی را صادر کند،
بعد نارنجی می‌شود و آن‌وقت حالت SSL زون روی **Full (strict)**. CNAME روی خود apex را
CNAME-flattening مربوط به Cloudflare حل می‌کند.

**توکن OAuth مربوط به wrangler این رکوردها را نمی‌سازد** — فقط `zone:read` دارد. یا دستی وارد
می‌شوند یا با یک توکن Cloudflare که `DNS:Edit` دارد.

## تاریخی: جابه‌جایی اولیه Cloudflare → Railway

`apps/web` قبلاً روی Cloudflare Workers مستقر می‌شد؛ `apps/web/wrangler.jsonc` پیکربندی باقی‌مانده
از آن است و می‌شود حذفش کرد. یک دامنه اختصاصی Workers و یک CNAME نمی‌توانند هر دو مالک یک نام
میزبان باشند، پس آن جابه‌جایی اول نیاز داشت که binding مربوط به Workers برداشته شود:

```bash
wrangler triggers delete --name bimegold-web
```
