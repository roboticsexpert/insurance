import React from 'react'

import type { Faq, FaqBlock as Props } from '@/payload-types'

export const FaqBlock: React.FC<Props> = ({ heading, faqs }) => {
  const list = (faqs ?? []).filter((f): f is Faq => typeof f === 'object')

  if (!list.length) return null

  return (
    <section className="container py-12">
      {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
      <dl className="mt-6 space-y-4">
        {list.map((faq) => (
          <div key={faq.id} className="rounded border border-border p-4">
            <dt className="font-bold">{faq.question}</dt>
            <dd className="mt-2 text-muted-foreground">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
