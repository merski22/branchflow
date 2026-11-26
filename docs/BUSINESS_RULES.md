# Business Rules Registry

Every operational rule BranchFlow applies is listed here **and** in
`src/domain/rules/registry.ts`. A test (`src/domain/rules/registry.test.ts`)
fails if the two disagree on rule ids or statuses.

## Validation statuses

| Status               | Meaning                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `confirmed`          | Matches a confirmed operational finding and founder sign-off.          |
| `proposed`           | Reasonable default we believe is correct; not validated with managers. |
| `experimental`       | Being trialled; may be removed.                                        |
| `requires_discovery` | Placeholder for a rule we know is needed but cannot define yet.        |

A rule's status is never promoted without recording the evidence in
OPERATIONAL_DISCOVERY.md and noting the change in CHANGELOG.md.

## Rule template

```
### RULE-ID — Name
- Status:
- Module:
- Purpose:
- Inputs:
- Output:
- Assumptions:
- Missing-data behaviour:
- Thresholds (configurable):
- Tests:
```

---

### FRESH-001 — Data freshness classification

- **Status:** proposed
- **Module:** shared
- **Purpose:** Tell a manager how current a piece of information is, so stale
  data is never presented as current.
- **Inputs:** `observedAt` (instant the source data describes; may be unknown),
  `now`, thresholds.
- **Output:** one of `fresh`, `aging`, `stale`, `unknown`, `invalid_future`,
  plus the age in minutes when known.
- **Assumptions:** One threshold pair is adequate for Phase 0 data sources.
  Different data types will need different thresholds (e.g. a daily export vs.
  a contract snapshot) — to be set per source in Phase 1.
- **Missing-data behaviour:** `observedAt` unknown → `unknown` (never `fresh`).
  `observedAt` more than the allowed clock skew in the future → `invalid_future`.
- **Thresholds:** `agingAfterMinutes` (default 240), `staleAfterMinutes`
  (default 1440), `allowedClockSkewMinutes` (default 5). **Defaults are
  placeholders, not operational policy.**
- **Tests:** `src/domain/shared/freshness.test.ts`.

### TIME-001 — Branch business date

- **Status:** proposed
- **Module:** shared
- **Purpose:** Decide which operational day an instant belongs to at a branch,
  for daily views and future EOD reporting.
- **Inputs:** instant (UTC), branch IANA time zone.
- **Output:** local calendar date `YYYY-MM-DD`; start/end instants of that day.
- **Assumptions:** A business day runs from local midnight to local midnight.
  Whether EOD reporting uses a different cut-off (e.g. close of business) is
  unknown (Q-070).
- **Missing-data behaviour:** invalid time zone or invalid instant → error;
  never falls back to UTC or server time silently.
- **Thresholds:** none.
- **Tests:** `src/domain/shared/time.test.ts` (including DST transitions in
  America/Toronto).

### AUTH-001 — Branch access

- **Status:** proposed
- **Module:** shared / security
- **Purpose:** Decide whether a user may perform an action at a branch.
- **Inputs:** user's membership role at the branch (or none), requested permission.
- **Output:** allowed / not found.
- **Assumptions:** The role→permission matrix in `src/domain/auth/permissions.ts`
  is a proposal (Q-080).
- **Missing-data behaviour:** no membership → not found; unknown role → denied.
- **Thresholds:** none.
- **Tests:** `src/domain/auth/permissions.test.ts`,
  `src/server/auth/authorize.integration.test.ts`.
