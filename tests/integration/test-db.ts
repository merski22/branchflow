import { loadEnvConfig } from "@next/env"
import { sql } from "drizzle-orm"

import { createDatabase, type DatabaseHandle } from "@/db/client"
import { branches, branchMemberships, organizations, users } from "@/db/schema"
import type { BranchRole } from "@/domain/auth/permissions"

loadEnvConfig(process.cwd())

/**
 * The integration-test database URL. Refuses anything that is not clearly a disposable test
 * database, because the suite drops and truncates tables.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL
  if (!url) {
    throw new Error("TEST_DATABASE_URL is not set. Integration tests need a disposable database.")
  }
  const dbName = new URL(url).pathname.replace(/^\//, "")
  if (!dbName.endsWith("_test")) {
    throw new Error(`Refusing to use "${dbName}" for tests: the database name must end in _test.`)
  }
  if (process.env.DATABASE_URL && url === process.env.DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL.")
  }
  return url
}

export function openTestDatabase(): DatabaseHandle {
  return createDatabase(getTestDatabaseUrl(), { max: 2 })
}

export async function truncateAll(handle: DatabaseHandle): Promise<void> {
  await handle.db.execute(
    sql`TRUNCATE audit_events, data_imports, branch_memberships, branches, users, organizations RESTART IDENTITY CASCADE`,
  )
}

/** Small fixture builders. Every fixture is synthetic. */
export function fixtures(handle: DatabaseHandle) {
  const { db } = handle
  return {
    async org(slug: string) {
      const [row] = await db
        .insert(organizations)
        .values({ slug, name: `Org ${slug}`, isSynthetic: true })
        .returning()
      return row!
    },
    async branch(organizationId: string, slug: string, timeZone = "America/Toronto") {
      const [row] = await db
        .insert(branches)
        .values({ organizationId, slug, name: `Branch ${slug}`, timeZone, isSynthetic: true })
        .returning()
      return row!
    },
    async user(email: string, isSynthetic = true) {
      const [row] = await db
        .insert(users)
        .values({ email, displayName: email.split("@")[0]!, isSynthetic })
        .returning()
      return row!
    },
    async member(userId: string, branchId: string, role: BranchRole) {
      await db.insert(branchMemberships).values({ userId, branchId, role })
    },
  }
}

/** Await a promise expected to fail and return the underlying Postgres error code. */
export async function pgErrorCode(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause
    return cause?.code ?? (error as { code?: string }).code
  }
  throw new Error("Expected the database operation to fail, but it succeeded.")
}

export const PG = {
  FOREIGN_KEY_VIOLATION: "23503",
  CHECK_VIOLATION: "23514",
  UNIQUE_VIOLATION: "23505",
  INSUFFICIENT_PRIVILEGE: "42501",
} as const
