import React from 'react'

import type { Faq, FaqBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'

import { FaqAccordion } from './Accordion'

/**
 * پرسش‌های پرتکرار، از روی بوم خانه: روی دسکتاپ یک نوار سفید تمام‌عرض با ستون
 * تیتر در کنار، روی موبایل یک کارت ساده.
 *
 * پرسش‌ها از مجموعه `faqs` می‌آیند نه از داخل بلوک، تا یک پاسخ در چند صفحه تکرار
 * و واگرا نشود.
 */
export const FaqBlock: React.FC<Props> = ({ heading, subheading, faqs, links }) => {
  const list = (faqs ?? []).filter((f): f is Faq => typeof f === 'object')

  if (!list.length) return null

  return (
    <section aria-labelledby="faq-title" className="lg:border-y lg:border-border lg:bg-card">
      <div className="shell flex flex-col gap-2 pt-10 pb-0 lg:flex-row lg:gap-24 lg:py-24">
        <div className="flex flex-col gap-3 lg:w-90 lg:shrink-0">
          <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="faq-title">
            {heading}
          </h2>
          {subheading && (
            <p className="hidden leading-[1.9] text-muted-foreground lg:block">{subheading}</p>
          )}
          {links?.[0]?.link && (
            <CMSLink
              className="mt-2 hidden h-11 w-fit items-center rounded-card border border-border px-[1.125rem] text-[0.9375rem] font-semibold text-foreground transition-colors hover:border-brand-500 lg:flex"
              {...links[0].link}
            />
          )}
        </div>

        <div className="grow">
          <FaqAccordion
            items={list.map((faq) => ({ answer: faq.answer, id: faq.id, question: faq.question }))}
          />
        </div>
      </div>
    </section>
  )
}
