import React from 'react'

import type { OfferPreviewBlock as Props } from '@/payload-types'

import { formatToman } from '@/lib/fa'

export const OfferPreviewBlock: React.FC<Props> = ({ heading, offers, disclaimer }) => (
  <section className="container py-12">
    {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
    <ul className="mt-6 divide-y divide-border rounded border border-border">
      {(offers ?? []).map((offer, i) => (
        <li key={offer.id ?? i} className="flex items-center justify-between p-4">
          <div>
            <span className="font-bold">
              {typeof offer.insurer === 'object' ? offer.insurer.name : '—'}
            </span>
            {offer.note && <span className="ms-2 text-sm text-muted-foreground">{offer.note}</span>}
          </div>
          <span>{formatToman(offer.amount)}</span>
        </li>
      ))}
    </ul>
    {/* برچسب «نرخ نمونه» شرط صداقت این بلوک است، نه تزئین. */}
    <p className="mt-2 text-sm text-muted-foreground">{disclaimer}</p>
  </section>
)
