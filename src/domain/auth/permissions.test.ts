import { describe, expect, it } from "vitest"

import { BRANCH_ROLES, PERMISSIONS, isBranchRole, roleHasPermission } from "./permissions"

describe("roleHasPermission (AUTH-001, proposed matrix)", () => {
  it("lets every role view its branch", () => {
    for (const role of BRANCH_ROLES) expect(roleHasPermission(role, "branch.view")).toBe(true)
  })

  it("restricts the audit log to branch and assistant managers", () => {
    expect(roleHasPermission("branch_manager", "audit.view")).toBe(true)
    expect(roleHasPermission("assistant_manager", "audit.view")).toBe(true)
    expect(roleHasPermission("management_trainee", "audit.view")).toBe(false)
    expect(roleHasPermission("read_only", "audit.view")).toBe(false)
  })

  it("grants nothing to a missing or unrecognised role", () => {
    for (const permission of PERMISSIONS) {
      expect(roleHasPermission(undefined, permission)).toBe(false)
      expect(roleHasPermission(null, permission)).toBe(false)
      expect(roleHasPermission("admin", permission)).toBe(false)
      expect(roleHasPermission("", permission)).toBe(false)
    }
  })

  it("recognises only defined roles", () => {
    expect(isBranchRole("branch_manager")).toBe(true)
    expect(isBranchRole("BRANCH_MANAGER")).toBe(false)
    expect(isBranchRole(42)).toBe(false)
  })
})
