import { sql } from "drizzle-orm"

import { createDatabase } from "@/db/client"
import { runMigrations } from "@/db/migrate"

import { getTestDatabaseUrl } from "./test-db"

/** Recreate the test database schema from migrations once per test run. */
export default async function setup(): Promise<void> {
  const url = getTestDatabaseUrl()
  const handle = createDatabase(url, { max: 1 })
  try {
    await handle.db.execute(sql`DROP SCHEMA IF EXISTS drizzle CASCADE`)
    await handle.db.execute(sql`DROP SCHEMA IF EXISTS public CASCADE`)
    await handle.db.execute(sql`CREATE SCHEMA public`)
  } finally {
    await handle.close()
  }
  await runMigrations(url)
}
