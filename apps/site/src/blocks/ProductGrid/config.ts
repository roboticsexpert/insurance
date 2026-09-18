import type { Block } from 'payload'

/**
 * شبکه محصول‌ها. عنوان، زیرعنوان و «از … تومان» از API می‌آیند نه از اینجا
 * (`src/lib/products.ts`) — CMS فقط می‌گوید کدام‌ها و با چه ترتیبی.
 */
export const ProductGrid: Block = {
  slug: 'productGrid',
  interfaceName: 'ProductGridBlock',
  labels: { singular: 'شبکه محصول', plural: 'شبکه‌های محصول' },
  fields: [
    { name: 'heading', type: 'text', label: 'تیتر بخش' },
    { name: 'subheading', type: 'textarea', label: 'زیرتیتر بخش' },
    {
      name: 'products',
      type: 'select',
      hasMany: true,
      label: 'محصول‌ها',
      options: [
        { label: 'شخص ثالث', value: 'motor-tpl' },
        { label: 'مسافرتی', value: 'travel' },
        { label: 'آتش‌سوزی منزل', value: 'home-fire' },
      ],
      admin: { description: 'خالی بگذارید تا همه محصول‌های فعال نمایش داده شوند.' },
    },
    {
      /*
       * محصول‌هایی که هنوز در API نیستند. طرح خانه یک کارت «به‌زودی» دارد (مسئولیت
       * حرفه‌ای) و چون `GET /catalog/products` فقط محصول فعال را برمی‌گرداند، جایش
       * اینجاست نه در `src/lib/products.ts` — وگرنه با وصل‌شدن API ناپدید می‌شود.
       */
      name: 'comingSoon',
      type: 'array',
      label: 'محصول‌های «به‌زودی»',
      labels: { singular: 'محصول به‌زودی', plural: 'محصول‌های به‌زودی' },
      maxRows: 3,
      admin: { initCollapsed: true },
      fields: [
        { name: 'title', type: 'text', label: 'عنوان', required: true },
        { name: 'description', type: 'textarea', label: 'توضیح' },
        {
          name: 'iconKey',
          type: 'select',
          label: 'آیکن',
          defaultValue: 'briefcase',
          options: [
            { label: 'کیف — مسئولیت حرفه‌ای', value: 'briefcase' },
            { label: 'خودرو', value: 'car' },
            { label: 'هواپیما', value: 'plane' },
            { label: 'شعله', value: 'fire' },
          ],
        },
      ],
    },
    {
      name: 'showPrice',
      type: 'checkbox',
      label: 'نمایش «از … تومان»',
      defaultValue: true,
      admin: { description: 'نرخ‌ها با برچسب «نرخ نمونه» می‌آیند تا با نرخ قطعی اشتباه نشوند.' },
    },
  ],
}
