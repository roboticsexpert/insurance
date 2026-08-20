import type { ReactNode } from 'react'
import { ChevronIcon } from '../icons'
import { toPersianDigits } from '../../lib/fa'

/**
 * One question group per screen.
 *
 * Long mobile forms die on scroll length: the user cannot see progress, cannot tell what is
 * required, and abandons. A step at a time keeps the ask small and the primary action always
 * under the thumb.
 */
export function WizardShell({
  title,
  hint,
  step,
  totalSteps,
  onBack,
  children,
  footer,
}: {
  title: string
  hint?: string
  step: number
  totalSteps: number
  onBack: () => void
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page">
        <header className="safe-top px-5 pb-3 pt-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="بازگشت"
              className="-mr-2 grid h-11 w-11 place-items-center rounded-full text-muted"
            >
              {/* RTL: forward is leftwards, so "back" points right. */}
              <ChevronIcon className="h-5 w-5 rotate-180" />
            </button>
            <p className="text-xs text-muted">
              گام {toPersianDigits(step)} از {toPersianDigits(totalSteps)}
            </p>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </header>

        <div className="flex-1 px-5 pt-5">
          <h1 className="text-xl font-bold text-strong">{title}</h1>
          {hint ? <p className="mt-1.5 text-sm leading-7 text-muted">{hint}</p> : null}
          <div className="mt-6">{children}</div>
        </div>

        {/* Sticky, so the thumb never travels to continue. */}
        <div className="safe-bottom sticky bottom-0 border-t border-line bg-page/95 px-5 pb-3 pt-3 backdrop-blur">
          {footer}
        </div>
      </div>
    </div>
  )
}
