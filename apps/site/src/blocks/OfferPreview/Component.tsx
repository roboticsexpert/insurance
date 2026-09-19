import React from 'react'

import type { Insurer, OfferPreviewBlock as Props } from '@/payload-types'

import { formatToman } from '@/lib/fa'
import { bundledMarks } from '@/lib/insurer-marks'
import { cn } from '@/utilities/ui'

/**
 * پیش‌نمایش مقایسه نرخ، از روی بوم «صفحه محصول — شخص ثالث».
 *
 * پنل سمت چپ یک **نمونه** است، نه نرخ زنده: نه استعلامی گرفته شده و نه قراردادی
 * امضا شده. برچسب «نرخ نمونه» و جمله زیر پنل شرط صداقت این بلوک‌اند، نه تزئین
 * (`docs/website/LANDING-PAGES.md`) — برنداریدشان. ردیفی که شرکت یا مبلغش در
 * پیشخان خالی باشد همان جای‌نگار طرح را نشان می‌دهد.
 */
export const OfferPreviewBlock: React.FC<Props> = ({
  heading,
  body,
  offers,
  panelLabel,
  disclaimer,
}) => (
  <section aria-labelledby="offers-title" className="border-y border-border bg-card">
    <div className="shell grid gap-8 py-10 lg:grid-cols-12 lg:items-center lg:gap-6 lg:py-24">
      <div className="flex flex-col gap-3 lg:col-span-5 lg:gap-4">
        <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="offers-title">
          {heading}
        </h2>
        {body && (
          <p className="text-sm leading-[1.9] text-muted-foreground lg:text-[1.0625rem]">{body}</p>
        )}
      </div>

      <div className="flex flex-col gap-2 lg:col-span-6 lg:col-start-7">
        <div className="flex flex-col gap-3 rounded-sheet bg-background p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{panelLabel || 'پیشنهادها'}</span>
            <span className="rounded-full bg-sunken px-2.5 py-[3px] text-xs font-medium">
              نرخ نمونه
            </span>
          </div>

          <ul className="flex flex-col gap-3">
            {(offers ?? []).map((offer, i) => {
              const insurer = typeof offer.insurer === 'object' ? (offer.insurer as Insurer) : null
              const unavailable = offer.state === 'unavailable'
              const cheapest = offer.state === 'cheapest'

              return (
                <li
                  className={cn(
                    'flex items-center gap-3 rounded-card border bg-card p-4',
                    cheapest && 'border-[1.5px] border-brand-600 shadow-card',
                    !cheapest && !unavailable && 'border-border shadow-card',
                    unavailable && 'border-border opacity-70',
                  )}
                  key={offer.id ?? i}
                >
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-sunken">
                    {insurer && bundledMarks.has(insurer.slug) && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img alt="" className="size-7" src={`/insurers/${insurer.slug}.svg`} />
                    )}
                  </span>

                  <span className="flex grow flex-col gap-0.5">
                    <span className="text-[0.95rem] font-semibold">
                      {insurer?.name ?? '[نام شرکت بیمه]'}
                    </span>
                    {offer.note && (
                      <span className="text-xs text-muted-foreground">{offer.note}</span>
                    )}
                  </span>

                  {unavailable ? (
                    <span className="shrink-0 rounded-full bg-sunken px-2.5 py-[3px] text-xs font-medium">
                      ناموجود
                    </span>
                  ) : (
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {cheapest && (
                        <span className="rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-medium text-primary-foreground">
                          ارزان‌ترین
                        </span>
                      )}
                      <span className="text-lg font-bold">
                        {typeof offer.amount === 'number'
                          ? formatToman(offer.amount)
                          : '[مبلغ] تومان'}
                      </span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>

        <p className="px-1 text-xs text-muted-foreground lg:text-[0.8125rem]">{disclaimer}</p>
      </div>
    </div>
  </section>
)
