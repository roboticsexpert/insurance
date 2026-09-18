import type { Block } from 'payload'

export const PostsList: Block = {
  slug: 'postsList',
  interfaceName: 'PostsListBlock',
  labels: { singular: 'فهرست مقاله', plural: 'فهرست‌های مقاله' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    {
      name: 'mode',
      type: 'select',
      label: 'انتخاب مقاله‌ها',
      defaultValue: 'latest',
      required: true,
      options: [
        { label: 'تازه‌ترین‌ها', value: 'latest' },
        { label: 'دستی', value: 'manual' },
      ],
    },
    {
      name: 'categories',
      type: 'relationship',
      label: 'محدود به دسته‌ها',
      relationTo: 'categories',
      hasMany: true,
      admin: { condition: (_, s) => s?.mode === 'latest' },
    },
    {
      name: 'limit',
      type: 'number',
      label: 'تعداد',
      defaultValue: 3,
      min: 1,
      max: 12,
      admin: { condition: (_, s) => s?.mode === 'latest' },
    },
    {
      name: 'posts',
      type: 'relationship',
      label: 'مقاله‌ها',
      relationTo: 'posts',
      hasMany: true,
      admin: { condition: (_, s) => s?.mode === 'manual' },
    },
  ],
}
