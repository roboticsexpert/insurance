import type { ReferenceItem } from '../../lib/quotes-api'

/** Big tap targets instead of a native select — one tap, no picker wheel to fight. */
export function OptionList({
  options,
  value,
  onChange,
}: {
  options: ReferenceItem[]
  value: string | null
  onChange: (next: string) => void
}) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
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
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                selected ? 'border-brand-600' : 'border-line'
              }`}
            >
              {selected ? <span className="h-2.5 w-2.5 rounded-full bg-brand-600" /> : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}
