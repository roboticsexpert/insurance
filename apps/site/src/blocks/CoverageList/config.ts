import type { Block } from 'payload'

export const CoverageList: Block = {
  slug: 'coverageList',
  interfaceName: 'CoverageListBlock',
  labels: { singular: 'فهرست پوشش‌ها', plural: 'فهرست‌های پوشش' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
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
        },
      ],
    },
  ],
}
