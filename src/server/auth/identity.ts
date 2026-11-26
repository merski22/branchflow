import "server-only"

import { eq, sql } from "drizzle-orm"
import { z } from "zod"

import type { Database } from "@/db/client"
import { users } from "@/db/schema"

export interface SessionUser {
  id: string
  email: string
  displayName: string
  isSynthetic: boolean
}

export type SessionState =
  | { status: "signed_in"; user: SessionUser; source: "dev_identity" }
  /** No identity source is configured (e.g. a production build before real auth exists). */
  | { status: "auth_not_configured"; reason: string }
  /** An identity source exists but no valid user was resolved. */
  | { status: "signed_out" }

export interface IdentityInput {
  authMode: "dev" | "none"
  nodeEnv: "development" | "test" | "production"
  /** Value of the development identity cookie, if any (untrusted input). */
  devIdentityCookie: string | undefined
  defaultUserEmail: string | undefined
}

const userColumns = {
  id: users.id,
  email: users.email,
  displayName: users.displayName,
  isSynthetic: users.isSynthetic,
}

/**
 * Resolve the current user. Phase 0 has only a development identity (ADR-003), which
 * refuses to operate when NODE_ENV=production (NFR-018) and only ever resolves synthetic
 * users.
 */
export async function resolveIdentity(db: Database, input: IdentityInput): Promise<SessionState> {
  if (input.authMode !== "dev") {
    return { status: "auth_not_configured", reason: "No authentication provider is configured." }
  }
  if (input.nodeEnv === "production") {
    return {
      status: "auth_not_configured",
      reason: "Development identity is disabled in production builds.",
    }
  }

  const cookieId = z.uuid().safeParse(input.devIdentityCookie)
  if (cookieId.success) {
    const [user] = await db
      .select(userColumns)
      .from(users)
      .where(eq(users.id, cookieId.data))
      .limit(1)
    if (user?.isSynthetic) return { status: "signed_in", user, source: "dev_identity" }
  }

  if (input.defaultUserEmail) {
    const [user] = await db
      .select(userColumns)
      .from(users)
      .where(sql`lower(${users.email}) = ${input.defaultUserEmail.toLowerCase()}`)
      .limit(1)
    if (user?.isSynthetic) return { status: "signed_in", user, source: "dev_identity" }
  }

  return { status: "signed_out" }
}
