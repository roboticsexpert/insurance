import React from 'react'

import { cn } from '@/utilities/ui'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

/**
 * لوگوی کامل بیمه گلد. `public/brand/` تولیدشده است — با `tools/brand-gold/build.sh`
 * به‌روز می‌شود، دستی ویرایشش نکنید.
 *
 * دو فایل، نه یکی: کلمه «bime» در `logo.svg` با charcoal یعنی `#2B2B2B` کشیده شده و
 * روی سربرگ تم تیره (`surface-card` تیره) عملاً ناپدید می‌شود — فقط «gold» طلایی
 * می‌ماند. `logo-on-dark.svg` همان لوگو با `#F0F0F0` است (توکن `charcoal-on-dark`).
 * جابه‌جایی با CSS انجام می‌شود نه با جاوااسکریپت، تا در رندر سمت سرور هم درست
 * باشد و بین سرور و کلاینت ناهماهنگی پیش نیاید.
 *
 * بلندی پیش‌فرض ۲۸ پیکسل است (اندازه لوگو در هدر و فوتر طرح) و پهنا خودش می‌آید تا
 * نسبت تصویر نشکند. `cn` است نه `clsx` تا `className` بیرونی بتواند بلندی را عوض کند.
 */
export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  /* `alt` روی هر دو صریح نوشته شده چون قاعده jsx-a11y/alt-text آن را از داخل spread نمی‌بیند. */
  const shared = {
    decoding: 'async' as const,
    fetchPriority: priority,
    height: 34,
    loading,
    width: 193,
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <>
      <img
        {...shared}
        alt="بیمه گلد"
        className={cn('h-7 w-auto dark:hidden', className)}
        src="/brand/logo.svg"
      />
      <img
        {...shared}
        alt="بیمه گلد"
        className={cn('hidden h-7 w-auto dark:block', className)}
        src="/brand/logo-on-dark.svg"
      />
    </>
  )
}
