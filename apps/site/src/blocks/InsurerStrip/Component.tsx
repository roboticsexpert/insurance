import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Insurer, InsurerStripBlock as Props } from '@/payload-types'

import { Media } from '@/components/Media'

export const InsurerStripBlock: React.FC<Props> = async ({ heading, insurers }) => {
  let list = (insurers ?? []).filter((i): i is Insurer => typeof i === 'object')

  if (!list.length) {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({
      collection: 'insurers',
      where: { status: { equals: 'active' } },
      limit: 24,
      depth: 1,
    })
    list = res.docs
  }

  // شرکتی که قراردادش امضا نشده روی سایت نمی‌رود، حتی اگر دستی انتخاب شده باشد.
  list = list.filter((i) => i.status === 'active')

  if (!list.length) return null

  return (
    <section className="container py-8">
      {heading && <h2 className="text-lg font-bold">{heading}</h2>}
      <ul className="mt-4 flex flex-wrap items-center gap-6">
        {list.map((insurer) => (
          <li key={insurer.id}>
            {insurer.logo && typeof insurer.logo === 'object' ? (
              <Media resource={insurer.logo} imgClassName="h-10 w-auto" />
            ) : (
              <span>{insurer.name}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
