import React from 'react'

import type { ProductGridBlock as Props } from '@/payload-types'

import { formatTomanCompact } from '@/lib/fa'
import { getProducts } from '@/lib/products'
import { getAppURL } from '@/utilities/getURL'

export const ProductGridBlock: React.FC<Props> = async ({
  heading,
  subheading,
  products,
  showPrice,
}) => {
  const all = await getProducts()
  const picked = products?.length ? all.filter((p) => (products as string[]).includes(p.slug)) : all

  return (
    <section className="container py-12">
      {heading && <h2 className="text-2xl font-bold">{heading}</h2>}
      {subheading && <p className="mt-2 text-muted-foreground">{subheading}</p>}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {picked.map((p) => (
          <li key={p.id} className="rounded border border-border p-4">
            <h3 className="font-bold">{p.titleFa}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.subtitleFa}</p>
            {showPrice && (
              <p className="mt-3 text-sm">
                {p.fromAmount === null ? (
                  <span className="text-muted-foreground">به‌زودی</span>
                ) : (
                  <>
                    از {formatTomanCompact(p.fromAmount)}
                    {p.fromAmountIsSample && (
                      <span className="ms-2 text-xs text-muted-foreground">نرخ نمونه</span>
                    )}
                  </>
                )}
              </p>
            )}
            <a className="mt-4 inline-block underline" href={`${getAppURL()}/p/${p.slug}/form`}>
              استعلام قیمت
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
