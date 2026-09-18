import React from 'react'

import type { CtaBandBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { cn } from '@/utilities/ui'

/**
 * نوار دعوت، از روی بوم خانه. تنها جایی که `navy` سطح بزرگ می‌شود، و سه نقطه
 * طلایی بالایش تنها جای صفحه است که طلایی لوگو می‌آید — طلایی روی زمینه روشن
 * ۲٫۱:۱ است و هرگز متن نمی‌شود، ولی روی navy ۸٫۵:۱ است.
 */
export const CtaBandBlock: React.FC<Props> = ({ heading, body, links }) => (
  <section className="shell py-10 lg:pt-0 lg:pb-26">
    <div className="flex flex-col gap-3 rounded-sheet bg-navy px-6 py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-16 lg:py-14">
      <div className="flex flex-col gap-3">
        <div aria-hidden="true" className="flex gap-1.5">
          <span className="size-1.5 rounded-full bg-gold" />
          <span className="size-1.5 rounded-full bg-gold opacity-60" />
          <span className="size-1.5 rounded-full bg-gold opacity-30" />
        </div>
        <h2 className="text-[1.375rem] leading-[1.6] font-bold text-navy-foreground lg:text-[2.125rem] lg:leading-[1.5]">
          {heading}
        </h2>
        {body && <p className="text-sm text-navy-muted lg:text-[1.0625rem]">{body}</p>}
      </div>

      {links?.length ? (
        <div className="mt-2 flex shrink-0 flex-col gap-3 lg:mt-0 lg:flex-row">
          {links.map(({ link }, i) => (
            <CMSLink
              className={cn(
                'flex h-13 items-center justify-center rounded-card px-5 text-[0.95rem] font-semibold lg:px-7 lg:text-base',
                link.appearance === 'outline'
                  ? 'border border-white/20 text-navy-foreground'
                  : 'bg-primary text-primary-foreground',
              )}
              key={i}
              {...link}
              appearance="inline"
            />
          ))}
        </div>
      ) : null}
    </div>
  </section>
)
