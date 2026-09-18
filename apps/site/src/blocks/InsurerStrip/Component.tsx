import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Insurer, InsurerStripBlock as Props } from '@/payload-types'

import { Media } from '@/components/Media'

/** طرح پنج خانه دارد؛ تا قرارداد امضا نشده همه‌شان جای‌نگارند. */
const PLACEHOLDER_COUNT = 5

/**
 * نوار شرکت‌های بیمه، از روی بوم خانه.
 *
 * فقط شرکت‌های `active` لوگو می‌گیرند — تا قرارداد امضا نشده، لوگو روی سایت ادعای
 * همکاری است. وقتی هیچ شرکت فعالی نیست، بخش حذف نمی‌شود بلکه همان خانه‌های
 * جای‌نگار طرح را نشان می‌دهد: خانه خالی با متن «[لوگوی شرکت بیمه]» چیزی ادعا
 * نمی‌کند، و جمله بالایش («شرکت‌های بیمه دارای مجوز صادر می‌کنند») هم راست است.
 */
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

  return (
    <section
      aria-label="شرکت‌های بیمه"
      className="shell flex flex-col items-center gap-4 pt-10 pb-0 lg:gap-6 lg:pt-0 lg:pb-26"
    >
      {heading && (
        <p className="text-center text-sm text-muted-foreground lg:text-base">{heading}</p>
      )}
      <ul className="grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 lg:gap-4">
        {list.length
          ? list.map((insurer) => (
              <li
                className="flex h-20 items-center justify-center rounded-card border border-border bg-card px-4 lg:h-22"
                key={insurer.id}
              >
                {insurer.logo && typeof insurer.logo === 'object' ? (
                  <Media imgClassName="h-10 w-auto" resource={insurer.logo} />
                ) : (
                  <span className="text-[0.8125rem]">{insurer.name}</span>
                )}
              </li>
            ))
          : Array.from({ length: PLACEHOLDER_COUNT }, (_, i) => (
              <li
                className="flex h-20 items-center justify-center rounded-card border border-border bg-card text-[0.8125rem] text-muted-foreground lg:h-22"
                key={i}
              >
                [لوگوی شرکت بیمه]
              </li>
            ))}
      </ul>
    </section>
  )
}
