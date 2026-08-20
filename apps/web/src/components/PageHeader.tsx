export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="safe-top px-5 pb-4 pt-4">
      <h1 className="text-xl font-bold text-strong">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
    </header>
  )
}
