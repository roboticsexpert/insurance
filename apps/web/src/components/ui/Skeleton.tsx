import type { ReactNode } from 'react'

/**
 * One pulsing placeholder box.
 *
 * `aria-hidden`, deliberately: a screen reader announcing twenty pulsing rectangles is worse
 * than silence. The `SkeletonScreen` wrapper carries the single announcement for the whole
 * loading region instead.
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-sunken ${className}`} />
}

/**
 * Wraps a set of skeletons so the region announces itself once, and politely.
 *
 * `aria-busy` is what tells assistive tech the content is on its way; `role="status"` with a
 * single Persian label is what a screen-reader user actually hears.
 */
export function SkeletonScreen({
  children,
  label = 'در حال بارگذاری',
}: {
  children: ReactNode
  label?: string
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label}>
      {children}
    </div>
  )
}

/** The shape most lists want: N identical cards, evenly spaced. */
export function SkeletonCards({
  count = 3,
  height = 'h-28',
  className = 'space-y-3 px-5',
}: {
  count?: number
  height?: string
  className?: string
}) {
  return (
    <SkeletonScreen>
      <div className={className}>
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className={`${height} rounded-[var(--radius-card)]`} />
        ))}
      </div>
    </SkeletonScreen>
  )
}
