import { Suspense } from "react"

import { BranchNav, type BranchNavItem } from "@/components/branch-nav"
import { SyntheticDataBanner } from "@/components/synthetic-data-banner"
import { requireBranchAccess } from "@/server/auth/session"

/**
 * Branch frame. The layout authorizes only to render the frame; every page re-authorizes
 * for its own permission, because layouts are not re-rendered on client navigation.
 */
export default function BranchLayout({
  children,
  params,
}: LayoutProps<"/o/[orgSlug]/[branchSlug]">) {
  return (
    <>
      <Suspense fallback={<div className="h-11 border-b border-border" />}>
        <BranchFrame params={params} />
      </Suspense>
      <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </>
  )
}

async function BranchFrame({
  params,
}: {
  params: LayoutProps<"/o/[orgSlug]/[branchSlug]">["params"]
}) {
  const { orgSlug, branchSlug } = await params
  const { access } = await requireBranchAccess(orgSlug, branchSlug, "branch.view")
  const base = `/o/${access.organization.slug}/${access.branch.slug}`
  const items: BranchNavItem[] = [{ href: base, label: "Overview" }]
  if (access.permissions.includes("audit.view")) {
    items.push({ href: `${base}/audit`, label: "Audit log" })
  }

  return (
    <>
      {access.branch.isSynthetic ? <SyntheticDataBanner /> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-2">
        <div className="text-sm">
          <span className="text-muted-foreground">{access.organization.name}</span>
          <span className="px-1.5 text-muted-foreground">/</span>
          <span className="font-medium">{access.branch.name}</span>
        </div>
        <BranchNav items={items} />
      </div>
    </>
  )
}
