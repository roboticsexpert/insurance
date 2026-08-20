import { useMutation, useQuery } from '@tanstack/react-query'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../app/auth-context'
import { ChevronIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { JalaliDateField } from '../components/ui/JalaliDateField'
import { TextField } from '../components/ui/TextField'
import { ApiError } from '../lib/api'
import { checkoutShape } from '../lib/checkout'
import { formatJalali, formatToman, toLatinDigits, toPersianDigits } from '../lib/fa'
import { createOrder, payOrder, type InsuredPerson } from '../lib/orders-api'
import { getQuote } from '../lib/quotes-api'

/** Birth date is null until collected, so it cannot be sent half-filled. */
type Draft = Omit<InsuredPerson, 'birthDate'> & { birthDate: string | null }

export function CheckoutPage() {
  const { quoteId = '', offerId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const quote = useQuery({ queryKey: ['quote', quoteId], queryFn: () => getQuote(quoteId), staleTime: Infinity })
  const offer = quote.data?.offers.find((o) => o.id === offerId)

  /*
   * Generated once and reused across retries. A regenerated key would defeat the server's
   * idempotency and let a flaky connection create two orders for one purchase.
   */
  const idempotencyKey = useRef(crypto.randomUUID())

  const [people, setPeople] = useState<Draft[] | null>(null)

  // What this product needs named, and how its cover period reads. Travel knows the birth dates
  // already — age set the price, so they are shown and locked; motor and home have to ask.
  const shape = useMemo(
    () => (quote.data ? checkoutShape(quote.data.productType, quote.data.input) : null),
    [quote.data],
  )

  const initial = useMemo<Draft[] | null>(() => {
    if (!shape) return null
    // Prefilling the buyer saves the common case: they are usually the first person named.
    return shape.seeds.map((seed, index) => ({
      firstName: index === 0 ? (user?.firstName ?? '') : '',
      lastName: index === 0 ? (user?.lastName ?? '') : '',
      nationalCode: index === 0 ? (user?.nationalCode ?? '') : '',
      birthDate: seed.birthDate ?? (index === 0 ? (user?.birthDate ?? null) : null),
      passportNo: '',
    }))
  }, [shape, user])

  const drafts = people ?? initial ?? []
  const update = (index: number, patch: Partial<Draft>) =>
    setPeople(drafts.map((person, i) => (i === index ? { ...person, ...patch } : person)))

  const complete =
    drafts.length > 0 &&
    drafts.every(
      (p) =>
        p.firstName.trim().length >= 2 &&
        p.lastName.trim().length >= 2 &&
        p.nationalCode.length === 10 &&
        p.birthDate !== null &&
        (!shape?.requiresPassport || (p.passportNo ?? '').length >= 5),
    )

  const purchase = useMutation({
    mutationFn: async () => {
      const order = await createOrder({
        quoteOfferId: offerId,
        insured: drafts.map(({ passportNo, ...p }) => ({
          ...p,
          firstName: p.firstName.trim(),
          lastName: p.lastName.trim(),
          // `birthDate` is non-null by the time the button enables; `complete` gates on it.
          birthDate: p.birthDate as string,
          // The server allows no passport but rejects an empty one, so omit rather than send ''.
          ...(passportNo ? { passportNo } : {}),
        })),
        idempotencyKey: idempotencyKey.current,
      })
      return payOrder(order.id)
    },
    // A full page navigation, not a router push: the bank owns the next screen.
    onSuccess: ({ redirectUrl }) => window.location.assign(redirectUrl),
  })

  const error = purchase.error instanceof ApiError ? purchase.error : undefined

  if (quote.isPending) return <PageSkeleton />
  // The API knows exactly why — expired, not yours, gone. Repeat it rather than guessing.
  if (quote.isError) {
    return (
      <Missing
        message={
          quote.error instanceof ApiError ? quote.error.messageFa : 'این استعلام در دسترس نیست.'
        }
      />
    )
  }
  if (!offer || !quote.data || !shape) return <Missing message="این گزینه در استعلام پیدا نشد." />

  const expired = quote.data.isExpired
  // Back to the wizard this quote came from — not, as it was, always the travel one.
  const requoteHref = `/p/${quote.data.productSlug}/form`

  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page">
        <header className="safe-top flex items-center gap-2 px-5 pb-3 pt-3">
          <button
            type="button"
            onClick={() => navigate(`/quotes/${quoteId}/offers/${offerId}`)}
            aria-label="بازگشت"
            className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-muted"
          >
            <ChevronIcon className="h-5 w-5 rotate-180" />
          </button>
          <h1 className="text-lg font-bold text-strong">تکمیل خرید</h1>
        </header>

        <div className="flex-1 px-5 pb-4">
          <section className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-strong">{quote.data.productTitleFa}</span>
              <span className="text-sm text-muted">{offer.insurer.name}</span>
            </div>
            <p className="mt-1.5 text-xs text-muted">
              {toPersianDigits(drafts.length)} {shape.subjectFa}
              {shape.periodFa ? ` · ${shape.periodFa}` : ''}
            </p>
          </section>

          {expired ? (
            <div role="alert" className="mt-4 rounded-2xl border border-line bg-card p-4 text-center">
              <p className="text-sm font-semibold text-strong">مهلت این قیمت تمام شد</p>
              <Link
                to={requoteHref}
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
              >
                استعلام دوباره
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold text-strong">{shape.headingFa}</h2>
              <p className="mb-3 text-xs leading-6 text-muted">{shape.hintFa}</p>

              <div className="space-y-4">
                {drafts.map((person, index) => (
                  <div key={index} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-strong">
                        {shape.subjectFa}
                        {drafts.length > 1 ? ` ${toPersianDigits(index + 1)}` : ''}
                      </span>
                      {shape.seeds[index]?.birthDateLocked && person.birthDate ? (
                        <span className="text-xs text-muted">
                          متولد {formatJalali(person.birthDate)}
                        </span>
                      ) : null}
                    </div>

                    <TextField
                      label="نام"
                      value={person.firstName}
                      onChange={(e) => update(index, { firstName: e.target.value })}
                      autoComplete={index === 0 ? 'given-name' : 'off'}
                    />
                    <TextField
                      label="نام خانوادگی"
                      value={person.lastName}
                      onChange={(e) => update(index, { lastName: e.target.value })}
                      autoComplete={index === 0 ? 'family-name' : 'off'}
                    />
                    <TextField
                      label="کد ملی"
                      inputMode="numeric"
                      dir="ltr"
                      className="text-center"
                      value={toPersianDigits(person.nationalCode)}
                      onChange={(e) =>
                        update(index, {
                          nationalCode: toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 10),
                        })
                      }
                    />
                    {shape.seeds[index]?.birthDateLocked ? null : (
                      <JalaliDateField
                        label="تاریخ تولد"
                        value={person.birthDate}
                        onChange={(iso) => update(index, { birthDate: iso })}
                      />
                    )}

                    {shape.requiresPassport ? (
                      <TextField
                        label="شماره گذرنامه"
                        dir="ltr"
                        className="text-center uppercase"
                        value={person.passportNo ?? ''}
                        onChange={(e) =>
                          update(index, { passportNo: e.target.value.toUpperCase().slice(0, 15) })
                        }
                        hint="روی صفحه اول گذرنامه"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!expired ? (
          <div className="safe-bottom sticky bottom-0 border-t border-line bg-page/95 px-5 pb-3 pt-3 backdrop-blur">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-sm text-muted">مبلغ قابل پرداخت</span>
              <span className="text-lg font-bold text-strong">{formatToman(offer.totalAmount)}</span>
            </div>
            <Button
              disabled={!complete || purchase.isPending}
              loading={purchase.isPending}
              onClick={() => purchase.mutate()}
            >
              پرداخت
            </Button>
            {error ? (
              <ErrorNote>
                {/* The server says which person and which field; a generic sentence throws that
                    away and leaves the buyer guessing which card to fix. */}
                {Object.values(error.fields ?? {}).join(' · ') || error.messageFa}
              </ErrorNote>
            ) : null}
            <p className="mt-2 text-center text-xs text-muted">
              به درگاه بانکی منتقل می‌شوید.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function PageSkeleton() {
  return (
    <SkeletonScreen>
      <div className="min-h-dvh bg-page">
        <div className="mx-auto w-full max-w-[430px] space-y-4 px-5 pt-16">
          <Skeleton className="h-20 rounded-[var(--radius-card)]" />
          <Skeleton className="h-64 rounded-[var(--radius-card)]" />
        </div>
      </div>
    </SkeletonScreen>
  )
}

function Missing({ message }: { message: string }) {
  return (
    <div className="min-h-dvh bg-page">
      <div role="alert" className="mx-auto w-full max-w-[430px] px-5 pt-16 text-center">
        <p className="text-sm leading-7 text-strong">{message}</p>
        {/* The quote is what names the product, and it is exactly what is missing here — so
            this goes to the product list rather than guessing at a wizard. */}
        <Link
          to="/"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
        >
          استعلام جدید
        </Link>
      </div>
    </div>
  )
}
