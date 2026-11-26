import "server-only"

import { asc, eq } from "drizzle-orm"

import type { Database } from "@/db/client"
import { branches, branchMemberships, organizations } from "@/db/schema"
import type { BranchRole } from "@/domain/auth/permissions"

export interface BranchSummary {
  orgSlug: string
  orgName: string
  branchSlug: string
  branchName: string
  timeZone: string
  isSynthetic: boolean
  role: BranchRole
}

/** Branches the user is a member of. Never returns branches without a membership. */
export async function listBranchesForUser(db: Database, userId: string): Promise<BranchSummary[]> {
  return db
    .select({
      orgSlug: organizations.slug,
      orgName: organizations.name,
      branchSlug: branches.slug,
      branchName: branches.name,
      timeZone: branches.timeZone,
      isSynthetic: branches.isSynthetic,
      role: branchMemberships.role,
    })
    .from(branchMemberships)
    .innerJoin(branches, eq(branches.id, branchMemberships.branchId))
    .innerJoin(organizations, eq(organizations.id, branches.organizationId))
    .where(eq(branchMemberships.userId, userId))
    .orderBy(asc(organizations.name), asc(branches.name))
}
