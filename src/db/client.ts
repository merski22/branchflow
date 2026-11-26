import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import * as schema from "./schema"

export type Database = PostgresJsDatabase<typeof schema>

export interface DatabaseHandle {
  db: Database
  close: () => Promise<void>
}

/** Create a database handle. Callers own its lifecycle (scripts, tests). */
export function createDatabase(url: string, options: { max?: number } = {}): DatabaseHandle {
  const client = postgres(url, { max: options.max ?? 10, onnotice: () => {} })
  return {
    db: drizzle(client, { schema, casing: "snake_case" }),
    close: () => client.end({ timeout: 5 }),
  }
}
