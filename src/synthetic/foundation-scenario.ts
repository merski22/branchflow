/**
 * Foundation scenario: synthetic tenants, branches, people and memberships.
 *
 * Everything here is fictional and flagged synthetic. E-mail addresses use the reserved
 * `.test` top-level domain so they can never reach a real mailbox. No operational records
 * (contracts, reservations, vehicles) exist yet — they arrive with their modules.
 */
import type { BranchRole } from "../domain/auth/permissions"
import { createRandom } from "./random"

export const FOUNDATION_SCENARIO_VERSION = 1
export const DEFAULT_SEED = 20261126
export const SYNTHETIC_EMAIL_DOMAIN = "synthetic.branchflow.test"

export interface ScenarioOrganization {
  id: string
  slug: string
  name: string
}
export interface ScenarioBranch {
  id: string
  organizationId: string
  slug: string
  name: string
  timeZone: string
}
export interface ScenarioUser {
  id: string
  email: string
  displayName: string
  /** What this identity is for when exercising the app. */
  purpose: string
}
export interface ScenarioMembership {
  id: string
  userId: string
  branchId: string
  role: BranchRole
}
export interface ScenarioImport {
  id: string
  organizationId: string
  branchId: string
  sourceLabel: string
  dataAsOf: Date
}

export interface FoundationScenario {
  seed: number
  version: number
  referenceTime: Date
  organizations: ScenarioOrganization[]
  branches: ScenarioBranch[]
  users: ScenarioUser[]
  memberships: ScenarioMembership[]
  imports: ScenarioImport[]
}

interface PersonaSpec {
  key: string
  displayName: string
  purpose: string
  memberships: [branchKey: string, role: BranchRole][]
}

const ORGS = [
  { key: "northshore", slug: "northshore", name: "Northshore Vehicle Rental (Synthetic)" },
  { key: "prairie", slug: "prairie-wheels", name: "Prairie Wheels (Synthetic)" },
] as const

const BRANCHES = [
  {
    key: "lakeshore",
    org: "northshore",
    slug: "lakeshore",
    name: "Lakeshore",
    timeZone: "America/Toronto",
  },
  {
    key: "harbourfront",
    org: "northshore",
    slug: "harbourfront",
    name: "Harbourfront",
    timeZone: "America/Toronto",
  },
  {
    key: "riverside",
    org: "prairie",
    slug: "riverside",
    name: "Riverside",
    timeZone: "America/Winnipeg",
  },
] as const

const PERSONAS: PersonaSpec[] = [
  {
    key: "avery.manager",
    displayName: "Avery Manager",
    purpose: "Branch manager at Lakeshore; assistant manager at Harbourfront (multi-branch).",
    memberships: [
      ["lakeshore", "branch_manager"],
      ["harbourfront", "assistant_manager"],
    ],
  },
  {
    key: "jordan.assistant",
    displayName: "Jordan Assistant",
    purpose: "Assistant manager at Lakeshore.",
    memberships: [["lakeshore", "assistant_manager"]],
  },
  {
    key: "sam.trainee",
    displayName: "Sam Trainee",
    purpose: "Management trainee at Lakeshore — cannot view the audit log.",
    memberships: [["lakeshore", "management_trainee"]],
  },
  {
    key: "riley.manager",
    displayName: "Riley Manager",
    purpose: "Branch manager at Harbourfront only — cannot see Lakeshore.",
    memberships: [["harbourfront", "branch_manager"]],
  },
  {
    key: "casey.manager",
    displayName: "Casey Manager",
    purpose: "Branch manager in a different organization (Riverside, Central time).",
    memberships: [["riverside", "branch_manager"]],
  },
  {
    key: "morgan.unassigned",
    displayName: "Morgan Unassigned",
    purpose: "Has no branch memberships — sees no branches.",
    memberships: [],
  },
]

/** Build the scenario. Pure and deterministic for a given (seed, referenceTime). */
export function buildFoundationScenario(
  seed: number = DEFAULT_SEED,
  referenceTime: Date = new Date(),
): FoundationScenario {
  if (Number.isNaN(referenceTime.getTime())) throw new RangeError("Invalid reference time.")
  const rng = createRandom(seed)

  const orgIds = new Map<string, string>()
  const organizations = ORGS.map((o) => {
    const id = rng.uuid()
    orgIds.set(o.key, id)
    return { id, slug: o.slug, name: o.name }
  })

  const branchIds = new Map<string, string>()
  const branches = BRANCHES.map((b) => {
    const id = rng.uuid()
    branchIds.set(b.key, id)
    return {
      id,
      organizationId: orgIds.get(b.org)!,
      slug: b.slug,
      name: b.name,
      timeZone: b.timeZone,
    }
  })

  const users: ScenarioUser[] = []
  const memberships: ScenarioMembership[] = []
  for (const persona of PERSONAS) {
    const id = rng.uuid()
    users.push({
      id,
      email: `${persona.key}@${SYNTHETIC_EMAIL_DOMAIN}`,
      displayName: persona.displayName,
      purpose: persona.purpose,
    })
    for (const [branchKey, role] of persona.memberships) {
      memberships.push({ id: rng.uuid(), userId: id, branchId: branchIds.get(branchKey)!, role })
    }
  }

  const imports = branches.map((branch) => ({
    id: rng.uuid(),
    organizationId: branch.organizationId,
    branchId: branch.id,
    sourceLabel: `Synthetic foundation seed v${FOUNDATION_SCENARIO_VERSION} (seed ${seed}) — tenancy only, no operational records`,
    dataAsOf: referenceTime,
  }))

  return {
    seed,
    version: FOUNDATION_SCENARIO_VERSION,
    referenceTime,
    organizations,
    branches,
    users,
    memberships,
    imports,
  }
}
