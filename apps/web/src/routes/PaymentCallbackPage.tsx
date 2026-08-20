import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { CheckCircleIcon, ClockIcon, XCircleIcon } from '../components/icons'
import { ApiError } from '../lib/api'
import { formatToman, toPersianDigits } from '../lib/fa'
import { verifyPayment, type VerifyPaymentResult } from '../lib/orders-api'

/**
 * Where the bank sends the customer back.
 *
 * Verification runs here and needs no session: the money moved whether or not their login
 * survived the round trip through a banking app.
 */
export function PaymentCallbackPage() {
  const [params] = useSearchParams()
  const authority = params.get('Authority') ?? params.get('authority') ?? ''
  const status = params.get('Status') ?? params.get('status') ?? undefined

  /*
   * A query, not a mutation, even though it POSTs.
   *
   * Verification is idempotent, so it has query semantics — and modelling it as a mutation
   * fired from an effect loses the result when StrictMode unmounts, leaving the screen stuck
   * on "checking…" after the request already succeeded. Keyed by authority, it also survives a
   * remount and refuses to fire twice.
   */
  const verify = useQuery({
    queryKey: ['payment-verify', authority],
    queryFn: () => verifyPayment(authority, status),
    enabled: authority.length > 0,
    staleTime: Infinity,
    retry: false,
  })

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col items-center justify-center bg-page px-6 py-10 text-center">
        {!authority ? (
          <Result
            tone="error"
            title="اطلاعات پرداخت ناقص است"
            body="این صفحه باید از درگاه بانکی باز شود."
            actions={<HomeLink />}
          />
        ) : verify.isPending ? (
          <Result
            tone="pending"
            title="در حال بررسی پرداخت…"
            body="چند لحظه صبر کنید. این صفحه را نبندید."
          />
        ) : verify.isError ? (
          <Result
            tone="error"
            title="بررسی پرداخت ممکن نشد"
            body={
              verify.error instanceof ApiError
                ? verify.error.messageFa
                : 'ارتباط با سرور برقرار نشد.'
            }
            actions={
              <>
                <Primary onClick={() => void verify.refetch()}>تلاش دوباره</Primary>
                <HomeLink />
              </>
            }
          />
        ) : verify.data ? (
          <Settled result={verify.data} />
        ) : null}
      </div>
    </div>
  )
}

function Settled({ result }: { result: VerifyPaymentResult }) {
  if (result.paymentStatus !== 'SUCCEEDED') {
    return (
      <Result
        tone="error"
        title="پرداخت انجام نشد"
        body={result.messageFa}
        actions={
          <>
            {/* A declined card should not cost the customer their quote. */}
            <Link
              to={`/checkout/${result.quoteId}/${result.quoteOfferId}`}
              className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white"
            >
              پرداخت دوباره
            </Link>
            <HomeLink />
          </>
        }
      />
    )
  }

  /*
   * Paid, but no policy yet. The money is safe and support picks it up — saying "successful"
   * with nothing to show would be worse than saying plainly what is happening.
   */
  if (!result.policyId) {
    return (
      <Result
        tone="pending"
        title="پرداخت انجام شد"
        body="بیمه‌نامه شما در حال صدور است. به‌محض آماده شدن پیامک می‌شود."
        refId={result.refId}
        amount={result.amount}
        actions={<PoliciesLink />}
      />
    )
  }

  return (
    <Result
      tone="success"
      title="بیمه‌نامه شما صادر شد"
      body={result.productTitleFa}
      refId={result.refId}
      amount={result.amount}
      actions={
        <>
          <Link
            to={`/policies/${result.policyId}`}
            className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white"
          >
            مشاهده بیمه‌نامه
          </Link>
          <HomeLink />
        </>
      }
    />
  )
}

const TONES = {
  success: { Icon: CheckCircleIcon, className: 'text-brand-600' },
  error: { Icon: XCircleIcon, className: 'text-red-600 dark:text-red-400' },
  pending: { Icon: ClockIcon, className: 'text-muted' },
} as const

function Result({
  tone,
  title,
  body,
  refId,
  amount,
  actions,
}: {
  tone: keyof typeof TONES
  title: string
  body: string
  refId?: string | null
  amount?: number
  actions?: React.ReactNode
}) {
  const { Icon, className } = TONES[tone]

  return (
    <div className="w-full" role="status">
      <Icon className={`mx-auto h-16 w-16 ${className}`} />
      <h1 className="mt-5 text-lg font-bold text-strong">{title}</h1>
      <p className="mt-2 text-sm leading-7 text-muted">{body}</p>

      {amount !== undefined || refId ? (
        <dl className="mt-5 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card px-4 text-right">
          {amount !== undefined ? (
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">مبلغ پرداختی</dt>
              <dd className="text-sm font-semibold text-strong">{formatToman(amount)}</dd>
            </div>
          ) : null}
          {refId ? (
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-sm text-muted">شماره پیگیری</dt>
              <dd className="text-sm font-semibold tabular-nums text-strong">
                {toPersianDigits(refId)}
              </dd>
            </div>
          ) : null}
        </dl>
      ) : null}

      {actions ? <div className="mt-6 space-y-2.5">{actions}</div> : null}
    </div>
  )
}

const Primary = ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="min-h-[52px] w-full rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white"
  >
    {children}
  </button>
)

const HomeLink = () => (
  <Link
    to="/"
    className="flex min-h-[44px] w-full items-center justify-center text-sm font-medium text-brand-600"
  >
    بازگشت به خانه
  </Link>
)

const PoliciesLink = () => (
  <Link
    to="/policies"
    className="flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-brand-600 text-[0.95rem] font-semibold text-white"
  >
    بیمه‌نامه‌های من
  </Link>
)
