import type { Fulfillment, ProductType } from '@prisma/client'

export interface ProductSeed {
  slug: string
  type: ProductType
  titleFa: string
  subtitleFa: string
  descriptionFa: string
  highlightsFa: string[]
  faq: { q: string; a: string }[]
  iconKey: string
  fulfillment: Fulfillment
  sortWeight: number
  /** Which insurers sell it, by slug. */
  insurerSlugs: string[]
}

export const PRODUCTS: ProductSeed[] = [
  {
    slug: 'travel',
    type: 'TRAVEL',
    titleFa: 'بیمه مسافرتی',
    subtitleFa: 'برای سفرهای خارجی و اخذ ویزا',
    descriptionFa:
      'هزینه‌های درمانی، بستری و بازگرداندن بیمار در طول سفر خارجی را پوشش می‌دهد. اغلب سفارت‌ها ارائه این بیمه‌نامه را برای صدور ویزا الزامی می‌دانند.',
    highlightsFa: ['صدور آنی و آنلاین', 'مورد تأیید سفارت‌ها', 'پوشش ۲۴ ساعته در سراسر دنیا'],
    faq: [
      {
        q: 'آیا این بیمه‌نامه مورد قبول سفارت است؟',
        a: 'بله. بیمه‌نامه به‌صورت دوزبانه صادر می‌شود و برای اخذ ویزای شنگن و سایر مقاصد قابل ارائه است.',
      },
      {
        q: 'اگر سفرم لغو شود چه می‌شود؟',
        a: 'تا پیش از تاریخ شروع بیمه‌نامه، امکان ابطال و بازگشت وجه با کسر کارمزد وجود دارد.',
      },
      {
        q: 'سن بالای ۷۰ سال هم پوشش دارد؟',
        a: 'بله، اما نرخ برای گروه‌های سنی بالاتر متفاوت است و در استعلام نمایش داده می‌شود.',
      },
    ],
    iconKey: 'plane',
    fulfillment: 'INSTANT',
    sortWeight: 1,
    insurerSlugs: ['pasargad', 'saman', 'karafarin', 'dey', 'alborz'],
  },
  {
    slug: 'motor-tpl',
    type: 'MOTOR_TPL',
    titleFa: 'بیمه شخص ثالث',
    subtitleFa: 'الزامی برای همه خودروها و موتورسیکلت‌ها',
    descriptionFa:
      'خسارت جانی و مالی که با وسیله نقلیه شما به دیگران وارد می‌شود را جبران می‌کند. داشتن این بیمه‌نامه طبق قانون برای همه وسایل نقلیه الزامی است.',
    highlightsFa: ['اعمال تخفیف عدم خسارت', 'پرداخت اقساطی', 'ثبت در سامانه سنهاب'],
    faq: [
      {
        q: 'تخفیف عدم خسارت من چقدر است؟',
        a: 'میزان تخفیف بر اساس سال‌های بدون خسارت شما محاسبه می‌شود و در فرم استعلام وارد می‌کنید.',
      },
      {
        q: 'تعهد مالی چیست؟',
        a: 'سقف خسارتی که بابت آسیب به اموال دیگران پرداخت می‌شود و درصدی از تعهد جانی است.',
      },
    ],
    iconKey: 'car',
    fulfillment: 'INSTANT',
    sortWeight: 2,
    insurerSlugs: ['pasargad', 'saman', 'karafarin', 'dey', 'alborz'],
  },
  {
    slug: 'home-fire',
    type: 'HOME_FIRE',
    titleFa: 'بیمه آتش‌سوزی منزل',
    subtitleFa: 'ساختمان و اثاثیه، در برابر آتش و زلزله',
    descriptionFa:
      'خسارت ناشی از آتش‌سوزی، صاعقه و انفجار را جبران می‌کند و می‌توانید پوشش زلزله، سیل، سرقت و ترکیدگی لوله را هم اضافه کنید.',
    highlightsFa: ['پوشش زلزله اختیاری', 'بدون نیاز به بازدید', 'صدور یک‌ساله'],
    faq: [
      {
        q: 'ارزش ساختمان را چطور تعیین کنم؟',
        a: 'ارزش بازسازی بنا را وارد کنید، نه قیمت خرید ملک؛ چون در زمان خسارت هزینه ساخت مبنا است.',
      },
      {
        q: 'مستأجر هم می‌تواند بیمه کند؟',
        a: 'بله. مستأجر معمولاً فقط اثاثیه را بیمه می‌کند و ساختمان بر عهده مالک است.',
      },
    ],
    iconKey: 'fire',
    fulfillment: 'INSTANT',
    sortWeight: 3,
    insurerSlugs: ['pasargad', 'saman', 'dey'],
  },
]
