import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../app/auth-context'
import { OptionList } from '../components/wizard/OptionList'
import { SkeletonCards } from '../components/ui/Skeleton'
import { SearchableOptions } from '../components/wizard/SearchableOptions'
import { WizardShell } from '../components/wizard/WizardShell'
import { ChevronIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { ErrorNote } from '../components/ui/ErrorNote'
import { JalaliDateField } from '../components/ui/JalaliDateField'
import { PlateField } from '../components/ui/PlateField'
import { ApiError } from '../lib/api'
import { toPersianDigits } from '../lib/fa'
import { currentJalaliYear } from '../lib/jalali'
import { EMPTY_PLATE, isValidPlate, type Plate } from '../lib/plate'
import { createQuote, getReference, type ReferenceItem } from '../lib/quotes-api'
import { getVehicles, saveVehicle, type SavedVehicle } from '../lib/vehicles-api'

const MAX_BODILY_DISCOUNT_YEARS = 14
const MAX_PROPERTY_DISCOUNT_YEARS = 8
/** Nothing older is insurable in practice, and the input schema stops at 1350 regardless. */
const OLDEST_PRODUCTION_YEAR = 1350

type StepId = 'vehicle' | 'usage' | 'identity' | 'history' | 'tier' | 'start'

export function MotorWizardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { status } = useAuth()
  const signedIn = status === 'authenticated'
  const [stepIndex, setStepIndex] = useState(0)

  const [modelId, setModelId] = useState<string | null>(null)
  const [usage, setUsage] = useState<string | null>(null)
  const [productionYear, setProductionYear] = useState<string>('')
  const [plate, setPlate] = useState<Plate>(EMPTY_PLATE)
  const [hasPrevious, setHasPrevious] = useState<boolean | null>(null)
  const [bodilyYears, setBodilyYears] = useState(0)
  const [propertyYears, setPropertyYears] = useState(0)
  const [tier, setTier] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string | null>(null)

  const models = useQuery({
    queryKey: ['ref', 'vehicle-models'],
    queryFn: () => getReference('vehicle-models'),
    // The catalog does not change mid-session; re-fetching it between steps is pure latency.
    staleTime: Infinity,
  })
  const usages = useQuery({
    queryKey: ['ref', 'vehicle-usages'],
    queryFn: () => getReference('vehicle-usages'),
  })
  const tiers = useQuery({
    queryKey: ['ref', 'property-tiers'],
    queryFn: () => getReference('property-tiers'),
  })

  /*
   * Quoting stays open to anyone, so the saved list is only fetched for a signed-in visitor —
   * and `enabled` alone would still serve a previous session's cache, hence the `signedIn`
   * guard on the read as well.
   */
  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles, enabled: signedIn })
  const saved = signedIn ? (vehicles.data ?? []) : []

  const applySaved = (vehicle: SavedVehicle) => {
    setModelId(vehicle.vehicleModelId)
    setUsage(vehicle.usage)
    setProductionYear(String(vehicle.productionYear))
    setPlate(vehicle.plate)
    // Straight past the three screens it just answered — re-asking them is the whole point of
    // having saved it. The remaining steps are cover choices, which are per-policy, not per-car.
    setStepIndex(steps.indexOf('history'))
  }

  // Arriving from «استعلام دوباره» on the saved list: prefill once the list has loaded.
  const requestedId = (location.state as { vehicleId?: string } | null)?.vehicleId
  const [appliedId, setAppliedId] = useState<string | null>(null)
  if (requestedId && requestedId !== appliedId && saved.length > 0) {
    const match = saved.find((v) => v.id === requestedId)
    setAppliedId(requestedId)
    if (match) applySaved(match)
  }

  const model = models.data?.find((m) => m.value === modelId)
  const group = model?.meta?.group as string | undefined

  /*
   * A motorcycle can only be insured for personal use, so asking is a question with one answer.
   * The step list is built per-render instead of being a constant: skipping the screen keeps the
   * progress bar honest, which a disabled step or a one-option list would not.
   */
  const isMotorcycle = group === 'MOTORCYCLE'
  const steps = useMemo<StepId[]>(
    () =>
      isMotorcycle
        ? ['vehicle', 'identity', 'history', 'tier', 'start']
        : ['vehicle', 'usage', 'identity', 'history', 'tier', 'start'],
    [isMotorcycle],
  )

  // Clamped because choosing a motorcycle last drops a step out from under the current index.
  const index = Math.min(stepIndex, steps.length - 1)
  const step = steps[index] as StepId
  const isLast = index === steps.length - 1
  const effectiveUsage = isMotorcycle ? 'PERSONAL' : usage

  const quote = useMutation({
    mutationFn: () =>
      createQuote('motor-tpl', {
        vehicleUsage: effectiveUsage,
        vehicleGroup: group,
        vehicleModelId: modelId,
        productionYear: Number(productionYear),
        plate,
        startDate,
        hasPreviousPolicy: hasPrevious ?? false,
        bodilyDiscountYears: hasPrevious ? bodilyYears : 0,
        propertyDiscountYears: hasPrevious ? propertyYears : 0,
        propertyCoverageTier: tier,
      }),
    onSuccess: (created) => {
      /*
       * Saving is a convenience, not part of the purchase: it must never delay the prices or
       * fail the quote the customer just waited for. Fire-and-forget, and a failure costs them
       * one retyped plate next time rather than this quote.
       */
      if (signedIn && modelId) {
        void saveVehicle({
          vehicleModelId: modelId,
          plate,
          productionYear: Number(productionYear),
          usage: effectiveUsage as string,
        })
          .then(() => queryClient.invalidateQueries({ queryKey: ['vehicles'] }))
          .catch(() => undefined)
      }
      navigate(`/quotes/${created.id}`, { replace: true })
    },
  })

  const complete: Record<StepId, boolean> = {
    vehicle: modelId !== null,
    usage: usage !== null,
    identity: productionYear !== '' && isValidPlate(plate),
    history: hasPrevious !== null,
    tier: tier !== null,
    start: startDate !== null,
  }

  const error = quote.error instanceof ApiError ? quote.error : undefined
  const fieldMessages = error?.fields ? Object.values(error.fields) : []

  return (
    <WizardShell
      title={TITLES[step]}
      hint={HINTS[step]}
      step={index + 1}
      totalSteps={steps.length}
      onBack={() => (index === 0 ? navigate('/') : setStepIndex(index - 1))}
      footer={
        <>
          <Button
            disabled={!complete[step] || quote.isPending}
            loading={quote.isPending}
            onClick={() => (isLast ? quote.mutate() : setStepIndex(index + 1))}
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
      {step === 'vehicle' ? (
        models.data ? (
          <>
            {saved.length > 0 ? (
              <div className="mb-6">
                <p className="mb-2 text-xs font-semibold text-muted">خودروهای ذخیره‌شده</p>
                <div className="space-y-2">
                  {saved.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      type="button"
                      onClick={() => applySaved(vehicle)}
                      className="flex w-full items-center gap-3 rounded-2xl border border-line bg-card px-4 py-3 text-right active:scale-[0.99]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-strong">
                          {vehicle.modelLabelFa}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted">{vehicle.plateFa}</span>
                      </span>
                      <ChevronIcon className="h-4 w-4 shrink-0 text-muted" />
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted">یا خودروی دیگری انتخاب کنید:</p>
              </div>
            ) : null}

            <SearchableOptions
              options={models.data}
              value={modelId}
              onChange={setModelId}
              placeholderFa="جست‌وجوی خودرو یا برند…"
            />
          </>
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'usage' ? (
        usages.data ? (
          <OptionList options={usages.data} value={usage} onChange={setUsage} />
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'identity' ? (
        <div className="space-y-6">
          <YearSelect value={productionYear} onChange={setProductionYear} />
          <PlateField value={plate} onChange={setPlate} />
        </div>
      ) : null}

      {step === 'history' ? (
        <div className="space-y-5">
          <OptionList
            options={PREVIOUS_POLICY_OPTIONS}
            value={hasPrevious === null ? null : hasPrevious ? 'yes' : 'no'}
            onChange={(next) => {
              const yes = next === 'yes'
              setHasPrevious(yes)
              // Leaving stale years behind would send a discount the customer just said they
              // do not have — which the API rejects, from a screen that looks answered.
              if (!yes) {
                setBodilyYears(0)
                setPropertyYears(0)
              }
            }}
          />

          {hasPrevious ? (
            <div className="space-y-5 rounded-2xl border border-line bg-card p-4">
              <YearsSelect
                label="سال‌های عدم خسارت جانی"
                max={MAX_BODILY_DISCOUNT_YEARS}
                value={bodilyYears}
                onChange={setBodilyYears}
              />
              <YearsSelect
                label="سال‌های عدم خسارت مالی"
                max={MAX_PROPERTY_DISCOUNT_YEARS}
                value={propertyYears}
                onChange={setPropertyYears}
              />
              <p className="text-xs leading-6 text-muted">
                این عددها روی بیمه‌نامه قبلی شما نوشته شده است. اگر مطمئن نیستید، صفر بگذارید —
                تخفیف هنگام صدور از سامانه سنهاب بررسی می‌شود.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 'tier' ? (
        tiers.data ? (
          <>
            <OptionList options={tiers.data} value={tier} onChange={setTier} />
            <p className="mt-4 text-xs leading-6 text-muted">
              تعهد مالی سقف خسارتی است که بابت آسیب به خودرو و اموال دیگران پرداخت می‌شود.
            </p>
          </>
        ) : (
          <SkeletonCards count={4} height="h-14" className="space-y-2.5" />
        )
      ) : null}

      {step === 'start' ? (
        <div className="space-y-5">
          <JalaliDateField label="تاریخ شروع بیمه‌نامه" value={startDate} onChange={setStartDate} />
          <p className="text-xs leading-6 text-muted">
            بیمه‌نامه شخص ثالث یک‌ساله است و از این تاریخ به مدت یک سال اعتبار دارد.
          </p>
        </div>
      ) : null}
    </WizardShell>
  )
}

const TITLES: Record<StepId, string> = {
  vehicle: 'چه خودرویی دارید؟',
  usage: 'کاربری خودرو چیست؟',
  identity: 'مشخصات خودرو',
  history: 'بیمه‌نامه شخص ثالث قبلی دارید؟',
  tier: 'تعهد مالی را انتخاب کنید',
  start: 'بیمه‌نامه از چه تاریخی شروع شود؟',
}

const HINTS: Record<StepId, string | undefined> = {
  vehicle: 'برند یا نام خودرو را جست‌وجو کنید.',
  usage: 'کاربری روی نرخ بیمه اثر مستقیم دارد.',
  identity: 'سال ساخت و شماره پلاک را همان‌طور که روی کارت خودرو نوشته شده وارد کنید.',
  history: 'سابقه عدم خسارت، بزرگ‌ترین عامل کاهش حق بیمه است.',
  tier: undefined,
  start: undefined,
}

const PREVIOUS_POLICY_OPTIONS: ReferenceItem[] = [
  { value: 'yes', labelFa: 'بله، بیمه‌نامه قبلی دارم' },
  { value: 'no', labelFa: 'خیر، اولین بیمه‌نامه من است' },
]

const selectClass =
  'w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-base text-strong outline-none transition-colors focus:border-brand-500'

/** A list, not a number field: the year is on the card in front of them, ready to pick. */
function YearSelect({ value, onChange }: { value: string; onChange: (next: string) => void }) {
  // Next year is a real answer — cars are sold ahead of their model year.
  const newest = currentJalaliYear() + 1
  const years = Array.from({ length: newest - OLDEST_PRODUCTION_YEAR + 1 }, (_, i) => newest - i)

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-strong">سال ساخت</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        <option value="">انتخاب کنید</option>
        {years.map((year) => (
          <option key={year} value={year}>
            {toPersianDigits(year)}
          </option>
        ))}
      </select>
    </label>
  )
}

function YearsSelect({
  label,
  max,
  value,
  onChange,
}: {
  label: string
  max: number
  value: number
  onChange: (next: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-strong">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={selectClass}
      >
        {Array.from({ length: max + 1 }, (_, years) => (
          <option key={years} value={years}>
            {years === 0 ? 'بدون سابقه' : `${toPersianDigits(years)} سال`}
          </option>
        ))}
      </select>
    </label>
  )
}
