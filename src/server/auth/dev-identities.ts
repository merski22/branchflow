import "server-only"

import { asc, eq } from "drizzle-orm"

import type { Database } from "@/db/client"
import { branches, branchMemberships, organizations, users } from "@/db/schema"
import type { BranchRole } from "@/domain/auth/permissions"

import { getServerEnv } from "../env"

/** Whether the development identity mechanism may run in this process (ADR-003, NFR-018). */
export function isDevIdentityEnabled(): boolean {
  const env = getServerEnv()
  return env.AUTH_MODE === "dev" && env.NODE_ENV !== "production"
}

export interface DevIdentity {
  id: string
  email: string
  displayName: string
  memberships: { orgName: string; branchName: string; role: BranchRole }[]
}

/** Synthetic users and their memberships. Only for the development identity switcher. */
export async function listDevIdentities(db: Database): Promise<DevIdentity[]> {
  if (!isDevIdentityEnabled()) return []
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      orgName: organizations.name,
      branchName: branches.name,
      role: branchMemberships.role,
    })
    .from(users)
    .leftJoin(branchMemberships, eq(branchMemberships.userId, users.id))
    .leftJoin(branches, eq(branches.id, branchMemberships.branchId))
    .leftJoin(organizations, eq(organizations.id, branches.organizationId))
    .where(eq(users.isSynthetic, true))
    .orderBy(asc(users.displayName), asc(branches.name))

  const byId = new Map<string, DevIdentity>()
  for (const row of rows) {
    let identity = byId.get(row.id)
    if (!identity) {
      identity = { id: row.id, email: row.email, displayName: row.displayName, memberships: [] }
      byId.set(row.id, identity)
    }
    if (row.role && row.branchName && row.orgName) {
      identity.memberships.push({
        orgName: row.orgName,
        branchName: row.branchName,
        role: row.role,
      })
    }
  }
  return [...byId.values()]
}
