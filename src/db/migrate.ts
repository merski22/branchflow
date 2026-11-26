import path from "node:path"

import { migrate } from "drizzle-orm/postgres-js/migrator"

import { createDatabase } from "./client"

export const MIGRATIONS_FOLDER = path.resolve(process.cwd(), "src/db/migrations")

/** Apply all pending migrations to the database at `url`. */
export async function runMigrations(url: string): Promise<void> {
  const handle = createDatabase(url, { max: 1 })
  try {
    await migrate(handle.db, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await handle.close()
  }
}
