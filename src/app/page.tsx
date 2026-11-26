import Link from "next/link"
import { Suspense } from "react"

import { EmptyState, LoadingState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { ROLE_LABELS } from "@/domain/auth/permissions"
import { getSession } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { listBranchesForUser } from "@/server/repositories/branches"

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeader title="Branches" description="Branches you have access to." />
      <Suspense fallback={<LoadingState label="Loading your branches…" />}>
        <BranchList />
      </Suspense>
    </main>
  )
}

async function BranchList() {
  const session = await getSession()

  if (session.status === "auth_not_configured") {
    return (
      <EmptyState title="Sign-in is not available">
        {session.reason} Production authentication has not been built yet (see ADR-003).
      </EmptyState>
    )
  }
  if (session.status === "signed_out") {
    return (
      <EmptyState title="No identity selected">
        <Link href="/dev/identity" className="underline underline-offset-4">
          Choose a synthetic development identity
        </Link>{" "}
        to continue. If the list is empty, run <code>pnpm db:seed</code>.
      </EmptyState>
    )
  }

  const branches = await listBranchesForUser(getDb(), session.user.id)
  if (branches.length === 0) {
    return (
      <EmptyState title="You don't have access to any branches">
        Ask a branch manager to add you to a branch.
      </EmptyState>
    )
  }

  return (
    <ul className="divide-y divide-border rounded-md border border-border">
      {branches.map((b) => (
        <li key={`${b.orgSlug}/${b.branchSlug}`}>
          <Link
            href={`/o/${b.orgSlug}/${b.branchSlug}`}
            className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-muted"
          >
            <span>
              <span className="block text-sm font-medium">{b.branchName}</span>
              <span className="block text-xs text-muted-foreground">
                {b.orgName} · {b.timeZone}
              </span>
            </span>
            <span className="flex items-center gap-2">
              {b.isSynthetic ? <Badge tone="synthetic">Synthetic</Badge> : null}
              <span className="text-xs text-muted-foreground">{ROLE_LABELS[b.role]}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
