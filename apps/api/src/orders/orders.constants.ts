/**
 * How long an order stays payable. Independent of the quote's own TTL: once someone commits to
 * buying, the price is already frozen on the QuoteOffer, so the quote expiring underneath them
 * mid-payment must not matter.
 */
export const ORDER_TTL_MINUTES = 30
