import { useMemo, useState } from 'react'
import { toLatinDigits } from '../../lib/fa'
import type { ReferenceItem } from '../../lib/quotes-api'

/**
 * A long reference list — 115 vehicle models across 24 brands — narrowed by typing.
 *
 * The whole list arrives in one request and is filtered in the browser rather than round-
 * tripping per keystroke: it is a few kilobytes, it never changes mid-session, and a search box
 * that stalls on a slow connection is worse than no search box. The API's `?q=` is still there
 * for anything that outgrows this.
 *
 * Options stay grouped under their brand heading while filtering, because «جک S3» means nothing
 * without «کرمان موتور» above it — several brands sell a model called S3.
 */
export function SearchableOptions({
  options,
  value,
  onChange,
  placeholderFa,
}: {
  options: ReferenceItem[]
  value: string | null
  onChange: (next: string) => void
  placeholderFa: string
}) {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const needle = normalise(query)
    const matches = needle
      ? options.filter((o) => normalise(`${o.groupFa ?? ''} ${o.labelFa}`).includes(needle))
      : options

    const byGroup = new Map<string, ReferenceItem[]>()
    for (const option of matches) {
      const key = option.groupFa ?? ''
      byGroup.set(key, [...(byGroup.get(key) ?? []), option])
    }
    return [...byGroup.entries()]
  }, [options, query])

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholderFa}
        aria-label={placeholderFa}
        className="w-full rounded-2xl border border-line bg-card px-4 py-3.5 text-base text-strong outline-none transition-colors placeholder:text-muted/60 focus:border-brand-500"
      />

      {groups.length === 0 ? (
        <p className="mt-6 text-center text-sm leading-7 text-muted">
          موردی پیدا نشد.
          <br />
          نام برند را هم امتحان کنید.
        </p>
      ) : null}

      <div className="mt-4 space-y-5">
        {groups.map(([groupFa, items]) => (
          <div key={groupFa}>
            {groupFa ? (
              <p className="mb-2 px-1 text-xs font-semibold text-muted">{groupFa}</p>
            ) : null}
            <div className="space-y-2">
              {items.map((option) => {
                const selected = option.value === value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    aria-pressed={selected}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-right transition-colors ${
                      selected
                        ? 'border-brand-600 bg-brand-50 dark:bg-brand-900/30'
                        : 'border-line bg-card'
                    }`}
                  >
                    <span
                      className={`text-[0.95rem] ${
                        selected ? 'font-semibold text-brand-700 dark:text-brand-200' : 'text-strong'
                      }`}
                    >
                      {/* The brand is already the heading; repeating it in every row is noise. */}
                      {stripGroup(option)}
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
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Arabic ی/ک and Persian ی/ک are different code points that look identical, and a phone
 * keyboard may send either. Folding them — plus digits and the zero-width non-joiner — is what
 * makes «کویر» find «کویر موتور» when the two were typed on different keyboards.
 */
const normalise = (input: string): string =>
  toLatinDigits(input)
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/‌/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()

const stripGroup = (option: ReferenceItem): string =>
  option.groupFa && option.labelFa.startsWith(`${option.groupFa} `)
    ? option.labelFa.slice(option.groupFa.length + 1)
    : option.labelFa
