/**
 * داده اولیه سایت.
 *
 * از خط فرمان صدا زده می‌شود: `pnpm --filter @bimegold/site seed` (`src/seed/cli.ts`).
 *
 * محیط عملیاتی در ۱۴۰۵/۰۶/۲۷ یک‌بار با یک مسیر موقت `POST /next/seed` پر شد — دیتابیس
 * Railway هیچ نقطه اتصال عمومی ندارد و باز کردن یک TCP proxy یعنی گذاشتن کل دیتابیس
 * پلتفرم در معرض اینترنت. آن مسیر بعد از همان یک‌بار حذف شد. اگر باز لازم شد، همان را
 * برگردانید (پشت `Authorization: Bearer $CRON_SECRET`)، استفاده کنید و دوباره برش دارید.
 *
 * محتوای نمایشی قالب انگلیسی Payload حذف شده؛ این اسکریپت جایش را گرفته و فقط چیزی
 * می‌سازد که **راست** است: متن محصول‌ها از `apps/api/prisma/seed-data/products.ts` آمده،
 * پرسش‌ها از همان‌جا، و شرکت‌های بیمه با وضعیت «در حال مذاکره» ساخته می‌شوند تا لوگویشان
 * روی سایت نرود. مبلغ، نماد اعتماد و شماره پروانه جای‌نگارند — هنوز قرارداد و پروانه نداریم.
 *
 * دوباره اجرا کردنش امن است: هر چیزی که با همان اسلاگ وجود داشته باشد به‌روز می‌شود.
 */
import { type Payload } from 'payload'

/**
 * هوک‌های `revalidatePage`/`revalidateHeader` به `revalidatePath` مربوط به Next وصل‌اند و
 * بیرون از یک درخواست Next خطا می‌دهند. اسکریپت CLI بیرون از Next اجرا می‌شود، پس
 * خاموششان می‌کنیم؛ داخل مسیر HTTP هم بی‌ضررند چون صفحه‌ها `force-dynamic`اند.
 */
const NO_REVALIDATE = { disableRevalidate: true }

const upsert = async (
  payload: Payload,
  collection: Parameters<Payload['find']>[0]['collection'],
  where: Record<string, unknown>,
  data: Record<string, unknown>,
): Promise<{ id: number | string }> => {
  const existing = await payload.find({
    collection,
    where: where as never,
    limit: 1,
    pagination: false,
    overrideAccess: true,
  })

  if (existing.docs[0]) {
    return await payload.update({
      collection,
      id: existing.docs[0].id,
      data: data as never,
      overrideAccess: true,
      context: NO_REVALIDATE,
    })
  }

  return await payload.create({
    collection,
    data: data as never,
    overrideAccess: true,
    context: NO_REVALIDATE,
  })
}

/**
 * آدرس اپ خرید. سایت چیزی نمی‌فروشد؛ هر دکمه استعلام و هر لینک حساب کاربری به اینجا
 * می‌رود. از محیط خوانده می‌شود تا روی لپ‌تاپ به `apps/web` محلی برود نه به دامنه عملیاتی.
 */
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.bimegold.com'

/**
 * شرکت‌های بیمه بازار ایران. ترتیب همین فهرست، ترتیب نمایش روی سایت است — شش تای اول
 * همان‌هایی‌اند که در بوم طرح آمده‌اند، بقیه بعدشان. نشان هر کدام در
 * `apps/site/public/insurers/<slug>.svg` است.
 *
 * «بیمه مرکزی» عمداً اینجا نیست: نهاد ناظر است نه شرکت بیمه، و جایش در نوار شرکت‌ها
 * نیست. فایل نشانش هست تا اگر جای‌نگار مجوز در فوتر خواستش، آماده باشد.
 */
