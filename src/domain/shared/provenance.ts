/**
 * Where a fact came from and how much to trust it (ADR-004, NFR-002, NFR-003).
 */

export const SOURCE_KINDS = [
  /** Generated demonstration data. Never real. */
  "synthetic",
  /** Read from an authorized import (e.g. an exported report). */
  "imported",
  /** Typed in by a BranchFlow user. */
  "manual",
  /** Calculated by BranchFlow from other facts. */
  "derived",
] as const

export type SourceKind = (typeof SOURCE_KINDS)[number]

export const CERTAINTIES = [
  /** Stated as fact by the source. */
  "confirmed",
  /** An estimate or expectation (e.g. an expected return time). */
  "estimated",
] as const

export type Certainty = (typeof CERTAINTIES)[number]

export interface Provenance {
  readonly sourceKind: SourceKind
  readonly certainty: Certainty
  /** Identifier of the producing import or rule, if any (e.g. a data_imports id or rule id). */
  readonly sourceRef: string | null
  /** When the source says the fact was true. `null` = unknown. */
  readonly observedAt: Date | null
  /** When BranchFlow recorded the fact. */
  readonly recordedAt: Date
}

export const SOURCE_KIND_LABELS: Readonly<Record<SourceKind, string>> = {
  synthetic: "Synthetic",
  imported: "Imported",
  manual: "Entered manually",
  derived: "Calculated",
}
