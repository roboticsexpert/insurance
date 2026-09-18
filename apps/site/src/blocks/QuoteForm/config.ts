import type { Block } from 'payload'

/**
 * فرم استعلام. تصمیم `docs/website/LANDING-PAGES.md`: سایت نرخ نمی‌دهد و نمی‌فروشد —
 * این فرم فقط آنچه کاربر وارد کرده را به ویزارد `app.bimegold.com` می‌برد.
 * خودِ فیلدها در کد هستند نه در CMS، چون باید دقیقاً با ویزارد اپ جور دربیایند.
 */
export const QuoteForm: Block = {
  slug: 'quoteForm',
  interfaceName: 'QuoteFormBlock',
  labels: { singular: 'فرم استعلام', plural: 'فرم‌های استعلام' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر' },
    {
      name: 'product',
      type: 'select',
      label: 'محصول',
      required: true,
      defaultValue: 'motor-tpl',
      options: [
        { label: 'شخص ثالث', value: 'motor-tpl' },
        { label: 'مسافرتی', value: 'travel' },
        { label: 'آتش‌سوزی منزل', value: 'home-fire' },
        { label: 'انتخاب کاربر — همه محصول‌ها', value: 'any' },
      ],
    },
    {
      name: 'submitLabel',
      type: 'text',
      label: 'برچسب دکمه',
      defaultValue: 'استعلام قیمت',
    },
    {
      name: 'note',
      type: 'text',
      label: 'یادداشت زیر فرم',
      admin: { description: 'مثلاً «رایگان است و شما را متعهد نمی‌کند».' },
    },
  ],
}
