import { useQuery } from '@tanstack/react-query'
import { ActivePolicyStrip } from '../components/ActivePolicyStrip'
import { ErrorState } from '../components/ErrorState'
import { CheckCircleIcon } from '../components/icons'
import { ProductCard } from '../components/ProductCard'
import { BrandLogo } from '../components/BrandLogo'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { ApiError } from '../lib/api'
import { getProducts, type ProductCard as Product } from '../lib/catalog-api'

/** The product the page leads with: third-party cover is mandatory for every car on the road. */
const FEATURED_SLUG = 'motor-tpl'

/*
 * Only what the «پشتیبانی» answers already promise — the page repeats commitments the product
 * makes, it does not invent new ones or pad itself with statistics.
 */
const PROMISES = ['صدور فوری', 'همان نرخ مصوب', 'پول شما محفوظ است']

export function HomePage() {
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts })

  return (
    <div>
      {/* The lockup carries the name, so the Persian one beside it would only repeat it. */}
      <header className="safe-top px-5 pb-5 pt-4">
        <BrandLogo className="h-7 w-auto text-strong" />
      </header>

      <ActivePolicyStrip />

      <section aria-labelledby="products-heading">
        <div className="px-5 pb-5">
          <h1 id="products-heading" className="text-[1.35rem] font-extrabold leading-9 text-strong">
            چه چیزی را بیمه کنیم؟
          </h1>
          <p className="mt-1 text-sm text-muted">قیمت بگیرید، مقایسه کنید، همین‌جا بخرید.</p>
        </div>

        {products.isPending ? <ProductSkeletons /> : null}

        {products.isError ? (
          <ErrorState
            title="بارگذاری بیمه‌ها ممکن نشد"
            message={
              products.error instanceof ApiError
                ? products.error.messageFa
                : 'دریافت اطلاعات ممکن نشد.'
            }
            onRetry={() => void products.refetch()}
            retrying={products.isFetching}
          />
        ) : null}

        {products.data ? <ProductGrid products={products.data} /> : null}
      </section>

      {products.data ? (
        <ul className="mt-6 flex flex-wrap gap-2 px-5" aria-label="تعهدهای بیمه گلد">
          {PROMISES.map((promise) => (
            <li
              key={promise}
              className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-2 text-xs text-strong"
            >
              <CheckCircleIcon className="h-4 w-4 text-brand-600 dark:text-brand-300" />
              {promise}
            </li>
          ))}
        </ul>
      ) : null}

      {products.data?.some((p) => p.fromAmountIsSample) ? (
        <p className="mt-5 px-5 text-[0.7rem] leading-6 text-muted">
          نرخ‌های نمایش‌داده‌شده نمونه است و پیش از خرید نهایی با نرخ رسمی شرکت بیمه جایگزین
          می‌شود.
        </p>
      ) : null}
    </div>
  )
}

function ProductGrid({ products }: { products: Product[] }) {
  // Lead with third-party cover when the catalogue has it; otherwise whatever comes first.
  const featured = products.find((p) => p.slug === FEATURED_SLUG) ?? products[0]
  const rest = products.filter((p) => p !== featured)

  return (
    <div className="grid grid-cols-2 gap-3 px-5">
      {featured ? <ProductCard product={featured} featured /> : null}
      {rest.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

/** Skeletons rather than a spinner: the grid keeps its shape, so nothing jumps on arrival. */
function ProductSkeletons() {
  return (
    <SkeletonScreen>
      <div className="grid grid-cols-2 gap-3 px-5">
        <div className="col-span-2 flex items-center gap-3 rounded-[var(--radius-sheet)] border border-line bg-card p-5">
          <div className="flex-1 space-y-2.5">
            <Skeleton className="h-4 w-2/5 rounded" />
            <Skeleton className="h-3 w-3/5 rounded" />
            <Skeleton className="mt-4 h-7 w-1/3 rounded-full" />
          </div>
          <Skeleton className="h-24 w-24 shrink-0 rounded-2xl" />
        </div>
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col rounded-[var(--radius-sheet)] border border-line bg-card p-4">
            <Skeleton className="h-20 w-20 self-center rounded-2xl" />
            <Skeleton className="mt-3 h-3.5 w-3/5 rounded" />
            <Skeleton className="mt-2 h-3 w-2/5 rounded" />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}