const INSURERS = [
  { name: 'بیمه تعاون', slug: 'taavon' },
  { name: 'بیمه پاسارگاد', slug: 'pasargad' },
  { name: 'بیمه سامان', slug: 'saman' },
  { name: 'بیمه کارآفرین', slug: 'karafarin' },
  { name: 'بیمه دی', slug: 'dey' },
  { name: 'بیمه البرز', slug: 'alborz' },
  { name: 'بیمه ایران', slug: 'iran' },
  { name: 'بیمه آسیا', slug: 'asia' },
  { name: 'بیمه دانا', slug: 'dana' },
  { name: 'بیمه پارسیان', slug: 'parsian' },
  { name: 'بیمه ملت', slug: 'mellat' },
  { name: 'بیمه نوین', slug: 'novin' },
  { name: 'بیمه ما', slug: 'ma' },
  { name: 'بیمه سینا', slug: 'sina' },
  { name: 'بیمه معلم', slug: 'moalem' },
  { name: 'بیمه کوثر', slug: 'kosar' },
  { name: 'بیمه آرمان', slug: 'arman' },
  { name: 'بیمه رازی', slug: 'raazi' },
  { name: 'بیمه توسعه', slug: 'toseei' },
]

const FAQS = [
  {
    question: 'آیا بیمه‌نامه مسافرتی مورد قبول سفارت است؟',
    answer:
      'بله. بیمه‌نامه به‌صورت دوزبانه صادر می‌شود و برای اخذ ویزای شنگن و سایر مقاصد قابل ارائه است.',
    topic: 'travel',
  },
  {
    question: 'اگر سفرم لغو شود چه می‌شود؟',
    answer: 'تا پیش از تاریخ شروع بیمه‌نامه، امکان ابطال و بازگشت وجه با کسر کارمزد وجود دارد.',
    topic: 'travel',
  },
  {
    question: 'تخفیف عدم خسارت من چقدر است؟',
    answer:
      'میزان تخفیف بر اساس سال‌های بدون خسارت شما محاسبه می‌شود و در فرم استعلام واردش می‌کنید.',
    topic: 'motor-tpl',
  },
  {
    question: 'تعهد مالی چیست؟',
    answer: 'سقف خسارتی که بابت آسیب به اموال دیگران پرداخت می‌شود و درصدی از تعهد جانی است.',
    topic: 'motor-tpl',
  },
  {
    question: 'ارزش ساختمان را چطور تعیین کنم؟',
    answer:
      'ارزش بازسازی بنا را وارد کنید، نه قیمت خرید ملک؛ چون در زمان خسارت هزینه ساخت مبنا است.',
    topic: 'home-fire',
  },
  {
    question: 'مستأجر هم می‌تواند بیمه آتش‌سوزی بخرد؟',
    answer: 'بله. مستأجر معمولاً فقط اثاثیه را بیمه می‌کند و ساختمان بر عهده مالک است.',
    topic: 'home-fire',
  },
  {
    question: 'بیمه‌نامه را چطور تحویل می‌گیرم؟',
    answer:
      'بلافاصله بعد از پرداخت، بیمه‌نامه در حساب کاربری شما صادر می‌شود و از بخش «بیمه‌نامه‌های من» قابل مشاهده و دریافت است.',
    topic: 'payment',
  },
  {
    question: 'قیمت‌ها با خرید مستقیم از شرکت بیمه فرق دارد؟',
    answer:
      'خیر. نرخ‌ها همان نرخ مصوب شرکت بیمه است و بابت استفاده از بیمه گلد هزینه‌ای اضافه نمی‌شود.',
    topic: 'payment',
  },
  {
    question: 'اگر پرداخت انجام شد ولی بیمه‌نامه صادر نشد چه می‌شود؟',
    answer:
      'مبلغ پرداختی محفوظ است و پیگیری صدور به‌صورت خودکار انجام می‌شود. در صورت انصراف، وجه تا ۷۲ ساعت به حساب شما بازمی‌گردد.',
    topic: 'payment',
  },
]

