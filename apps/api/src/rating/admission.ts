import { AppException } from '../common/app.exception'
import { toPersianDigits } from '../common/fa'
import { tehranDaysBetween, tehranToday } from '../common/tehran'
import type { RatingContext } from './rating-strategy'

/**
 * Clock-relative admission rules — the checks that ask "may this be *bought* right now?",
 * as opposed to "is this input well-formed?".
 *
 * They live apart from the schemas on purpose. Every strategy's `decode()` answers the shape
 * question and is a pure function of its input; only `parse()` adds these, and only the request
 * path calls `parse()`. Issuance re-derives the coverage period from an order that was already
 * accepted and paid for, so it must decode without re-asking a question whose answer legitimately
 * changes with the clock: a same-day-departure order whose payment settles after midnight would
 * otherwise fail issuance forever, with the money already taken.
 */


/**
 * How far ahead cover may be bought.
 *
 * There has to be a ceiling. Every rate table these products price from is annual — the motor
 * one says so in its own comment, because دیه resets each year — so `startDate: "9999-12-31"`
 * sold a policy starting in 2030 at today's numbers. Only the past was ever guarded.
 *
 * Ninety days is the ordinary renewal window: long enough to buy the next year's cover before
 * the current one lapses, short enough that the price still means something.
 */
export const MAX_START_DAYS_AHEAD = 90

/**
 * Cover may not be backdated, nor bought arbitrarily far ahead. Rejected here rather than inside
 * `rate()` so it reads as one mistake in the request instead of five insurers independently
 * refusing the customer.
 *
 * Compared as **Tehran calendar days**. The customer picks a day on the Iranian calendar; asking
 * whether a UTC instant is in the past made every Tehran day begin 3½ hours late, so between
 * midnight and 03:30 local the guard cheerfully accepted yesterday.
 */
export function assertStartDateInWindow(
  startDate: string,
  ctx: RatingContext,
  messageFa: string,
): void {
  const daysAhead = tehranDaysBetween(tehranToday(ctx.now), startDate)

  if (daysAhead < 0) {
    throw new AppException('VALIDATION_FAILED', { fields: { startDate: messageFa } })
  }
  if (daysAhead > MAX_START_DAYS_AHEAD) {
    throw new AppException('VALIDATION_FAILED', {
      fields: {
        startDate: `تاریخ شروع نمی‌تواند بیش از ${toPersianDigits(MAX_START_DAYS_AHEAD)} روز آینده باشد`,
      },
    })
  }
}

/**
 * A date of birth in the future is not a young customer, it is a broken request.
 *
 * Travel rates on age at departure, and `ageOnDeparture` happily goes negative — a traveler
 * born in 2028 fell into the `max: 12` band and was priced with the 0.65 child factor.
 */
export function assertBornInThePast(
  birthDate: string,
  ctx: RatingContext,
  path: string,
): void {
  if (birthDate > tehranToday(ctx.now)) {
    throw new AppException('VALIDATION_FAILED', {
      fields: { [path]: 'تاریخ تولد نمی‌تواند در آینده باشد' },
    })
  }
}
