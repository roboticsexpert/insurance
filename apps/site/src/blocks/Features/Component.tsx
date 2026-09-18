import React from 'react'

import type { FeaturesBlock as Props } from '@/payload-types'

import { Media } from '@/components/Media'

const COLS: Record<string, string> = {
  '2': 'sm:grid-cols-2',
  '3': 'sm:grid-cols-2 lg:grid-cols-3',
  '4': 'sm:grid-cols-2 lg:grid-cols-4',
}

export const FeaturesBlock: React.FC<Props> = ({ heading, columns, features }) => (
  <section className="container py-12">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    <ul className={`mt-6 grid gap-6 ${COLS[columns ?? '3']}`}>
      {(features ?? []).map((f, i) => (
        <li key={f.id ?? i}>
          {f.icon && typeof f.icon === 'object' && (
            <Media resource={f.icon} imgClassName="size-10" />
          )}
          <h3 className="mt-2 font-bold">{f.title}</h3>
          {f.description && <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>}
        </li>
      ))}
    </ul>
  </section>
)
