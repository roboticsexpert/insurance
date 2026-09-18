import React from 'react'

import type { CoverageListBlock as Props } from '@/payload-types'

import { ShieldCheckIcon, SlashCircleIcon, type IconProps } from '@/components/icons'
import { cn } from '@/utilities/ui'

type Item = NonNullable<Props['items']>[number]

/**
 * «این بیمه چه چیزی را پوشش می‌دهد»، از روی بوم «صفحه محصول — شخص ثالث»: دو کارت
 * کنار هم، یکی آنچه جبران می‌شود و یکی آنچه نمی‌شود.
 *
 * وضعیت سومِ پیشخان — «اختیاری، با هزینه اضافه» — ستون سوم نمی‌گیرد: پوشش دارد،
 * فقط پولش را جدا می‌دهید؛ پس در همان کارت «پوشش می‌دهد» می‌نشیند و برچسب
 * «اختیاری» کنار عنوانش می‌آید. ستون سوم یعنی خواندن سه ستون برای پاسخ یک سؤال.
 */
const Column: React.FC<{
  Icon: React.FC<IconProps>
  iconClassName: string
  items: Item[]
  title: string
}> = ({ Icon, iconClassName, items, title }) => (
  <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-5 lg:gap-5 lg:p-8">
    <h3 className="flex items-center gap-2.5 text-[1.0625rem] font-bold lg:text-[1.3125rem]">
      <Icon className={cn('shrink-0', iconClassName)} size={26} />
      {title}
    </h3>
    <ul className="flex flex-col gap-4">
      {items.map((item, i) => (
        <li
          className={cn(
            'flex flex-col gap-1',
            i < items.length - 1 && 'border-b border-border pb-4',
          )}
          key={item.id ?? i}
        >
          <span className="flex flex-wrap items-center gap-2 text-[0.9375rem] font-semibold lg:text-[1.0625rem]">
            {item.title}
            {item.included === 'optional' && (
              <span className="rounded-full bg-sunken px-2.5 py-[3px] text-[0.6875rem] font-medium text-muted-foreground">
                اختیاری
              </span>
            )}
          </span>
          {item.description && (
            <p className="text-sm leading-[1.9] text-muted-foreground lg:text-[0.9375rem]">
              {item.description}
            </p>
          )}
        </li>
      ))}
    </ul>
  </div>
)

export const CoverageListBlock: React.FC<Props> = ({ heading, intro, items }) => {
  const list = items ?? []
  const covered = list.filter((item) => item.included !== 'excluded')
  const excluded = list.filter((item) => item.included === 'excluded')

  if (!list.length) return null

  return (
    <section aria-labelledby="coverage-title" className="shell py-10 lg:py-26">
      <div className="flex flex-col gap-2">
        <h2 className="text-[1.375rem] font-bold lg:text-4xl lg:leading-[1.5]" id="coverage-title">
          {heading}
        </h2>
        {intro && <p className="text-muted-foreground lg:text-[1.0625rem]">{intro}</p>}
      </div>

      <div
        className={cn(
          'mt-5 grid gap-4 lg:mt-10 lg:gap-5',
          covered.length && excluded.length && 'lg:grid-cols-2',
        )}
      >
        {covered.length > 0 && (
          <Column
            Icon={ShieldCheckIcon}
            iconClassName="text-brand-600"
            items={covered}
            title="پوشش می‌دهد"
          />
        )}
        {excluded.length > 0 && (
          <Column
            Icon={SlashCircleIcon}
            iconClassName="text-muted-foreground"
            items={excluded}
            title="پوشش نمی‌دهد"
          />
        )}
      </div>
    </section>
  )
}
