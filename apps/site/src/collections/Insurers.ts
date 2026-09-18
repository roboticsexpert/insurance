import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugFieldFa } from '@/fields/slugFa'

/**
 * شرکت‌های بیمه‌ای که با آن‌ها کار می‌کنیم. تا وقتی قرارداد امضا نشده، `status` روی
 * «در حال مذاکره» بماند و لوگو روی سایت نرود — نوار شرکت‌ها فقط `active`ها را نشان می‌دهد.
 */
export const Insurers: CollectionConfig = {
  slug: 'insurers',
  labels: { singular: 'شرکت بیمه', plural: 'شرکت‌های بیمه' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'updatedAt'],
    group: 'محتوا',
  },
  fields: [
    { name: 'name', type: 'text', label: 'نام شرکت', required: true },
    { name: 'logo', type: 'upload', label: 'لوگو', relationTo: 'media' },
    {
      name: 'status',
      type: 'select',
      label: 'وضعیت همکاری',
      options: [
        { label: 'فعال — قرارداد امضا شده', value: 'active' },
        { label: 'در حال مذاکره', value: 'negotiating' },
      ],
      defaultValue: 'negotiating',
      required: true,
      admin: {
        description: 'فقط شرکت‌های «فعال» روی سایت دیده می‌شوند.',
      },
    },
    {
      name: 'rating',
      type: 'text',
      label: 'رتبه توانگری مالی',
      admin: { description: 'رتبه اعلامی بیمه مرکزی، مثلاً «۱». خالی بگذارید اگر تأیید نشده.' },
    },
    slugFieldFa({ useAsSlug: 'name', position: undefined }),
  ],
}
