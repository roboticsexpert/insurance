import React from 'react'

import type { CoverageListBlock as Props } from '@/payload-types'

const MARK: Record<string, string> = {
  included: 'پوشش دارد',
  optional: 'اختیاری',
  excluded: 'پوشش ندارد',
}

export const CoverageListBlock: React.FC<Props> = ({ heading, items }) => (
  <section className="container py-12">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    <ul className="mt-6 space-y-4">
      {(items ?? []).map((item, i) => (
        <li key={item.id ?? i} className="flex gap-3">
          <span className="shrink-0 text-sm text-muted-foreground">{MARK[item.included]}</span>
          <div>
            <h3 className="font-bold">{item.title}</h3>
            {item.description && (
              <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  </section>
)
