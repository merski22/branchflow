import { sql } from "drizzle-orm"
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { BRANCH_ROLES } from "../../domain/auth/permissions"

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}

/** A customer of BranchFlow: a rental company or operator. */
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  isSynthetic: boolean("is_synthetic").notNull(),
  ...timestamps,
})

/** A rental location. Every operational record belongs to exactly one branch. */
export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** IANA time zone, e.g. America/Toronto. Validated in the application layer. */
    timeZone: text("time_zone").notNull(),
    isSynthetic: boolean("is_synthetic").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("branches_org_slug_uq").on(t.organizationId, t.slug),
    // Target for composite foreign keys that keep a record's organization consistent with its branch.
    unique("branches_id_org_uq").on(t.id, t.organizationId),
  ],
)

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stored lower-case; uniqueness enforced case-insensitively. */
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    isSynthetic: boolean("is_synthetic").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_lower_uq").on(sql`lower(${t.email})`)],
)

/** Proposed role names (Q-080). Permissions per role live in src/domain/auth/permissions.ts. */
export const branchRole = pgEnum("branch_role", BRANCH_ROLES)

export const branchMemberships = pgTable(
  "branch_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    branchId: uuid("branch_id")
      .notNull()
      .references(() => branches.id, { onDelete: "cascade" }),
    role: branchRole("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("branch_memberships_user_branch_uq").on(t.userId, t.branchId),
    index("branch_memberships_branch_idx").on(t.branchId),
  ],
)
