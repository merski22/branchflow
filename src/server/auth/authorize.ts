import "server-only"

import { and, eq } from "drizzle-orm"

import type { Database } from "@/db/client"
import { branches, branchMemberships, organizations } from "@/db/schema"
import {
  isBranchRole,
  permissionsForRole,
  roleHasPermission,
  type BranchRole,
  type Permission,
} from "@/domain/auth/permissions"

declare const authorizedBrand: unique symbol

/**
 * Proof that a specific user was authorized for a specific branch and permission.
 * Only `authorizeBranchAccess` produces this value; branch-scoped repositories require it,
 * so tenant data cannot be queried with an unchecked branch id.
 */
export interface AuthorizedBranch {
  readonly [authorizedBrand]: true
  readonly userId: string
  readonly role: BranchRole
  readonly permissions: readonly Permission[]
  readonly branch: {
    readonly id: string
    readonly slug: string
    readonly name: string
    readonly timeZone: string
    readonly isSynthetic: boolean
  }
  readonly organization: {
    readonly id: string
    readonly slug: string
    readonly name: string
    readonly isSynthetic: boolean
  }
}

/**
 * Rule AUTH-001. Resolve a branch for a user and check a permission.
 *
 * The branch is loaded only through the user's membership, so a branch the user does not
 * belong to is indistinguishable from one that does not exist. Returns `null` for every
 * denial (no such org/branch, no membership, unknown role, missing permission); callers
 * respond with 404 (NFR-012).
 */
export async function authorizeBranchAccess(
  db: Database,
  input: { userId: string; orgSlug: string; branchSlug: string; permission: Permission },
): Promise<AuthorizedBranch | null> {
  const rows = await db
    .select({
      role: branchMemberships.role,
      branchId: branches.id,
      branchSlug: branches.slug,
      branchName: branches.name,
      timeZone: branches.timeZone,
      branchIsSynthetic: branches.isSynthetic,
      orgId: organizations.id,
      orgSlug: organizations.slug,
      orgName: organizations.name,
      orgIsSynthetic: organizations.isSynthetic,
    })
    .from(branchMemberships)
    .innerJoin(branches, eq(branches.id, branchMemberships.branchId))
    .innerJoin(organizations, eq(organizations.id, branches.organizationId))
    .where(
      and(
        eq(branchMemberships.userId, input.userId),
        eq(organizations.slug, input.orgSlug),
        eq(branches.slug, input.branchSlug),
      ),
    )
    .limit(1)

  const row = rows[0]
  if (!row || !isBranchRole(row.role)) return null
  if (!roleHasPermission(row.role, input.permission)) return null

  return {
    userId: input.userId,
    role: row.role,
    permissions: permissionsForRole(row.role),
    branch: {
      id: row.branchId,
      slug: row.branchSlug,
      name: row.branchName,
      timeZone: row.timeZone,
      isSynthetic: row.branchIsSynthetic,
    },
    organization: {
      id: row.orgId,
      slug: row.orgSlug,
      name: row.orgName,
      isSynthetic: row.orgIsSynthetic,
    },
  } as AuthorizedBranch
}
