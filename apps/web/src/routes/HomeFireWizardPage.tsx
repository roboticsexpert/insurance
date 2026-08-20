import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { MultiOptionList } from '../components/wizard/MultiOptionList'
import { OptionList } from '../components/wizard/OptionList'
import { SkeletonCards } from '../components/ui/Skeleton'
import { SearchableOptions } from '../components/wizard/SearchableOptions'
import { WizardShell } from '../components/wizard/WizardShell'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { JalaliDateField } from '../components/ui/JalaliDateField'
import { MoneyField } from '../components/ui/MoneyField'
import { TextField } from '../components/ui/TextField'
import { ApiError } from '../lib/api'
import { formatToman, toLatinDigits, toPersianDigits } from '../lib/fa'
import { createQuote, getReference } from '../lib/quotes-api'

const MIN_AREA_SQM = 20
const MAX_AREA_SQM = 2000

type StepId = 'property' | 'city' | 'values' | 'perils' | 'start'

const STEPS: StepId[] = ['property', 'city', 'values', 'perils', 'start']

export function HomeFireWizardPage() {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)

  const [propertyType, setPropertyType] = useState<string | null>(null)
  const [cityId, setCityId] = useState<string | null>(null)
  const [area, setArea] = useState('')
  const [buildingValue, setBuildingValue] = useState<number | null>(null)
  const [contentsValue, setContentsValue] = useState<number | null>(null)
  const [perils, setPerils] = useState<string[]>([])
  const [startDate, setStartDate] = useState<string | null>(null)

  const propertyTypes = useQuery({
    queryKey: ['ref', 'property-types'],
    queryFn: () => getReference('property-types'),
  })
  const cities = useQuery({
    queryKey: ['ref', 'cities'],
    queryFn: () => getReference('cities'),
    staleTime: Infinity,
  })
  const extraPerils = useQuery({
    queryKey: ['ref', 'extra-perils'],
    queryFn: () => getReference('extra-perils'),
  })

  const step = STEPS[stepIndex] as StepId
  const isLast = stepIndex === STEPS.length - 1
  const areaNumber = Number(toLatinDigits(area))
  const sumInsured = (buildingValue ?? 0) + (contentsValue ?? 0)

  const quote = useMutation({
    mutationFn: () =>
      createQuote('home-fire', {
        propertyType,
        cityId,
        areaSqm: areaNumber,
        buildingValue: buildingValue ?? 0,
        contentsValue: contentsValue ?? 0,
        extraPerils: perils,
        durationMonths: 12,
        startDate,
      }),
    onSuccess: (created) => navigate(`/quotes/${created.id}`, { replace: true }),
  })

  const areaIsValid =
    Number.isInteger(areaNumber) && areaNumber >= MIN_AREA_SQM && areaNumber <= MAX_AREA_SQM

  const complete: Record<StepId, boolean> = {
    property: propertyType !== null,
    city: cityId !== null,
    // A home insured for nothing is not a policy; the API refuses it and so does this screen.
    values: areaIsValid && sumInsured > 0,
    // Extra perils are genuinely optional — fire, lightning and explosion are always included.
    perils: true,
    start: startDate !== null,
  }

  const error = quote.error instanceof ApiError ? quote.error : undefined
  const fieldMessages = error?.fields ? Object.values(error.fields) : []

  return (
    <WizardShell
      title={TITLES[step]}
      hint={HINTS[step]}
      step={stepIndex + 1}
      totalSteps={STEPS.length}
      onBack={() => (stepIndex === 0 ? navigate('/') : setStepIndex(stepIndex - 1))}
      footer={
        <>
          <Button
            disabled={!complete[step] || quote.isPending}
            loading={quote.isPending}
            onClick={() => (isLast ? quote.mutate() : setStepIndex(stepIndex + 1))}
          >
            {isLast ? 'مشاهده قیمت‌ها' : 'ادامه'}
          </Button>
          {error && fieldMessages.length === 0 ? <ErrorNote>{error.messageFa}</ErrorNote> : null}
          {fieldMessages.map((message) => (
            <ErrorNote key={message}>{message}</ErrorNote>
          ))}
        </>
      }
    >
      {step === 'property' ? (
        propertyTypes.data ? (
          <OptionList
            options={propertyTypes.data}
            value={propertyType}
            onChange={setPropertyType}
          />
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'city' ? (
        cities.data ? (
          <SearchableOptions
            options={cities.data}
            value={cityId}
            onChange={setCityId}
            placeholderFa="جست‌وجوی شهر یا استان…"
          />
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'values' ? (
        <div className="space-y-6">
          <TextField
            label="متراژ (متر مربع)"
            inputMode="numeric"
            value={toPersianDigits(area)}
            onChange={(event) =>
              setArea(toLatinDigits(event.target.value).replace(/\D/g, '').slice(0, 4))
            }
            error={
              area !== '' && !areaIsValid
                ? `متراژ باید بین ${toPersianDigits(MIN_AREA_SQM)} تا ${toPersianDigits(MAX_AREA_SQM)} متر باشد`
                : undefined
            }
          />

          <MoneyField
            label="ارزش ساختمان"
            hint="ارزش بازسازی بنا را وارد کنید، نه قیمت خرید ملک — در زمان خسارت هزینه ساخت مبنا است."
            value={buildingValue}
            onChange={setBuildingValue}
            placeholderToman="۲٬۵۰۰٬۰۰۰٬۰۰۰"
          />

          <MoneyField
            label="ارزش اثاثیه"
            hint="لوازم خانگی، مبلمان و وسایل شخصی."
            value={contentsValue}
            onChange={setContentsValue}
            placeholderToman="۴۰۰٬۰۰۰٬۰۰۰"
          />

          {sumInsured > 0 ? (
            <p className="rounded-2xl bg-sunken px-4 py-3 text-sm text-muted">
              سرمایه کل:{' '}
              <span className="font-semibold text-strong">{formatToman(sumInsured)}</span>
            </p>
          ) : (
            <p className="text-xs leading-6 text-muted">
              اگر مستأجر هستید، فقط ارزش اثاثیه را وارد کنید؛ ساختمان بر عهده مالک است.
            </p>
          )}
        </div>
      ) : null}

      {step === 'perils' ? (
        extraPerils.data ? (
          <div className="space-y-5">
            <div className="rounded-2xl bg-sunken px-4 py-3 text-xs leading-6 text-muted">
              آتش‌سوزی، صاعقه و انفجار در همه بیمه‌نامه‌ها پوشش داده می‌شود. موارد زیر اختیاری است.
            </div>
            <MultiOptionList
              options={extraPerils.data}
              values={perils}
              onToggle={(peril) =>
                setPerils((prev) =>
                  prev.includes(peril) ? prev.filter((p) => p !== peril) : [...prev, peril],
                )
              }
            />
            {perils.includes('EARTHQUAKE') ? (
              <p className="text-xs leading-6 text-muted">
                نرخ زلزله به پهنه لرزه‌ای شهر انتخابی شما بستگی دارد.
              </p>
            ) : null}
          </div>
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'start' ? (
        <div className="space-y-5">
          <JalaliDateField label="تاریخ شروع بیمه‌نامه" value={startDate} onChange={setStartDate} />
          <p className="text-xs leading-6 text-muted">
            بیمه‌نامه آتش‌سوزی یک‌ساله است و از این تاریخ به مدت یک سال اعتبار دارد.
          </p>
        </div>
      ) : null}
    </WizardShell>
  )
}

const TITLES: Record<StepId, string> = {
  property: 'چه ملکی را بیمه می‌کنید؟',
  city: 'ملک در کدام شهر است؟',
  values: 'متراژ و سرمایه',
  perils: 'پوشش‌های اضافی',
  start: 'بیمه‌نامه از چه تاریخی شروع شود؟',
}

const HINTS: Record<StepId, string | undefined> = {
  property: undefined,
  city: 'شهر، نرخ پوشش زلزله را تعیین می‌کند.',
  values: 'سرمایه‌ای که وارد می‌کنید سقف خسارت قابل پرداخت است.',
  perils: undefined,
  start: undefined,
}
