import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateFooter } from './hooks/revalidateFooter'

export const Footer: GlobalConfig = {
  slug: 'footer',
  label: 'فوتر',
  access: {
    read: () => true,
  },
  admin: { group: 'ظاهر سایت' },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'لینک‌ها',
      labels: { singular: 'لینک', plural: 'لینک‌ها' },
      fields: [
        link({
          appearances: false,
        }),
      ],
      maxRows: 12,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
    },
    {
      name: 'legal',
      type: 'textarea',
      label: 'متن حقوقی',
      admin: {
        description:
          'شماره پروانه بیمه مرکزی و نماد اعتماد. تا وقتی پروانه صادر نشده، ادعایی اینجا ننویسید.',
      },
    },
    {
      name: 'licenseNumber',
      type: 'text',
      label: 'شماره پروانه بیمه مرکزی',
      admin: { description: 'خالی بماند تا پروانه واقعاً صادر شود.' },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
}
