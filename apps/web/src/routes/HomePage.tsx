import { useQuery } from '@tanstack/react-query'
import { ActivePolicyStrip } from '../components/ActivePolicyStrip'
import { ErrorState } from '../components/ErrorState'
import { ProductCard } from '../components/ProductCard'
import { BrandMark } from '../components/icons'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { ApiError } from '../lib/api'
import { getProducts } from '../lib/catalog-api'

export function HomePage() {
  const products = useQuery({ queryKey: ['products'], queryFn: getProducts })

  return (
    <div>
      <header className="safe-top flex items-center gap-3 px-5 pb-5 pt-4">
        <BrandMark className="h-9 w-9 text-brand-600" />
        <div>
          <p className="text-lg font-bold leading-tight text-strong">بیمه ۲۴۷</p>
          <p className="text-xs text-muted">خرید آنلاین بیمه، بدون رفت‌وآمد</p>
        </div>
      </header>

      <ActivePolicyStrip />

      <section className="px-5">
        <h2 className="mb-3 text-sm font-semibold text-strong">چه بیمه‌ای می‌خواهید؟</h2>

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

        {products.data ? (
          <div className="space-y-3">
            {products.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
      </section>

      {products.data?.some((p) => p.fromAmountIsSample) ? (
        <p className="mt-5 px-5 text-[0.7rem] leading-6 text-muted">
          نرخ‌های نمایش‌داده‌شده نمونه است و پیش از خرید نهایی با نرخ رسمی شرکت بیمه جایگزین
          می‌شود.
        </p>
      ) : null}
    </div>
  )
}

/** Skeletons rather than a spinner: the list keeps its shape, so nothing jumps on arrival. */
function ProductSkeletons() {
  return (
    <SkeletonScreen>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-2/5 rounded" />
              <Skeleton className="h-3 w-3/5 rounded" />
              <Skeleton className="h-3.5 w-1/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}
