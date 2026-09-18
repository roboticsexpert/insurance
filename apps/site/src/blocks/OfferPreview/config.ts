import type { Block } from 'payload'

/**
 * پیش‌نمایش مقایسه نرخ. **همیشه** برچسب «نرخ نمونه» دارد و نرخ‌ها را از CMS می‌گیرد،
 * چون قرارداد و نرخ زنده‌ای در کار نیست. این تصمیم صداقتِ `LANDING-PAGES.md` است؛
 * برچسب را برندارید.
 */
export const OfferPreview: Block = {
  slug: 'offerPreview',
  interfaceName: 'OfferPreviewBlock',
  labels: { singular: 'پیش‌نمایش مقایسه', plural: 'پیش‌نمایش‌های مقایسه' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    {
      name: 'offers',
      type: 'array',
      label: 'ردیف‌ها',
      minRows: 2,
      maxRows: 6,
      labels: { singular: 'ردیف', plural: 'ردیف‌ها' },
      admin: { initCollapsed: true },
      fields: [
        {
          name: 'insurer',
          type: 'relationship',
          label: 'شرکت',
          relationTo: 'insurers',
          required: true,
        },
        {
          name: 'amount',
          type: 'number',
          label: 'مبلغ (ریال)',
          required: true,
          admin: { description: 'به ریال وارد کنید؛ سایت خودش به تومان نشان می‌دهد.' },
        },
        { name: 'note', type: 'text', label: 'یادداشت ردیف' },
      ],
    },
    {
      name: 'disclaimer',
      type: 'text',
      label: 'متن برچسب',
      defaultValue: 'نرخ نمونه — نرخ قطعی پس از استعلام در اپ اعلام می‌شود.',
      required: true,
    },
  ],
}
