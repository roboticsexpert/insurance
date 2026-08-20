import type { ReferenceItem } from '../../lib/quotes-api'

/**
 * The multi-select twin of `OptionList`. Square marks rather than round ones, because the
 * shape is the only thing telling a customer that more than one answer is allowed here — and
 * a peril list where they pick one and move on is a policy missing the cover they wanted.
 */
export function MultiOptionList({
  options,
  values,
  onToggle,
}: {
  options: ReferenceItem[]
  values: string[]
  /**
   * Reports *what was tapped*, not the whole next array. Computing the next set in here would
   * read a `values` prop that is one render stale whenever two toggles land in the same batch,
   * and the second would silently undo the first. The parent owns the set and merges it with a
   * functional update, which is correct however the taps arrive.
   */
  onToggle: (value: string) => void
}) {
  const toggle = onToggle

  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = values.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => toggle(option.value)}
            aria-pressed={selected}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-right transition-colors ${
              selected ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30' : 'border-line bg-card'
            }`}
          >
            <span
              className={`text-[0.95rem] ${selected ? 'font-semibold text-brand-700 dark:text-brand-200' : 'text-strong'}`}
            >
              {option.labelFa}
            </span>
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 ${
                selected ? 'border-brand-600 bg-brand-600' : 'border-line'
              }`}
            >
              {selected ? (
                <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" aria-hidden="true">
                  <path
                    d="M2 6.5 4.5 9 10 3.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
