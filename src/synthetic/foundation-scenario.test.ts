import { readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { isValidTimeZone } from "../domain/shared/time"
import { SYNTHETIC_EMAIL_DOMAIN, buildFoundationScenario } from "./foundation-scenario"

const t = new Date("2026-11-26T14:00:00Z")

describe("buildFoundationScenario", () => {
  it("is reproducible: same seed and reference time give identical output", () => {
    expect(buildFoundationScenario(123, t)).toEqual(buildFoundationScenario(123, t))
  })

  it("produces different ids for a different seed", () => {
    const a = buildFoundationScenario(1, t)
    const b = buildFoundationScenario(2, t)
    expect(a.organizations[0]!.id).not.toBe(b.organizations[0]!.id)
  })

  it("has unique ids and internally consistent references", () => {
    const s = buildFoundationScenario(99, t)
    const ids = [...s.organizations, ...s.branches, ...s.users, ...s.memberships, ...s.imports].map(
      (x) => x.id,
    )
    expect(new Set(ids).size).toBe(ids.length)
    const orgIds = new Set(s.organizations.map((o) => o.id))
    const branchById = new Map(s.branches.map((b) => [b.id, b]))
    const userIds = new Set(s.users.map((u) => u.id))
    for (const b of s.branches) expect(orgIds.has(b.organizationId)).toBe(true)
    for (const m of s.memberships) {
      expect(userIds.has(m.userId)).toBe(true)
      expect(branchById.has(m.branchId)).toBe(true)
    }
    for (const i of s.imports)
      expect(branchById.get(i.branchId)?.organizationId).toBe(i.organizationId)
  })

  it("uses only valid IANA time zones and slugs unique within each organization", () => {
    const s = buildFoundationScenario(1, t)
    for (const b of s.branches) expect(isValidTimeZone(b.timeZone)).toBe(true)
    const keys = s.branches.map((b) => `${b.organizationId}/${b.slug}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it("only uses reserved synthetic e-mail addresses and labels organizations as synthetic", () => {
    const s = buildFoundationScenario(1, t)
    for (const u of s.users) expect(u.email.endsWith(`@${SYNTHETIC_EMAIL_DOMAIN}`)).toBe(true)
    for (const o of s.organizations) expect(o.name).toMatch(/\(Synthetic\)$/)
  })

  it("covers the identities needed to exercise isolation and permissions", () => {
    const s = buildFoundationScenario(1, t)
    const membershipsByUser = new Map<string, number>()
    for (const m of s.memberships) {
      membershipsByUser.set(m.userId, (membershipsByUser.get(m.userId) ?? 0) + 1)
    }
    const counts = s.users.map((u) => membershipsByUser.get(u.id) ?? 0)
    expect(counts).toContain(0) // a user with no branches
    expect(Math.max(...counts)).toBeGreaterThan(1) // a multi-branch user
    expect(new Set(s.memberships.map((m) => m.role)).size).toBeGreaterThanOrEqual(3)
    expect(s.organizations.length).toBeGreaterThanOrEqual(2) // cross-organization isolation
  })

  it("contains the default development identity named in .env.example", () => {
    const env = readFileSync(path.resolve(__dirname, "../../.env.example"), "utf8")
    const email = /^DEV_AUTH_DEFAULT_USER_EMAIL=(.+)$/m.exec(env)?.[1]?.trim()
    const s = buildFoundationScenario(undefined, t)
    expect(s.users.map((u) => u.email)).toContain(email)
  })

  it("rejects an invalid reference time", () => {
    expect(() => buildFoundationScenario(1, new Date("nope"))).toThrow(RangeError)
  })
})
