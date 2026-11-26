import "server-only"

import { createDatabase, type Database, type DatabaseHandle } from "@/db/client"

import { getServerEnv } from "./env"

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { __branchflowDb?: DatabaseHandle }

export function getDb(): Database {
  if (!globalForDb.__branchflowDb) {
    globalForDb.__branchflowDb = createDatabase(getServerEnv().DATABASE_URL)
  }
  return globalForDb.__branchflowDb.db
}
