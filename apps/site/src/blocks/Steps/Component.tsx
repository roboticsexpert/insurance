import React from 'react'

import type { StepsBlock as Props } from '@/payload-types'

import { toPersianDigits } from '@/lib/fa'

export const StepsBlock: React.FC<Props> = ({ heading, steps }) => (
  <section className="container py-12">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    <ol className="mt-6 grid gap-6 md:grid-cols-3">
      {(steps ?? []).map((step, i) => (
        <li key={step.id ?? i} className="flex gap-3">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border">
            {toPersianDigits(i + 1)}
          </span>
          <div>
            <h3 className="font-bold">{step.title}</h3>
            {step.description && (
              <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  </section>
)
