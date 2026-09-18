import type { Block } from 'payload'

export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  labels: { singular: 'ویژگی‌ها', plural: 'بخش‌های ویژگی' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    {
      name: 'columns',
      type: 'select',
      label: 'تعداد ستون',
      defaultValue: '3',
      options: [
        { label: 'دو ستون', value: '2' },
        { label: 'سه ستون', value: '3' },
        { label: 'چهار ستون', value: '4' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      label: 'ویژگی‌ها',
      minRows: 2,
      labels: { singular: 'ویژگی', plural: 'ویژگی‌ها' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
        { name: 'icon', type: 'upload', label: 'آیکن', relationTo: 'media' },
      ],
    },
  ],
}
