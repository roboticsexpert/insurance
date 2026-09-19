# سایت بازاریابی بیمه گلد

سایت عمومی روی دامنه اصلی — معرفی محصول‌ها، لندینگ کمپین و مجله. با **Payload CMS 3**
(قالب `website`) روی **Next.js 16** ساخته شده و داده‌اش در **Postgres** است.

**این سایت چیزی نمی‌فروشد.** خرید در `app.bimegold.com` (`apps/web`) انجام می‌شود؛ هر دکمه
استعلام، کاربر را با انتخابش به ویزارد آن اپ می‌فرستد. تصمیم‌های طراحی در
[`docs/website/LANDING-PAGES.md`](../../docs/website/LANDING-PAGES.md) است.

## راه‌اندازی

```bash
pnpm db:up                        # Postgres داکری مشترک با apps/api
cp apps/site/.env.example apps/site/.env
pnpm --filter @bimegold/site seed # کاربر پیشخان، صفحه خانه، محصول شخص ثالث
pnpm dev:site                     # http://localhost:3100
```

پیشخان: `http://localhost:3100/admin` — `admin@bimegold.com` / `bimegold`
(با `SEED_ADMIN_EMAIL` و `SEED_ADMIN_PASSWORD` قابل تغییر است).

`seed` را می‌شود چند بار اجرا کرد؛ هرچه با همان اسلاگ وجود داشته باشد به‌روز می‌شود.

## دیتابیس

همان نمونه Postgres داکری `apps/api` است (پورت ۵۴۳۳) و همان دیتابیس `bime247`، ولی
**اسکیمای جدا**: جدول‌های CMS در `cms` می‌نشینند و `public` دست Prisma است، پس دو
مهاجرت‌ساز به هم نمی‌خورند.

- **در توسعه** `push: true` است و Payload اسکیما را خودش هم‌گام می‌کند.
- **در محیط عملیاتی** `push: false` است؛ تغییر اسکیما فقط با مهاجرت:
  `pnpm --filter @bimegold/site migrate:create` و بعد `migrate`.

## ساختار

مسیرها نسبت به `apps/site/`.

```
src/
  payload.config.ts        مجموعه‌ها، گلوبال‌ها، آداپتور Postgres، i18n فارسی پیشخان
  collections/             pages, posts, categories, authors, faqs, insurers, media, users
  blocks/<Name>/           هر بلوک: config.ts (اسکیمای CMS) + Component.tsx (رندر)
  blocks/RenderBlocks.tsx  نگاشت blockType → کامپوننت
  Header/ Footer/          گلوبال‌ها و رندرشان
  lib/products.ts          داده محصول — فعلاً جای‌نگار، جای اتصال به API همین‌جاست
  lib/fa.ts                ارقام فارسی، تومان، تاریخ جلالی
  utilities/slugifyFa.ts   اسلاگ‌ساز فارسی (اسلاگ پیش‌فرض Payload حروف فارسی را دور می‌ریزد)
  seed/index.ts            داده اولیه
  app/(frontend)/          سایت عمومی
  app/(payload)/           پیشخان و REST/GraphQL
```

## بلوک‌ها

صفحه‌ها **کاملاً** بلوکی‌اند — هیرو هم یک بلوک است، نه یک تب جدا (قالب اصلی Payload جدایش
می‌کرد)، تا لندینگ کمپین بتواند بدون هیرو یا با دو هیرو ساخته شود.

| بلوک | کار |
|---|---|
| `hero` | تیتر صفحه، در سه وزن: اصلی، محصول، ساده |
| `quoteForm` | فرستادن کاربر به ویزارد اپ؛ فیلدها در کد‌اند تا با ویزارد جور بمانند |
| `productGrid` | کارت محصول‌ها، با نرخ «از …» از `lib/products.ts` |
| `steps` | «سه قدم تا بیمه‌نامه» |
| `features` | شبکه ویژگی‌ها |
| `insurerStrip` | نام و نشان شرکت‌ها، با وضعیت هرکدام |
| `offerPreview` | پیش‌نمایش مقایسه نرخ، همیشه با برچسب «نرخ نمونه» |
| `coverageList` | دو کارت: چه چیزی پوشش می‌دهد و چه چیزی نمی‌دهد |
| `priceFactors` | قیمت چطور تعیین می‌شود — ستون‌های شماره‌دار |
| `faq` | پرسش‌ها از مجموعه `faqs` انتخاب می‌شوند، نه داخل بلوک |
| `postsList` | مقاله‌های تازه یا انتخاب دستی |
| `ctaBand` | نوار دعوت |

به‌علاوه `content`، `mediaBlock` و `formBlock` که از قالب مانده‌اند.

نان‌ریزه بالای صفحه‌های داخلی بلوک **نیست**: `components/Breadcrumb` است و `[slug]/page.tsx`
آن را برای هر صفحه‌ای جز خانه خودش می‌گذارد.

بلوک تازه: پوشه‌ای در `src/blocks/` با `config.ts` و `Component.tsx` بسازید، بلوک را به
`blocks` در `collections/Pages/index.ts` اضافه کنید، کامپوننت را در `RenderBlocks.tsx` نگاشت
کنید و `pnpm --filter @bimegold/site generate:types` را اجرا کنید.

## صداقت

