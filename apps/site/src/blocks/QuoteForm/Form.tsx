'use client'

import React, { useState } from 'react'

import type { QuoteFormBlock as Props } from '@/payload-types'
import type { ReferenceItem, ReferenceOptions } from '@/lib/reference'

import {
  CarIcon,
  FireIcon,
  PlaneIcon,
  MinusIcon,
  PlusIcon,
  type IconProps,
} from '@/components/icons'
import { JalaliDateField } from '@/components/JalaliDateField'
import { toLatinDigits, toPersianDigits } from '@/lib/fa'
import { getAppURL } from '@/utilities/getURL'
import { cn } from '@/utilities/ui'

type ProductKey = 'motor-tpl' | 'travel' | 'home-fire'

const PRODUCTS: { key: ProductKey; label: string; path: string; Icon: React.FC<IconProps> }[] = [
  { key: 'motor-tpl', label: 'شخص ثالث', path: '/p/motor-tpl/form', Icon: CarIcon },
  { key: 'travel', label: 'مسافرتی', path: '/p/travel/form', Icon: PlaneIcon },
  { key: 'home-fire', label: 'آتش‌سوزی منزل', path: '/p/home-fire/form', Icon: FireIcon },
]

/* حدهای خود ویزارد (`apps/web/src/routes/MotorWizardPage.tsx`). */
const OLDEST_PRODUCTION_YEAR = 1350
const MAX_BODILY_DISCOUNT_YEARS = 14

const currentJalaliYear = (): number => {
  const parts = new Intl.DateTimeFormat('en-u-ca-persian', {
    year: 'numeric',
    timeZone: 'Asia/Tehran',
  }).formatToParts(new Date())
  return Number(parts.find((p) => p.type === 'year')?.value ?? 1405)
}

const Field: React.FC<{
  children: React.ReactNode
  className?: string
  id: string
  label: string
}> = ({ children, className, id, label }) => (
  <div className={cn('flex flex-col gap-2', className)}>
    <label className="text-sm font-medium" htmlFor={id}>
      {label}
    </label>
    {children}
  </div>
)

const selectClass =
  'h-13 rounded-card border border-border bg-card px-4 text-base text-foreground focus:border-brand-500 focus:outline-none'

const inputClass = `${selectClass} w-full tabular-nums`

/**
 * مبلغ به **تومان** گرفته می‌شود و به **ریال** فرستاده، دقیقاً مثل `MoneyField`
 * ویزارد (`apps/web/src/components/ui/MoneyField.tsx`): کسی در ایران عدد را به
 * ریال نمی‌گوید، ولی API ریال می‌خواهد. رقم‌ها حین تایپ سه‌تاسه‌تا جدا می‌شوند،
 * چون یک صفر اضافه در ارزش ساختمان تا روز خسارت معلوم نمی‌شود.
 *
 * فیلد دیده‌شده نامی ندارد؛ آنچه فرستاده می‌شود فیلد پنهان کنارش است. بدون
 * جاوااسکریپت هیچ مبلغی فرستاده نمی‌شود و ویزارد خودش می‌پرسد.
 */
/**
 * یک انتخابگر که گزینه‌هایش از `reference` API آمده — مقدارها همان مقدارهایی‌اند که
 * ویزارد می‌فرستد (`SCHENGEN`، `APARTMENT`، شناسه شهر…)، پس چیزی اینجا ساخته نمی‌شود.
 *
 * فهرست خالی یعنی API جواب نداده؛ آن‌وقت فیلد اصلاً ساخته نمی‌شود و همان سؤال را
 * ویزارد می‌پرسد — همان رفتاری که پیش از وصل‌شدن به API داشتیم.
 */
