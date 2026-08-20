export function ErrorNote({ children }: { children: string }) {
  return (
    <p role="alert" className="mt-3 text-sm leading-6 text-red-600 dark:text-red-400">
      {children}
    </p>
  )
}
