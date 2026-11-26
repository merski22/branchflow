/**
 * Explicit representation of values that may be unknown (NFR-001).
 *
 * BranchFlow never silently converts an unknown value into zero, false, an empty string or
 * a "confirmed" value. Code that needs a value must handle the unknown branch explicitly.
 */

export const UNKNOWN_REASONS = [
  /** The source did not include this field or row. */
  "missing_from_source",
  /** The source included a value we could not parse or that failed validation. */
  "invalid_value",
  /** No source for this information has been connected or collected yet. */
  "not_collected",
] as const

export type UnknownReason = (typeof UNKNOWN_REASONS)[number]

export type Observed<T> =
  | { readonly known: true; readonly value: T }
  | { readonly known: false; readonly reason: UnknownReason }

export function known<T>(value: T): Observed<T> {
  return { known: true, value }
}

export function unknown<T = never>(reason: UnknownReason): Observed<T> {
  return { known: false, reason }
}

/** `null`/`undefined` become unknown with the given reason. Other falsy values (0, false, "") are kept as known. */
export function fromNullable<T>(
  value: T | null | undefined,
  reason: UnknownReason = "missing_from_source",
): Observed<T> {
  return value === null || value === undefined ? unknown(reason) : known(value)
}

export function mapObserved<T, U>(observed: Observed<T>, fn: (value: T) => U): Observed<U> {
  return observed.known ? known(fn(observed.value)) : observed
}

/** For storage and transport only: unknown becomes `null` (never a default value). */
export function toNullable<T>(observed: Observed<T>): T | null {
  return observed.known ? observed.value : null
}

export const UNKNOWN_REASON_LABELS: Readonly<Record<UnknownReason, string>> = {
  missing_from_source: "Not provided by the source",
  invalid_value: "Source value could not be read",
  not_collected: "Not yet collected",
}
