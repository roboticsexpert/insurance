import React from 'react'

import type { CtaBandBlock as Props } from '@/payload-types'

import { CMSLink } from '@/components/Link'

export const CtaBandBlock: React.FC<Props> = ({ heading, body, links }) => (
  <section className="bg-navy text-navy-foreground">
    <div className="container flex flex-col gap-4 py-12 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-2xl font-bold">{heading}</h2>
        {body && <p className="mt-2">{body}</p>}
      </div>
      {links?.length ? (
        <div className="flex flex-wrap gap-3">
          {links.map(({ link }, i) => (
            <CMSLink key={i} size="lg" {...link} />
          ))}
        </div>
      ) : null}
    </div>
  </section>
)
