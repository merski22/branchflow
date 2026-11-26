import { afterAll, beforeEach, describe, expect, it } from "vitest"

import {
  PG,
  fixtures,
  openTestDatabase,
  pgErrorCode,
  truncateAll,
} from "../../../tests/integration/test-db"
import { listAuditEvents, recordAuditEvent } from "../repositories/audit"
import { listBranchesForUser } from "../repositories/branches"
import { listDataImports } from "../repositories/data-imports"
import { dataImports } from "@/db/schema"
import { authorizeBranchAccess } from "./authorize"

const handle = openTestDatabase()
const { db } = handle
const f = fixtures(handle)

afterAll(() => handle.close())

/**
 * Two organizations; org A has two branches. Users:
 *  - managerA1: branch_manager at A1
 *  - traineeA1: management_trainee at A1
 *  - managerB1: branch_manager at B1 (same branch slug as A1, different org)
 */
async function seedTenants() {
  const orgA = await f.org("org-a")
  const orgB = await f.org("org-b")
  const a1 = await f.branch(orgA.id, "main")
  const a2 = await f.branch(orgA.id, "north")
  const b1 = await f.branch(orgB.id, "main")
  const managerA1 = await f.user("manager.a1@example.test")
  const traineeA1 = await f.user("trainee.a1@example.test")
  const managerB1 = await f.user("manager.b1@example.test")
  await f.member(managerA1.id, a1.id, "branch_manager")
  await f.member(traineeA1.id, a1.id, "management_trainee")
  await f.member(managerB1.id, b1.id, "branch_manager")
  return { orgA, orgB, a1, a2, b1, managerA1, traineeA1, managerB1 }
}

beforeEach(() => truncateAll(handle))

describe("authorizeBranchAccess (AUTH-001)", () => {
  it("authorizes a member for a permission their role grants", async () => {
    const t = await seedTenants()
    const access = await authorizeBranchAccess(db, {
      userId: t.managerA1.id,
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "audit.view",
    })
    expect(access?.branch.id).toBe(t.a1.id)
    expect(access?.organization.id).toBe(t.orgA.id)
    expect(access?.role).toBe("branch_manager")
    expect(access?.branch.timeZone).toBe("America/Toronto")
  })

  it("denies a sibling branch in the same organization without membership", async () => {
    const t = await seedTenants()
    const access = await authorizeBranchAccess(db, {
      userId: t.managerA1.id,
      orgSlug: "org-a",
      branchSlug: "north",
      permission: "branch.view",
    })
    expect(access).toBeNull()
  })

  it("denies another organization's branch even when the branch slug matches", async () => {
    const t = await seedTenants()
    const access = await authorizeBranchAccess(db, {
      userId: t.managerA1.id,
      orgSlug: "org-b",
      branchSlug: "main",
      permission: "branch.view",
    })
    expect(access).toBeNull()
  })

  it("denies a permission the member's role does not grant", async () => {
    const t = await seedTenants()
    const view = await authorizeBranchAccess(db, {
      userId: t.traineeA1.id,
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "branch.view",
    })
    const audit = await authorizeBranchAccess(db, {
      userId: t.traineeA1.id,
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "audit.view",
    })
    expect(view).not.toBeNull()
    expect(audit).toBeNull()
  })

  it("returns the same result for a nonexistent branch as for a forbidden one", async () => {
    const t = await seedTenants()
    const missing = await authorizeBranchAccess(db, {
      userId: t.managerA1.id,
      orgSlug: "org-a",
      branchSlug: "does-not-exist",
      permission: "branch.view",
    })
    expect(missing).toBeNull()
  })

  it("denies an unknown user", async () => {
    await seedTenants()
    const access = await authorizeBranchAccess(db, {
      userId: "00000000-0000-4000-8000-000000000000",
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "branch.view",
    })
    expect(access).toBeNull()
  })
})

