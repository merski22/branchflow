import type { ReactNode } from "react"

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium">{title}</p>
      {children ? <div className="mt-1 text-sm text-muted-foreground">{children}</div> : null}
    </div>
  )
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" aria-live="polite" className="px-1 py-4 text-sm text-muted-foreground">
      {label}
    </p>
  )
}
