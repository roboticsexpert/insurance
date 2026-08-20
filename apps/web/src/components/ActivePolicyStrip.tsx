import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { useAuth } from '../app/auth-context'
import type { ProductType } from '../lib/catalog-api'
import { daysUntil, formatJalali, toPersianDigits } from '../lib/fa'
import { getPolicies, type PolicyListItem } from '../lib/policies-api'
import { CarIcon, ChevronIcon, FireIcon, PlaneIcon } from './icons'

const ICONS: Record<ProductType, typeof PlaneIcon> = {
  TRAVEL: PlaneIcon,
  MOTOR_TPL: CarIcon,
  HOME_FIRE: FireIcon,
}

/** Inside its last month a policy stops being a reassurance and becomes a thing to act on. */
const RENEWAL_WINDOW_DAYS = 30

/**
 * What a returning customer came back for, above what a new one came for. Upcoming policies
 * ride along with valid ones — bought and paid for, just not started — which is the same rule
 * the «معتبر» tab on `/policies` uses.
 */
export function ActivePolicyStrip() {
  const { status } = useAuth()
  const policies = useQuery({
    queryKey: ['policies'],
    queryFn: getPolicies,
    enabled: status === 'authenticated',
  })

  /*
   * `enabled` stops the *fetch*, not the cache read: a disabled query still hands back
   * whatever the previous session left behind. Gating on `status` as well is what keeps a
   * signed-out phone from showing the last user's policies on the home screen.
   */
  const current =
    status === 'authenticated'
      ? (policies.data ?? []).filter((policy) => policy.status !== 'EXPIRED')
      : []

  // The home screen belongs to the product list. A policies fetch that is still in flight or
  // has failed says nothing here rather than pushing a spinner or an error above it.
  if (current.length === 0) return null

  return (
    <section className="mb-7" aria-labelledby="active-policies-heading">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 id="active-policies-heading" className="text-sm font-semibold text-strong">
          بیمه‌نامه‌های من
        </h2>
        <Link to="/policies" className="-m-2 p-2 text-xs text-brand-600 dark:text-brand-300">
          همه
        </Link>
      </div>

      {/*
        Cards narrower than the viewport so the next one peeks in — on a touch-only screen that
        edge is the only thing telling the customer the row scrolls at all.
      */}
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {current.map((policy) => (
          <StripCard key={policy.id} policy={policy} full={current.length === 1} />
        ))}
      </div>
    </section>
  )
}

function StripCard({ policy, full }: { policy: PolicyListItem; full: boolean }) {
  const Icon = ICONS[policy.productType] ?? PlaneIcon
  const remaining = daysUntil(policy.endsAt)
  const urgent = policy.status === 'ACTIVE' && remaining <= RENEWAL_WINDOW_DAYS

  return (
    <Link
      to={`/policies/${policy.id}`}
      className={`shrink-0 snap-start rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)] active:scale-[0.99] ${
        full ? 'w-full' : 'w-[82%]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <Icon className="h-6 w-6" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.95rem] font-semibold text-strong">
            {policy.productTitleFa}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted">{policy.insurerName}</span>
        </span>

        <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
      </div>

      <p
        className={`mt-3 text-xs ${urgent ? 'text-amber-600 dark:text-amber-400' : 'text-muted'}`}
      >
        <Validity policy={policy} remaining={remaining} />
      </p>
    </Link>
  )
}

function Validity({ policy, remaining }: { policy: PolicyListItem; remaining: number }) {
  if (policy.status === 'UPCOMING') return <>از {formatJalali(policy.startsAt)} آغاز می‌شود</>
  // The server said ACTIVE, so a non-positive count means the last day is running out right now.
  if (remaining <= 0) return <>امروز پایان می‌یابد</>
  return <>{toPersianDigits(remaining)} روز تا پایان اعتبار</>
}
