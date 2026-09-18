/**
 * داده اولیه سایت.
 *
 * از دو جا صدا زده می‌شود: `pnpm --filter @bimegold/site seed` روی لپ‌تاپ
 * (`src/seed/cli.ts`)، و مسیر موقت `POST /next/seed` روی محیط عملیاتی، جایی که
 * دیتابیس فقط از داخل شبکه Railway در دسترس است.
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

const INSURERS = [
  { name: 'بیمه پاسارگاد', slug: 'pasargad' },
  { name: 'بیمه سامان', slug: 'saman' },
  { name: 'بیمه کارآفرین', slug: 'karafarin' },
  { name: 'بیمه دی', slug: 'dey' },
  { name: 'بیمه البرز', slug: 'alborz' },
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
      'بیمه‌نامه پس از پرداخت به‌صورت الکترونیکی صادر می‌شود و در همان لحظه در حساب کاربری‌تان قابل دانلود است.',
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
  for (const insurer of INSURERS) {
    await upsert(
      payload,
      'insurers',
      { slug: { equals: insurer.slug } },
      {
        ...insurer,
        // تا قرارداد امضا نشده، لوگو روی سایت ادعای همکاری است.
        status: 'negotiating',
      },
    )
  }

  // ── پرسش‌های پرتکرار ───────────────────────────────────────────────────────
  const faqIDs: (number | string)[] = []
  for (const faq of FAQS) {
    const doc = await upsert(payload, 'faqs', { question: { equals: faq.question } }, faq)
    faqIDs.push(doc.id)
  }

  // ── دسته‌های مجله ──────────────────────────────────────────────────────────
  for (const title of ['راهنمای خرید', 'شخص ثالث', 'سفر', 'منزل']) {
    await upsert(payload, 'categories', { title: { equals: title } }, { title })
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
          eyebrow: 'صدور آنی و آنلاین',
          heading: 'بیمه‌نامه‌ات را آنلاین بگیر',
          subheading:
            'نرخ چند شرکت را کنار هم ببین، آنلاین پرداخت کن و بیمه‌نامه را همان لحظه تحویل بگیر.',
          links: [
            {
              link: {
                type: 'custom',
                url: 'https://app.bimegold.com',
                label: 'استعلام قیمت',
                appearance: 'default',
              },
            },
          ],
        },
        {
          blockType: 'productGrid',
          heading: 'چه بیمه‌ای می‌خواهید؟',
          subheading: 'سه محصول اول ما. بقیه در راه‌اند.',
          showPrice: true,
        },
        {
          blockType: 'steps',
          heading: 'سه قدم تا بیمه‌نامه',
          steps: [
            { title: 'مشخصات را وارد کنید', description: 'فرم کوتاه است و چیزی جز لازم نمی‌پرسد.' },
            {
              title: 'نرخ‌ها را مقایسه کنید',
              description: 'نرخ شرکت‌های مختلف را کنار هم ببینید.',
            },
            { title: 'پرداخت و صدور', description: 'بیمه‌نامه بلافاصله پس از پرداخت صادر می‌شود.' },
          ],
        },
        {
          blockType: 'faq',
          heading: 'پرسش‌های پرتکرار',
          faqs: faqIDs.slice(0, 4),
        },
        {
          blockType: 'ctaBand',
          heading: 'همین حالا نرخ بگیرید',
          body: 'رایگان است و شما را متعهد نمی‌کند.',
          links: [
            {
              link: {
                type: 'custom',
                url: 'https://app.bimegold.com',
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
          heading: 'بیمه شخص ثالث',
          subheading:
            'خسارت جانی و مالی که با وسیله نقلیه شما به دیگران وارد می‌شود را جبران می‌کند. داشتن این بیمه‌نامه طبق قانون برای همه وسایل نقلیه الزامی است.',
        },
        {
          blockType: 'quoteForm',
          heading: 'نرخ شخص ثالث خودروی خود را بگیرید',
          product: 'motor-tpl',
          submitLabel: 'استعلام قیمت',
          note: 'رایگان است و شما را متعهد نمی‌کند.',
        },
        {
          blockType: 'coverageList',
          heading: 'چه چیزی پوشش دارد',
          items: [
            {
              title: 'خسارت جانی به اشخاص ثالث',
              description: 'هزینه درمان و دیه افرادی که در حادثه آسیب می‌بینند.',
              included: 'included',
            },
            {
              title: 'خسارت مالی به اشخاص ثالث',
              description: 'آسیب به خودرو و اموال دیگران، تا سقف تعهد مالی بیمه‌نامه.',
              included: 'included',
            },
            {
              title: 'حوادث راننده',
              description: 'پوشش خود راننده مقصر، که جدا از تعهد ثالث است.',
              included: 'included',
            },
            {
              title: 'خسارت به خودروی خودتان',
              description: 'این پوشش کار بیمه بدنه است، نه شخص ثالث.',
              included: 'excluded',
            },
          ],
        },
        {
          blockType: 'priceFactors',
          heading: 'قیمت به چه چیزهایی بستگی دارد',
          intro: 'قبل از استعلام بدانید چه چیزی نرخ را جابه‌جا می‌کند.',
          factors: [
            {
              title: 'تخفیف عدم خسارت',
              description: 'سال‌هایی که بدون خسارت بیمه‌نامه داشته‌اید.',
            },
            {
              title: 'نوع و مدل وسیله نقلیه',
              description: 'خودرو، موتورسیکلت و مدل آن نرخ را عوض می‌کند.',
            },
            { title: 'سقف تعهد مالی', description: 'هرچه سقف بالاتر، حق بیمه بیشتر.' },
            { title: 'مدت بیمه‌نامه', description: 'یک‌ساله یا کوتاه‌مدت.' },
          ],
        },
        {
          blockType: 'faq',
          heading: 'پرسش‌های پرتکرار شخص ثالث',
          faqs: faqIDs.slice(2, 4),
        },
      ],
    },
  )

  // ── هدر و فوتر ─────────────────────────────────────────────────────────────
  await payload.updateGlobal({
    slug: 'header',
    overrideAccess: true,
    context: NO_REVALIDATE,
    data: {
      navItems: [
        { link: { type: 'custom', url: '/motor-tpl', label: 'شخص ثالث' } },
        { link: { type: 'custom', url: '/posts', label: 'مجله' } },
      ],
      cta: [{ link: { type: 'custom', url: 'https://app.bimegold.com', label: 'استعلام قیمت' } }],
    },
  })

  await payload.updateGlobal({
    slug: 'footer',
    overrideAccess: true,
    context: NO_REVALIDATE,
    data: {
      navItems: [
        { link: { type: 'custom', url: '/motor-tpl', label: 'شخص ثالث' } },
        { link: { type: 'custom', url: '/posts', label: 'مجله' } },
      ],
      // شماره پروانه عمداً خالی است — هنوز صادر نشده.
      legal: 'بیمه گلد کارگزار رسمی بیمه است. متن حقوقی نهایی پس از صدور پروانه اینجا می‌آید.',
    },
  })

  payload.logger.info('داده اولیه ساخته شد.')
}
