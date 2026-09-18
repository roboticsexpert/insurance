import React from 'react'

import type { StepsBlock as Props } from '@/payload-types'

import { toPersianDigits } from '@/lib/fa'

/**
 * سه قدم خرید، از روی بوم خانه. تنها جای صفحه — کنار نوار دعوت — که `navy` می‌آید:
 * دایره شماره قدم‌ها.
 */
export const StepsBlock: React.FC<Props> = ({ heading, steps }) => (
  <section aria-labelledby="steps-title" className="mt-10 border-y border-border bg-card lg:mt-0">
    <div className="shell flex flex-col gap-6 py-9 lg:gap-12 lg:py-24">
      <h2
        className="text-[1.375rem] font-bold lg:text-center lg:text-4xl lg:leading-[1.5]"
        id="steps-title"
      >
        {heading}
      </h2>
      <ol className="grid gap-5 lg:grid-cols-3 lg:gap-12">
        {(steps ?? []).map((step, i) => (
          <li className="flex gap-3.5 lg:flex-col lg:gap-4" key={step.id ?? i}>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy text-[1.0625rem] font-bold text-navy-foreground lg:size-12 lg:text-xl">
              {toPersianDigits(i + 1)}
            </span>
            <div className="flex flex-col gap-1 lg:gap-4">
              <h3 className="text-base font-bold lg:text-[1.3125rem]">{step.title}</h3>
              {step.description && (
                <p className="text-sm leading-[1.9] text-muted-foreground lg:text-base">
                  {step.description}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  </section>
)