export const seedContent = async (payload: Payload): Promise<void> => {
  payload.logger.info('در حال ساخت داده اولیه…')

  // ── کاربر پیشخان ───────────────────────────────────────────────────────────
  // فقط در توسعه. رمز پیش‌فرض روی یک دامنه عمومی یعنی پیشخان باز است؛ روی محیط
  // عملیاتی اولین کاربر را خودِ Payload در `/admin` می‌سازد.
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@bimegold.com'
  const password = process.env.SEED_ADMIN_PASSWORD || 'bimegold'
  const mayCreateUser =
    process.env.NODE_ENV !== 'production' || Boolean(process.env.SEED_ADMIN_PASSWORD)
  const users = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  if (!users.docs.length && mayCreateUser) {
    await payload.create({
      collection: 'users',
      data: { email, password, name: 'مدیر' },
      overrideAccess: true,
      context: NO_REVALIDATE,
    })
    payload.logger.info(`کاربر پیشخان ساخته شد: ${email} / ${password}`)
  } else if (!users.docs.length) {
    payload.logger.warn('کاربر پیشخان ساخته نشد — اولین کاربر را در /admin بسازید.')
  }

  // ── شرکت‌های بیمه ──────────────────────────────────────────────────────────
  const insurerIDs: (number | string)[] = []
  const insurerIDBySlug = new Map<string, number | string>()
  for (const insurer of INSURERS) {
    const doc = await upsert(
      payload,
      'insurers',
      { slug: { equals: insurer.slug } },
      {
        ...insurer,
        /*
         * هیچ قراردادی هنوز امضا نشده. توجه: این مقدار روی سایت برچسب «در حال مذاکره»
         * می‌شود، یعنی یک ادعای واقعی درباره رابطه با آن شرکت. هر شرکتی که واقعاً با
         * او صحبتی در جریان نیست باید در پیشخان درست شود.
         */
        status: 'negotiating',
      },
    )
    insurerIDs.push(doc.id)
    insurerIDBySlug.set(insurer.slug, doc.id)
  }
  const insurerBySlug = (slug: string): number | string => {
    const id = insurerIDBySlug.get(slug)
    if (id === undefined) throw new Error(`شرکت بیمه پیدا نشد: ${slug}`)
    return id
  }

  // ── پرسش‌های پرتکرار ───────────────────────────────────────────────────────
  const faqIDs = new Map<string, number | string>()
  for (const faq of FAQS) {
    const doc = await upsert(payload, 'faqs', { question: { equals: faq.question } }, faq)
    faqIDs.set(faq.question, doc.id)
  }
  /** پرسش‌ها با متنشان انتخاب می‌شوند نه با جایشان در فهرست؛ `slice` با اضافه‌شدن یک پرسش می‌لغزد. */
  const faqsByQuestion = (...questions: string[]): (number | string)[] =>
    questions.map((question) => {
      const id = faqIDs.get(question)
      if (id === undefined) throw new Error(`پرسش پرتکرار پیدا نشد: ${question}`)
      return id
    })

  // ── دسته‌های مجله ──────────────────────────────────────────────────────────
  const categoryIDs = new Map<string, number | string>()
  for (const title of ['راهنمای خرید', 'شخص ثالث', 'سفر', 'منزل']) {
    const doc = await upsert(payload, 'categories', { title: { equals: title } }, { title })
    categoryIDs.set(title, doc.id)
  }
  const categoryByTitle = (title: string): number | string => {
    const id = categoryIDs.get(title)
    if (id === undefined) throw new Error(`دسته پیدا نشد: ${title}`)
    return id
  }

  // ── صفحه خانه ──────────────────────────────────────────────────────────────
  await upsert(
    payload,
    'pages',
    { slug: { equals: 'home' } },
    {
      title: 'خانه',
      slug: 'home',
      _status: 'published',
      layout: [
        {
          blockType: 'hero',
          variant: 'primary',
          eyebrow: 'بیمه‌فروش آنلاین',
          heading: 'بیمه‌نامه را آنلاین بخرید، با همان نرخ مصوب',
          subheading:
            'قیمت شرکت‌های بیمه را کنار هم ببینید، مقایسه کنید و همین‌جا بخرید. بیمه‌نامه بلافاصله بعد از پرداخت صادر می‌شود.',
          bullets: [
            { label: 'صدور فوری' },
            { label: 'همان نرخ مصوب' },
            { label: 'پول شما محفوظ است' },
          ],
        },
        /*
         * بلافاصله بعد از هیروی «اصلی» می‌آید، پس `RenderBlocks` این دو را یک نوار
         * دو ستونی می‌کند — همان چیدمان طرح.
         */
        {
          blockType: 'quoteForm',
          heading: 'استعلام قیمت',
          product: 'any',
          submitLabel: 'مقایسه قیمت‌ها',
          note: 'قیمت نهایی پیش از پرداخت نمایش داده می‌شود.',
        },
        {
          blockType: 'productGrid',
          heading: 'چه چیزی را بیمه کنیم؟',
          subheading: 'هر بیمه صفحه راهنمای خودش را دارد؛ پیش از خرید پوشش‌ها را بخوانید.',
          products: ['motor-tpl', 'travel', 'home-fire'],
          showPrice: true,
          comingSoon: [
            {
              title: 'بیمه مسئولیت حرفه‌ای',
              description: 'برای صاحبان حرفه؛ قیمت‌گیری از چند شرکت بیمه و پیشنهاد اختصاصی.',
              iconKey: 'briefcase',
            },
          ],
        },
        {
          blockType: 'steps',
          heading: 'خرید بیمه در سه قدم',
          steps: [
            {
              title: 'مشخصات را وارد کنید',
              description: 'نوع وسیله، مقصد سفر یا ارزش خانه؛ فقط همان چیزی که برای قیمت لازم است.',
            },
            {
              title: 'پیشنهادها را مقایسه کنید',
              description:
                'قیمت و پوشش شرکت‌های بیمه کنار هم نمایش داده می‌شود و ارزان‌ترین مشخص است.',
            },
            {
              title: 'پرداخت کنید، بیمه‌نامه را بگیرید',
              description: 'بیمه‌نامه بلافاصله در حساب کاربری شما صادر می‌شود و قابل دریافت است.',
            },
          ],
        },
        {
          // متن‌ها همان پاسخ‌های پشتیبانی اپ‌اند (`apps/web/src/routes/SupportPage.tsx`).
          blockType: 'features',
          heading: 'چرا از بیمه گلد بخرید',
          subheading: 'همان تعهدهایی که در پشتیبانی می‌دهیم، اینجا هم می‌دهیم.',
          columns: '3',
          features: [
            {
              title: 'صدور فوری',
              description:
                'بلافاصله بعد از پرداخت، بیمه‌نامه در حساب کاربری شما صادر می‌شود و از بخش «بیمه‌نامه‌های من» قابل دریافت است.',
              iconKey: 'clock',
            },
            {
              title: 'همان نرخ مصوب',
              description:
                'نرخ‌ها همان نرخ مصوب شرکت بیمه است و بابت استفاده از بیمه گلد هزینه‌ای اضافه نمی‌شود.',
              iconKey: 'tag',
            },
            {
              title: 'پول شما محفوظ است',
              description:
                'اگر پرداخت انجام شد ولی بیمه‌نامه صادر نشد، پیگیری خودکار است و در صورت انصراف وجه تا ۷۲ ساعت برمی‌گردد.',
              iconKey: 'lock',
            },
          ],
        },
        {
          blockType: 'insurerStrip',
          heading:
            'با شرکت‌های بیمه دارای مجوز در حال مذاکره‌ایم؛ لوگوی هر شرکت پس از امضای قرارداد جای نامش می‌نشیند.',
          // صریح داده می‌شود تا ترتیب همان ترتیب طرح باشد، نه ترتیب ساخته‌شدن رکوردها.
          insurers: insurerIDs,
        },
        {
          blockType: 'faq',
          heading: 'پرسش‌های پرتکرار',
          subheading: 'جوابتان اینجا نبود؟ کارشناس پشتیبانی پاسخ می‌دهد.',
          links: [
            {
              link: {
                type: 'custom',
                url: `${APP_URL}/support`,
                label: 'گفت‌وگو با پشتیبانی',
              },
            },
          ],
          faqs: faqsByQuestion(
            'بیمه‌نامه را چطور تحویل می‌گیرم؟',
            'قیمت‌ها با خرید مستقیم از شرکت بیمه فرق دارد؟',
            'اگر پرداخت انجام شد ولی بیمه‌نامه صادر نشد چه می‌شود؟',
            'آیا بیمه‌نامه مسافرتی مورد قبول سفارت است؟',
            'ارزش ساختمان را چطور تعیین کنم؟',
          ),
        },
        {
          // تا مقاله‌ای منتشر نشده این بخش چیزی نشان نمی‌دهد و خودش را برمی‌دارد.
          blockType: 'postsList',
          heading: 'پیش از خرید بخوانید',
          subheading: 'راهنماهای کوتاه از مجله بیمه گلد',
          mode: 'latest',
          limit: 3,
        },
        {
          blockType: 'ctaBand',
          heading: 'بیمه‌نامه بعدی‌تان را آنلاین بگیرید',
          body: 'چند دقیقه برای قیمت گرفتن، بدون مراجعه حضوری.',
          links: [
            {
              link: {
                type: 'custom',
                url: `${APP_URL}/support`,
                label: 'گفت‌وگو با پشتیبانی',
                appearance: 'outline',
              },
            },
            {
              link: {
                type: 'custom',
                url: `${APP_URL}/p/motor-tpl/form`,
                label: 'استعلام قیمت',
                appearance: 'default',
              },
            },
          ],
        },
      ],
    },
  )

  // ── صفحه محصول شخص ثالث ────────────────────────────────────────────────────
  /*
   * از روی بوم «صفحه محصول — شخص ثالث». سه تعهد زیر تیتر همان `highlightsFa`
   * محصول در `apps/api/prisma/seed-data/products.ts` است، فقط جمله‌شده.
   *
   * یک کلمه از بوم عوض شده: آنجا «تخفیف عدم خسارت شما **خودکار** اعمال می‌شود»
   * نوشته، ولی ویزارد سال‌های بدون خسارت را از خود کاربر می‌پرسد و چیزی خودکار
   * خوانده نمی‌شود. تا وقتی از سنهاب خوانده نشده، این یک ادعای نادرست است.
   */
  await upsert(
    payload,
    'pages',
    { slug: { equals: 'motor-tpl' } },
    {
      title: 'بیمه شخص ثالث',
      slug: 'motor-tpl',
      _status: 'published',
      layout: [
        {
          blockType: 'hero',
          variant: 'product',
          iconKey: 'car',
          eyebrow: 'الزامی برای همه وسایل نقلیه',
          heading: 'بیمه شخص ثالث خودرو و موتورسیکلت',
          subheading:
            'خسارت جانی و مالی که با وسیله نقلیه شما به دیگران وارد می‌شود را جبران می‌کند. داشتن این بیمه‌نامه طبق قانون برای همه وسایل نقلیه الزامی است.',
          bullets: [
            { label: 'تخفیف عدم خسارت شما در قیمت اعمال می‌شود' },
            { label: 'امکان پرداخت اقساطی' },
            { label: 'بیمه‌نامه در سامانه سنهاب ثبت می‌شود' },
          ],
        },
        /* بلافاصله بعد از هیروی «محصول» می‌آید، پس `RenderBlocks` این دو را یک نوار دو ستونی می‌کند. */
        {
          blockType: 'quoteForm',
          heading: 'قیمت بیمه شخص ثالث',
          subheading: 'مشخصات وسیله نقلیه را وارد کنید تا قیمت شرکت‌های بیمه را ببینید.',
          product: 'motor-tpl',
          submitLabel: 'مشاهده قیمت‌ها',
        },
        {
          /*
           * ردیف‌ها نام سه شرکت واقعی را دارند تا پنل شبیه چیزی باشد که کاربر بعد
           * از استعلام می‌بیند. مبلغ‌ها همچنان جای‌نگارند و هیچ عددی به هیچ شرکتی
           * نسبت داده نمی‌شود — چون نه قراردادی امضا شده و نه نرخی در دست است.
           *
           * ⚠️ نام شرکت کنار یک ردیف، یک ادعای ضمنی درباره آن شرکت است: دو ردیف
           * اول یعنی «این شرکت نرخ می‌دهد» و ردیف سوم یعنی «این یکی برای این مدل
           * نمی‌دهد». به همین دلیل متن زیر پنل صریح می‌گوید که این فقط نمونه نمایش
           * است. اگر قرار شد ادعایی هم نشود، شرکت‌ها را از همین سه ردیف بردارید:
           * خالی که باشد، همان `[نام شرکت بیمه]` بوم برمی‌گردد.
           */
          blockType: 'offerPreview',
          heading: 'قیمت شرکت‌های بیمه، کنار هم',
          body: 'بعد از وارد کردن مشخصات، پیشنهاد هر شرکت بیمه با قیمت نهایی و سقف تعهدش نمایش داده می‌شود. ارزان‌ترین برچسب می‌خورد؛ شرکتی که پیشنهاد نمی‌دهد با دلیلش روی صفحه می‌ماند.',
          offers: [
            {
              state: 'cheapest',
              insurer: insurerBySlug('taavon'),
              note: 'تعهد مالی [مبلغ] تومان',
            },
            { state: 'normal', insurer: insurerBySlug('iran'), note: 'تعهد مالی [مبلغ] تومان' },
            {
              state: 'unavailable',
              insurer: insurerBySlug('alborz'),
              note: 'برای این مدل پیشنهاد نمی‌دهد',
            },
          ],
          disclaimer:
            'نمونه نمایش — مبلغ‌ها و ترتیب واقعی نیستند و نرخ قطعی پس از استعلام در اپ اعلام می‌شود.',
        },
        {
          blockType: 'coverageList',
          heading: 'این بیمه چه چیزی را پوشش می‌دهد',
          intro: 'پیش از خرید بدانید بیمه‌نامه دقیقاً چه چیزی را جبران می‌کند.',
          items: [
            {
              title: 'خسارت بدنی به دیگران',
              description: 'دیه و هزینه درمان سرنشینان و عابرانی که در حادثه آسیب می‌بینند.',
              included: 'included',
            },
            {
              title: 'خسارت مالی به اموال دیگران',
              description: 'تا سقف تعهد مالی که هنگام خرید انتخاب می‌کنید.',
              included: 'included',
            },
            {
              title: 'خسارت بدنی راننده مقصر',
              description: 'راننده وسیله بیمه‌شده هم در حادثه‌ای که مقصر آن است پوشش دارد.',
              included: 'included',
            },
            {
              title: 'خسارت به خودروی خودتان',
              description: 'برای آن بیمه بدنه لازم است.',
              included: 'excluded',
            },
            {
              title: 'خسارت عمدی',
              description: 'آسیبی که بیمه‌گذار یا راننده عمداً وارد کند.',
              included: 'excluded',
            },
            {
              title: 'جریمه‌ها و محموله',
              description: 'جریمه‌های نقدی و خسارت به بار و محموله خود وسیله نقلیه.',
              included: 'excluded',
            },
          ],
        },
        {
          blockType: 'priceFactors',
          heading: 'قیمت چطور تعیین می‌شود',
          factors: [
            {
              title: 'نوع و کاربری وسیله',
              description: 'سواری، وانت یا موتورسیکلت؛ شخصی یا عمومی.',
            },
            {
              title: 'تخفیف عدم خسارت',
              description: 'هر سال بدون خسارت، قیمت را پایین‌تر می‌آورد.',
            },
            { title: 'سقف تعهد مالی', description: 'سقف بالاتر، پوشش بیشتر و قیمت بیشتر.' },
            {
              title: 'روزهای بدون بیمه',
              description: 'اگر بیمه‌نامه قبلی تمام شده باشد، جریمه دیرکرد اضافه می‌شود.',
            },
          ],
        },
        {
          blockType: 'faq',
          heading: 'پرسش‌های بیمه شخص ثالث',
          subheading: 'جوابتان اینجا نبود؟ کارشناس پشتیبانی پاسخ می‌دهد.',
          links: [
            {
              link: { type: 'custom', url: `${APP_URL}/support`, label: 'گفت‌وگو با پشتیبانی' },
            },
          ],
          faqs: faqsByQuestion(
            'تخفیف عدم خسارت من چقدر است؟',
            'تعهد مالی چیست؟',
            'بیمه‌نامه را چطور تحویل می‌گیرم؟',
            'اگر پرداخت انجام شد ولی بیمه‌نامه صادر نشد چه می‌شود؟',
          ),
        },
        {
          // تا مقاله‌ای در دسته «شخص ثالث» منتشر نشده، این بخش خودش را برمی‌دارد.
          blockType: 'postsList',
          heading: 'راهنمای شخص ثالث',
          mode: 'latest',
          categories: [categoryByTitle('شخص ثالث')],
          limit: 3,
        },
        {
          blockType: 'ctaBand',
          heading: 'بیمه‌نامه قبلی‌تان کی تمام می‌شود؟',
          body: 'پیش از سررسید تمدید کنید تا جریمه دیرکرد نخورد.',
          links: [
            {
              link: {
                type: 'custom',
                url: `${APP_URL}/p/motor-tpl/form`,
                label: 'استعلام قیمت شخص ثالث',
                appearance: 'default',
              },
            },
          ],
        },
      ],
    },
  )

  // ── هدر و فوتر ─────────────────────────────────────────────────────────────
  /*
   * طرح، پنج آیتم منو و چهار ستون فوتر دارد. اینجا فقط چیزی می‌آید که مقصدش
   * واقعاً وجود دارد: صفحه محصول مسافرتی و آتش‌سوزی، «درباره ما»، «تماس با ما» و
   * صفحه‌های حقوقی هنوز ساخته نشده‌اند و لینک مرده در منوی اصلی از منوی کوتاه بدتر
   * است. بیمه‌های بدون صفحه محصول مستقیم به ویزارد خودشان در اپ می‌روند — مقصدی
   * که هست و همان کار را می‌کند.
   */
  await payload.updateGlobal({
    slug: 'header',
    overrideAccess: true,
    context: NO_REVALIDATE,
    data: {
      navItems: [
        { link: { type: 'custom', url: '/motor-tpl', label: 'بیمه شخص ثالث' } },
        { link: { type: 'custom', url: `${APP_URL}/p/travel/form`, label: 'بیمه مسافرتی' } },
        {
          link: { type: 'custom', url: `${APP_URL}/p/home-fire/form`, label: 'بیمه آتش‌سوزی منزل' },
        },
        { link: { type: 'custom', url: '/posts', label: 'مجله' } },
        { link: { type: 'custom', url: `${APP_URL}/support`, label: 'پشتیبانی' } },
      ],
      login: [{ link: { type: 'custom', url: `${APP_URL}/auth`, label: 'ورود' } }],
      cta: [{ link: { type: 'custom', url: `${APP_URL}/policies`, label: 'بیمه‌نامه‌های من' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    overrideAccess: true,
    context: NO_REVALIDATE,
    data: {
      tagline: 'بیمه‌فروش آنلاین. قیمت بگیرید، مقایسه کنید، همین‌جا بخرید.',
      columns: [
        {
          title: 'بیمه‌ها',
          navItems: [
            { link: { type: 'custom', url: '/motor-tpl', label: 'بیمه شخص ثالث' } },
            { link: { type: 'custom', url: `${APP_URL}/p/travel/form`, label: 'بیمه مسافرتی' } },
            {
              link: {
                type: 'custom',
                url: `${APP_URL}/p/home-fire/form`,
                label: 'بیمه آتش‌سوزی منزل',
              },
            },
          ],
        },
        {
          title: 'راهنما',
          navItems: [
            { link: { type: 'custom', url: '/posts', label: 'مجله' } },
            { link: { type: 'custom', url: `${APP_URL}/support`, label: 'پرسش‌های پرتکرار' } },
            { link: { type: 'custom', url: `${APP_URL}/policies`, label: 'پیگیری بیمه‌نامه' } },
          ],
        },
      ],
      // شماره تماس، ایمیل و شماره پروانه عمداً خالی‌اند — هنوز نداریمشان و فوتر
      // به‌جایشان جای‌نگار نشان می‌دهد، نه نشانی ساختگی.
      legal: 'بیمه گلد کارگزار رسمی بیمه است. متن حقوقی نهایی پس از صدور پروانه اینجا می‌آید.',
    },
  })

  payload.logger.info('داده اولیه ساخته شد.')
}
