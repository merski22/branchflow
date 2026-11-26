import { sql } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import { fixtures, openTestDatabase, truncateAll } from "../../tests/integration/test-db"
import { buildFoundationScenario } from "../synthetic/foundation-scenario"
import { UnsafeSeedTargetError, applyFoundationScenario } from "./seed"

const handle = openTestDatabase()
const { db } = handle
afterAll(() => handle.close())
beforeEach(() => truncateAll(handle))

const t = new Date("2026-11-26T14:00:00Z")

async function snapshot() {
  const tables = ["organizations", "branches", "users", "branch_memberships", "data_imports"]
  const out: Record<string, unknown[]> = {}
  for (const table of tables) {
    const rows = await db.execute(sql.raw(`SELECT * FROM ${table} ORDER BY id`))
    // created_at / updated_at are set by the database at insert time.
    out[table] = rows.map(({ created_at: _c, updated_at: _u, ...rest }) => rest)
  }
  return out
}

describe("applyFoundationScenario", () => {
  it("is reproducible: seeding twice with the same seed yields identical data", async () => {
    await applyFoundationScenario(db, buildFoundationScenario(7, t))
    const first = await snapshot()
    await applyFoundationScenario(db, buildFoundationScenario(7, t))
    expect(await snapshot()).toEqual(first)
    expect(first.users!.length).toBeGreaterThan(0)
  })

  it("marks every organization, branch and user as synthetic", async () => {
    await applyFoundationScenario(db, buildFoundationScenario(7, t))
    const [row] = await db.execute<{ n: number }>(sql`
      SELECT (SELECT count(*) FROM organizations WHERE NOT is_synthetic)
           + (SELECT count(*) FROM branches WHERE NOT is_synthetic)
           + (SELECT count(*) FROM users WHERE NOT is_synthetic) AS n`)
    expect(Number(row!.n)).toBe(0)
  })

  it("records provenance: one completed synthetic import and audit event per branch", async () => {
    const scenario = buildFoundationScenario(7, t)
    await applyFoundationScenario(db, scenario)
    const imports = await db.execute(sql`SELECT source_kind, status, data_as_of FROM data_imports`)
    expect(imports).toHaveLength(scenario.branches.length)
    for (const i of imports) {
      expect(i.source_kind).toBe("synthetic_seed")
      expect(i.status).toBe("completed")
      expect(new Date(i.data_as_of as string).toISOString()).toBe(t.toISOString())
    }
    const events = await db.execute(
      sql`SELECT count(*)::int AS n FROM audit_events WHERE action = 'synthetic_seed.applied'`,
    )
    expect(events[0]!.n).toBe(scenario.branches.length)
  })

  it("refuses to run when real (non-synthetic) data is present, and changes nothing", async () => {
    await fixtures(handle).user("real.person@example.com", false)
    await expect(applyFoundationScenario(db, buildFoundationScenario(7, t))).rejects.toBeInstanceOf(
      UnsafeSeedTargetError,
    )
    const users = await db.execute(sql`SELECT email FROM users`)
    expect(users.map((u) => u.email)).toEqual(["real.person@example.com"])
  })
})
