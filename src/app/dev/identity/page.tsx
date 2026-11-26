import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { EmptyState, LoadingState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { ROLE_LABELS } from "@/domain/auth/permissions"
import { isDevIdentityEnabled, listDevIdentities } from "@/server/auth/dev-identities"
import { getSession } from "@/server/auth/session"
import { getDb } from "@/server/db"

import { switchDevIdentity } from "./actions"

export const metadata: Metadata = { title: "Development identity" }

export default function DevIdentityPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <Suspense fallback={<LoadingState />}>
        <IdentityPicker />
      </Suspense>
    </main>
  )
}

async function IdentityPicker() {
  const session = await getSession()
  if (!isDevIdentityEnabled()) notFound()
  const identities = await listDevIdentities(getDb())
  const currentId = session.status === "signed_in" ? session.user.id : null

  return (
    <>
      <PageHeader
        title="Development identity"
        description="Act as a synthetic user to check what each role can see. This page does not exist in production builds and is not a sign-in."
      />
      {identities.length === 0 ? (
        <EmptyState title="No synthetic users found">
          Run <code>pnpm db:seed</code> to create them.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {identities.map((identity) => (
            <li key={identity.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{identity.displayName}</p>
                <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {identity.memberships.length === 0
                    ? "No branch memberships"
                    : identity.memberships
                        .map((m) => `${ROLE_LABELS[m.role]}, ${m.branchName}`)
                        .join(" · ")}
                </p>
              </div>
              {identity.id === currentId ? (
                <span className="text-xs font-medium text-muted-foreground">Current</span>
              ) : (
                <form action={switchDevIdentity}>
                  <input type="hidden" name="userId" value={identity.id} />
                  <Button type="submit" variant="outline" size="sm">
                    Use this identity
                  </Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
