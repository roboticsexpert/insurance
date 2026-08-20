/**
 * How long a quoted price stands. Short enough that rate changes propagate, long enough that
 * a customer can finish a checkout without being repriced mid-purchase.
 */
export const QUOTE_TTL_MINUTES = 30

/**
 * An offer within this margin of the cheapest counts as "in the running" for the recommended
 * badge, which then goes to the insurer with the best claims record among them.
 */
export const RECOMMENDED_PRICE_TOLERANCE = 0.2
