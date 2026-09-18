import React from 'react'

import type { HeroBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'

/**
 * چیدمان اینجا عمداً خام است. دور طراحی هنوز نرسیده — ساختار و داده درست است،
 * ظاهر بعداً روی همین اسکلت سوار می‌شود.
 */
export const HeroBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  subheading,
  variant,
  media,
  links,
}) => {
  return (
    <section data-variant={variant} className="container py-12">
      <div className="max-w-3xl">
        {eyebrow && <p className="mb-2 text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-3xl font-bold md:text-5xl">{heading}</h1>
        {subheading && <p className="mt-4 text-lg text-muted-foreground">{subheading}</p>}
        {links?.length ? (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(({ link }, i) => (
              <CMSLink key={i} size="lg" {...link} />
            ))}
          </div>
        ) : null}
      </div>
      {media && typeof media === 'object' && (
        <div className="mt-8">
          <Media resource={media} imgClassName="rounded-lg" />
        </div>
      )}
    </section>
  )
}
