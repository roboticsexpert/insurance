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
    /*
     * طرح دو عمل در هدر دارد: «ورود» با قاب و «بیمه‌نامه‌های من» پررنگ. هر دو به اپ
     * می‌روند؛ خرید و حساب کاربری روی این دامنه نیستند.
     */
    linkGroup({
      appearances: false,
      overrides: {
        name: 'login',
        label: 'دکمه ورود',
        maxRows: 1,
        admin: { description: 'دکمه قاب‌دار سمت چپ. خالی بگذارید تا نمایش داده نشود.' },
      },
    }),
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
