import { loadEnvConfig } from "@next/env"

import { createDatabase } from "@/db/client"
import { applyFoundationScenario } from "@/db/seed"
import { DEFAULT_SEED, buildFoundationScenario } from "@/synthetic/foundation-scenario"

loadEnvConfig(process.cwd())

// Usage: pnpm db:seed [--seed=<integer>]
const seedArg = process.argv.find((a) => a.startsWith("--seed="))?.split("=")[1]
const seed = seedArg === undefined ? DEFAULT_SEED : Number(seedArg)
if (!Number.isInteger(seed)) {
  console.error(`Invalid --seed value: ${seedArg}`)
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!url) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env.")
  process.exit(1)
}

const handle = createDatabase(url, { max: 1 })
const scenario = buildFoundationScenario(seed, new Date())

applyFoundationScenario(handle.db, scenario)
  .then(() => {
    console.log(`Seeded synthetic foundation scenario v${scenario.version} (seed ${seed}):`)
    console.log(
      `  ${scenario.organizations.length} organizations, ${scenario.branches.length} branches, ` +
        `${scenario.users.length} users, ${scenario.memberships.length} memberships`,
    )
    console.log("  Development identities:")
    for (const user of scenario.users) console.log(`    ${user.email} — ${user.purpose}`)
  })
  .catch((error: unknown) => {
    console.error("Seed failed:", error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => handle.close())
