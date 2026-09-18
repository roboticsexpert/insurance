import type { Block } from 'payload'

import { linkGroup } from '../../fields/linkGroup'

/**
 * پرسش‌های پرتکرار از مجموعه `faqs` می‌آیند نه از داخل بلوک، تا یک پاسخ در چند صفحه
 * تکرار و واگرا نشود.
 */
export const Faq: Block = {
  slug: 'faq',
  interfaceName: 'FaqBlock',
  labels: { singular: 'پرسش‌های پرتکرار', plural: 'بخش‌های پرسش پرتکرار' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش', defaultValue: 'پرسش‌های پرتکرار' },
    {
      name: 'subheading',
      type: 'textarea',
      label: 'زیرتیتر بخش',
      admin: { description: 'مثلاً «جوابتان اینجا نبود؟ کارشناس پشتیبانی پاسخ می‌دهد.»' },
    },
    linkGroup({
      appearances: false,
      overrides: {
        name: 'links',
        label: 'دکمه کنار تیتر',
        maxRows: 1,
        admin: { description: 'مثلاً «گفت‌وگو با پشتیبانی». خالی بگذارید تا نمایش داده نشود.' },
      },
    }),
    {
      name: 'faqs',
      type: 'relationship',
      label: 'پرسش‌ها',
      relationTo: 'faqs',
      hasMany: true,
      required: true,
      admin: { description: 'ترتیب همین فهرست، ترتیب نمایش است.' },
    },
  ],
}
