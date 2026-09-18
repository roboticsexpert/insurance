import type { Block } from 'payload'

/**
 * پیش‌نمایش مقایسه نرخ، از روی بوم «صفحه محصول — شخص ثالث»: یک ستون توضیح و کنارش
 * یک پنل نمونه که نشان می‌دهد بعد از استعلام چه می‌بیند.
 *
 * **همیشه** برچسب «نرخ نمونه» دارد و ردیف‌ها را از CMS می‌گیرد، چون قرارداد و نرخ
 * زنده‌ای در کار نیست. این تصمیم صداقتِ `LANDING-PAGES.md` است؛ برچسب را برندارید.
 *
 * شرکت و مبلغ هر ردیف اختیاری‌اند: تا امضای قرارداد، طرح هم همان `[نام شرکت بیمه]`
 * و `[مبلغ]` را نشان می‌دهد و خالی‌گذاشتنشان همان جای‌نگار را می‌سازد — یعنی راه
 * پیش‌فرض، راهِ چیزی ادعا نکردن است.
 */
export const OfferPreview: Block = {
  slug: 'offerPreview',
  interfaceName: 'OfferPreviewBlock',
  labels: { singular: 'پیش‌نمایش مقایسه', plural: 'پیش‌نمایش‌های مقایسه' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    { name: 'body', type: 'textarea', label: 'متن کنار پنل' },
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
          admin: { description: 'خالی بگذارید تا جای‌نگار «[نام شرکت بیمه]» بنشیند.' },
        },
        {
          name: 'state',
          type: 'select',
          label: 'حالت ردیف',
          defaultValue: 'normal',
          required: true,
          options: [
            { label: 'عادی', value: 'normal' },
            { label: 'ارزان‌ترین — برجسته', value: 'cheapest' },
            { label: 'بدون پیشنهاد', value: 'unavailable' },
          ],
        },
        {
          name: 'amount',
          type: 'number',
          label: 'مبلغ (ریال)',
          admin: {
            condition: (_, siblingData) => siblingData?.state !== 'unavailable',
            description: 'به ریال وارد کنید؛ سایت خودش به تومان نشان می‌دهد. خالی = «[مبلغ]».',
          },
        },
        {
          name: 'note',
          type: 'text',
          label: 'خط زیر نام',
          admin: {
            description:
              'مثلاً «تعهد مالی … تومان»، و در ردیف بدون پیشنهاد دلیلش: «برای این مدل پیشنهاد نمی‌دهد».',
          },
        },
      ],
    },
    {
      name: 'disclaimer',
      type: 'text',
      label: 'متن زیر پنل',
      defaultValue: 'نرخ نمونه — نرخ قطعی پس از استعلام در اپ اعلام می‌شود.',
      required: true,
    },
  ],
}
