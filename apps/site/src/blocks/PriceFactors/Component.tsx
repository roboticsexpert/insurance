import React from 'react'

import type { PriceFactorsBlock as Props } from '@/payload-types'

import { toPersianDigits } from '@/lib/fa'

/**
 * «قیمت چطور تعیین می‌شود»، از روی بوم «صفحه محصول — شخص ثالث»: ستون‌های شماره‌دار
 * با یک خط بالای هرکدام، بدون کارت.
 *
 * پدینگ بالا ندارد — این بخش دنباله «چه چیزی پوشش می‌دهد» است و در طرح همان فاصله
 * را با آن یکی شریک است، نه اینکه فاصله تازه‌ای باز کند.
 */
export const PriceFactorsBlock: React.FC<Props> = ({ heading, intro, factors }) => (
  <section aria-labelledby="factors-title" className="shell pt-0 pb-10 lg:pb-26">
    <div className="flex flex-col gap-2">
      <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="factors-title">
        {heading}
      </h2>
      {intro && <p className="text-muted-foreground lg:text-[1.0625rem]">{intro}</p>}
    </div>

    <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:mt-8 lg:grid-cols-4">
      {(factors ?? []).map((factor, i) => (
        <li
          className="flex flex-col gap-2 border-t-2 border-foreground pt-4 lg:pt-5"
          key={factor.id ?? i}
        >
          <span className="text-sm text-muted-foreground">
            {toPersianDigits(String(i + 1).padStart(2, '0'))}
          </span>
          <h3 className="text-[1.0625rem] font-bold lg:text-[1.1875rem]">{factor.title}</h3>
          {factor.description && (
            <p className="text-sm leading-[1.9] text-muted-foreground lg:text-[0.9375rem]">
              {factor.description}
            </p>
          )}
        </li>
      ))}
    </ol>
  </section>
)
