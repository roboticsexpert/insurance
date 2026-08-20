import { useMutation, useQuery } from '@tanstack/react-query'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { Link, useNavigate, useParams } from 'react-router'
import { ChevronIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { ApiError } from '../lib/api'
import { formatJalali, formatToman, toPersianDigits } from '../lib/fa'
import { getPolicy, getPolicyDocument, type PolicyDetail } from '../lib/policies-api'

export function PolicyDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()

  const policy = useQuery({ queryKey: ['policy', id], queryFn: () => getPolicy(id) })

  /*
   * The document route needs an Authorization header, so it cannot be a plain link. Fetch it,
   * wrap it in a blob URL and open that — the browser's own print dialog then produces the PDF
   * a customer needs for a visa appointment.
   */
  const openDocument = useMutation({
    mutationFn: async () => {
      const html = await getPolicyDocument(id)
      const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
      // Revoking immediately would race the load on some browsers.
      setTimeout(() => URL.revokeObjectURL(url), 60_000)

      /*
       * A new tab is nicer, but popup blockers are common on mobile. Telling the customer to
       * change a browser setting is a bad answer when the same tab works everywhere — this is
       * a SPA, so the back button returns them exactly where they were.
       */
      const opened = window.open(url, '_blank')
      if (!opened) window.location.assign(url)
    },
  })

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page">
        <header className="safe-top flex items-center gap-2 px-5 pb-3 pt-3">
          <button
            type="button"
            onClick={() => navigate('/policies')}
            aria-label="بازگشت"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-muted"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-strong">
            {policy.data?.productTitleFa ?? 'بیمه‌نامه'}
          </h1>
        </header>

        {policy.isPending ? <PageSkeleton /> : null}

        {policy.isError ? (
          <div role="alert" className="flex-1 px-5 pt-6 text-center">
            <p className="text-sm text-strong">
              {policy.error instanceof ApiError ? policy.error.messageFa : 'بیمه‌نامه پیدا نشد.'}
            </p>
            <Link
              to="/policies"
              className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
            >
              بیمه‌نامه‌های من
            </Link>
          </div>
        ) : null}

        {policy.data ? <Body policy={policy.data} /> : null}

        {policy.data ? (
          <div className="safe-bottom sticky bottom-0 border-t border-line bg-page/95 px-5 pb-3 pt-3 backdrop-blur">
            <Button loading={openDocument.isPending} onClick={() => openDocument.mutate()}>
              مشاهده و چاپ بیمه‌نامه
            </Button>
            {openDocument.error instanceof ApiError ? (
              <ErrorNote>{openDocument.error.messageFa}</ErrorNote>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Body({ policy }: { policy: PolicyDetail }) {
  return (
    <div className="flex-1 px-5 pb-4">
      <section className="rounded-[var(--radius-card)] border border-line bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">شماره بیمه‌نامه</span>
          <span className="rounded-full bg-sunken px-2 py-0.5 text-[0.65rem] text-muted">
            {policy.statusFa}
          </span>
        </div>
        <p className="mt-1 text-base font-bold tabular-nums text-strong" dir="ltr">
          {policy.policyNumber}
        </p>
        <p className="mt-2 text-xs text-muted">
          {policy.insurerName} · {formatJalali(policy.startsAt)} تا {formatJalali(policy.endsAt)}
        </p>
      </section>

      <Section title="بیمه‌شدگان">
        {policy.insured.map((person, index) => (
          <div key={index} className="flex items-start justify-between gap-3 py-2.5">
            <span className="text-sm text-strong">
              {[person.firstName, person.lastName].filter(Boolean).join(' ')}
            </span>
            <span className="text-left text-xs leading-6 text-muted">
              {person.nationalCode ? toPersianDigits(person.nationalCode) : null}
              {person.passportNo ? (
                <span className="block" dir="ltr">
                  {person.passportNo}
                </span>
              ) : null}
            </span>
          </div>
        ))}
      </Section>

      <Section title="پوشش‌ها">
        {policy.coverages.map((coverage) => (
          <div key={coverage.key} className="flex items-start justify-between gap-4 py-2.5">
            <span className="text-sm text-muted">{coverage.labelFa}</span>
            <span className="text-sm font-medium text-strong">{coverage.valueFa}</span>
          </div>
        ))}
      </Section>

      <Section title="حق بیمه">
        {policy.lineItems.map((item) => (
          <div key={item.key} className="flex items-center justify-between gap-4 py-2.5">
            <span className="text-sm text-muted">{item.labelFa}</span>
            <span className="text-sm font-medium text-strong">
              {item.kind === 'DISCOUNT' ? '−' : ''}
              {formatToman(Math.abs(item.amount))}
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between py-3">
          <span className="text-sm font-semibold text-strong">مبلغ پرداخت‌شده</span>
          <span className="text-base font-bold text-strong">{formatToman(policy.amount)}</span>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-sm font-semibold text-strong">{title}</h2>
      <div className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-card px-4">
        {children}
      </div>
    </section>
  )
}

function PageSkeleton() {
  return (
    <SkeletonScreen>
      <div className="flex-1 space-y-4 px-5 pt-2">
        <Skeleton className="h-24 rounded-[var(--radius-card)]" />
        <Skeleton className="h-32 rounded-[var(--radius-card)]" />
      </div>
    </SkeletonScreen>
  )
}
