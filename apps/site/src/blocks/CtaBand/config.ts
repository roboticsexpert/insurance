import type { Block } from 'payload'

import { linkGroup } from '../../fields/linkGroup'

/** نوار دعوت. تنها جایی که رنگ `navy` تمام‌عرض می‌شود. */
export const CtaBand: Block = {
  slug: 'ctaBand',
  interfaceName: 'CtaBandBlock',
  labels: { singular: 'نوار دعوت', plural: 'نوارهای دعوت' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر', required: true },
    { name: 'body', type: 'textarea', label: 'متن' },
    linkGroup({ appearances: ['default', 'outline'], overrides: { maxRows: 2 } }),
  ],
}
