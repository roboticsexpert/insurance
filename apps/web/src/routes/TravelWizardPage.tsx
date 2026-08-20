import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { OptionList } from '../components/wizard/OptionList'
import { SkeletonCards } from '../components/ui/Skeleton'
import { WizardShell } from '../components/wizard/WizardShell'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { JalaliDateField } from '../components/ui/JalaliDateField'
import { ApiError } from '../lib/api'
import { createQuote, getReference } from '../lib/quotes-api'
import { formatJalali, toPersianDigits } from '../lib/fa'

const TOTAL_STEPS = 4
const MAX_TRAVELERS = 10

interface TravelerDraft {
  /** Local id so React keys survive removal from the middle of the list. */
  id: number
  birthDate: string | null
}

export function TravelWizardPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const [zone, setZone] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [travelers, setTravelers] = useState<TravelerDraft[]>([{ id: 1, birthDate: null }])
  const [coverage, setCoverage] = useState<string | null>(null)

  const zones = useQuery({ queryKey: ['ref', 'travel-zones'], queryFn: () => getReference('travel-zones') })
  const coverages = useQuery({
    queryKey: ['ref', 'travel-coverages'],
    queryFn: () => getReference('travel-coverages'),
  })

  const quote = useMutation({
    mutationFn: () =>
      createQuote('travel', {
        destinationZone: zone,
        startDate,
        endDate,
        coverageLimit: coverage,
        travelers: travelers.map((t) => ({ birthDate: t.birthDate })),
      }),
    onSuccess: (created) => navigate(`/quotes/${created.id}`, { replace: true }),
  })

  const back = () => (step === 1 ? navigate('/') : setStep((s) => s - 1))

  const tripDays =
    startDate && endDate
      ? Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000)
      : 0

  const stepIsComplete =
    step === 1
      ? zone !== null
      : step === 2
        ? startDate !== null && endDate !== null && tripDays >= 1
        : step === 3
          ? travelers.every((t) => t.birthDate !== null)
          : coverage !== null

  const error = quote.error instanceof ApiError ? quote.error : undefined
  // The API reports field paths like `travelers[0].birthDate`; show them all rather than one.
  const fieldMessages = error?.fields ? Object.values(error.fields) : []

  return (
    <WizardShell
      title={STEP_TITLES[step - 1] as string}
      hint={STEP_HINTS[step - 1]}
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={back}
      footer={
        <>
          <Button
            disabled={!stepIsComplete || quote.isPending}
            loading={quote.isPending}
            onClick={() => (step < TOTAL_STEPS ? setStep((s) => s + 1) : quote.mutate())}
          >
            {step < TOTAL_STEPS ? 'ادامه' : 'مشاهده قیمت‌ها'}
          </Button>
          {error && fieldMessages.length === 0 ? <ErrorNote>{error.messageFa}</ErrorNote> : null}
          {fieldMessages.map((message) => (
            <ErrorNote key={message}>{message}</ErrorNote>
          ))}
        </>
      }
    >
      {step === 1 ? (
        zones.data ? (
          <OptionList options={zones.data} value={zone} onChange={setZone} />
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          <JalaliDateField label="تاریخ رفت" value={startDate} onChange={setStartDate} />
          <JalaliDateField label="تاریخ بازگشت" value={endDate} onChange={setEndDate} />
          {tripDays > 0 ? (
            <p className="rounded-2xl bg-sunken px-4 py-3 text-sm text-muted">
              مدت سفر: <span className="font-semibold text-strong">{toPersianDigits(tripDays)} روز</span>
              {startDate ? ` — از ${formatJalali(startDate)}` : ''}
            </p>
          ) : null}
          {startDate && endDate && tripDays < 1 ? (
            <ErrorNote>تاریخ بازگشت باید بعد از تاریخ رفت باشد.</ErrorNote>
          ) : null}
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-5">
          {travelers.map((traveler, index) => (
            <div key={traveler.id} className="rounded-2xl border border-line bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-strong">
                  مسافر {toPersianDigits(index + 1)}
                </span>
                {travelers.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setTravelers((list) => list.filter((t) => t.id !== traveler.id))}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    حذف
                  </button>
                ) : null}
              </div>
              <JalaliDateField
                label="تاریخ تولد"
                value={traveler.birthDate}
                onChange={(iso) =>
                  setTravelers((list) =>
                    list.map((t) => (t.id === traveler.id ? { ...t, birthDate: iso } : t)),
                  )
                }
              />
            </div>
          ))}

          {travelers.length < MAX_TRAVELERS ? (
            <button
              type="button"
              onClick={() =>
                setTravelers((list) => [
                  ...list,
                  { id: Math.max(...list.map((t) => t.id)) + 1, birthDate: null },
                ])
              }
              className="min-h-[44px] w-full rounded-2xl border border-dashed border-line text-sm font-medium text-brand-600"
            >
              افزودن مسافر
            </button>
          ) : null}

          <p className="text-xs leading-6 text-muted">
            برای گرفتن قیمت فقط تاریخ تولد لازم است. نام و مشخصات هنگام خرید گرفته می‌شود.
          </p>
        </div>
      ) : null}

      {step === 4 ? (
        coverages.data ? (
          <OptionList options={coverages.data} value={coverage} onChange={setCoverage} />
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}
    </WizardShell>
  )
}

const STEP_TITLES = ['به کجا سفر می‌کنید؟', 'چه تاریخی؟', 'چند نفر مسافر؟', 'سقف پوشش درمانی؟']

const STEP_HINTS = [
  'مقصد اصلی سفرتان را انتخاب کنید.',
  'تاریخ رفت و بازگشت را وارد کنید.',
  undefined,
  'اغلب سفارت‌های شنگن حداقل ۳۰ هزار یورو را می‌پذیرند.',
]
