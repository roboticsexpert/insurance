import type { Block } from 'payload'

import { linkGroup } from '../../fields/linkGroup'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'هیرو', plural: 'هیروها' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'خط بالای تیتر',
      admin: { description: 'اختیاری. یک عبارت کوتاه، مثلاً «صدور آنی».' },
    },
    { name: 'heading', type: 'text', label: 'تیتر', required: true },
    { name: 'subheading', type: 'textarea', label: 'زیرتیتر' },
    {
      name: 'variant',
      type: 'select',
      label: 'وزن',
      defaultValue: 'primary',
      options: [
        { label: 'اصلی — صفحه خانه', value: 'primary' },
        { label: 'محصول — بالای صفحه محصول', value: 'product' },
        { label: 'ساده — صفحه‌های داخلی', value: 'simple' },
      ],
      required: true,
    },
    { name: 'media', type: 'upload', label: 'تصویر', relationTo: 'media' },
    linkGroup({ appearances: ['default', 'outline'], overrides: { maxRows: 2 } }),
  ],
}
