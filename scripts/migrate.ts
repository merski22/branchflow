import { loadEnvConfig } from "@next/env"

import { runMigrations } from "@/db/migrate"

loadEnvConfig(process.cwd())

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.")
  process.exit(1)
}

runMigrations(url)
  .then(() => console.log("Migrations applied."))
  .catch((error: unknown) => {
    console.error("Migration failed:", error instanceof Error ? error.message : error)
    process.exit(1)
  })
