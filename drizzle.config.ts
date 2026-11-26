import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"

loadEnvConfig(process.cwd())

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  casing: "snake_case",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
  strict: true,
  verbose: true,
})
