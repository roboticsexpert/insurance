import type { Block } from 'payload'

export const Features: Block = {
  slug: 'features',
  interfaceName: 'FeaturesBlock',
  labels: { singular: 'ویژگی‌ها', plural: 'بخش‌های ویژگی' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    { name: 'subheading', type: 'textarea', label: 'زیرتیتر بخش' },
    {
      name: 'columns',
      type: 'select',
      label: 'تعداد ستون',
      defaultValue: '3',
      options: [
        { label: 'دو ستون', value: '2' },
        { label: 'سه ستون', value: '3' },
        { label: 'چهار ستون', value: '4' },
        { label: 'پنج ستون', value: '5' },
      ],
    },
    {
      name: 'features',
      type: 'array',
      label: 'ویژگی‌ها',
      minRows: 2,
      labels: { singular: 'ویژگی', plural: 'ویژگی‌ها' },
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
        {
          name: 'iconKey',
          type: 'select',
          label: 'آیکن',
          options: [
            { label: 'ساعت — صدور فوری', value: 'clock' },
            { label: 'برچسب قیمت — نرخ مصوب', value: 'tag' },
            { label: 'قفل — امنیت پرداخت', value: 'lock' },
            { label: 'تیک — تأیید', value: 'check' },
            { label: 'خودرو', value: 'car' },
            { label: 'هواپیما', value: 'plane' },
            { label: 'شعله', value: 'fire' },
            { label: 'کیف — مسئولیت حرفه‌ای', value: 'briefcase' },
          ],
          admin: {
            description: 'آیکن خطی سایت. اگر تصویر اختصاصی بارگذاری کنید، آن جایش را می‌گیرد.',
          },
        },
        { name: 'icon', type: 'upload', label: 'آیکن اختصاصی', relationTo: 'media' },
      ],
    },
  ],
}