const ReferenceSelect: React.FC<{
  hint?: string
  id: string
  items: ReferenceItem[]
  label: string
  name: string
  wide?: boolean
}> = ({ hint, id, items, label, name, wide }) => {
  if (!items.length) return null

  const groups = items.reduce<Map<string, ReferenceItem[]>>((acc, item) => {
    const key = item.groupFa ?? ''
    acc.set(key, [...(acc.get(key) ?? []), item])
    return acc
  }, new Map())
  const grouped = groups.size > 1 || !groups.has('')

  return (
    <Field className={wide ? 'col-span-2' : undefined} id={id} label={label}>
      <select className={selectClass} id={id} name={name}>
        {grouped
          ? [...groups].map(([group, list]) => (
              <optgroup key={group} label={group}>
                {list.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.labelFa}
                  </option>
                ))}
              </optgroup>
            ))
          : items.map((item) => (
              <option key={item.value} value={item.value}>
                {item.labelFa}
              </option>
            ))}
      </select>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Field>
  )
}

const MoneyField: React.FC<{ hint?: string; id: string; label: string; name: string }> = ({
  hint,
  id,
  label,
  name,
}) => {
  const [toman, setToman] = useState('')
  const grouped = toman === '' ? '' : toPersianDigits(toman.replace(/\B(?=(\d{3})+(?!\d))/g, '٬'))

  return (
    <Field id={id} label={label}>
      <div className="relative">
        <input
          className={`${inputClass} pl-16`}
          id={id}
          inputMode="numeric"
          onChange={(e) => setToman(toLatinDigits(e.target.value).replace(/\D/g, '').slice(0, 15))}
          type="text"
          value={grouped}
        />
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-muted-foreground">
          تومان
        </span>
      </div>
      <input name={name} type="hidden" value={toman === '' ? '' : Number(toman) * 10} />
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Field>
  )
}

/**
 * فرم استعلام، از روی کارت کنار هیروی بوم خانه.
 *
 * تصمیم `docs/website/LANDING-PAGES.md`: سایت نرخ نمی‌دهد و نمی‌فروشد — این فرم فقط
 * آنچه کاربر وارد کرده را به ویزارد `app.bimegold.com` می‌برد. فرستادن با GET عمدی
 * است؛ بدون جاوااسکریپت هم کار می‌کند (روی محصول پیش‌فرض) و چیزی اینجا ذخیره نمی‌شود.
 *
 * فیلدها در کد هستند نه در CMS، چون باید دقیقاً با ویزارد اپ جور دربیایند. فقط جایی
 * فیلد گذاشته‌ایم که فهرست گزینه‌هایش واقعاً ایستا باشد؛ مقصد سفر و نوع ملک از
 * `reference` های API می‌آیند و روی سایت در دسترس نیستند، پس همان‌ها را ویزارد
 * می‌پرسد.
 *
 * ⚠️ ویزارد فعلاً این پارامترها را نمی‌خواند و کاربر دوباره واردشان می‌کند؛ خواندنشان
 * کار سمت `apps/web` است.
 */
