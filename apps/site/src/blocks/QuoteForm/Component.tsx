import React from 'react'

import type { QuoteFormBlock as Props } from '@/payload-types'

import { getAppURL } from '@/utilities/getURL'

const WIZARD_PATH: Record<string, string> = {
  'motor-tpl': '/p/motor-tpl/form',
  travel: '/p/travel/form',
  'home-fire': '/p/home-fire/form',
  any: '/',
}

/**
 * سایت نه نرخ می‌دهد و نه می‌فروشد؛ این فرم فقط کاربر را با انتخابش به ویزارد اپ می‌برد.
 * فرستادن با GET عمدی است — بدون جاوااسکریپت هم کار می‌کند و چیزی اینجا ذخیره نمی‌شود.
 */
export const QuoteFormBlock: React.FC<Props> = ({ heading, product, submitLabel, note }) => {
  const action = `${getAppURL()}${WIZARD_PATH[product ?? 'any'] ?? '/'}`

  return (
    <section className="container py-12">
      {heading && <h2 className="mb-4 text-2xl font-bold">{heading}</h2>}
      <form action={action} method="get" className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <input type="hidden" name="utm_source" value="bimegold.com" />
        <input type="hidden" name="utm_medium" value="site" />
        {product === 'any' && (
          <label className="flex flex-col gap-1">
            <span className="text-sm">محصول</span>
            <select name="product" className="rounded border border-border p-2">
              <option value="motor-tpl">بیمه شخص ثالث</option>
              <option value="travel">بیمه مسافرتی</option>
              <option value="home-fire">بیمه آتش‌سوزی منزل</option>
            </select>
          </label>
        )}
        <button type="submit" className="rounded bg-primary px-6 py-2 text-primary-foreground">
          {submitLabel || 'استعلام قیمت'}
        </button>
      </form>
      {note && <p className="mt-2 text-sm text-muted-foreground">{note}</p>}
    </section>
  )
}
