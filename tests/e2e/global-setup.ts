import { loadEnvConfig } from "@next/env"

import { createDatabase } from "@/db/client"
import { runMigrations } from "@/db/migrate"
import { applyFoundationScenario } from "@/db/seed"
import { DEFAULT_SEED, buildFoundationScenario } from "@/synthetic/foundation-scenario"

/** Migrate and reseed the app database so every run starts from the same synthetic state. */
export default async function globalSetup(): Promise<void> {
  loadEnvConfig(process.cwd())
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL must be set for end-to-end tests.")
  await runMigrations(url)
  const handle = createDatabase(url, { max: 1 })
  try {
    await applyFoundationScenario(handle.db, buildFoundationScenario(DEFAULT_SEED, new Date()))
  } finally {
    await handle.close()
  }
}
