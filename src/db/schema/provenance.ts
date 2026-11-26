import { sql } from "drizzle-orm"
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { branches, organizations, users } from "./tenancy"

export const importSourceKind = pgEnum("import_source_kind", ["synthetic_seed", "file_upload"])
export const importStatus = pgEnum("import_status", ["pending", "completed", "failed"])

/**
 * One ingestion of data into a branch — the provenance anchor for imported records.
 * Nullable columns mean "unknown", never zero.
 */
export const dataImports = pgTable(
  "data_imports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    branchId: uuid("branch_id").notNull(),
    sourceKind: importSourceKind("source_kind").notNull(),
    /** Human-readable description of the source, e.g. "Synthetic seed (seed 20261126)". */
    sourceLabel: text("source_label").notNull(),
    fileName: text("file_name"),
    /** SHA-256 of the imported content; unique per branch so re-importing is idempotent. */
    contentSha256: text("content_sha256"),
    status: importStatus("status").notNull(),
    /** The time the source data describes. NULL = unknown. */
    dataAsOf: timestamp("data_as_of", { withTimezone: true }),
    rowCount: integer("row_count"),
    acceptedRowCount: integer("accepted_row_count"),
    rejectedRowCount: integer("rejected_row_count"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    foreignKey({
      name: "data_imports_branch_org_fk",
      columns: [t.branchId, t.organizationId],
      foreignColumns: [branches.id, branches.organizationId],
    }).onDelete("restrict"),
    uniqueIndex("data_imports_branch_sha_uq").on(t.branchId, t.contentSha256),
    index("data_imports_branch_started_idx").on(t.branchId, t.startedAt),
  ],
)

export const auditActorKind = pgEnum("audit_actor_kind", ["user", "system"])

/**
 * Append-only audit log. UPDATE and DELETE are rejected by a trigger (see migrations).
 * `metadata` must never contain customer personal data.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "restrict",
    }),
    branchId: uuid("branch_id"),
    actorKind: auditActorKind("actor_kind").notNull(),
    // "restrict": users with audit history cannot be hard-deleted (the log is append-only).
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
    /** Dotted action name, e.g. "synthetic_seed.applied". */
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // MATCH SIMPLE: enforced only when both columns are set (branch-level events).
    foreignKey({
      name: "audit_events_branch_org_fk",
      columns: [t.branchId, t.organizationId],
      foreignColumns: [branches.id, branches.organizationId],
    }).onDelete("restrict"),
    check(
      "audit_events_branch_requires_org",
      sql`${t.branchId} IS NULL OR ${t.organizationId} IS NOT NULL`,
    ),
    index("audit_events_branch_occurred_idx").on(t.branchId, t.occurredAt),
  ],
)
