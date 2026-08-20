import { Link } from 'react-router'
import type { PolicyListItem } from '../lib/policies-api'
import { formatJalali, formatToman } from '../lib/fa'
import { ChevronIcon } from './icons'

const STATUS_STYLES: Record<PolicyListItem['status'], string> = {
  ACTIVE: 'bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200',
  UPCOMING: 'bg-sunken text-muted',
  EXPIRED: 'bg-sunken text-muted',
}

export function PolicyCard({ policy }: { policy: PolicyListItem }) {
  return (
    <Link
      to={`/policies/${policy.id}`}
      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)] active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[0.95rem] font-semibold text-strong">{policy.productTitleFa}</span>
          <span className={`rounded-full px-2 py-0.5 text-[0.65rem] ${STATUS_STYLES[policy.status]}`}>
            {policy.statusFa}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted">{policy.insurerName}</p>
        <p className="mt-1.5 text-xs text-muted">
          {formatJalali(policy.startsAt)} تا {formatJalali(policy.endsAt)}
        </p>
        <p className="mt-1.5 text-xs tabular-nums text-muted" dir="ltr">
          {policy.policyNumber}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-semibold text-strong">{formatToman(policy.amount)}</span>
        <ChevronIcon className="h-4 w-4 text-muted" />
      </div>
    </Link>
  )
}
