import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { EmptyState } from '../components/EmptyState'
import { ErrorState } from '../components/ErrorState'
import { PageHeader } from '../components/PageHeader'
import { CarIcon } from '../components/icons'
import { SkeletonCards } from '../components/ui/Skeleton'
import { ErrorNote } from '../components/ui/ErrorNote'
import { ApiError } from '../lib/api'
import { toPersianDigits } from '../lib/fa'
import { deleteVehicle, getVehicles, type SavedVehicle } from '../lib/vehicles-api'

export function VehiclesPage() {
  const queryClient = useQueryClient()
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: getVehicles })

  const remove = useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      setConfirmingId(null)
      return queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    },
  })

  return (
    <div>
      <PageHeader title="خودروهای من" />

      {vehicles.isPending ? <SkeletonCards count={2} height="h-32" /> : null}

      {vehicles.isError ? (
        <ErrorState
          title="دریافت خودروها ممکن نشد"
          message={
            vehicles.error instanceof ApiError ? vehicles.error.messageFa : 'دوباره تلاش کنید.'
          }
          onRetry={() => void vehicles.refetch()}
          retrying={vehicles.isFetching}
        />
      ) : null}

      {vehicles.data ? (
        vehicles.data.length === 0 ? (
          <EmptyState
            icon={<CarIcon className="h-14 w-14" />}
            title="خودرویی ذخیره نکرده‌اید"
            description="وقتی برای خودرویی بیمه شخص ثالث می‌گیرید، مشخصاتش اینجا ذخیره می‌شود تا دفعه بعد دوباره وارد نکنید."
            action={
              <Link
                to="/p/motor-tpl/form"
                className="mt-2 inline-flex min-h-[44px] items-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white"
              >
                استعلام شخص ثالث
              </Link>
            }
          />
        ) : (
          <div className="space-y-3 px-5">
            {vehicles.data.map((vehicle) => (
              <VehicleRow
                key={vehicle.id}
                vehicle={vehicle}
                confirming={confirmingId === vehicle.id}
                busy={remove.isPending && remove.variables === vehicle.id}
                onAskDelete={() => setConfirmingId(vehicle.id)}
                onCancel={() => setConfirmingId(null)}
                onConfirm={() => remove.mutate(vehicle.id)}
              />
            ))}

            {remove.isError ? (
              <ErrorNote>
                {remove.error instanceof ApiError ? remove.error.messageFa : 'حذف ممکن نشد.'}
              </ErrorNote>
            ) : null}

            <p className="pt-1 text-xs leading-6 text-muted">
              حذف خودرو روی بیمه‌نامه‌های صادرشده اثری ندارد.
            </p>
          </div>
        )
      ) : null}
    </div>
  )
}

function VehicleRow({
  vehicle,
  confirming,
  busy,
  onAskDelete,
  onCancel,
  onConfirm,
}: {
  vehicle: SavedVehicle
  confirming: boolean
  busy: boolean
  onAskDelete: () => void
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <CarIcon className="h-6 w-6" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-semibold text-strong">
            {vehicle.modelLabelFa}
          </p>
          {/* Plain RTL: this is running Persian, not the plate widget. */}
          <p className="mt-1 text-sm text-strong">{vehicle.plateFa}</p>
          <p className="mt-1 text-xs text-muted">
            {vehicle.groupFa} · {vehicle.usageFa} · مدل {toPersianDigits(vehicle.productionYear)}
          </p>
        </div>
      </div>

      {confirming ? (
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <p className="flex-1 text-xs text-muted">این خودرو حذف شود؟</p>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[36px] rounded-full px-3 text-xs font-medium text-muted"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="min-h-[36px] rounded-full bg-red-600 px-4 text-xs font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'در حال حذف…' : 'حذف'}
          </button>
        </div>
      ) : (
        <div className="mt-3 flex justify-between border-t border-line pt-3">
          <Link
            to="/p/motor-tpl/form"
            state={{ vehicleId: vehicle.id }}
            className="text-xs font-medium text-brand-600 dark:text-brand-300"
          >
            استعلام دوباره
          </Link>
          {/* Two taps to delete: a stored plate is tedious to retype and there is no undo. */}
          <button type="button" onClick={onAskDelete} className="text-xs text-muted">
            حذف
          </button>
        </div>
      )}
    </div>
  )
}
