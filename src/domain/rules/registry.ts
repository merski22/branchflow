/**
 * Registry of every business rule BranchFlow applies (NFR-032).
 * Must stay in sync with docs/BUSINESS_RULES.md — enforced by registry.test.ts.
 */

export const RULE_STATUSES = [
  "confirmed",
  "proposed",
  "experimental",
  "requires_discovery",
] as const
export type RuleStatus = (typeof RULE_STATUSES)[number]

export interface RuleDefinition {
  readonly id: string
  readonly name: string
  readonly module: string
  readonly status: RuleStatus
  readonly purpose: string
  readonly inputs: readonly string[]
  readonly output: string
  readonly assumptions: readonly string[]
  readonly missingDataBehavior: string
  /** Configurable thresholds and their current default values. */
  readonly thresholds: Readonly<Record<string, number>>
  /** Source file implementing the rule, relative to the repository root. */
  readonly implementation: string
  readonly tests: readonly string[]
}

export const RULES: readonly RuleDefinition[] = [
  {
    id: "FRESH-001",
    name: "Data freshness classification",
    module: "shared",
    status: "proposed",
    purpose:
      "Show how current a piece of information is so stale data is never presented as current.",
    inputs: ["observedAt (may be unknown)", "now", "thresholds"],
    output: "fresh | aging | stale | unknown | invalid_future, with age in minutes when known",
    assumptions: [
      "One threshold pair is adequate for Phase 0 data sources; per-source thresholds come in Phase 1.",
    ],
    missingDataBehavior:
      "Unknown or invalid observedAt → unknown (never fresh). Future beyond clock skew → invalid_future.",
    thresholds: { agingAfterMinutes: 240, staleAfterMinutes: 1440, allowedClockSkewMinutes: 5 },
    implementation: "src/domain/shared/freshness.ts",
    tests: ["src/domain/shared/freshness.test.ts"],
  },
  {
    id: "TIME-001",
    name: "Branch business date",
    module: "shared",
    status: "proposed",
    purpose: "Decide which operational day an instant belongs to at a branch.",
    inputs: ["instant (UTC)", "branch IANA time zone"],
    output: "Local calendar date YYYY-MM-DD and its [start, end) UTC bounds",
    assumptions: [
      "A business day runs from local midnight to local midnight (EOD cut-off unknown, Q-070).",
    ],
    missingDataBehavior:
      "Invalid time zone or instant → error; never falls back to UTC or server time.",
    thresholds: {},
    implementation: "src/domain/shared/time.ts",
    tests: ["src/domain/shared/time.test.ts"],
  },
  {
    id: "AUTH-001",
    name: "Branch access",
    module: "security",
    status: "proposed",
    purpose: "Decide whether a user may perform an action at a branch.",
    inputs: ["membership role at the branch (or none)", "requested permission"],
    output: "allowed | not found",
    assumptions: ["The role → permission matrix is a proposal pending Q-080."],
    missingDataBehavior: "No membership → not found. Unknown role → denied.",
    thresholds: {},
    implementation: "src/domain/auth/permissions.ts",
    tests: ["src/domain/auth/permissions.test.ts", "src/server/auth/authorize.integration.test.ts"],
  },
]

export function getRule(id: string): RuleDefinition | undefined {
  return RULES.find((rule) => rule.id === id)
}