describe("branch-scoped repositories", () => {
  it("lists only the branches a user belongs to", async () => {
    const t = await seedTenants()
    const branchesA = await listBranchesForUser(db, t.managerA1.id)
    expect(branchesA.map((b) => `${b.orgSlug}/${b.branchSlug}`)).toEqual(["org-a/main"])
  })

  it("returns no branches for a user with no memberships", async () => {
    const lonely = await f.user("nobody@example.test")
    expect(await listBranchesForUser(db, lonely.id)).toEqual([])
  })

  it("never returns another branch's data imports or audit events", async () => {
    const t = await seedTenants()
    for (const [branch, org] of [
      [t.a1, t.orgA],
      [t.b1, t.orgB],
    ] as const) {
      await db.insert(dataImports).values({
        organizationId: org.id,
        branchId: branch.id,
        sourceKind: "synthetic_seed",
        sourceLabel: `import for ${org.slug}`,
        status: "completed",
      })
      await recordAuditEvent(db, {
        action: `test.${org.slug}`,
        actorKind: "system",
        organizationId: org.id,
        branchId: branch.id,
      })
    }

    const accessA = await authorizeBranchAccess(db, {
      userId: t.managerA1.id,
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "audit.view",
    })
    expect(accessA).not.toBeNull()

    const imports = await listDataImports(db, accessA!)
    expect(imports.map((i) => i.sourceLabel)).toEqual(["import for org-a"])
    const events = await listAuditEvents(db, accessA!)
    expect(events.map((e) => e.action)).toEqual(["test.org-a"])
  })

  it("refuses to list audit events without the audit.view permission", async () => {
    const t = await seedTenants()
    const traineeAccess = await authorizeBranchAccess(db, {
      userId: t.traineeA1.id,
      orgSlug: "org-a",
      branchSlug: "main",
      permission: "branch.view",
    })
    await expect(listAuditEvents(db, traineeAccess!)).rejects.toThrow(/audit\.view/)
  })
})

describe("database tenant integrity", () => {
  it("rejects a duplicate branch slug within one organization", async () => {
    const t = await seedTenants()
    expect(await pgErrorCode(f.branch(t.orgA.id, "main"))).toBe(PG.UNIQUE_VIOLATION)
  })

  it("rejects a duplicate import of the same content at one branch (idempotency)", async () => {
    const t = await seedTenants()
    const row = {
      organizationId: t.orgA.id,
      branchId: t.a1.id,
      sourceKind: "file_upload" as const,
      sourceLabel: "contracts.csv",
      contentSha256: "a".repeat(64),
      status: "completed" as const,
    }
    await db.insert(dataImports).values(row)
    expect(await pgErrorCode(db.insert(dataImports).values(row))).toBe(PG.UNIQUE_VIOLATION)
  })

  it("rejects a data import whose organization does not own the branch", async () => {
    const t = await seedTenants()
    const code = await pgErrorCode(
      db.insert(dataImports).values({
        organizationId: t.orgB.id,
        branchId: t.a1.id,
        sourceKind: "synthetic_seed",
        sourceLabel: "mismatched",
        status: "completed",
      }),
    )
    expect(code).toBe(PG.FOREIGN_KEY_VIOLATION)
  })

  it("rejects an audit event whose organization does not own the branch", async () => {
    const t = await seedTenants()
    const code = await pgErrorCode(
      recordAuditEvent(db, {
        action: "test.mismatch",
        actorKind: "system",
        organizationId: t.orgB.id,
        branchId: t.a1.id,
      }),
    )
    expect(code).toBe(PG.FOREIGN_KEY_VIOLATION)
  })

  it("rejects a branch-level audit event without an organization", async () => {
    const t = await seedTenants()
    const code = await pgErrorCode(
      recordAuditEvent(db, { action: "test.no-org", actorKind: "system", branchId: t.a1.id }),
    )
    expect(code).toBe(PG.CHECK_VIOLATION)
  })
})
