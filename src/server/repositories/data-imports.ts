import "server-only"

import { desc, eq } from "drizzle-orm"

import type { Database } from "@/db/client"
import { dataImports } from "@/db/schema"

import type { AuthorizedBranch } from "../auth/authorize"

export interface DataImportRecord {
  id: string
  sourceKind: "synthetic_seed" | "file_upload"
  sourceLabel: string
  fileName: string | null
  status: "pending" | "completed" | "failed"
  /** NULL = the time the source data describes is unknown. */
  dataAsOf: Date | null
  rowCount: number | null
  acceptedRowCount: number | null
  rejectedRowCount: number | null
  startedAt: Date
  completedAt: Date | null
}

/** Data imports for an authorized branch, newest first. */
export async function listDataImports(
  db: Database,
  access: AuthorizedBranch,
  options: { limit?: number } = {},
): Promise<DataImportRecord[]> {
  return db
    .select({
      id: dataImports.id,
      sourceKind: dataImports.sourceKind,
      sourceLabel: dataImports.sourceLabel,
      fileName: dataImports.fileName,
      status: dataImports.status,
      dataAsOf: dataImports.dataAsOf,
      rowCount: dataImports.rowCount,
      acceptedRowCount: dataImports.acceptedRowCount,
      rejectedRowCount: dataImports.rejectedRowCount,
      startedAt: dataImports.startedAt,
      completedAt: dataImports.completedAt,
    })
    .from(dataImports)
    .where(eq(dataImports.branchId, access.branch.id))
    .orderBy(desc(dataImports.startedAt))
    .limit(options.limit ?? 50)
}
