import type { ReactNode } from "react"

export function PageHeader({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}
