import { Link } from 'react-router'
import { Skeleton, SkeletonScreen } from '../components/ui/Skeleton'
import { useAuth } from '../app/auth-context'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { CarIcon, ChevronIcon, ProfileIcon } from '../components/icons'
import { Button } from '../components/ui/Button'
import { formatMobile } from '../lib/fa'

export function ProfilePage() {
  const { status, user, signOut } = useAuth()

  if (status === 'loading') {
    return (
      <div>
        <PageHeader title="پروفایل" />
        <SkeletonScreen>
          <div className="px-5">
            <Skeleton className="h-24 rounded-[var(--radius-card)]" />
          </div>
        </SkeletonScreen>
      </div>
    )
  }

  if (!user) {
    return (
      <div>
        <PageHeader title="پروفایل" />
        <EmptyState
          icon={<ProfileIcon className="h-14 w-14" />}
          title="وارد نشده‌اید"
          description="برای خرید بیمه و دیدن بیمه‌نامه‌ها، با شماره موبایل وارد شوید."
          action={
            <Link
              to="/auth"
              className="mt-2 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
            >
              ورود یا ثبت‌نام
            </Link>
          }
        />
      </div>
    )
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ')

  return (
    <div>
      <PageHeader title="پروفایل" />
      <div className="space-y-4 px-5">
        <div className="rounded-[var(--radius-card)] border border-line bg-card p-5 shadow-[var(--shadow-card)]">
          <p className="text-base font-semibold text-strong">{fullName || 'کاربر بیمه گلد'}</p>
          <p className="mt-1 text-sm text-muted" dir="ltr">
            {formatMobile(user.mobile)}
          </p>
          {!user.isProfileComplete ? (
            <p className="mt-3 rounded-xl bg-sunken px-3 py-2 text-xs leading-6 text-muted">
              برای خرید بیمه، اطلاعات حساب خود را کامل کنید.
            </p>
          ) : null}
        </div>

        <Link
          to="/profile/vehicles"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)] active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
            <CarIcon className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.95rem] font-semibold text-strong">خودروهای من</span>
            <span className="mt-0.5 block text-xs text-muted">
              پلاک‌های ذخیره‌شده برای استعلام سریع‌تر
            </span>
          </span>
          <ChevronIcon className="h-5 w-5 shrink-0 text-muted" />
        </Link>

        <Button variant="ghost" onClick={() => void signOut()}>
          خروج از حساب
        </Button>
      </div>
    </div>
  )
}
