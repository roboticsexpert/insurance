import clsx from 'clsx'
import React from 'react'

interface Props {
  className?: string
  loading?: 'lazy' | 'eager'
  priority?: 'auto' | 'high' | 'low'
}

/**
 * لوگوی کامل بیمه گلد. `public/brand/` تولیدشده است — با `tools/brand-gold/build.sh`
 * به‌روز می‌شود، دستی ویرایشش نکنید.
 */
export const Logo = (props: Props) => {
  const { loading: loadingFromProps, priority: priorityFromProps, className } = props

  const loading = loadingFromProps || 'lazy'
  const priority = priorityFromProps || 'low'

  return (
    /* eslint-disable @next/next/no-img-element */
    <img
      alt="بیمه گلد"
      width={193}
      height={34}
      loading={loading}
      fetchPriority={priority}
      decoding="async"
      className={clsx('h-[34px] w-full max-w-[9.375rem]', className)}
      src="/brand/logo.svg"
    />
  )
}
