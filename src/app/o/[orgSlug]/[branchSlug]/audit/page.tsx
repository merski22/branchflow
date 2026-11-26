import type { Metadata } from "next"
import { Suspense } from "react"

import { EmptyState, LoadingState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatBranchDateTime } from "@/domain/shared/time"
import { requireBranchAccess } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { listAuditEvents } from "@/server/repositories/audit"

export const metadata: Metadata = { title: "Audit log" }

type Params = PageProps<"/o/[orgSlug]/[branchSlug]/audit">["params"]

export default function AuditPage({ params }: PageProps<"/o/[orgSlug]/[branchSlug]/audit">) {
  return (
    <Suspense fallback={<LoadingState label="Loading audit log…" />}>
      <AuditLog params={params} />
    </Suspense>
  )
}

async function AuditLog({ params }: { params: Params }) {
  const { orgSlug, branchSlug } = await params
  const { access } = await requireBranchAccess(orgSlug, branchSlug, "audit.view")
  const events = await listAuditEvents(getDb(), access)
  const tz = access.branch.timeZone

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Security- and data-relevant events for this branch. Entries cannot be edited or deleted."
      />
      {events.length === 0 ? (
        <EmptyState title="No events recorded for this branch yet" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="tabular-nums whitespace-nowrap">
                  {formatBranchDateTime(e.occurredAt, tz)}
                </TableCell>
                <TableCell className="font-mono text-xs">{e.action}</TableCell>
                <TableCell>
                  {e.actorKind === "system" ? "System" : (e.actorDisplayName ?? "Unknown user")}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {Object.keys(e.metadata).length > 0 ? JSON.stringify(e.metadata) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )
}
