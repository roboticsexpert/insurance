import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'

export function NotFoundPage() {
  return (
    <EmptyState
      title="صفحه پیدا نشد"
      description="نشانی‌ای که باز کردید وجود ندارد یا جابه‌جا شده است."
      action={
        <Link
          to="/"
          className="mt-2 inline-flex items-center rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          بازگشت به خانه
        </Link>
      }
    />
  )
}
