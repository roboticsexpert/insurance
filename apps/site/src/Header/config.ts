import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { linkGroup } from '@/fields/linkGroup'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  label: 'هدر',
  access: {
    read: () => true,
  },
  admin: { group: 'ظاهر سایت' },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'منو',
      labels: { singular: 'آیتم منو', plural: 'آیتم‌های منو' },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 6,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
    },
    // دکمه اصلی هدر همیشه به اپ می‌رود؛ خرید روی این دامنه انجام نمی‌شود.
    linkGroup({
      appearances: false,
      overrides: {
        name: 'cta',
        label: 'دکمه دعوت',
        maxRows: 1,
      },
    }),
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
