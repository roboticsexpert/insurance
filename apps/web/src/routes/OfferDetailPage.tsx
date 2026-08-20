import { useQuery } from '@tanstack/react-query'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { Link, useNavigate, useParams } from 'react-router'
import { useCountdown } from '../components/quote/useCountdown'
import { ChevronIcon } from '../components/icons'
import { ApiError } from '../lib/api'
import { getQuote, type PremiumLineItem, type QuoteOffer } from '../lib/quotes-api'
import { formatCountdown, formatToman, toPersianDigits } from '../lib/fa'

const BADGE_LABELS: Record<string, string> = {
  CHEAPEST: 'ارزان‌ترین',
  RECOMMENDED: 'پیشنهاد ما',
}

export function OfferDetailPage() {
  const { id = '', offerId = '' } = useParams()
  const navigate = useNavigate()

  const quote = useQuery({ queryKey: ['quote', id], queryFn: () => getQuote(id), staleTime: Infinity })
  const offer = quote.data?.offers.find((o) => o.id === offerId)

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page">
        <header className="safe-top flex items-center gap-2 px-5 pb-3 pt-3">
          <button
            type="button"
            onClick={() => navigate(`/quotes/${id}`)}
            aria-label="بازگشت"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-muted"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-strong">{offer?.insurer.name ?? 'جزئیات'}</h1>
        </header>

        {quote.isPending ? <DetailSkeleton /> : null}

        {quote.isError ? (
          <Message
            text={quote.error instanceof ApiError ? quote.error.messageFa : 'استعلام پیدا نشد.'}
          />
        ) : null}

        {quote.data && !offer ? <Message text="این گزینه در استعلام پیدا نشد." /> : null}

        {quote.data && offer ? (
          <Body
            offer={offer}
            expiresAt={quote.data.expiresAt}
            isExpired={quote.data.isExpired}
            quoteId={id}
          />
        ) : null}
      </div>
    </div>
  )
}

function Body({
  offer,
  expiresAt,
  isExpired,
  quoteId,
}: {
  offer: QuoteOffer
  expiresAt: string
  isExpired: boolean
  quoteId: string
}) {
  const remaining = useCountdown(expiresAt)
  const expired = isExpired || remaining === 0

  if (!offer.isEligible) {
    return (
      <div className="flex-1 px-5 pt-4">
        <div className="rounded-[var(--radius-card)] border border-line bg-card p-5">
          <p className="text-sm font-semibold text-strong">این شرکت به شما بیمه‌نامه نمی‌دهد</p>
          <p className="mt-2 text-sm leading-7 text-muted">{offer.ineligibleReasonFa}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 px-5 pb-4">
        <section className="rounded-[var(--radius-card)] border border-line bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-strong">{offer.insurer.name}</p>
              <p className="mt-1 text-xs leading-6 text-muted">
                {offer.insurer.solvencyLevel !== null
                  ? `توانگری مالی سطح ${toPersianDigits(offer.insurer.solvencyLevel)}`
                  : null}
                {offer.insurer.claimSatisfaction !== null
                  ? ` · رضایت از پرداخت خسارت ${toPersianDigits(offer.insurer.claimSatisfaction)}٪`
                  : null}
                {offer.insurer.branchCount !== null
                  ? ` · ${toPersianDigits(offer.insurer.branchCount)} شعبه`
                  : null}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {offer.badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-brand-50 px-2 py-0.5 text-[0.65rem] font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200"
                >
                  {BADGE_LABELS[badge] ?? badge}
                </span>
              ))}
            </div>
          </div>
        </section>

        <Section title="پوشش‌ها">
          <dl className="divide-y divide-line">
            {offer.coverages.map((coverage) => (
              <div key={coverage.key} className="flex items-start justify-between gap-4 py-2.5">
                <dt className={`text-sm ${coverage.highlight ? 'font-medium text-strong' : 'text-muted'}`}>
                  {coverage.labelFa}
                </dt>
                <dd className="text-sm font-medium text-strong">{coverage.valueFa}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title="ریز حق بیمه">
          <dl className="divide-y divide-line">
            {offer.lineItems.map((item) => (
              <LineRow key={item.key} item={item} />
            ))}
            <div className="flex items-center justify-between py-3">
              <dt className="text-sm font-semibold text-strong">مبلغ قابل پرداخت</dt>
              <dd className="text-base font-bold text-strong">{formatToman(offer.totalAmount)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-[0.7rem] leading-6 text-muted">
            مالیات و عوارض قانونی جدا از حق بیمه محاسبه و در همین صورت‌حساب نمایش داده می‌شود.
          </p>
        </Section>

        {offer.featuresFa.length > 0 ? (
          <Section title="ویژگی‌ها">
            <ul className="space-y-2">
              {offer.featuresFa.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-muted">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand-600" />
                  {feature}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </div>

      <div className="safe-bottom sticky bottom-0 border-t border-line bg-page/95 px-5 pb-3 pt-3 backdrop-blur">
        {expired ? (
          <>
            <Link
              to="/p/travel/form"
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white"
            >
              استعلام دوباره
            </Link>
            <p className="mt-2 text-center text-xs text-muted">مهلت این قیمت تمام شده است.</p>
          </>
        ) : (
          <>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm text-muted">مبلغ قابل پرداخت</span>
              <span className="text-lg font-bold text-strong">{formatToman(offer.totalAmount)}</span>
            </div>
            <Link
              to={`/checkout/${quoteId}/${offer.id}`}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white shadow-[0_6px_20px_-8px_var(--color-brand-600)] active:scale-[0.985]"
            >
              خرید و پرداخت
            </Link>
            <p className="mt-2 text-center text-xs text-muted">
              اعتبار این قیمت: <span className="tabular-nums">{formatCountdown(remaining)}</span>
            </p>
          </>
        )}
      </div>
    </>
  )
}

function LineRow({ item }: { item: PremiumLineItem }) {
  const isDiscount = item.kind === 'DISCOUNT'
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <dt className="text-sm text-muted">{item.labelFa}</dt>
      <dd
        className={`text-sm font-medium ${isDiscount ? 'text-brand-600' : 'text-strong'}`}
        dir="rtl"
      >
        {isDiscount ? '−' : ''}
        {formatToman(Math.abs(item.amount))}
      </dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-semibold text-strong">{title}</h2>
      <div className="rounded-[var(--radius-card)] border border-line bg-card px-4">{children}</div>
    </section>
  )
}

function DetailSkeleton() {
  return (
    <SkeletonScreen>
      <div className="flex-1 space-y-4 px-5 pt-4">
        <Skeleton className="h-20 rounded-[var(--radius-card)]" />
        <Skeleton className="h-40 rounded-[var(--radius-card)]" />
        <Skeleton className="h-32 rounded-[var(--radius-card)]" />
      </div>
    </SkeletonScreen>
  )
}

function Message({ text }: { text: string }) {
  return (
    <div role="alert" className="flex-1 px-5 pt-6 text-center">
      <p className="text-sm text-strong">{text}</p>
      <Link
        to="/p/travel/form"
        className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
      >
        استعلام جدید
      </Link>
    </div>
  )
}
