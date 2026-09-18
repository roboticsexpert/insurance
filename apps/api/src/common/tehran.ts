/**
 * Calendar dates are chosen in Tehran; instants are stored in UTC. This is where the two meet.
 *
 * Everything the customer picks — a departure date, a policy start date — is a *calendar day in
 * Tehran*, not an instant. Treating `"2026-09-01"` as `2026-09-01T00:00:00Z` makes cover begin at
 * 03:30 local on that day, so a 06:00 flight departs uninsured. The same off-by-three-and-a-half
 * hours made the past-date guard accept *yesterday* for the first 3½ hours of every Tehran day.
 *
 * Iran abolished daylight saving in 2022, so the offset is a fixed +03:30 with no transitions to
 * model. If that ever changes, this is the one file that has to know.
 */

export const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000

const DAY_MS = 86_400_000

/** The instant a Tehran calendar day begins, in UTC. `2026-09-01` → `2026-08-31T20:30:00Z`. */
export const tehranDayStart = (isoDate: string): Date =>
  new Date(Date.parse(`${isoDate}T00:00:00Z`) - TEHRAN_OFFSET_MS)

/** The last instant of a Tehran calendar day — one second before the next one starts. */
export const tehranDayEnd = (isoDate: string): Date =>
  new Date(tehranDayStart(isoDate).getTime() + DAY_MS - 1000)

/** Today's date in Tehran, as `YYYY-MM-DD`. */
export const tehranToday = (now: Date): string =>
  new Date(now.getTime() + TEHRAN_OFFSET_MS).toISOString().slice(0, 10)

/**
 * Whole Tehran calendar days from `from` to `to`. Negative when `to` is earlier.
 *
 * Both ends are day starts, so this counts day boundaries crossed rather than elapsed hours —
 * which is the question a policy period actually asks.
 */
export const tehranDaysBetween = (from: string, to: string): number =>
  Math.round((tehranDayStart(to).getTime() - tehranDayStart(from).getTime()) / DAY_MS)

/**
 * The same calendar date one year on, in Tehran. Used for annual policies.
 *
 * 29 اسفند / Feb 29 has no anniversary in a common year; it lands on Mar 1, which is the
 * conventional answer and the one an insurer would give.
 */
export const tehranNextYear = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number]
  // `Date.UTC` normalises 29 Feb + 1 year to 1 March, which is the conventional anniversary —
  // and, unlike string surgery, it always returns a date the calendar actually has.
  return new Date(Date.UTC(year + 1, month - 1, day)).toISOString().slice(0, 10)
}
