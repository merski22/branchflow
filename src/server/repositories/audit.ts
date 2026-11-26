import "server-only"

import { desc, eq } from "drizzle-orm"

import type { Database } from "@/db/client"
import { auditEvents, users } from "@/db/schema"

import type { AuthorizedBranch } from "../auth/authorize"

export interface AuditEventRecord {
  id: string
  action: string
  actorKind: "user" | "system"
  actorDisplayName: string | null
  entityType: string | null
  metadata: Record<string, unknown>
  occurredAt: Date
}

/** Audit events for an authorized branch, newest first. Caller must hold `audit.view`. */
export async function listAuditEvents(
  db: Database,
  access: AuthorizedBranch,
  options: { limit?: number } = {},
): Promise<AuditEventRecord[]> {
  if (!access.permissions.includes("audit.view")) {
    throw new Error("listAuditEvents requires the audit.view permission")
  }
  return db
    .select({
      id: auditEvents.id,
      action: auditEvents.action,
      actorKind: auditEvents.actorKind,
      actorDisplayName: users.displayName,
      entityType: auditEvents.entityType,
      metadata: auditEvents.metadata,
      occurredAt: auditEvents.occurredAt,
    })
    .from(auditEvents)
    .leftJoin(users, eq(users.id, auditEvents.actorUserId))
    .where(eq(auditEvents.branchId, access.branch.id))
    .orderBy(desc(auditEvents.occurredAt))
    .limit(options.limit ?? 100)
}

export type NewAuditEvent = {
  action: string
  actorKind: "user" | "system"
  actorUserId?: string | null
  organizationId?: string | null
  branchId?: string | null
  entityType?: string | null
  entityId?: string | null
  /** Never include customer personal data. */
  metadata?: Record<string, unknown>
}

export async function recordAuditEvent(db: Database, event: NewAuditEvent): Promise<void> {
  await db.insert(auditEvents).values({
    action: event.action,
    actorKind: event.actorKind,
    actorUserId: event.actorUserId ?? null,
    organizationId: event.organizationId ?? null,
    branchId: event.branchId ?? null,
    entityType: event.entityType ?? null,
    entityId: event.entityId ?? null,
    metadata: event.metadata ?? {},
  })
}
