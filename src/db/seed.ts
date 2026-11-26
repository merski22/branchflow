import { sql } from "drizzle-orm"

import type { FoundationScenario } from "../synthetic/foundation-scenario"
import type { Database } from "./client"
import {
  auditEvents,
  branches,
  branchMemberships,
  dataImports,
  organizations,
  users,
} from "./schema"

export class UnsafeSeedTargetError extends Error {}

/**
 * Replace all data with a synthetic scenario, in one transaction.
 *
 * Refuses to run if the database contains any non-synthetic organization or user, so a
 * seed can never wipe real data.
 */
export async function applyFoundationScenario(
  db: Database,
  scenario: FoundationScenario,
): Promise<void> {
  await db.transaction(async (tx) => {
    const [real] = await tx.execute<{ count: number }>(sql`
      SELECT (SELECT count(*) FROM organizations WHERE NOT is_synthetic)
           + (SELECT count(*) FROM users WHERE NOT is_synthetic) AS count`)
    if (Number(real?.count ?? 0) > 0) {
      throw new UnsafeSeedTargetError(
        "Refusing to seed: the database contains non-synthetic organizations or users.",
      )
    }

    await tx.execute(
      sql`TRUNCATE audit_events, data_imports, branch_memberships, branches, users, organizations RESTART IDENTITY CASCADE`,
    )

    await tx
      .insert(organizations)
      .values(scenario.organizations.map((o) => ({ ...o, isSynthetic: true })))
    await tx.insert(branches).values(scenario.branches.map((b) => ({ ...b, isSynthetic: true })))
    await tx.insert(users).values(
      scenario.users.map((u) => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        isSynthetic: true,
      })),
    )
    if (scenario.memberships.length > 0) {
      await tx.insert(branchMemberships).values(scenario.memberships)
    }
    await tx.insert(dataImports).values(
      scenario.imports.map((i) => ({
        id: i.id,
        organizationId: i.organizationId,
        branchId: i.branchId,
        sourceKind: "synthetic_seed" as const,
        sourceLabel: i.sourceLabel,
        status: "completed" as const,
        dataAsOf: i.dataAsOf,
        rowCount: 0,
        acceptedRowCount: 0,
        rejectedRowCount: 0,
        startedAt: scenario.referenceTime,
        completedAt: scenario.referenceTime,
      })),
    )
    await tx.insert(auditEvents).values(
      scenario.imports.map((i) => ({
        organizationId: i.organizationId,
        branchId: i.branchId,
        actorKind: "system" as const,
        action: "synthetic_seed.applied",
        entityType: "data_import",
        entityId: i.id,
        metadata: { seed: scenario.seed, scenarioVersion: scenario.version },
        occurredAt: scenario.referenceTime,
      })),
    )
  })
}
