import "server-only"

import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import { cache } from "react"

import type { Permission } from "@/domain/auth/permissions"

import { getDb } from "../db"
import { getServerEnv } from "../env"
import { authorizeBranchAccess, type AuthorizedBranch } from "./authorize"
import { resolveIdentity, type SessionState, type SessionUser } from "./identity"

export const DEV_IDENTITY_COOKIE = "bf_dev_identity"

/** Current session, resolved once per request. Reads cookies: call inside <Suspense>. */
export const getSession = cache(async (): Promise<SessionState> => {
  const env = getServerEnv()
  const cookieStore = await cookies()
  return resolveIdentity(getDb(), {
    authMode: env.AUTH_MODE,
    nodeEnv: env.NODE_ENV,
    devIdentityCookie: cookieStore.get(DEV_IDENTITY_COOKIE)?.value,
    defaultUserEmail: env.DEV_AUTH_DEFAULT_USER_EMAIL,
  })
})

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  return session.status === "signed_in" ? session.user : null
}

/**
 * Authorize the current user for a branch route. Every denial — not signed in, no such
 * branch, no membership, missing permission — renders 404 (NFR-012).
 */
export async function requireBranchAccess(
  orgSlug: string,
  branchSlug: string,
  permission: Permission,
): Promise<{ user: SessionUser; access: AuthorizedBranch }> {
  const user = await getSessionUser()
  if (!user) notFound()
  const access = await authorizeBranchAccess(getDb(), {
    userId: user.id,
    orgSlug,
    branchSlug,
    permission,
  })
  if (!access) notFound()
  return { user, access }
}
