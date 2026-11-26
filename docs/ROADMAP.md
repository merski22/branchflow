# Roadmap

BranchFlow is built one validated workflow at a time. Phases describe order of
work, not dates. Nothing in a later phase is built before its predecessor
demonstrates value.

## Phase 0 — Product and engineering foundation · _complete, awaiting founder review_

1. Repository and persistent documentation.
2. Next.js application scaffold, strict TypeScript, lint boundaries, provisional design tokens.
3. PostgreSQL + Drizzle: foundation schema and migration workflow.
4. Server-side authorization and branch-level isolation; development-only identity.
5. Domain foundations: unknown values, provenance, freshness, branch time, money, rule registry.
6. Deterministic synthetic data framework and seed.
7. Minimal application shell (branch overview, data sources, audit log).
8. CI, end-to-end smoke tests, testing documentation.

Exit: a fresh clone runs locally with four commands; CI green; isolation and
seed-reproducibility tests pass.

## Phase 1 — Contract Intelligence Engine · _direction approved, design pending_

One shared engine over open rental contracts, with four lenses:

- **Contract Review Worklist** (first): what needs a look today, what was already
  reviewed, what is awaiting someone else, when to look again.
- **PEND Intelligence**: aging and overdue contract exceptions.
- **Callback Intelligence**: extension vs. balance vs. unknown responsibility.
- **Insurance Authorization Monitor**: scheduled vs. last known authorized date,
  with source and freshness. Value depends on Q-004.

Before implementation: answer Q-001, Q-003, Q-005, Q-050–Q-053; co-design the
workflow and interface; register rules as _proposed_. Establish the baseline
review-time measurement (Q-053).

## Phase 2 — Branch Command Center

Built only from real outputs of implemented modules. No disconnected metrics.

## Phase 3 — Additional intelligence modules (order to be decided)

- **Availability Guard** — class-level supply vs. demand, 24/48h horizons,
  confirmed vs. expected supply, transfer tracking. No substitution logic until
  rules are validated (Q-020–Q-023).
- **Rush Management** — demand concentration, readiness gaps, configurable
  thresholds, possible read-only preparation display (Q-030–Q-032).
- **CARP Intelligence** — attempted vs. successful contact vs. verified (Q-040).
- **EOD Intelligence** — imports, reconciliation, discrepancy detection,
  exports. No formulas until source reports are validated (Q-070).

## Phase 4 — Authorized data ingestion and pilot readiness

Production authentication; CSV/Excel import with column mapping, validation,
duplicate detection, previews, idempotency and history; privacy assessment
(Q-010, Q-011, NFR-020); baseline and pilot measurement.

## Phase 5 — Commercial readiness

Multi-tenant deployment, onboarding, subscriptions, **Regional Operations**
(multi-branch visibility, regional availability, cross-branch transfers,
benchmarking), support, enterprise integration interfaces.

## Known limitations after Phase 0

- **No production authentication.** Only the development identity exists; a
  production build shows "Sign-in is not available" by design (ADR-003).
- **Denied pages return HTTP 200** with the not-found page, because authorization
  runs inside a streamed Suspense boundary (see ARCHITECTURE.md). Content is
  correct and leaks nothing; the status code is not 404.
- **No operational data or modules.** The data-sources table shows only the
  synthetic seed itself (zero rows). This is intentional.
- **No data import pipeline**, so imports, column mapping and failed-import
  handling are untested (Phase 4).
- **Branch time zones are not validated at write time** — there is no
  branch-creation path yet.
- **Role/permission matrix and FRESH-001 thresholds are proposals** pending
  discovery (Q-080).
- **E2E runs against `next dev`**, not a production build (ADR-011).
- **Design is provisional:** neutral tokens and a working shell only.
