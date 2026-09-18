import type { Block } from 'payload'

/** «قیمت به چه چیزهایی بستگی دارد» — قبل از فرستادن کاربر به ویزارد، انتظارش را می‌سازد. */
export const PriceFactors: Block = {
  slug: 'priceFactors',
  interfaceName: 'PriceFactorsBlock',
  labels: { singular: 'عوامل قیمت', plural: 'بخش‌های عوامل قیمت' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    { name: 'intro', type: 'textarea', label: 'مقدمه' },
    {
      name: 'factors',
      type: 'array',
      label: 'عوامل',
      minRows: 2,
      labels: { singular: 'عامل', plural: 'عوامل' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
      ],
    },
  ],
}
