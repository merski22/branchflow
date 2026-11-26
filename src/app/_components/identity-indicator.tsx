import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { getSession } from "@/server/auth/session"

/** Who the app thinks you are, and where that identity came from. */
export async function IdentityIndicator() {
  const session = await getSession()
  if (session.status === "auth_not_configured") {
    return <span className="text-xs text-muted-foreground">Not signed in</span>
  }
  if (session.status === "signed_out") {
    return (
      <Link href="/dev/identity" className="text-xs underline underline-offset-4">
        Choose a development identity
      </Link>
    )
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge tone="synthetic" title="Development-only identity; not a real sign-in">
        Dev identity
      </Badge>
      <span className="font-medium">{session.user.displayName}</span>
      <Link href="/dev/identity" className="text-muted-foreground underline underline-offset-4">
        Switch
      </Link>
    </div>
  )
}
