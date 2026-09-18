import type { Block } from 'payload'

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
