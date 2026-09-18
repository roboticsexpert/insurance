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
    /*
     * فهرست صاف قدیمی. فوتر دیگر نمی‌خواندش و در پیشخان هم دیده نمی‌شود، ولی حذفش
     * یعنی پاک‌شدن لینک‌های فوتر محیط عملیاتی؛ اول محتوا به `columns` برود، بعد یک
     * مهاجرت جدا برش دارد. نگه‌داشتنش تغییر این دور را هم فقط «افزودنی» می‌کند.
     *
     * @deprecated به‌جایش `columns`.
     */
    {
      name: 'navItems',
      type: 'array',
      label: 'لینک‌ها (قدیمی)',
      labels: { singular: 'لینک', plural: 'لینک‌ها' },
      maxRows: 12,
      admin: {
        hidden: true,
        initCollapsed: true,
        components: {
          RowLabel: '@/Footer/RowLabel#RowLabel',
        },
      },
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
    /* طرح فوتر سه ستون عنوان‌دار دارد (بیمه‌ها، بیمه گلد، راهنما)، پس لینک‌ها گروه‌بندی‌شده‌اند. */
    {
      name: 'columns',
      type: 'array',
      label: 'ستون‌های لینک',
      labels: { singular: 'ستون', plural: 'ستون‌ها' },
      maxRows: 4,
      admin: {
        initCollapsed: true,
        description: 'هر ستون یک عنوان و چند لینک. طرح سه ستون دارد.',
      },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان ستون', required: true },
        {
          name: 'navItems',
          type: 'array',
          label: 'لینک‌ها',
          labels: { singular: 'لینک', plural: 'لینک‌ها' },
          maxRows: 8,
          admin: {
            initCollapsed: true,
            components: {
              RowLabel: '@/Footer/RowLabel#RowLabel',
            },
          },
          fields: [
            link({
              appearances: false,
            }),
          ],
        },
      ],
    },
    {
      name: 'tagline',
      type: 'textarea',
      label: 'یک‌خطی زیر لوگو',
      admin: { description: 'مثلاً «بیمه‌فروش آنلاین. قیمت بگیرید، مقایسه کنید، همین‌جا بخرید.»' },
    },
    {
      name: 'supportPhone',
      type: 'text',
      label: 'شماره پشتیبانی',
      admin: { description: 'خالی بماند تا شماره واقعی فعال شود؛ فوتر جای‌نگار نشان می‌دهد.' },
    },
    {
      name: 'supportEmail',
      type: 'text',
      label: 'ایمیل پشتیبانی',
      admin: { description: 'خالی بماند تا نشانی واقعی فعال شود؛ فوتر جای‌نگار نشان می‌دهد.' },
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
