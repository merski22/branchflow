# Architecture

## Shape

A **modular monolith** (ADR-001): one Next.js App Router application with a pure
TypeScript domain layer, a server layer that owns authorization and data access,
and PostgreSQL.

```
 Browser
   │  HTTP (RSC / server actions)
   ▼
 src/app/            Routes, layouts, pages. Thin: compose server + components.
   │
   ├─ src/components/   UI primitives (ui/) and BranchFlow composites.
   │
   ▼
 src/server/         'server-only'. Env, session, authorization, repositories.
   │                 Every tenant read goes through an authorized repository.
   ├──────────────► src/domain/   Pure TS. Rules, calculations, types.
   ▼                               No React, Next, DB or I/O imports.
 src/db/             Drizzle schema, client, SQL migrations.
   ▼
 PostgreSQL 16
```

Supporting folders: `src/synthetic/` (deterministic generators and seed
scenarios), `src/ingestion/` (adapter interfaces; Phase 4), `scripts/` (migrate,
seed), `tests/e2e/` (Playwright).

## Layer rules (enforced by ESLint `no-restricted-imports`)

| Layer | May import | Must not import |
|---|---|---|
| `domain` | `domain`, small pure libraries (zod, date-fns) | `app`, `components`, `server`, `db`, `next`, `react` |
| `synthetic` | `domain` | `app`, `components`, `server`, `next`, `react` |
| `db` | drizzle, `domain` types | `app`, `components`, `server` |
| `server` | `domain`, `db` | `app`, `components` |
| `components` | `domain` types, `components` | `server`, `db` |
| `app` | everything above | — |

## Request flow and authorization

1. Identity: `getSessionUser()` (`src/server/auth/session.ts`). In Phase 0 the
   only identity source is the development identity (`AUTH_MODE=dev`, ADR-003),
   which throws if `NODE_ENV=production`.
2. Authorization: `authorizeBranchAccess(db, userId, orgSlug, branchSlug, permission)`
   loads the branch **only through a join on the user's membership** and checks
   the role's permissions (`src/domain/auth/permissions.ts`). Missing branch,
   missing membership and missing permission all produce `NotFound`
   (NFR-012).
3. Branch-scoped repositories accept an `AuthorizedBranch` value (only obtainable
   from step 2) rather than raw ids, so unscoped queries are hard to write by
   accident.
4. Pages render request-dependent content inside `<Suspense>` (ADR-006).

## Time

- Stored as `timestamptz` (UTC instants).
- Each branch has an IANA `time_zone` (validated). Demo: `America/Toronto`.
- `src/domain/shared/time.ts` converts instants to branch-local date/time and
  defines the **business date** of an instant in a branch. Business-day
  boundaries are local midnight; DST transitions are tested.

## Money

`src/domain/shared/money.ts`: integer minor units + ISO currency. Parsing from
decimal strings is exact; values with more than two decimals are rejected, not
rounded.

## Provenance and unknowns (ADR-004)

- Domain: `Observed<T>` = known value or explicit unknown with a reason.
- Database: nullable columns mean "unknown"; provenance columns
  (`source_kind`, `data_import_id`, `observed_at`, `recorded_at`) on operational
  tables.
- Freshness is computed by rule `FRESH-001`, never stored.

## Business rules

Rules live in `src/domain/**` as pure functions and are registered in
`src/domain/rules/registry.ts` with metadata (id, purpose, inputs, output,
assumptions, missing-data behaviour, thresholds, status). A test keeps
`docs/BUSINESS_RULES.md` and the registry in sync.

## Integration (future)

`src/ingestion/` will define a `SourceAdapter` interface: parse → validate (Zod)
→ preview → commit as a `data_imports` record with row-level results. CSV and
Excel adapters come first (Phase 4). No adapter for any proprietary system exists
or is assumed (P-1, ADR-005).

## Caching

Next.js Cache Components are enabled (ADR-006). Tenant data is not cached.

## Configuration

Validated with Zod in `src/server/env.ts`. See `.env.example`.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string |
| `AUTH_MODE` | `dev` (only mode in Phase 0) or `none` |
| `DEV_AUTH_DEFAULT_USER_EMAIL` | Synthetic user used when no dev identity is chosen |
| `TEST_DATABASE_URL` | Database for integration tests (destroyed/recreated) |

## Deployment

Not in scope for Phase 0. The app is a standard Node.js Next.js server plus
Postgres; any host that runs both works.
