import { Link } from 'react-router'
import type { ProductCard as ProductCardData } from '../lib/catalog-api'
import { formatToman } from '../lib/fa'
import { hasWizard } from '../lib/wizards'
import { CarIcon, ChevronIcon, FireIcon, PlaneIcon } from './icons'

const ICONS: Record<string, typeof PlaneIcon> = {
  plane: PlaneIcon,
  car: CarIcon,
  fire: FireIcon,
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const Icon = ICONS[product.iconKey] ?? PlaneIcon

  /*
   * A product with no headline price is one the engine genuinely cannot quote yet, so it is
   * shown as «به‌زودی» rather than linking to a wizard that would fail. The price comes from
   * the data, not from a hardcoded list of which products are "ready" — but the *form* is this
   * app's own business, and rate tables land a release before the wizard that feeds them, so
   * both have to be true before the card becomes a link.
   */
  const quotable = product.fromAmount !== null && hasWizard(product.slug)

  const body = (
    <>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon className="h-7 w-7" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-semibold text-strong">{product.titleFa}</span>
        <span className="mt-0.5 block truncate text-xs text-muted">{product.subtitleFa}</span>

        <span className="mt-2 flex items-center gap-2">
          {quotable ? (
            <>
              <span className="text-sm font-semibold text-strong">
                از {formatToman(product.fromAmount as number)}
              </span>
              {product.fromAmountIsSample ? (
                <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.65rem] text-muted">
                  نرخ نمونه
                </span>
              ) : null}
            </>
          ) : (
            <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.7rem] text-muted">
              به‌زودی
            </span>
          )}
        </span>
      </span>

      {quotable ? <ChevronIcon className="h-5 w-5 shrink-0 text-muted" /> : null}
    </>
  )

  const className =
    'flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)]'

  if (!quotable) {
    return <div className={`${className} opacity-60`}>{body}</div>
  }

  return (
    <Link to={`/p/${product.slug}/form`} className={`${className} active:scale-[0.99]`}>
      {body}
    </Link>
  )
}
