import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import { DEFAULT_FRESHNESS_THRESHOLDS } from "../shared/freshness"
import { RULES, RULE_STATUSES } from "./registry"

const root = path.resolve(__dirname, "../../..")
const doc = readFileSync(path.join(root, "docs/BUSINESS_RULES.md"), "utf8")

/** Parse "### ID — Name" headings and their "**Status:** value" lines from the docs. */
function documentedRules(): Map<string, string | undefined> {
  const result = new Map<string, string | undefined>()
  const sections = doc.split(/^### /m).slice(1)
  for (const section of sections) {
    const id = /^([A-Z]+-\d{3})\s+—/.exec(section)?.[1]
    if (!id) continue
    const status = /\*\*Status:\*\*\s*([a-z_]+)/.exec(section)?.[1]
    result.set(id, status)
  }
  return result
}

describe("business rules registry", () => {
  it("has unique, well-formed ids", () => {
    const ids = RULES.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[A-Z]+-\d{3}$/)
  })

  it("documents exactly the registered rules, with matching statuses", () => {
    const documented = documentedRules()
    expect([...documented.keys()].sort()).toEqual(RULES.map((r) => r.id).sort())
    for (const rule of RULES) expect(documented.get(rule.id)).toBe(rule.status)
  })

  it("uses only defined statuses and never claims 'confirmed' in Phase 0", () => {
    for (const rule of RULES) {
      expect(RULE_STATUSES).toContain(rule.status)
      expect(rule.status).not.toBe("confirmed")
    }
  })

  it("points at implementation and test files that exist", () => {
    for (const rule of RULES) {
      expect(existsSync(path.join(root, rule.implementation)), rule.implementation).toBe(true)
      expect(rule.tests.length).toBeGreaterThan(0)
      for (const test of rule.tests) expect(existsSync(path.join(root, test)), test).toBe(true)
    }
  })

  it("records the thresholds the code actually uses", () => {
    expect(RULES.find((r) => r.id === "FRESH-001")?.thresholds).toEqual(
      DEFAULT_FRESHNESS_THRESHOLDS,
    )
  })
})
