import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageHeader } from '../components/PageHeader'
import { PolicyCard } from '../components/PolicyCard'
import { SkeletonCards } from '../components/ui/Skeleton'
import { PolicyIcon } from '../components/icons'
import { ApiError } from '../lib/api'
import { getPolicies, type PolicyListItem } from '../lib/policies-api'
import { toPersianDigits } from '../lib/fa'

type Tab = 'current' | 'past'

/** Upcoming policies belong with valid ones: the customer has bought them and they will run. */
const isCurrent = (policy: PolicyListItem) => policy.status !== 'EXPIRED'

export function PoliciesPage() {
  const [tab, setTab] = useState<Tab>('current')
  const policies = useQuery({ queryKey: ['policies'], queryFn: getPolicies })

  const all = policies.data ?? []
  const current = all.filter(isCurrent)
  const past = all.filter((p) => !isCurrent(p))
  const shown = tab === 'current' ? current : past

  return (
    <div>
      <PageHeader title="بیمه‌نامه‌های من" />

      {policies.isPending ? <SkeletonCards count={2} /> : null}

      {policies.isError ? (
        <ErrorState
          title="دریافت بیمه‌نامه‌ها ممکن نشد"
          message={
            policies.error instanceof ApiError ? policies.error.messageFa : 'دوباره تلاش کنید.'
          }
          onRetry={() => void policies.refetch()}
          retrying={policies.isFetching}
        />
      ) : null}

      {policies.data ? (
        all.length === 0 ? (
          <EmptyState
            icon={<PolicyIcon className="h-14 w-14" />}
            title="هنوز بیمه‌نامه‌ای ندارید"
            description="بعد از اولین خرید، بیمه‌نامه‌هایتان اینجا نگهداری می‌شود و همیشه در دسترس است."
            action={
              <Link
                to="/"
                className="mt-2 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
              >
                خرید بیمه
              </Link>
            }
          />
        ) : (
          <>
            <div className="mx-5 mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-sunken p-1">
              <TabButton active={tab === 'current'} onClick={() => setTab('current')}>
                معتبر {current.length > 0 ? `(${toPersianDigits(current.length)})` : ''}
              </TabButton>
              <TabButton active={tab === 'past'} onClick={() => setTab('past')}>
                منقضی {past.length > 0 ? `(${toPersianDigits(past.length)})` : ''}
              </TabButton>
            </div>

            {shown.length === 0 ? (
              <EmptyState
                title={tab === 'current' ? 'بیمه‌نامه معتبری ندارید' : 'بیمه‌نامه منقضی‌شده‌ای ندارید'}
              />
            ) : (
              <div className="space-y-3 px-5">
                {shown.map((policy) => (
                  <PolicyCard key={policy.id} policy={policy} />
                ))}
              </div>
            )}
          </>
        )
      ) : null}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`min-h-[40px] rounded-xl text-sm font-medium transition-colors ${
        active ? 'bg-card text-strong shadow-[var(--shadow-card)]' : 'text-muted'
      }`}
    >
      {children}
    </button>
  )
}
