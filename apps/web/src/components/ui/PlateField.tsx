import { useId, useRef, type ReactNode } from 'react'
import { toLatinDigits, toPersianDigits } from '../../lib/fa'
import { PLATE_LETTERS, plateHint, type Plate } from '../../lib/plate'

/**
 * The Iranian licence plate, drawn as the plate itself rather than as four labelled inputs.
 *
 * People do not read their plate as «دو رقم، حرف، سه رقم، کد استان» — they read the object in
 * their hand, left to right, and copying it works only if the boxes sit where the characters
 * sit. So the widget is `dir="ltr"` inside an otherwise RTL app: the blue I.R.IRAN band on the
 * left, then `۱۲ ب ۳۴۵`, then the «ایران» box with the provincial code. Laying it out in
 * reading order would put the province code first and quietly invite a wrong plate.
 *
 * Digits are shown in Persian and stored in Latin, and focus advances as each box fills, so
 * the whole plate is one uninterrupted run of taps on the numeric keypad.
 */
export function PlateField({
  value,
  onChange,
  error,
  label = 'شماره پلاک',
}: {
  value: Plate
  onChange: (next: Plate) => void
  error?: string
  label?: string
}) {
  const id = useId()
  const letterRef = useRef<HTMLSelectElement>(null)
  const threeRef = useRef<HTMLInputElement>(null)
  const iranRef = useRef<HTMLInputElement>(null)
  const twoRef = useRef<HTMLInputElement>(null)

  const hint = error ?? plateHint(value)

  const digits = (raw: string, max: number) => toLatinDigits(raw).replace(/\D/g, '').slice(0, max)

  /** Advancing only when a box is *full* keeps a correction in place from jumping away. */
  const setPart = (part: keyof Plate, next: string, max: number, advance?: () => void) => {
    onChange({ ...value, [part]: next })
    if (next.length === max) advance?.()
  }

  /** Backspace in an empty box steps back, so a mistyped plate is fixable without aiming. */
  const backspaceTo = (target: () => HTMLElement | null, current: string) =>
    (event: React.KeyboardEvent) => {
      if (event.key === 'Backspace' && current.length === 0) {
        event.preventDefault()
        target()?.focus()
      }
    }

  return (
    <div>
      <span id={`${id}-label`} className="mb-2 block text-sm font-medium text-strong">
        {label}
      </span>

      <div
        dir="ltr"
        role="group"
        aria-labelledby={`${id}-label`}
        // Red is reserved for a real error. A half-typed plate is not a mistake — going red the
        // moment the first box fills, and staying red until the last one does, tells the user
        // they are failing for the entire time they are succeeding.
        className={`flex items-stretch overflow-hidden rounded-xl border-2 bg-white shadow-[var(--shadow-card)] ${
          error ? 'border-red-500' : 'border-neutral-800'
        }`}
      >
        {/* The blue band every Iranian plate carries on its left edge. */}
        <div className="flex w-7 shrink-0 flex-col items-center justify-end bg-[#243c8c] pb-1.5 pt-1">
          <span className="text-[0.6rem] leading-none text-white">
            <FlagMark />
          </span>
          <span className="mt-1 text-[0.32rem] font-bold leading-tight tracking-tight text-white">
            I.R.
            <br />
            IRAN
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5">
          <PlateBox
            ref={twoRef}
            aria-label="دو رقم سمت چپ"
            value={value.twoDigit}
            placeholder="۱۲"
            width="w-12"
            onChange={(raw) =>
              setPart('twoDigit', digits(raw, 2), 2, () => letterRef.current?.focus())
            }
          />

          <select
            ref={letterRef}
            aria-label="حرف پلاک"
            value={value.letter}
            onChange={(event) => {
              onChange({ ...value, letter: event.target.value })
              if (event.target.value) threeRef.current?.focus()
            }}
            className="h-11 rounded-lg border-none bg-transparent px-1 text-center text-lg font-bold text-neutral-900 outline-none focus:bg-brand-50"
          >
            <option value="">—</option>
            {PLATE_LETTERS.map((letter) => (
              <option key={letter} value={letter}>
                {letter}
              </option>
            ))}
          </select>

          <PlateBox
            ref={threeRef}
            aria-label="سه رقم سمت راست"
            value={value.threeDigit}
            placeholder="۳۴۵"
            width="w-16"
            onChange={(raw) =>
              setPart('threeDigit', digits(raw, 3), 3, () => iranRef.current?.focus())
            }
            onKeyDown={backspaceTo(() => letterRef.current, value.threeDigit)}
          />
        </div>

        {/* The «ایران» box: a separate field on the plate, so a separate box here. */}
        <div className="flex w-14 shrink-0 flex-col items-center justify-center border-l border-neutral-300 px-1 py-1.5">
          <PlateBox
            ref={iranRef}
            aria-label="کد استان"
            value={value.iranCode}
            placeholder="۱۰"
            width="w-full"
            size="text-lg"
            onChange={(raw) => setPart('iranCode', digits(raw, 2), 2)}
            onKeyDown={backspaceTo(() => threeRef.current, value.iranCode)}
          />
          <span className="text-[0.5rem] font-semibold leading-none text-neutral-700">ایران</span>
        </div>
      </div>

      {hint ? (
        <p
          role={error ? 'alert' : undefined}
          className={`mt-2 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-muted'}`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/**
 * The plate is a physical object with black ink on white, in both themes — a "dark mode plate"
 * is not a thing, so these colours are deliberately literal rather than tokens.
 */
const PlateBox = ({
  ref,
  value,
  onChange,
  placeholder,
  width,
  size = 'text-xl',
  ...props
}: {
  ref?: React.Ref<HTMLInputElement>
  value: string
  onChange: (raw: string) => void
  placeholder: string
  width: string
  size?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'>) => (
  <input
    ref={ref}
    type="text"
    inputMode="numeric"
    autoComplete="off"
    value={toPersianDigits(value)}
    placeholder={placeholder}
    onChange={(event) => onChange(event.target.value)}
    {...props}
    className={`${width} ${size} h-11 rounded-lg bg-transparent text-center font-bold tabular-nums text-neutral-900 outline-none placeholder:font-normal placeholder:text-neutral-300 focus:bg-brand-50`}
  />
)

function FlagMark(): ReactNode {
  return (
    <svg viewBox="0 0 12 8" className="h-2 w-3" aria-hidden="true">
      <rect width="12" height="2.67" fill="#239f40" />
      <rect y="2.67" width="12" height="2.66" fill="#fff" />
      <rect y="5.33" width="12" height="2.67" fill="#da0000" />
    </svg>
  )
}
