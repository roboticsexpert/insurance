'use client'

import React, { useId, useState } from 'react'

import { MinusIcon, PlusIcon } from '@/components/icons'
import { cn } from '@/utilities/ui'

export type AccordionItem = {
  answer: string
  id: number | string
  question: string
}

/**
 * آکاردئون پرسش‌ها. طرح اولین پرسش را باز نشان می‌دهد و بقیه را بسته، و فقط یکی
 * هم‌زمان باز است.
 *
 * `<details>` بومی ساده‌تر بود ولی «فقط یکی باز» را بدون جاوااسکریپت نمی‌دهد، و
 * آیکن + و − طرح هم روی `marker` سوار نمی‌شود.
 */
export const FaqAccordion: React.FC<{ items: AccordionItem[] }> = ({ items }) => {
  const [openId, setOpenId] = useState<AccordionItem['id'] | null>(items[0]?.id ?? null)
  const baseId = useId()

  return (
    <div className="flex flex-col rounded-card border border-border bg-card px-4 lg:rounded-none lg:border-0 lg:px-0">
      {items.map((item, i) => {
        const isOpen = item.id === openId
        const panelId = `${baseId}-panel-${i}`
        const buttonId = `${baseId}-button-${i}`

        return (
          <div
            className={cn(
              'flex flex-col',
              i < items.length - 1 && 'border-b border-border',
              isOpen && 'pb-4 lg:pb-6',
            )}
            key={item.id}
          >
            <h3>
              <button
                aria-controls={panelId}
                aria-expanded={isOpen}
                className="flex min-h-15 w-full cursor-pointer items-center justify-between gap-3 text-start text-[0.9375rem] font-semibold text-foreground lg:min-h-18 lg:gap-4 lg:text-lg"
                id={buttonId}
                onClick={() => setOpenId(isOpen ? null : item.id)}
                type="button"
              >
                {item.question}
                {isOpen ? (
                  <MinusIcon className="shrink-0 text-brand-700" size={22} />
                ) : (
                  <PlusIcon className="shrink-0 text-muted-foreground" size={22} />
                )}
              </button>
            </h3>
            {isOpen && (
              <p
                aria-labelledby={buttonId}
                className="max-w-[40rem] text-sm leading-[1.9] text-muted-foreground lg:text-base"
                id={panelId}
                role="region"
              >
                {item.answer}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
