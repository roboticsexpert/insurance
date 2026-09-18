import type { Block } from 'payload'

/**
 * «این بیمه چه چیزی را پوشش می‌دهد» — دو کارت کنار هم در بوم صفحه محصول. تیتر هر
 * کارت در کد است نه در پیشخان: «پوشش می‌دهد» و «پوشش نمی‌دهد» ساختار این بلوک‌اند،
 * و وضعیت هر مورد است که تعیین می‌کند کجا بنشیند.
 */
export const CoverageList: Block = {
  slug: 'coverageList',
  interfaceName: 'CoverageListBlock',
  labels: { singular: 'فهرست پوشش‌ها', plural: 'فهرست‌های پوشش' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    { name: 'intro', type: 'textarea', label: 'مقدمه' },
    {
      name: 'items',
      type: 'array',
      label: 'موارد',
      minRows: 1,
      labels: { singular: 'مورد', plural: 'موارد' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
        {
          name: 'included',
          type: 'select',
          label: 'وضعیت',
          defaultValue: 'included',
          required: true,
          options: [
            { label: 'پوشش دارد', value: 'included' },
            { label: 'اختیاری — با هزینه اضافه', value: 'optional' },
            { label: 'پوشش ندارد', value: 'excluded' },
          ],
          admin: {
            description:
              '«پوشش دارد» و «اختیاری» در کارت راست می‌نشینند، «پوشش ندارد» در کارت چپ.',
          },
        },
      ],
    },
  ],
}
