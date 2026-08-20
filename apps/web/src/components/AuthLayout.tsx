import type { ReactNode } from 'react'
import { BrandMark } from './icons'

/**
 * The auth flow deliberately has no bottom tab bar: it is a linear task, and the tabs would
 * invite the user to wander out of it halfway through.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-h-dvh bg-sunken">
      <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-page">
        <div className="safe-top flex flex-1 flex-col px-6 pt-10">
          <BrandMark className="h-11 w-11 text-brand-600" />
          <h1 className="mt-6 text-2xl font-bold text-strong">{title}</h1>
          <div className="mt-2 text-sm leading-7 text-muted">{subtitle}</div>
          <div className="mt-8 flex-1">{children}</div>
        </div>
        {footer ? <div className="safe-bottom px-6 pb-3 pt-2">{footer}</div> : null}
      </div>
    </div>
  )
}
