import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugFieldFa } from '@/fields/slugFa'

/** نویسنده‌های مجله. جدا از `users` است چون نویسنده لزوماً حساب پیشخان ندارد. */
export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'نویسنده', plural: 'نویسندگان' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'updatedAt'],
    group: 'مجله',
  },
  fields: [
    { name: 'name', type: 'text', label: 'نام', required: true },
    { name: 'role', type: 'text', label: 'سمت' },
    { name: 'bio', type: 'textarea', label: 'معرفی کوتاه' },
    { name: 'avatar', type: 'upload', label: 'تصویر', relationTo: 'media' },
    slugFieldFa({ useAsSlug: 'name', position: undefined }),
  ],
}
