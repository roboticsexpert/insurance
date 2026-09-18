import React from 'react'

import type { PriceFactorsBlock as Props } from '@/payload-types'

export const PriceFactorsBlock: React.FC<Props> = ({ heading, intro, factors }) => (
  <section className="container py-12">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    {intro && <p className="mt-2 text-muted-foreground">{intro}</p>}
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {(factors ?? []).map((factor, i) => (
        <li key={factor.id ?? i} className="rounded border border-border p-4">
          <h3 className="font-bold">{factor.title}</h3>
          {factor.description && (
            <p className="mt-1 text-sm text-muted-foreground">{factor.description}</p>
          )}
        </li>
      ))}
    </ul>
  </section>
)
