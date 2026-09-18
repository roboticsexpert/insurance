import configPromise from '@payload-config'
import { getPayload } from 'payload'
import React from 'react'

import type { Insurer, InsurerStripBlock as Props } from '@/payload-types'

import { Media } from '@/components/Media'
import { bundledMarks } from '@/lib/insurer-marks'

const STATUS_LABEL: Partial<Record<Insurer['status'], string>> = {
  negotiating: 'در حال مذاکره',
}

/**
 * نوار شرکت‌های بیمه، از روی بوم خانه (نسخه به‌روزشده ۱۴۰۵/۰۶/۲۸).
 *
 * پیش‌تر فقط شرکت‌های `active` را نشان می‌داد و بقیه را حذف می‌کرد، چون لوگو روی
 * سایت یعنی ادعای همکاری. طرح تازه راه بهتری را انتخاب کرده: نام و نشان هر شرکت
 * می‌آید ولی وضعیتش هم صریح کنارش نوشته می‌شود («در حال مذاکره»)، پس چیزی ادعا
 * نمی‌شود. بعد از امضای قرارداد، لوگوی کامل — که ویراستار در پیشخان بارگذاری
 * می‌کند — جای نام و برچسب می‌نشیند.
 */
export const InsurerStripBlock: React.FC<Props> = async ({ heading, insurers }) => {
  let list = (insurers ?? []).filter((i): i is Insurer => typeof i === 'object')

  // ترتیب انتخاب پیشخان ترتیب نمایش است؛ خالی که باشد همه شرکت‌ها می‌آیند.
  if (!list.length) {
    const payload = await getPayload({ config: configPromise })
    const res = await payload.find({ collection: 'insurers', limit: 24, depth: 1 })
    list = res.docs
  }

  if (!list.length) return null

  return (
    <section
      aria-label="شرکت‌های بیمه"
      className="shell flex flex-col items-center gap-4 pt-10 pb-0 lg:gap-5 lg:pt-0 lg:pb-26"
    >
      {heading && (
        <p className="max-w-3xl text-center text-sm leading-[1.9] text-muted-foreground lg:text-base">
          {heading}
        </p>
      )}
      <ul className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {list.map((insurer) => {
          const label = STATUS_LABEL[insurer.status]
          const signed =
            insurer.status === 'active' && insurer.logo && typeof insurer.logo === 'object'

          return (
            <li
              className="flex h-37 flex-col items-center justify-center gap-2.5 rounded-card border border-border bg-card p-3 text-center"
              key={insurer.id}
            >
              {signed ? (
                <Media imgClassName="h-10 w-auto" resource={insurer.logo} />
              ) : (
                <>
                  {bundledMarks.has(insurer.slug) && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img alt="" className="size-10" src={`/insurers/${insurer.slug}.svg`} />
                  )}
                  <span className="text-[0.9375rem] font-semibold">{insurer.name}</span>
                  {label && (
                    <span className="rounded-full bg-sunken px-2.5 py-[3px] text-[0.6875rem] font-medium text-muted-foreground">
                      {label}
                    </span>
                  )}
                </>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
