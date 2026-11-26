import { Badge } from "@/components/ui/badge"
import { FRESHNESS_LABELS, formatAge, type FreshnessResult } from "@/domain/shared/freshness"

const TONE = {
  fresh: "ok",
  aging: "warn",
  stale: "danger",
  unknown: "unknown",
  invalid_future: "danger",
} as const

/**
 * Shows FRESH-001's classification together with its basis (the age), so the label is
 * never shown without the reason.
 */
export function FreshnessBadge({ result }: { result: FreshnessResult }) {
  const label = FRESHNESS_LABELS[result.status]
  const detail =
    result.status === "unknown"
      ? result.reason === "no_timestamp"
        ? "source did not say when this was true"
        : "source timestamp unreadable"
      : result.status === "invalid_future"
        ? `${formatAge(result.ageMinutes)} in the future`
        : `${formatAge(result.ageMinutes)} old`
  return (
    <span className="inline-flex items-center gap-2">
      <Badge tone={TONE[result.status]}>{label}</Badge>
      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">{detail}</span>
    </span>
  )
}
