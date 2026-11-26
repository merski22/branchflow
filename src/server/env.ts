import "server-only"

import { z } from "zod"

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  AUTH_MODE: z.enum(["dev", "none"]).default("none"),
  DEV_AUTH_DEFAULT_USER_EMAIL: z.email().optional(),
})

export type ServerEnv = z.infer<typeof EnvSchema>

let cached: ServerEnv | undefined

/**
 * Validated server configuration. Parsed lazily so that `next build` does not require
 * runtime configuration. Throws with the names (never the values) of invalid variables.
 */
export function getServerEnv(): ServerEnv {
  if (cached) return cached
  const result = EnvSchema.safeParse(process.env)
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((issue) => issue.path.join(".")))]
    throw new Error(`Invalid server configuration: ${names.join(", ")}. See .env.example.`)
  }
  cached = result.data
  return cached
}
