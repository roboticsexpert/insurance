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
 * بلندی پیش‌فرض ۲۸ پیکسل است (اندازه لوگو در هدر و فوتر طرح) و پهنا خودش می‌آید تا
 * نسبت تصویر نشکند. `cn` است نه `clsx` تا `className` بیرونی بتواند بلندی را عوض کند.
 */
export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="بیمه گلد"
      className={cn('h-7 w-auto', className)}
      decoding="async"
      fetchPriority={priority}
      height={34}
      loading={loading}
      src="/brand/logo.svg"
      width={193}
    />
  )
}
