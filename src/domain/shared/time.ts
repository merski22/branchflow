/**
 * Branch time handling (NFR-004) and rule TIME-001 — Branch business date (status: proposed).
 *
 * Instants are stored in UTC. A branch's IANA time zone decides local dates and times.
 * Nothing here falls back silently to UTC or the server's time zone.
 */
import { TZDate } from "@date-fns/tz"

/** A local calendar date, `YYYY-MM-DD`. */
export type BusinessDate = string & { readonly __brand: "BusinessDate" }

const BUSINESS_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone || typeof timeZone !== "string") return false
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone })
    // Reject offsets / abbreviations that Intl accepts but are not IANA zone names.
    return timeZone.includes("/") || timeZone === "UTC"
  } catch {
    return false
  }
}

function assertTimeZone(timeZone: string): void {
  if (!isValidTimeZone(timeZone)) throw new RangeError(`Invalid IANA time zone: "${timeZone}"`)
}

function assertInstant(instant: Date): void {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new RangeError("Invalid instant")
  }
}

/** Parse and validate `YYYY-MM-DD` (rejects impossible dates such as 2026-02-30). */
export function parseBusinessDate(value: string): BusinessDate {
  const match = BUSINESS_DATE_RE.exec(value)
  if (!match) throw new RangeError(`Invalid business date: "${value}"`)
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const probe = new Date(Date.UTC(y, m - 1, d))
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) {
    throw new RangeError(`Invalid business date: "${value}"`)
  }
  return value as BusinessDate
}

/** TIME-001: the branch-local calendar date of an instant. */
export function businessDateOf(instant: Date, timeZone: string): BusinessDate {
  assertInstant(instant)
  assertTimeZone(timeZone)
  const local = new TZDate(instant.getTime(), timeZone)
  const y = String(local.getFullYear()).padStart(4, "0")
  const m = String(local.getMonth() + 1).padStart(2, "0")
  const d = String(local.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}` as BusinessDate
}

/**
 * TIME-001: UTC instants bounding a branch business date, as a half-open interval
 * `[start, end)`. Days containing a DST transition are 23 or 25 hours long.
 */
export function businessDayBounds(
  date: BusinessDate,
  timeZone: string,
): { start: Date; end: Date } {
  assertTimeZone(timeZone)
  const [y, m, d] = parseBusinessDate(date).split("-").map(Number) as [number, number, number]
  const start = new TZDate(y, m - 1, d, 0, 0, 0, timeZone)
  const end = new TZDate(y, m - 1, d + 1, 0, 0, 0, timeZone)
  return { start: new Date(start.getTime()), end: new Date(end.getTime()) }
}

export function isWithinBusinessDate(instant: Date, date: BusinessDate, timeZone: string): boolean {
  assertInstant(instant)
  const { start, end } = businessDayBounds(date, timeZone)
  return instant.getTime() >= start.getTime() && instant.getTime() < end.getTime()
}

/**
 * Format an instant in the branch's time zone. Always includes the zone abbreviation
 * (e.g. "EST"/"EDT") so the reader knows which clock is shown.
 */
export function formatBranchDateTime(instant: Date, timeZone: string, locale = "en-CA"): string {
  assertInstant(instant)
  assertTimeZone(timeZone)
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).format(instant)
}

/** Long-form local date, e.g. "Thursday, November 26, 2026". */
export function formatBranchDate(instant: Date, timeZone: string, locale = "en-CA"): string {
  assertInstant(instant)
  assertTimeZone(timeZone)
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(instant)
}
