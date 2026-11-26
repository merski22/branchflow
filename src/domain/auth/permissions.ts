/**
 * Rule AUTH-001 — Branch access (status: proposed).
 *
 * Roles and the role → permission matrix are a PROPOSAL pending discovery (Q-080):
 * we have not confirmed who would use BranchFlow or what each role may do.
 * Only permissions used by implemented features are defined. Add permissions
 * alongside the feature that needs them.
 */

export const BRANCH_ROLES = [
  "branch_manager",
  "assistant_manager",
  "management_trainee",
  "read_only",
] as const

export type BranchRole = (typeof BRANCH_ROLES)[number]

export const PERMISSIONS = [
  /** See the branch, its configuration and its data sources. */
  "branch.view",
  /** See the branch audit log. */
  "audit.view",
] as const

export type Permission = (typeof PERMISSIONS)[number]

const ROLE_PERMISSIONS: Readonly<Record<BranchRole, readonly Permission[]>> = {
  branch_manager: ["branch.view", "audit.view"],
  assistant_manager: ["branch.view", "audit.view"],
  management_trainee: ["branch.view"],
  read_only: ["branch.view"],
}

export const ROLE_LABELS: Readonly<Record<BranchRole, string>> = {
  branch_manager: "Branch manager",
  assistant_manager: "Assistant manager",
  management_trainee: "Management trainee",
  read_only: "Read only",
}

export function isBranchRole(value: unknown): value is BranchRole {
  return typeof value === "string" && (BRANCH_ROLES as readonly string[]).includes(value)
}

/**
 * Whether `role` grants `permission`. A missing or unrecognised role grants nothing.
 */
export function roleHasPermission(role: unknown, permission: Permission): boolean {
  if (!isBranchRole(role)) return false
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function permissionsForRole(role: BranchRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role]
}