export const QuoteForm: React.FC<Props & { asColumn?: boolean; options: ReferenceOptions }> = ({
  asColumn,
  heading,
  options,
  product,
  subheading,
  submitLabel,
  note,
}) => {
  const choosable = (product ?? 'any') === 'any'
  const [selected, setSelected] = useState<ProductKey>(
    choosable ? 'motor-tpl' : ((product ?? 'motor-tpl') as ProductKey),
  )
  /*
   * فرم اختصاصی شخص ثالث (بوم صفحه محصول) یک پرسش بیشتر دارد: خودرو صفر یا بدون
   * بیمه‌نامه قبلی. فرم صفحه خانه که کاربر محصولش را انتخاب می‌کند این را ندارد —
   * بوم خانه هم ندارد و آنجا هدف کوتاه نگه‌داشتن فرم است.
   */
  const dedicatedMotor = product === 'motor-tpl'
  const [noPrevious, setNoPrevious] = useState(false)
  /* بوم یک مسافر نشان می‌دهد و یک دکمه «افزودن مسافر»؛ نرخ برای هر مسافر جدا حساب می‌شود. */
  const [travelerCount, setTravelerCount] = useState(1)

  const active = PRODUCTS.find((p) => p.key === selected) ?? PRODUCTS[0]!
  const thisYear = currentJalaliYear()
  const years = Array.from(
    { length: thisYear - OLDEST_PRODUCTION_YEAR + 1 },
    (_, i) => thisYear - i,
  )

  const form = (
    <form
      action={`${getAppURL()}${active.path}`}
      aria-labelledby="quote-title"
      className="flex flex-col gap-5 rounded-sheet border border-border bg-card p-5 shadow-card lg:p-8"
      method="get"
    >
      <input name="utm_source" type="hidden" value="bimegold.com" />
      <input name="utm_medium" type="hidden" value="site" />

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold lg:text-[1.375rem]" id="quote-title">
          {heading || 'استعلام قیمت'}
        </h2>
        {(subheading || choosable) && (
          <p className="text-sm text-muted-foreground">
            {subheading || 'بیمه مورد نظرتان را انتخاب کنید.'}
          </p>
        )}
      </div>

      {choosable && (
        <fieldset className="grid grid-cols-3 gap-3">
          <legend className="sr-only">نوع بیمه</legend>
          {PRODUCTS.map(({ key, label, Icon }) => {
            const isOn = key === selected
            return (
              <label
                className={cn(
                  'flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-card text-[0.9375rem] transition-colors focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500',
                  isOn
                    ? 'border-[1.5px] border-brand-600 bg-accent font-semibold text-accent-foreground'
                    : 'border border-border bg-card font-medium text-foreground',
                )}
                key={key}
              >
                <input
                  checked={isOn}
                  className="sr-only"
                  name="product"
                  onChange={() => setSelected(key)}
                  type="radio"
                  value={key}
                />
                <Icon className={cn(isOn ? '' : 'text-muted-foreground')} size={28} />
                {label}
              </label>
            )
          })}
        </fieldset>
      )}

      {selected === 'motor-tpl' ? (
        <div className="grid grid-cols-2 gap-4">
          <Field id="quote-vehicle" label="نوع وسیله نقلیه">
            <select
              className={selectClass}
              defaultValue="سواری"
              id="quote-vehicle"
              name="vehicleType"
            >
              <option value="سواری">سواری</option>
              <option value="وانت">وانت</option>
              <option value="موتورسیکلت">موتورسیکلت</option>
            </select>
          </Field>
          <Field id="quote-year" label="سال ساخت">
            <select className={selectClass} id="quote-year" name="productionYear">
              {years.map((year) => (
                <option key={year} value={year}>
                  {toPersianDigits(year)}
                </option>
              ))}
            </select>
          </Field>
          <Field className="col-span-2" id="quote-noclaim" label="سال‌های بدون خسارت">
            <select
              className={selectClass}
              disabled={noPrevious}
              id="quote-noclaim"
              name="bodilyYears"
            >
              {Array.from({ length: MAX_BODILY_DISCOUNT_YEARS + 1 }, (_, i) => i).map((n) => (
                <option key={n} value={n}>
                  {n === 0 ? 'بدون سابقه' : `${toPersianDigits(n)} سال`}
                </option>
              ))}
            </select>
            {dedicatedMotor && (
              <span className="text-xs text-muted-foreground">
                روی بیمه‌نامه قبلی‌تان نوشته شده است.
              </span>
            )}
          </Field>
        </div>
      ) : selected === 'travel' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ReferenceSelect
              id="quote-zone"
              items={options['travel-zones'] ?? []}
              label="مقصد سفر"
              name="destinationZone"
              wide
            />
            <JalaliDateField label="تاریخ رفت" name="startDate" />
            <JalaliDateField label="تاریخ بازگشت" name="endDate" />
            <ReferenceSelect
              hint="سفارت‌های شنگن معمولاً دست‌کم ۳۰ هزار یورو می‌خواهند."
              id="quote-coverage"
              items={options['travel-coverages'] ?? []}
              label="سقف پوشش درمانی"
              name="coverageLimit"
              wide
            />
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">مسافران</legend>
            {Array.from({ length: travelerCount }, (_, i) => (
              <div className="flex items-end gap-2" key={i}>
                <div className="grow">
                  <JalaliDateField
                    label={`تاریخ تولد مسافر ${toPersianDigits(i + 1)}`}
                    name="travelerBirthDate"
                  />
                </div>
                {travelerCount > 1 && (
                  <button
                    aria-label={`حذف مسافر ${toPersianDigits(i + 1)}`}
                    className="flex size-13 shrink-0 items-center justify-center rounded-card border border-border text-muted-foreground"
                    onClick={() => setTravelerCount((n) => n - 1)}
                    type="button"
                  >
                    <MinusIcon size={20} />
                  </button>
                )}
              </div>
            ))}
            <button
              className="flex h-11 w-fit items-center gap-1.5 text-[0.9375rem] font-semibold text-brand-700"
              onClick={() => setTravelerCount((n) => n + 1)}
              type="button"
            >
              <PlusIcon size={18} />
              افزودن مسافر
            </button>
            <span className="text-xs text-muted-foreground">
              برای قیمت فقط تاریخ تولد لازم است؛ نام و مشخصات هنگام خرید گرفته می‌شود.
            </span>
          </fieldset>
        </div>
      ) : selected === 'home-fire' ? (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <ReferenceSelect
              id="quote-property"
              items={options['property-types'] ?? []}
              label="نوع ملک"
              name="propertyType"
            />
            <ReferenceSelect
              id="quote-city"
              items={options.cities ?? []}
              label="شهر"
              name="cityId"
            />
            <Field className="col-span-2" id="quote-area" label="متراژ (متر مربع)">
              <input
                className={inputClass}
                id="quote-area"
                inputMode="numeric"
                name="areaSqm"
                type="text"
              />
            </Field>
            <MoneyField
              hint="هزینه ساخت دوباره بنا، نه قیمت خرید ملک."
              id="quote-building"
              label="ارزش بازسازی ساختمان"
              name="buildingValue"
            />
            <MoneyField
              hint="مستأجر معمولاً فقط همین را بیمه می‌کند."
              id="quote-contents"
              label="ارزش اثاثیه"
              name="contentsValue"
            />
          </div>

          {options['extra-perils']?.length ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1 text-sm font-medium">پوشش‌های اضافه</legend>
              <div className="grid grid-cols-2 gap-x-4">
                {options['extra-perils'].map((peril) => (
                  <label
                    className="flex min-h-11 items-center gap-2.5 text-[0.9375rem]"
                    key={peril.value}
                  >
                    <input
                      className="size-5 accent-brand-600"
                      name="extraPerils"
                      type="checkbox"
                      value={peril.value}
                    />
                    {peril.labelFa}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : null}
        </div>
      ) : null}

      {dedicatedMotor && selected === 'motor-tpl' && (
        <>
          {/*
           * خودِ چک‌باکس نامی ندارد و فقط وضعیت را نگه می‌دارد؛ آنچه فرستاده می‌شود
           * این فیلد پنهان است، با همان نام پارامتر ویزارد. بدون جاوااسکریپت،
           * چک‌باکس کاری نمی‌کند و فرم «بیمه‌نامه قبلی دارم» می‌فرستد — همان چیزی
           * که ویزارد در گام بعد دوباره می‌پرسد.
           */}
          <input name="hasPreviousPolicy" type="hidden" value={noPrevious ? 'false' : 'true'} />
          <label className="flex min-h-11 items-center gap-2.5 text-[0.9375rem]">
            <input
              checked={noPrevious}
              className="size-5 accent-brand-600"
              onChange={(e) => setNoPrevious(e.target.checked)}
              type="checkbox"
            />
            خودرو صفر است یا بیمه‌نامه قبلی ندارد
          </label>
        </>
      )}

      <button
        className="flex h-13 items-center justify-center rounded-card bg-primary text-base font-semibold text-primary-foreground shadow-button transition-opacity hover:opacity-90"
        type="submit"
      >
        {submitLabel || 'مقایسه قیمت‌ها'}
      </button>

      {note && <p className="text-center text-[0.8125rem] text-muted-foreground">{note}</p>}
    </form>
  )

  // ستون راست یک نوار دو ستونی — پدینگ و عرض را والد می‌دهد.
  if (asColumn) return form

  return (
    <section className="shell py-10 lg:py-16">
      <div className="max-w-xl">{form}</div>
    </section>
  )
}
