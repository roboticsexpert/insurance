import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: { singular: 'کاربر پیشخان', plural: 'کاربران پیشخان' },
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['name', 'email'],
    useAsTitle: 'name',
    group: 'تنظیمات',
  },
  auth: true,
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'نام',
    },
  ],
  timestamps: true,
}
