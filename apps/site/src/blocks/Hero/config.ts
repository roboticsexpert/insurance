import type { Block } from 'payload'

import { linkGroup } from '../../fields/linkGroup'

export const Hero: Block = {
  slug: 'hero',
  interfaceName: 'HeroBlock',
  labels: { singular: 'هیرو', plural: 'هیروها' },
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      label: 'خط بالای تیتر',
      admin: { description: 'اختیاری. یک عبارت کوتاه، مثلاً «صدور آنی».' },
    },
    { name: 'heading', type: 'text', label: 'تیتر', required: true },
    { name: 'subheading', type: 'textarea', label: 'زیرتیتر' },
    {
      name: 'variant',
      type: 'select',
      label: 'وزن',
      defaultValue: 'primary',
      options: [
        { label: 'اصلی — صفحه خانه', value: 'primary' },
        { label: 'محصول — بالای صفحه محصول', value: 'product' },
        { label: 'ساده — صفحه‌های داخلی', value: 'simple' },
      ],
      required: true,
    },
    {
      /*
       * کاشی آیکن بالای تیتر صفحه محصول، از روی بوم «صفحه محصول — شخص ثالث».
       * همان کلیدهای `PRODUCT_ICONS` است که کارت محصول هم با آن آیکنش را انتخاب
       * می‌کند، تا یک محصول در هر دو جا یک آیکن داشته باشد.
       */
      name: 'iconKey',
      type: 'select',
      label: 'آیکن محصول',
      options: [
        { label: 'خودرو — شخص ثالث و بدنه', value: 'car' },
        { label: 'هواپیما — مسافرتی', value: 'plane' },
        { label: 'شعله — آتش‌سوزی', value: 'fire' },
        { label: 'کیف — مسئولیت حرفه‌ای', value: 'briefcase' },
      ],
      admin: {
        condition: (_, s) => s?.variant === 'product',
        description: 'فقط در وزن «محصول» دیده می‌شود.',
      },
    },
    {
      name: 'bullets',
      type: 'array',
      label: 'تعهدها',
      labels: { singular: 'تعهد', plural: 'تعهدها' },
      maxRows: 4,
      admin: {
        description:
          'برچسب‌های کوتاه زیر زیرتیتر، مثل «صدور فوری». فقط چیزی که واقعاً تعهد می‌کنیم.',
      },
      fields: [{ name: 'label', type: 'text', label: 'متن', required: true }],
    },
    { name: 'media', type: 'upload', label: 'تصویر', relationTo: 'media' },
    linkGroup({ appearances: ['default', 'outline'], overrides: { maxRows: 2 } }),
  ],
}
