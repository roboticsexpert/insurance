import type { Block } from 'payload'

/**
 * نوار لوگوی شرکت‌های بیمه. فقط شرکت‌های `active` را نشان می‌دهد — تا قرارداد امضا نشده،
 * لوگو روی سایت ادعای همکاری است.
 */
export const InsurerStrip: Block = {
  slug: 'insurerStrip',
  interfaceName: 'InsurerStripBlock',
  labels: { singular: 'نوار شرکت‌ها', plural: 'نوارهای شرکت‌ها' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش', defaultValue: 'شرکت‌های همکار' },
    {
      name: 'insurers',
      type: 'relationship',
      label: 'شرکت‌ها',
      relationTo: 'insurers',
      hasMany: true,
      admin: { description: 'خالی بگذارید تا همه شرکت‌های فعال نمایش داده شوند.' },
    },
  ],
}
