import type { Block } from 'payload'

export const Steps: Block = {
  slug: 'steps',
  interfaceName: 'StepsBlock',
  labels: { singular: 'قدم‌ها', plural: 'بخش‌های قدم‌ها' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    {
      name: 'steps',
      type: 'array',
      label: 'قدم‌ها',
      minRows: 2,
      maxRows: 5,
      labels: { singular: 'قدم', plural: 'قدم‌ها' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
      ],
    },
  ],
}
