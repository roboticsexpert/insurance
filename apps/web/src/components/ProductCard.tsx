import { Link } from 'react-router'
import carArt from '../assets/products/car.webp'
import houseArt from '../assets/products/house.webp'
import planeArt from '../assets/products/plane.webp'
import type { ProductCard as ProductCardData } from '../lib/catalog-api'
import { formatToman } from '../lib/fa'
import { hasWizard } from '../lib/wizards'
import { CarIcon, ChevronIcon, FireIcon, PlaneIcon } from './icons'

/*
 * Gold 3D objects, one per product, on a real alpha channel so they sit on the card in either
 * theme. A product whose `iconKey` has no art yet falls back to its stroke icon in a brand tile,
 * so a new catalogue entry still renders instead of showing a broken image.
 */
const ART: Record<string, string> = { car: carArt, plane: planeArt, fire: houseArt }
const ICONS: Record<string, typeof PlaneIcon> = { plane: PlaneIcon, car: CarIcon, fire: FireIcon }

export function ProductCard({
  product,
  featured = false,
}: {
  product: ProductCardData
  /** Full-width, art beside the copy. The home page gives this to the one product it leads with. */
  featured?: boolean
}) {
  /*
   * A product with no headline price is one the engine genuinely cannot quote yet, so it is
   * shown as «به‌زودی» rather than linking to a wizard that would fail. The price comes from
   * the data, not from a hardcoded list of which products are "ready" — but the *form* is this
   * app's own business, and rate tables land a release before the wizard that feeds them, so
   * both have to be true before the card becomes a link.
   */
  const quotable = product.fromAmount !== null && hasWizard(product.slug)

  const price = quotable ? (
    featured ? (
      <span className="mt-4 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
        از {formatToman(product.fromAmount as number)}
        <ChevronIcon className="h-3.5 w-3.5" />
      </span>
    ) : (
      <span className="mt-1 block text-xs text-muted">از {formatToman(product.fromAmount as number)}</span>
    )
  ) : (
    <span
      className={`${featured ? 'mt-4' : 'mt-1.5'} inline-block rounded-full bg-sunken px-2 py-0.5 text-[0.7rem] text-muted`}
    >
      به‌زودی
    </span>
  )

  const shell = `rounded-[var(--radius-sheet)] border border-line bg-card shadow-[var(--shadow-card)] ${
    quotable ? (featured ? 'active:scale-[0.99]' : 'active:scale-[0.98]') : 'opacity-60 shadow-none'
  }`

  const body = featured ? (
    <>
      <span className="min-w-0 flex-1">
        <span className="block text-lg font-bold text-strong">{product.titleFa}</span>
        <span className="mt-1 block text-xs leading-5 text-muted">{product.subtitleFa}</span>
        {price}
      </span>
      <Art iconKey={product.iconKey} size={132} className="-my-3 -ml-3" />
    </>
  ) : (
    <>
      <Art iconKey={product.iconKey} size={96} className="-mt-1 self-center" />
      <span className="mt-2 block text-[0.95rem] font-bold text-strong">{product.titleFa}</span>
      {price}
    </>
  )

  const layout = featured
    ? `col-span-2 flex items-center gap-2 overflow-hidden p-5 ${shell}`
    : `flex flex-col p-4 ${shell}`

  if (!quotable) return <div className={layout}>{body}</div>

  return (
    <Link to={`/p/${product.slug}/form`} className={layout}>
      {body}
    </Link>
  )
}

function Art({ iconKey, size, className }: { iconKey: string; size: number; className: string }) {
  const src = ART[iconKey]
  if (src) {
    // Decorative: the title beside it already names the product.
    return <img src={src} width={size} height={size} alt="" className={`shrink-0 ${className}`} />
  }

  const Icon = ICONS[iconKey] ?? PlaneIcon
  return (
    <span
      className="grid h-14 w-14 shrink-0 place-items-center self-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300"
      aria-hidden
    >
      <Icon className="h-8 w-8" />
    </span>
  )
}
