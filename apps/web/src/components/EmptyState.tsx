import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-8 py-14 text-center">
      {icon ? <div className="text-muted/50">{icon}</div> : null}
      <p className="text-base font-semibold text-strong">{title}</p>
      {description ? <p className="text-sm leading-7 text-muted">{description}</p> : null}
      {action}
    </div>
  )
}
