import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'

/**
 * پرسش‌های پرتکرار. یک مخزن مشترک است: بلوک `faq` روی هر صفحه‌ای چند مورد از این‌ها
 * را انتخاب می‌کند، تا یک پاسخ در چند صفحه تکرار و واگرا نشود.
 */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'پرسش پرتکرار', plural: 'پرسش‌های پرتکرار' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'topic', 'updatedAt'],
    group: 'محتوا',
  },
  fields: [
    { name: 'question', type: 'text', label: 'پرسش', required: true },
    { name: 'answer', type: 'textarea', label: 'پاسخ', required: true },
    {
      name: 'topic',
      type: 'select',
      label: 'موضوع',
      options: [
        { label: 'عمومی', value: 'general' },
        { label: 'شخص ثالث', value: 'motor-tpl' },
        { label: 'مسافرتی', value: 'travel' },
        { label: 'آتش‌سوزی منزل', value: 'home-fire' },
        { label: 'پرداخت و بیمه‌نامه', value: 'payment' },
      ],
      defaultValue: 'general',
      required: true,
    },
  ],
}
