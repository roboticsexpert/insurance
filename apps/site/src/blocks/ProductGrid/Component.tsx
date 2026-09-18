import React from 'react'

import type { ProductGridBlock as Props } from '@/payload-types'

import { ArrowIcon, BriefcaseIcon, CheckIcon, PRODUCT_ICONS } from '@/components/icons'
import { formatTomanCompact } from '@/lib/fa'
import { getProducts } from '@/lib/products'
import { getAppURL } from '@/utilities/getURL'

/**
 * شبکه محصول‌ها، از روی بوم خانه: روی دسکتاپ چهار کارت قدی، روی موبایل ردیف‌های
 * افقی — همان دو چیدمانی که در طرح دسکتاپ و طرح موبایل هست.
 *
 * عنوان، ویژگی‌ها و «از … تومان» از API می‌آیند نه از CMS (`src/lib/products.ts`)؛
 * CMS فقط می‌گوید کدام‌ها و با چه ترتیبی.
 */
export const ProductGridBlock: React.FC<Props> = async ({
  heading,
  subheading,
  products,
  comingSoon,
  showPrice,
}) => {
  const all = await getProducts()
  const chosen = (products as string[] | null | undefined) ?? []
  // ترتیب انتخاب پیشخان ترتیب نمایش است، پس روی همان فهرست می‌چرخیم نه روی همه.
  const picked = chosen.length
    ? chosen.map((slug) => all.find((p) => p.slug === slug)).filter((p) => p !== undefined)
    : all

  return (
    <section aria-labelledby="products-title" className="shell pt-7 pb-0 lg:pt-0 lg:pb-26">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold lg:text-4xl lg:leading-[1.5]" id="products-title">
          {heading}
        </h2>
        {subheading && <p className="text-muted-foreground lg:text-[1.0625rem]">{subheading}</p>}
      </div>

      <ul className="mt-3 grid gap-3 lg:mt-8 lg:grid-cols-2 lg:gap-5 xl:grid-cols-4">
        {picked.map((product) => {
          const Icon = PRODUCT_ICONS[product.iconKey] ?? BriefcaseIcon
          return (
            <li className="flex" key={product.id}>
              <a
                className="flex w-full items-center gap-3 rounded-card border border-border bg-card p-4 text-foreground shadow-card transition-shadow hover:shadow-md lg:flex-col lg:items-stretch lg:gap-4 lg:p-6"
                href={`${getAppURL()}/p/${product.slug}/form`}
              >
                <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-accent text-accent-foreground lg:size-14">
                  <Icon size={28} />
                </span>

                <span className="flex grow flex-col gap-0.5 lg:gap-1.5">
                  <span className="text-[0.95rem] font-semibold lg:text-xl lg:font-bold">
                    {product.titleFa}
                  </span>
                  <span className="text-xs leading-[1.8] text-muted-foreground lg:text-sm">
                    {product.subtitleFa}
                  </span>
                  {showPrice && (
                    <span className="mt-1 text-sm text-muted-foreground lg:hidden">
                      {product.fromAmount === null ? (
                        'به‌زودی'
                      ) : (
                        <>
                          از{' '}
                          <span className="font-bold text-foreground">
                            {formatTomanCompact(product.fromAmount)}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </span>

                {/* ویژگی‌ها و پاورقی قیمت فقط روی دسکتاپ — کارت موبایل یک ردیف است. */}
                <ul className="hidden grow flex-col gap-2 text-sm lg:flex">
                  {product.highlightsFa.map((highlight) => (
                    <li className="flex items-center gap-2" key={highlight}>
                      <CheckIcon className="shrink-0 text-brand-600" size={16} />
                      {highlight}
                    </li>
                  ))}
                </ul>

                {/*
                  طرح «[مبلغ]» دارد و مبلغ واقعی از آن بلندتر است، پس هر دو طرف
                  `whitespace-nowrap`اند و برچسب «نرخ نمونه» زیر مبلغ می‌نشیند نه
                  کنارش — وگرنه در ستون ۲۸۵ پیکسلی می‌شکند.
                */}
                {showPrice && (
                  <span className="hidden flex-col gap-1 border-t border-border pt-4 text-sm lg:flex">
                    <span className="flex items-center justify-between gap-2">
                      <span className="whitespace-nowrap text-muted-foreground">
                        {product.fromAmount === null ? (
                          'به‌زودی'
                        ) : (
                          <>
                            از{' '}
                            <span className="font-bold text-foreground">
                              {formatTomanCompact(product.fromAmount)}
                            </span>
                          </>
                        )}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-semibold text-brand-700">
                        جزئیات و خرید
                        <ArrowIcon size={16} />
                      </span>
                    </span>
                    {product.fromAmount !== null && product.fromAmountIsSample && (
                      <span className="text-[0.65rem] text-muted-foreground">نرخ نمونه</span>
                    )}
                  </span>
                )}

                <ArrowIcon className="shrink-0 text-muted-foreground lg:hidden" size={20} />
              </a>
            </li>
          )
        })}

        {(comingSoon ?? []).map((item, i) => {
          const Icon = PRODUCT_ICONS[item.iconKey ?? 'briefcase'] ?? BriefcaseIcon
          return (
            <li className="flex" key={item.id ?? i}>
              {/* روی موبایل یک ردیف است و برچسب ته ردیف؛ روی دسکتاپ برچسب بالای کارت. */}
              <div className="relative flex w-full items-center gap-3 rounded-card border border-border bg-card p-4 opacity-60 lg:flex-col lg:items-stretch lg:gap-4 lg:p-6">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-card bg-sunken text-muted-foreground lg:size-14">
                  <Icon size={28} />
                </span>
                <span className="flex grow flex-col gap-0.5 lg:gap-1.5">
                  <span className="text-[0.95rem] font-semibold lg:text-xl lg:font-bold">
                    {item.title}
                  </span>
                  {item.description && (
                    <span className="hidden text-sm leading-[1.8] text-muted-foreground lg:block">
                      {item.description}
                    </span>
                  )}
                </span>
                <span className="shrink-0 rounded-full bg-sunken px-2.5 py-1 text-[0.6875rem] font-medium lg:absolute lg:end-6 lg:top-6">
                  به‌زودی
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
