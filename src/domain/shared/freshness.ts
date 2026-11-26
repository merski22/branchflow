/**
 * Rule FRESH-001 — Data freshness classification (status: proposed).
 * See docs/BUSINESS_RULES.md. Thresholds are placeholders, not operational policy.
 */

export type FreshnessStatus = "fresh" | "aging" | "stale" | "unknown" | "invalid_future"

export interface FreshnessThresholds {
  /** Age at which data is no longer "fresh". */
  readonly agingAfterMinutes: number
  /** Age at which data is "stale". */
  readonly staleAfterMinutes: number
  /** Tolerated clock difference before a future timestamp is treated as invalid. */
  readonly allowedClockSkewMinutes: number
}

export const DEFAULT_FRESHNESS_THRESHOLDS: FreshnessThresholds = {
  agingAfterMinutes: 240,
  staleAfterMinutes: 1440,
  allowedClockSkewMinutes: 5,
}

export type FreshnessResult =
  | { readonly status: "fresh" | "aging" | "stale"; readonly ageMinutes: number }
  | {
      readonly status: "unknown"
      readonly ageMinutes: null
      readonly reason: "no_timestamp" | "invalid_timestamp"
    }
  | { readonly status: "invalid_future"; readonly ageMinutes: number }

function assertThresholds(t: FreshnessThresholds): void {
  const values = [t.agingAfterMinutes, t.staleAfterMinutes, t.allowedClockSkewMinutes]
  if (values.some((v) => !Number.isFinite(v) || v < 0)) {
    throw new RangeError("Freshness thresholds must be finite, non-negative numbers.")
  }
  if (t.agingAfterMinutes > t.staleAfterMinutes) {
    throw new RangeError("agingAfterMinutes must not exceed staleAfterMinutes.")
  }
}

/**
 * Classify how current a fact is.
 *
 * - No timestamp, or an invalid one → `unknown` (never `fresh`).
 * - Timestamp further in the future than the allowed clock skew → `invalid_future`
 *   (`ageMinutes` is negative).
 * - Boundaries: age exactly equal to a threshold falls into the older category.
 */
export function classifyFreshness(
  observedAt: Date | null | undefined,
  now: Date,
  thresholds: FreshnessThresholds = DEFAULT_FRESHNESS_THRESHOLDS,
): FreshnessResult {
  assertThresholds(thresholds)
  if (Number.isNaN(now.getTime())) throw new RangeError("`now` must be a valid date.")
  if (observedAt === null || observedAt === undefined) {
    return { status: "unknown", ageMinutes: null, reason: "no_timestamp" }
  }
  if (Number.isNaN(observedAt.getTime())) {
    return { status: "unknown", ageMinutes: null, reason: "invalid_timestamp" }
  }

  const ageMinutes = (now.getTime() - observedAt.getTime()) / 60_000
  if (ageMinutes < -thresholds.allowedClockSkewMinutes) {
    return { status: "invalid_future", ageMinutes }
  }
  const age = Math.max(0, ageMinutes)
  if (age >= thresholds.staleAfterMinutes) return { status: "stale", ageMinutes: age }
  if (age >= thresholds.agingAfterMinutes) return { status: "aging", ageMinutes: age }
  return { status: "fresh", ageMinutes: age }
}

export const FRESHNESS_LABELS: Readonly<Record<FreshnessStatus, string>> = {
  fresh: "Current",
  aging: "Aging",
  stale: "Stale",
  unknown: "Age unknown",
  invalid_future: "Invalid time",
}

/** Human-readable age, e.g. "12 min", "3 h 5 min", "2 d 4 h". */
export function formatAge(ageMinutes: number): string {
  const total = Math.floor(Math.abs(ageMinutes))
  const days = Math.floor(total / 1440)
  const hours = Math.floor((total % 1440) / 60)
  const minutes = total % 60
  if (days > 0) return hours > 0 ? `${days} d ${hours} h` : `${days} d`
  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
  return `${minutes} min`
}
