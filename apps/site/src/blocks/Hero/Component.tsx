import React from 'react'

import type { HeroBlock as Props } from '@/payload-types'

import { CheckCircleIcon } from '@/components/icons'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { cn } from '@/utilities/ui'

/**
 * هیروی صفحه، از روی بوم خانه.
 *
 * `asColumn` را فقط `RenderBlocks` می‌دهد، وقتی بلافاصله بعد از این هیرو یک بلوک
 * «فرم استعلام» آمده باشد: آن‌وقت این دو با هم یک نوار دو ستونی می‌شوند، همان‌طور
 * که در طرح است. تنها جای صفحه است که چیدمان به بلوک بعدی نگاه می‌کند.
 */
export const HeroBlock: React.FC<Props & { asColumn?: boolean }> = ({
  asColumn,
  bullets,
  eyebrow,
  heading,
  subheading,
  variant,
  media,
  links,
}) => {
  const isPrimary = variant === 'primary'

  const body = (
    <div className="flex flex-col gap-4 lg:gap-6">
      {eyebrow && (
        <span className="flex w-fit items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-[0.8125rem] font-medium text-accent-foreground lg:px-3.5 lg:text-sm">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-gold" />
          {eyebrow}
        </span>
      )}

      <h1
        className={cn(
          'font-extrabold',
          isPrimary
            ? 'text-[1.875rem] leading-[1.6] lg:text-[3.25rem] lg:leading-[1.45]'
            : 'text-[1.75rem] leading-[1.6] font-bold lg:text-[2.75rem] lg:leading-[1.45]',
        )}
      >
        {heading}
      </h1>

      {subheading && (
        <p className="max-w-[32.5rem] text-base leading-[1.9] text-muted-foreground lg:text-[1.1875rem]">
          {subheading}
        </p>
      )}

      {bullets?.length ? (
        <ul aria-label="تعهدهای بیمه گلد" className="mt-2 flex flex-wrap gap-2">
          {bullets.map((bullet, i) => (
            <li
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs lg:px-3.5 lg:text-sm"
              key={bullet.id ?? i}
            >
              <CheckCircleIcon className="shrink-0 text-brand-600" size={18} />
              {bullet.label}
            </li>
          ))}
        </ul>
      ) : null}

      {links?.length ? (
        <div className="mt-2 flex flex-wrap gap-3">
          {links.map(({ link }, i) => (
            <CMSLink
              className={cn(
                'flex h-13 items-center rounded-card px-6 text-base font-semibold',
                link.appearance === 'outline'
                  ? 'border border-border text-foreground'
                  : 'bg-primary text-primary-foreground shadow-button',
              )}
              key={i}
              {...link}
              appearance="inline"
            />
          ))}
        </div>
      ) : null}

      {media && typeof media === 'object' && (
        <div className="mt-6">
          <Media imgClassName="rounded-card" resource={media} />
        </div>
      )}
    </div>
  )

  // ستون چپ یک نوار دو ستونی — پدینگ و عرض را والد می‌دهد.
  if (asColumn) return body

  return (
    <section
      className={cn('shell', isPrimary ? 'pt-8 pb-0 lg:pt-18 lg:pb-24' : 'py-10 lg:py-16')}
      data-variant={variant}
    >
      {body}
    </section>
  )
}
