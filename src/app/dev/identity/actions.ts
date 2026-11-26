"use server"

import { and, eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"

import { users } from "@/db/schema"
import { isDevIdentityEnabled } from "@/server/auth/dev-identities"
import { DEV_IDENTITY_COOKIE } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { recordAuditEvent } from "@/server/repositories/audit"

const Input = z.object({ userId: z.uuid() })

/** Switch the development identity. Server actions are public endpoints: re-check everything. */
export async function switchDevIdentity(formData: FormData): Promise<void> {
  if (!isDevIdentityEnabled()) throw new Error("Development identity is disabled.")
  const parsed = Input.safeParse({ userId: formData.get("userId") })
  if (!parsed.success) throw new Error("Invalid identity.")

  const db = getDb()
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.data.userId), eq(users.isSynthetic, true)))
    .limit(1)
  if (!user) throw new Error("Invalid identity.")

  const cookieStore = await cookies()
  cookieStore.set(DEV_IDENTITY_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // development only; never enabled in production builds
    path: "/",
  })
  await recordAuditEvent(db, {
    action: "dev_identity.switched",
    actorKind: "user",
    actorUserId: user.id,
  })
  redirect("/")
}
