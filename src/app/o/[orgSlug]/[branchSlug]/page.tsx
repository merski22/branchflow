import { Suspense } from "react"

import { EmptyState, LoadingState } from "@/components/empty-state"
import { FreshnessBadge } from "@/components/freshness-badge"
import { PageHeader, Section } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ROLE_LABELS } from "@/domain/auth/permissions"
import { classifyFreshness } from "@/domain/shared/freshness"
import { businessDateOf, formatBranchDate, formatBranchDateTime } from "@/domain/shared/time"
import { requireBranchAccess } from "@/server/auth/session"
import { getDb } from "@/server/db"
import { listDataImports } from "@/server/repositories/data-imports"

type Params = PageProps<"/o/[orgSlug]/[branchSlug]">["params"]

export default function BranchOverviewPage({ params }: PageProps<"/o/[orgSlug]/[branchSlug]">) {
  return (
    <Suspense fallback={<LoadingState label="Loading branch…" />}>
      <Overview params={params} />
    </Suspense>
  )
}

async function Overview({ params }: { params: Params }) {
  const { orgSlug, branchSlug } = await params
  const { access } = await requireBranchAccess(orgSlug, branchSlug, "branch.view")
  const imports = await listDataImports(getDb(), access)
  const now = new Date()
  const tz = access.branch.timeZone

  return (
    <>
      <PageHeader
        title={access.branch.name}
        description={`${formatBranchDate(now, tz)} · business date ${businessDateOf(now, tz)}`}
      />

      <Section title="Branch">
        <dl className="grid max-w-2xl grid-cols-[10rem_1fr] gap-x-4 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Organization</dt>
          <dd>{access.organization.name}</dd>
          <dt className="text-muted-foreground">Time zone</dt>
          <dd>{tz}</dd>
          <dt className="text-muted-foreground">Local time</dt>
          <dd className="tabular-nums">{formatBranchDateTime(now, tz)}</dd>
          <dt className="text-muted-foreground">Your role</dt>
          <dd>{ROLE_LABELS[access.role]}</dd>
        </dl>
      </Section>

      <Section title="Data sources">
        {imports.length === 0 ? (
          <EmptyState title="No data has been imported for this branch">
            BranchFlow has nothing to analyse until a data source is connected.
          </EmptyState>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data as of</TableHead>
                <TableHead>Freshness</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {i.sourceKind === "synthetic_seed" ? (
                        <Badge tone="synthetic">Synthetic</Badge>
                      ) : null}
                      <span>{i.sourceLabel}</span>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{i.status}</TableCell>
                  <TableCell className="tabular-nums whitespace-nowrap">
                    {i.dataAsOf ? formatBranchDateTime(i.dataAsOf, tz) : "Unknown"}
                  </TableCell>
                  <TableCell>
                    <FreshnessBadge result={classifyFreshness(i.dataAsOf, now)} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {i.rowCount === null ? "Unknown" : i.rowCount.toLocaleString("en-CA")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              Freshness uses rule FRESH-001 with placeholder thresholds (aging after 4 h, stale
              after 24 h). Times are shown in the branch time zone.
            </TableCaption>
          </Table>
        )}
      </Section>
    </>
  )
}