اینها تصمیم‌اند، نه سهل‌انگاری — پیش از برداشتنشان
[`docs/website/LANDING-PAGES.md`](../../docs/website/LANDING-PAGES.md) را بخوانید:

- شرکت‌های بیمه با وضعیت **«در حال مذاکره»** ساخته می‌شوند و `insurerStrip` همین وضعیت را
  کنار نامشان می‌نویسد. تا قرارداد امضا نشده، لوگوی تنها روی سایت ادعای همکاری است.
- `offerPreview` **همیشه** برچسب «نرخ نمونه» دارد؛ نرخ زنده‌ای در کار نیست. ردیف‌های
  صفحه‌های محصول نام شرکت دارند ولی مبلغ‌هایشان جای‌نگارند، پس هیچ عددی به هیچ شرکتی
  نسبت داده نمی‌شود — جزئیات و هشدارهایش در `LANDING-PAGES.md`.
- **فرم استعلام فیلدی را که فهرست گزینه‌هایش از API می‌آید نمی‌سازد**، چون سایت به API
  وصل نیست و گزینه ساختگی یعنی مقداری که ویزارد نمی‌شناسد. جدولِ اینکه هر صفحه چه
  می‌پرسد در `LANDING-PAGES.md` است.
- شماره پروانه بیمه مرکزی در فوتر عمداً خالی است.
- تصویر OG پیش‌فرض نداریم — با دور طراحی می‌آید، نه با یک جای‌نگار.

## نکته‌های فنی

- **اسلاگ فارسی.** `slugify` پیش‌فرض Payload با `[^\w-]+` حروف فارسی را حذف می‌کند و عنوان
  فارسی به اسلاگ خالی ختم می‌شود. `src/fields/slugFa.ts` جایگزینش است — همه‌جا از
  `slugFieldFa` استفاده کنید، نه `slugField`.
- **`turbopack.root` ریشه ورک‌اسپیس است**، نه پوشه این اپ: با `node_modules` ایزوله pnpm،
  خود `next` یک symlink به `.pnpm` در ریشه مخزن است و Turbopack بیرون از root خودش را
  resolve نمی‌کند. با `root: dirname` بیلد با «Could not find the Next.js package» می‌شکند.
- **`robots.ts` در `src/app/` است، نه `src/app/(frontend)/`.** داخل آن گروه، مسیر پویای
  `[slug]` جلوتر می‌افتد و `/robots.txt` چهارصد و چهار می‌دهد.
- **هوک‌های revalidate بیرون از Next خطا می‌دهند.** اسکریپت seed برای همین
  `context: { disableRevalidate: true }` می‌فرستد.
- **نویسنده‌ها مجموعه خودشان را دارند** (`authors`)، نه `users`. قالب اصلی نویسنده را به
  `users` وصل می‌کرد و چون دسترسی خواندن `users` بسته است، مجبور بود با هوک `populateAuthors`
  اسمشان را کپی کند. آن هوک حذف شد.
- **قلم و لوگو تولیدشده‌اند.** `public/brand/` را دستی ویرایش نکنید؛ با
  `tools/brand-gold/build.sh` ساخته می‌شود.
- **ESLint فلت‌کانفیگ `eslint-config-next` را مستقیم import می‌کند.** قالب آن را از راه
  `FlatCompat` می‌کشید که روی ESLint 9.39 با «Converting circular structure to JSON» می‌شکند.
- **`HeaderThemeProvider` حذف شد.** ماشینی بود که هر صفحه با آن هدر را روشن/تیره می‌کرد و به
  وزن‌های هیروی قالب وصل بود؛ با آن‌ها رفت. پنج فایل `page.client.tsx` که فقط همین کار را
  می‌کردند هم حذف شدند. اگر دور طراحی چنین چیزی خواست، از روی `variant` بلوک هیرو بیاید.
- **انتخاب تم با `useSyncExternalStore` خوانده می‌شود**، نه با effectی که setState می‌کند —
  `localStorage` یک store بیرون از React است و قاعده `react-hooks/set-state-in-effect` درست
  می‌گفت. `src/providers/Theme/shared.ts`.

## استقرار

روی Railway، در همان پروژه `bime247`، سرویس `site`. جزئیات — متغیرها، volume، اسکیمای `cms`،
مهاجرت‌هایی که هنگام بالا آمدن اجرا می‌شوند و رکوردهای DNS — در
[`docs/platform/DEPLOY.md`](../../docs/platform/DEPLOY.md).

## باز
- `lib/products.ts` جای‌نگار است. اتصالش به `apps/api` یعنی عوض‌کردن بدنه `getProducts`.
- تاریخ‌های پیشخان میلادی‌اند (با اعداد فارسی). اگر مزاحم شد، `admin.dateFormat`.
- **محتوای محیط عملیاتی هنوز ساخته نشده.** اسکیما با اولین درخواست ساخته می‌شود، اما صفحه‌ای
  در کار نیست تا کسی در `/admin` اولین کاربر را بسازد و محتوا وارد کند.
- **هدر منوی موبایل ندارد.** قالب هم نداشت؛ زیر ۳۹۰ پیکسل لوگو و منو به هم می‌چسبند.
  با دور طراحی حل می‌شود.
- تم تیره سایت هنوز طراحی نشده؛ توکن `navy` جای‌نگار است تا دیزاین‌سیستم برسد.
