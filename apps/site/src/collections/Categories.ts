import type { CollectionConfig } from 'payload'

import { anyone } from '../access/anyone'
import { authenticated } from '../access/authenticated'
import { slugFieldFa } from '@/fields/slugFa'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'دسته', plural: 'دسته‌ها' },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    group: 'مجله',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان',
      required: true,
    },
    slugFieldFa({ position: undefined }),
  ],
}
