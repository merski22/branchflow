import { sql } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, it } from "vitest"

import {
  PG,
  fixtures,
  openTestDatabase,
  pgErrorCode,
  truncateAll,
} from "../../../tests/integration/test-db"
import { recordAuditEvent } from "../repositories/audit"
import { resolveIdentity, type IdentityInput } from "./identity"

const handle = openTestDatabase()
const { db } = handle
const f = fixtures(handle)

afterAll(() => handle.close())
beforeEach(() => truncateAll(handle))

const base: IdentityInput = {
  authMode: "dev",
  nodeEnv: "development",
  devIdentityCookie: undefined,
  defaultUserEmail: undefined,
}

describe("resolveIdentity (development identity)", () => {
  it("is not configured when AUTH_MODE is none", async () => {
    const state = await resolveIdentity(db, { ...base, authMode: "none" })
    expect(state.status).toBe("auth_not_configured")
  })

  it("refuses to run in production even when AUTH_MODE=dev (NFR-018)", async () => {
    const user = await f.user("dev@example.test")
    const state = await resolveIdentity(db, {
      ...base,
      nodeEnv: "production",
      devIdentityCookie: user.id,
      defaultUserEmail: user.email,
    })
    expect(state.status).toBe("auth_not_configured")
  })

  it("resolves the user named by a valid cookie", async () => {
    const user = await f.user("cookie@example.test")
    const state = await resolveIdentity(db, { ...base, devIdentityCookie: user.id })
    expect(state).toMatchObject({ status: "signed_in", user: { id: user.id } })
  })

  it("falls back to the default email when the cookie is malformed", async () => {
    const user = await f.user("default@example.test")
    const state = await resolveIdentity(db, {
      ...base,
      devIdentityCookie: "'; DROP TABLE users; --",
      defaultUserEmail: "DEFAULT@example.test",
    })
    expect(state).toMatchObject({ status: "signed_in", user: { id: user.id } })
  })

  it("never resolves a non-synthetic user", async () => {
    const real = await f.user("real.person@example.test", false)
    const state = await resolveIdentity(db, {
      ...base,
      devIdentityCookie: real.id,
      defaultUserEmail: real.email,
    })
    expect(state.status).toBe("signed_out")
  })

  it("is signed out when nothing matches", async () => {
    const state = await resolveIdentity(db, {
      ...base,
      devIdentityCookie: "00000000-0000-4000-8000-000000000000",
      defaultUserEmail: "missing@example.test",
    })
    expect(state.status).toBe("signed_out")
  })
})

describe("audit log", () => {
  it("is append-only: UPDATE and DELETE are rejected", async () => {
    await recordAuditEvent(db, { action: "test.event", actorKind: "system" })
    expect(await pgErrorCode(db.execute(sql`UPDATE audit_events SET action = 'tampered'`))).toBe(
      PG.INSUFFICIENT_PRIVILEGE,
    )
    expect(await pgErrorCode(db.execute(sql`DELETE FROM audit_events`))).toBe(
      PG.INSUFFICIENT_PRIVILEGE,
    )
    const rows = await db.execute(sql`SELECT action FROM audit_events`)
    expect(rows.map((r) => r.action)).toEqual(["test.event"])
  })
})
