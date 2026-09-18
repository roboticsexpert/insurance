import React from 'react'

import type { FeaturesBlock as Props } from '@/payload-types'

import { FEATURE_ICONS } from '@/components/icons'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

const COLS: Record<string, string> = {
  '2': 'lg:grid-cols-2',
  '3': 'lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

/**
 * «چرا از بیمه گلد بخرید»، از روی بوم خانه.
 *
 * آیکن یا از `iconKey` می‌آید (آیکن‌های خطی خود سایت) یا از تصویر بارگذاری‌شده؛
 * اگر هیچ‌کدام نبود، کارت بدون کاشی آیکن می‌نشیند و چیزی جای خالی نمی‌ماند.
 */
export const FeaturesBlock: React.FC<Props> = ({ heading, subheading, columns, features }) => (
  <section aria-labelledby="features-title" className="shell pt-10 pb-0 lg:py-26">
    <div className="flex flex-col gap-2">
      <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="features-title">
        {heading}
      </h2>
      {subheading && <p className="text-muted-foreground lg:text-[1.0625rem]">{subheading}</p>}
    </div>

    <ul className={cn('mt-3 grid gap-3 lg:mt-10 lg:gap-5', COLS[columns ?? '3'])}>
      {(features ?? []).map((feature, i) => {
        const Icon = feature.iconKey ? FEATURE_ICONS[feature.iconKey] : undefined
        return (
          <li
            className="flex flex-col gap-1.5 rounded-card border border-border bg-card p-4 lg:gap-3.5 lg:p-7"
            key={feature.id ?? i}
          >
            {feature.icon && typeof feature.icon === 'object' ? (
              <span className="hidden size-12 items-center justify-center rounded-card bg-accent lg:flex">
                <Media imgClassName="size-6" resource={feature.icon} />
              </span>
            ) : (
              Icon && (
                <span className="hidden size-12 items-center justify-center rounded-card bg-accent text-accent-foreground lg:flex">
                  <Icon size={26} />
                </span>
              )
            )}
            <h3 className="text-[0.95rem] font-semibold lg:text-xl lg:font-bold">
              {feature.title}
            </h3>
            {feature.description && (
              <p className="text-sm leading-[1.9] text-muted-foreground lg:text-[0.9375rem]">
                {feature.description}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  </section>
)
