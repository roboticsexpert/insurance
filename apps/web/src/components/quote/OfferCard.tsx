import { Link } from 'react-router'
import type { QuoteOffer } from '../../lib/quotes-api'
import { formatToman, toPersianDigits } from '../../lib/fa'
import { ChevronIcon } from '../icons'

const BADGE_LABELS: Record<string, string> = {
  CHEAPEST: 'ارزان‌ترین',
  RECOMMENDED: 'پیشنهاد ما',
}

export function OfferCard({ offer, quoteId }: { offer: QuoteOffer; quoteId: string }) {
  /*
   * A refused insurer stays on screen with its reason. Hiding it would make the comparison
   * look shorter than it is, and "this company will not cover someone your age" is exactly
   * the kind of thing a customer wants to know before phoning them.
   */
  if (!offer.isEligible) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-card p-4 opacity-70">
        <p className="text-[0.95rem] font-semibold text-strong">{offer.insurer.name}</p>
        <p className="mt-1.5 text-sm leading-6 text-muted">{offer.ineligibleReasonFa}</p>
      </div>
    )
  }

  return (
    <Link
      to={`/quotes/${quoteId}/offers/${offer.id}`}
      className="block rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[0.95rem] font-semibold text-strong">{offer.insurer.name}</p>
          {offer.insurer.solvencyLevel !== null ? (
            <p className="mt-0.5 text-xs text-muted">
              توانگری مالی سطح {toPersianDigits(offer.insurer.solvencyLevel)}
              {offer.insurer.claimSatisfaction !== null
                ? ` · رضایت از پرداخت خسارت ${toPersianDigits(offer.insurer.claimSatisfaction)}٪`
                : ''}
            </p>
          ) : null}
        </div>

        {offer.badges.length > 0 ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {offer.badges.map((badge) => (
              <span
                key={badge}
                className={`rounded-full px-2 py-0.5 text-[0.65rem] font-medium ${
                  badge === 'CHEAPEST'
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                }`}
              >
                {BADGE_LABELS[badge] ?? badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {offer.featuresFa.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {offer.featuresFa.map((feature) => (
            <li key={feature} className="flex items-center gap-1.5 text-xs text-muted">
              <span className="h-1 w-1 shrink-0 rounded-full bg-brand-600" />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="text-lg font-bold text-strong">{formatToman(offer.totalAmount)}</span>
        <span className="flex items-center gap-1 text-sm font-medium text-brand-600">
          جزئیات و خرید
          <ChevronIcon className="h-4 w-4" />
        </span>
      </div>
    </Link>
  )
}
