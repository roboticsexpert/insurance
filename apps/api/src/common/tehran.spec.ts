import {
  tehranDayEnd,
  tehranDayStart,
  tehranDaysBetween,
  tehranNextYear,
  tehranToday,
} from './tehran'

/*
 * M7. Every date the customer picks is a calendar day in Tehran; every instant stored is UTC.
 * Treating one as the other put both ends of a policy period 3½ hours late — cover began at
 * 03:30 local, so an early flight departed uninsured — and made the past-date guard accept
 * yesterday for the first 3½ hours of every Tehran day.
 */
describe('Tehran calendar days', () => {
  it('starts a day at 20:30 UTC the evening before', () => {
    expect(tehranDayStart('2026-09-01').toISOString()).toBe('2026-08-31T20:30:00.000Z')
  })

  it('ends a day one second before the next one starts', () => {
    expect(tehranDayEnd('2026-09-01').toISOString()).toBe('2026-09-01T20:29:59.000Z')
    expect(tehranDayEnd('2026-09-01').getTime() + 1000).toBe(tehranDayStart('2026-09-02').getTime())
  })

  it('covers the whole local day, 06:00 flights included', () => {
    // 06:00 Tehran on the departure day is 02:30 UTC — before the old UTC-midnight start.
    const earlyFlight = new Date('2026-09-01T02:30:00Z')
    expect(earlyFlight.getTime()).toBeGreaterThan(tehranDayStart('2026-09-01').getTime())
    expect(earlyFlight.getTime()).toBeLessThan(tehranDayEnd('2026-09-01').getTime())
  })

  describe('today', () => {
    it('is the local date, not the UTC one', () => {
      // 21:00 UTC is already 00:30 the next morning in Tehran. This is the case UTC got wrong.
      expect(tehranToday(new Date('2026-08-20T21:00:00Z'))).toBe('2026-08-21')
    })

    it('has not rolled over just before the local midnight', () => {
      expect(tehranToday(new Date('2026-08-20T20:29:00Z'))).toBe('2026-08-20')
    })

    it('agrees with UTC in the middle of the day', () => {
      expect(tehranToday(new Date('2026-08-20T09:00:00Z'))).toBe('2026-08-20')
    })
  })

  describe('days between', () => {
    it.each([
      ['2026-09-01', '2026-09-08', 7],
      ['2026-09-01', '2026-09-01', 0],
      ['2026-09-08', '2026-09-01', -7],
      ['2026-02-27', '2026-03-01', 2], // across a month, non-leap
      ['2028-02-27', '2028-03-01', 3], // across a month, leap
    ])('%s → %s is %i days', (from, to, expected) => {
      expect(tehranDaysBetween(from, to)).toBe(expected)
    })
  })

  describe('the same date a year on', () => {
    it.each([
      ['2026-09-01', '2027-09-01'],
      ['2026-02-28', '2027-02-28'],
      // 29 Feb has no anniversary in a common year; 1 March is the conventional answer.
      ['2028-02-29', '2029-03-01'],
    ])('%s → %s', (from, expected) => {
      expect(tehranNextYear(from)).toBe(expected)
    })

    it('always returns a date the calendar actually has', () => {
      for (const date of ['2028-02-29', '2026-01-31', '2026-12-31']) {
        const next = tehranNextYear(date)
        expect(new Date(`${next}T00:00:00Z`).toISOString().slice(0, 10)).toBe(next)
      }
    })
  })
})
