'use client'

import React, { useState } from 'react'

import { toLatinDigits, toPersianDigits } from '@/lib/fa'
import { currentJalaliYear, jalaliMonthLength, jalaliToIso, JALALI_MONTHS } from '@/lib/jalali'

/**
 * روز / ماه / سال، نه یک فیلد متنی با جداکننده.
 *
 * عیناً همان انتخابگر ویزارد (`apps/web/src/components/ui/JalaliDateField.tsx`) با
 * توکن‌های سایت: ایرانی‌ها تاریخ را ۱۳۶۹/۰۳/۰۲ می‌نویسند، ولی تحلیل متن آزاد روی
 * کیبورد موبایل یعنی جنگیدن با جداکننده و دو دستگاه رقم، بی‌آنکه چیزی عاید شود. سه
 * کنترل را نمی‌شود اشتباه تایپ کرد، و ماه فهرست است چون *نام* ماه همان چیزی است که
 * آدم‌ها به یاد می‌آورند.
 *
 * `<input type="date">` بومی جواب نمی‌دهد: میلادی است و کاربر باید تاریخ را در ذهنش
 * تبدیل کند.
 *
 * مقداری که فرستاده می‌شود میلادیِ `YYYY-MM-DD` است — همان چیزی که API می‌خواهد — و
 * در یک فیلد پنهان می‌نشیند، پس خودِ سه کنترل نامی ندارند.
 */
export const JalaliDateField: React.FC<{ label: string; name: string }> = ({ label, name }) => {
  const [jy, setJy] = useState('')
  const [jm, setJm] = useState('')
  const [jd, setJd] = useState('')

  const iso = jy && jm && jd ? jalaliToIso(Number(jy), Number(jm), Number(jd)) : null
  const maxDay = jy && jm ? jalaliMonthLength(Number(jy), Number(jm)) : 31
  const digitsOnly = (raw: string, max: number) =>
    toLatinDigits(raw).replace(/\D/g, '').slice(0, max)

  const boxClass =
    'h-13 w-full rounded-card border border-border bg-card px-3 text-center text-base text-foreground focus:border-brand-500 focus:outline-none'

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
        <input
          aria-label={`روز — ${label}`}
          className={boxClass}
          inputMode="numeric"
          onChange={(e) => setJd(digitsOnly(e.target.value, 2))}
          placeholder="روز"
          value={toPersianDigits(jd)}
        />
        <select
          aria-label={`ماه — ${label}`}
          className={boxClass}
          onChange={(e) => {
            const next = e.target.value
            setJm(next)
            // اسفند ۳۰ فقط در سال کبیسه هست، پس عوض‌شدن ماه می‌تواند روز را باطل کند.
            if (
              jd &&
              Number(jd) > jalaliMonthLength(Number(jy || currentJalaliYear()), Number(next))
            )
              setJd('')
          }}
          value={jm}
        >
          <option value="">ماه</option>
          {JALALI_MONTHS.map((month, i) => (
            <option key={month} value={i + 1}>
              {month}
            </option>
          ))}
        </select>
        <input
          aria-label={`سال — ${label}`}
          className={boxClass}
          inputMode="numeric"
          onChange={(e) => setJy(digitsOnly(e.target.value, 4))}
          placeholder="سال"
          value={toPersianDigits(jy)}
        />
      </div>
      <input name={name} type="hidden" value={iso ?? ''} />
      {jd && Number(jd) > maxDay && (
        <span className="text-xs text-destructive">
          این ماه {toPersianDigits(maxDay)} روز دارد.
        </span>
      )}
    </div>
  )
}
