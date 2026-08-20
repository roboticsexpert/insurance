import { useMutation, useQuery } from '@tanstack/react-query'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../app/auth-context'
import { ChevronIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { TextField } from '../components/ui/TextField'
import { ApiError } from '../lib/api'
import { formatJalali, formatToman, toLatinDigits, toPersianDigits } from '../lib/fa'
import { createOrder, payOrder, type InsuredPerson } from '../lib/orders-api'
import { getQuote } from '../lib/quotes-api'

interface TravelInput {
  travelers: { birthDate: string }[]
}

type Draft = InsuredPerson

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

  // Birth dates come from the quote and are not editable: age set the price, so changing one
  // here would be rejected by the server anyway. Prefilling the buyer saves the common case.
  const initial = useMemo<Draft[] | null>(() => {
    const input = quote.data?.input as TravelInput | undefined
    if (!input?.travelers) return null
    return input.travelers.map((traveler, index) => ({
      firstName: index === 0 ? (user?.firstName ?? '') : '',
      lastName: index === 0 ? (user?.lastName ?? '') : '',
      nationalCode: index === 0 ? (user?.nationalCode ?? '') : '',
      birthDate: traveler.birthDate,
      passportNo: '',
    }))
  }, [quote.data, user])

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
        (p.passportNo ?? '').length >= 5,
    )

  const purchase = useMutation({
    mutationFn: async () => {
      const order = await createOrder({
        quoteOfferId: offerId,
        insured: drafts.map((p) => ({ ...p, firstName: p.firstName.trim(), lastName: p.lastName.trim() })),
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
  if (!offer || !quote.data) return <Missing message="این گزینه در استعلام پیدا نشد." />

  const expired = quote.data.isExpired

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
              {toPersianDigits(drafts.length)} بیمه‌شده ·{' '}
              {formatJalali((quote.data.input as { startDate: string }).startDate)} تا{' '}
              {formatJalali((quote.data.input as { endDate: string }).endDate)}
            </p>
          </section>

          {expired ? (
            <div role="alert" className="mt-4 rounded-2xl border border-line bg-card p-4 text-center">
              <p className="text-sm font-semibold text-strong">مهلت این قیمت تمام شد</p>
              <Link
                to="/p/travel/form"
                className="mt-3 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
              >
                استعلام دوباره
              </Link>
            </div>
          ) : (
            <>
              <h2 className="mb-2 mt-6 text-sm font-semibold text-strong">مشخصات بیمه‌شدگان</h2>
              <p className="mb-3 text-xs leading-6 text-muted">
                همان‌طور که در گذرنامه آمده وارد کنید؛ این اطلاعات روی بیمه‌نامه درج می‌شود.
              </p>

              <div className="space-y-4">
                {drafts.map((person, index) => (
                  <div key={index} className="space-y-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-strong">
                        بیمه‌شده {toPersianDigits(index + 1)}
                      </span>
                      <span className="text-xs text-muted">
                        متولد {formatJalali(person.birthDate)}
                      </span>
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
            {error ? <ErrorNote>{error.messageFa}</ErrorNote> : null}
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
        <Link
          to="/p/travel/form"
          className="mt-4 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
        >
          استعلام جدید
        </Link>
      </div>
    </div>
  )
}
