# Testing

A feature is not done because it looks done (directive §16). Business logic is tested
independently of the UI; security properties are tested against a real database;
critical flows are tested in a real browser.

## Test layers

| Layer                                                        | Tool       | Location                       | Needs                               | Command                 |
| ------------------------------------------------------------ | ---------- | ------------------------------ | ----------------------------------- | ----------------------- |
| Unit — domain rules, synthetic generators                    | Vitest     | `src/**/*.test.ts`             | nothing                             | `pnpm test:unit`        |
| Integration — authorization, isolation, DB constraints, seed | Vitest     | `src/**/*.integration.test.ts` | Postgres (`TEST_DATABASE_URL`)      | `pnpm test:integration` |
| End-to-end — critical user flows                             | Playwright | `tests/e2e/*.spec.ts`          | Postgres (`DATABASE_URL`), Chromium | `pnpm test:e2e`         |

`pnpm test` runs unit and integration tests. CI (`.github/workflows/ci.yml`) runs
format check, lint, type-check, unit + integration tests, production build and
end-to-end tests on every push to `main` or `feature/**` and on pull requests.

## Databases used by tests

- **Integration tests** use `TEST_DATABASE_URL`. The suite **drops and recreates the
  schema** once per run and truncates tables before each test. As a safety
  guard it refuses any database whose name does not end in `_test`, or that
  equals `DATABASE_URL` (`tests/integration/test-db.ts`). Integration files run
  serially.
- **End-to-end tests** use `DATABASE_URL`. Global setup migrates it and
  **reseeds** the deterministic synthetic scenario. The seed refuses to run if
  any non-synthetic organization or user exists.

## Why e2e runs against `next dev`

The development identity is disabled whenever `NODE_ENV=production` (ADR-003,
NFR-018), so a production build has no identity source until real
authentication exists. Playwright therefore starts `next dev` on port 3100
(`E2E_PORT`). The production build is still verified separately by `pnpm build`
in CI.

## What is covered today

**Domain (unit)**

- FRESH-001: unknown/invalid timestamps never "fresh", threshold boundaries,
  clock-skew tolerance, future timestamps, configurable and invalid thresholds.
- TIME-001: local vs UTC dates, local-midnight boundaries, EDT/EST, the 23-hour
  and 25-hour DST days in America/Toronto, month/year roll-over, different
  branch time zones, invalid input never falling back to UTC.
- Money: exact parsing, no floating-point error, rejection (not rounding) of
  ambiguous input, currency mismatch, formatting.
- `Observed<T>`: unknown ≠ 0/false/"" and never defaults.
- AUTH-001 role matrix: unknown roles grant nothing.
- Rule registry ⇄ `docs/BUSINESS_RULES.md` sync, statuses, thresholds, files.
- Synthetic generator determinism; scenario consistency; reserved e-mail
  domain; default identity in `.env.example` exists in the scenario.

**Security and data integrity (integration)**

- Branch isolation: sibling branch in the same org, same branch slug in
  another org, nonexistent branch, unknown user → all denied identically.
- Permission denial (trainee cannot read the audit log, in the authorizer
  and in the repository).
- Branch-scoped repositories never return another branch's imports or events.
- Composite foreign keys reject records whose organization does not own the branch.
- Duplicate branch slug per organization and duplicate import content
  (idempotency) rejected.
- Audit log is append-only (UPDATE/DELETE rejected by trigger).
- Development identity: disabled in production, never resolves non-synthetic
  users, malformed cookie handled.
- Seed: byte-identical re-seeding, all records synthetic, provenance recorded,
  refuses to wipe real data.

**End-to-end**

- Branch list per identity; cross-org and sibling-branch access show the same
  not-found page and leak no names; trainee has no audit link and gets
  not-found on the direct URL; manager reads the audit log; no-membership
  empty state; no horizontal scroll at phone width.

## Not yet covered (by design or pending)

- Imports, column mapping and failed-import handling (no importer yet — Phase 4).
- Reservation/rush metrics (missing wait times, cancellations, denominators):
  required by the directive and will be written with those modules.
- Visual regression testing.

## Writing tests

- Put business logic in `src/domain` and test it there, without a database.
- New business rules: register in `src/domain/rules/registry.ts`, document in
  `docs/BUSINESS_RULES.md`, add tests; the registry test enforces the link.
- For database constraint tests, assert the specific Postgres error code with
  `pgErrorCode()` rather than "it throws".
- Every tenant-data repository needs an isolation test.
