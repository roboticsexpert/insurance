import { useQuery } from '@tanstack/react-query'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { Link, useNavigate, useParams } from 'react-router'
import { ErrorState } from '../components/ErrorState'
import { OfferCard } from '../components/quote/OfferCard'
import { useCountdown } from '../components/quote/useCountdown'
import { ChevronIcon } from '../components/icons'
import { ApiError } from '../lib/api'
import { getQuote, type Quote } from '../lib/quotes-api'
import { formatCountdown, formatJalali, formatTomanCompact, toPersianDigits } from '../lib/fa'
import { formatPlateFa, type Plate } from '../lib/plate'

const ZONE_LABELS: Record<string, string> = {
  SCHENGEN: 'اروپا (شنگن)',
  ASIA: 'آسیا',
  AMERICAS: 'آمریکا و کانادا',
  WORLDWIDE: 'سراسر جهان',
  HAJJ_OMRAH: 'حج و عمره',
}

interface TravelInput {
  destinationZone: string
  startDate: string
  endDate: string
  travelers: { birthDate: string }[]
}

/** Display labels only. The API remains the authority on what these values mean. */
const VEHICLE_GROUP_LABELS: Record<string, string> = {
  SEDAN: 'سواری',
  PICKUP: 'وانت',
  VAN: 'ون / مینی‌بوس',
  TRUCK: 'کامیون',
  MOTORCYCLE: 'موتورسیکلت',
}

interface MotorInput {
  vehicleGroup: string
  plate: Plate
  startDate: string
}

const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'آپارتمان',
  VILLA: 'ویلایی',
}

interface HomeFireInput {
  propertyType: string
  areaSqm: number
  buildingValue: number
  contentsValue: number
  startDate: string
}

export function QuotePage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const quote = useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuote(id),
    // The stored price never changes, so there is nothing to refetch for.
    staleTime: Infinity,
  })

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-page pb-10">
        <header className="safe-top flex items-center gap-2 px-5 pb-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/p/travel/form')}
            aria-label="بازگشت"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-muted"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-strong">
            {quote.data?.productTitleFa ?? 'مقایسه قیمت'}
          </h1>
        </header>

        {quote.isPending ? <OfferSkeletons /> : null}

        {quote.isError ? (
          <ErrorState
            title="این استعلام باز نشد"
            message={quote.error instanceof ApiError ? quote.error.messageFa : 'استعلام پیدا نشد.'}
            onRetry={() => void quote.refetch()}
            retrying={quote.isFetching}
          />
        ) : null}

        {quote.data ? <QuoteBody quote={quote.data} /> : null}
      </div>
    </div>
  )
}

function QuoteBody({ quote }: { quote: Quote }) {
  const remaining = useCountdown(quote.expiresAt)
  const expired = quote.isExpired || remaining === 0
  const eligibleCount = quote.offers.filter((o) => o.isEligible).length
  // Every product has its own wizard; the quote knows which one it came from.
  const editHref = `/p/${quote.productSlug}/form`

  return (
    <>
      <section className="px-5">
        <div className="rounded-2xl bg-sunken px-4 py-3 text-xs leading-6 text-muted">
          <QuoteSummary quote={quote} />{' '}
          <Link to={editHref} className="mr-2 font-medium text-brand-600">
            ویرایش
          </Link>
        </div>
      </section>

      {expired ? (
        <section className="mt-4 px-5">
          <div
            role="alert"
            className="rounded-2xl border border-line bg-card p-4 text-center"
          >
            <p className="text-sm font-semibold text-strong">مهلت این استعلام تمام شد</p>
            <p className="mt-1.5 text-xs leading-6 text-muted">
              قیمت‌ها فقط برای مدت محدودی معتبرند. برای دیدن قیمت‌های به‌روز دوباره استعلام
              بگیرید.
            </p>
            <Link
              to={editHref}
              className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
            >
              استعلام دوباره
            </Link>
          </div>
        </section>
      ) : (
        <section className="mt-4 flex items-center justify-between px-5">
          <p className="text-sm text-muted">
            {toPersianDigits(eligibleCount)} شرکت قیمت داده‌اند
          </p>
          {/* Real, not decorative: at zero the stored price stops being purchasable. */}
          <p className="text-xs text-muted">
            اعتبار قیمت‌ها:{' '}
            <span className="font-semibold tabular-nums text-strong">
              {formatCountdown(remaining)}
            </span>
          </p>
        </section>
      )}

      {quote.isSampleRates ? (
        <p className="mt-3 px-5 text-[0.7rem] leading-6 text-muted">
          این نرخ‌ها نمونه است و پیش از خرید نهایی با نرخ رسمی شرکت بیمه جایگزین می‌شود.
        </p>
      ) : null}

      <section className={`mt-3 space-y-3 px-5 ${expired ? 'pointer-events-none opacity-50' : ''}`}>
        {quote.offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} quoteId={quote.id} />
        ))}
      </section>
    </>
  )
}

/**
 * The «you asked for this» strip above the prices, one shape per product.
 *
 * It was written against travel and read `input.travelers.length` off whatever the quote
 * carried, which crashed the whole comparison screen the first time a motor quote reached it.
 * Switching on `productType` — and falling through to nothing rather than guessing — means a
 * product added later degrades to a missing line instead of a blank page.
 */
function QuoteSummary({ quote }: { quote: Quote }) {
  if (quote.productType === 'TRAVEL') {
    const input = quote.input as TravelInput
    return (
      <>
        {ZONE_LABELS[input.destinationZone] ?? input.destinationZone} ·{' '}
        {toPersianDigits(input.travelers.length)} مسافر ·{' '}
        {formatJalali(input.startDate)} تا {formatJalali(input.endDate)}
      </>
    )
  }

  if (quote.productType === 'MOTOR_TPL') {
    const input = quote.input as MotorInput
    return (
      <>
        {/*
          No `dir="ltr"` here, unlike the plate *input*. The widget mimics the physical object,
          which is read left to right; this is running Persian prose, where a plate is written
          «۴۴ ص ۸۲۱ ایران ۱۱» and read right to left like everything around it. Forcing LTR
          reordered the leading digits to the far end — «ص ۸۲۱ ایران ۱۱ ۴۴».
        */}
        {VEHICLE_GROUP_LABELS[input.vehicleGroup] ?? input.vehicleGroup} ·{' '}
        {formatPlateFa(input.plate)} · از {formatJalali(input.startDate)}
      </>
    )
  }

  if (quote.productType === 'HOME_FIRE') {
    const input = quote.input as HomeFireInput
    return (
      <>
        {PROPERTY_TYPE_LABELS[input.propertyType] ?? input.propertyType} ·{' '}
        {toPersianDigits(input.areaSqm)} متر ·{' '}
        {/* The sum insured is what the price is built on, so it is what the strip shows. */}
        سرمایه {formatTomanCompact(input.buildingValue + input.contentsValue)} · از{' '}
        {formatJalali(input.startDate)}
      </>
    )
  }

  return <>{quote.productTitleFa}</>
}

function OfferSkeletons() {
  return (
    <SkeletonScreen>
      <div className="space-y-3 px-5 pt-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <Skeleton className="h-4 w-1/3 rounded" />
            <Skeleton className="mt-2 h-3 w-2/3 rounded" />
            <Skeleton className="mt-4 h-5 w-1/4 rounded" />
          </div>
        ))}
      </div>
    </SkeletonScreen>
  )
}
