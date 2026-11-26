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

Supporting folders: `src/synthetic/` (deterministic generators and scenarios),
`src/lib/` (UI utilities), `scripts/` (migrate, seed entry points),
`tests/integration/` (test database harness), `tests/e2e/` (Playwright).

## Layer rules (enforced by ESLint `no-restricted-imports`)

| Layer        | May import                                         | Must not import                                                     |
| ------------ | -------------------------------------------------- | ------------------------------------------------------------------- |
| `domain`     | `domain`, small pure libraries (zod, @date-fns/tz) | `app`, `components`, `server`, `db`, `next`, `react`, `drizzle-orm` |
| `synthetic`  | `domain`                                           | `app`, `components`, `server`, `next`, `react`, `drizzle-orm`       |
| `db`         | drizzle, `domain`, `synthetic` (seed writer)       | `app`, `components`, `server`                                       |
| `server`     | `domain`, `db`                                     | `app`, `components`                                                 |
| `components` | `domain`, `lib`, other `components`                | `server`, `db`, `app`                                               |
| `lib`        | small UI utilities (`cn`)                          | —                                                                   |
| `app`        | everything above                                   | —                                                                   |

## Request flow and authorization

1. Identity: `getSession()` (`src/server/auth/session.ts`, logic in
   `identity.ts`) returns an explicit state: `signed_in`, `signed_out` or
   `auth_not_configured`. In Phase 0 the only identity source is the development
   identity (`AUTH_MODE=dev`, ADR-003). It reports `auth_not_configured` when
   `NODE_ENV=production` and only ever resolves users flagged synthetic. The
   chosen identity is an httpOnly cookie holding a user id, set by the
   `/dev/identity` server action, which re-validates everything.
2. Authorization: `authorizeBranchAccess(db, { userId, orgSlug, branchSlug, permission })`
   loads the branch **only through a join on the user's membership** and checks
   the role's permissions (`src/domain/auth/permissions.ts`). A missing branch,
   missing membership, unknown role or missing permission all return `null`;
   `requireBranchAccess()` turns that into `notFound()` (NFR-012).
3. Branch-scoped repositories accept an `AuthorizedBranch` value (a branded type
   only produced by step 2) rather than raw ids, so unscoped queries are hard to
   write by accident. Repositories that need a specific permission re-check it.
4. Every page authorizes for its own permission; the branch layout's check only
   renders the frame (layouts are not re-rendered on client navigation).
5. Pages render request-dependent content inside `<Suspense>` (ADR-006).

**Known limitation — HTTP status of denied pages.** Because authorization runs
inside a streamed `<Suspense>` boundary, the response status (200) is sent before
`notFound()` runs. Users see the not-found page and denied/nonexistent branches
are indistinguishable (the security property), but the HTTP status is not 404.
A request-level check in `proxy.ts` can fix this when real authentication lands.

## Time

- Stored as `timestamptz` (UTC instants).
- Each branch has an IANA `time_zone`. Demo: `America/Toronto` (and
  `America/Winnipeg` for a second organization). Time functions reject invalid
  zones rather than falling back to UTC. There is no branch-creation path yet;
  when one is added it must validate with `isValidTimeZone`.
- `src/domain/shared/time.ts` converts instants to branch-local date/time and
  defines the **business date** of an instant in a branch. Business-day
  boundaries are local midnight; DST transitions are tested.

## Money

`src/domain/shared/money.ts`: integer minor units + ISO currency. Parsing from
decimal strings is exact; values with more than two decimals are rejected, not
rounded.

## Provenance and unknowns (ADR-004)

- Domain: `Observed<T>` = known value or explicit unknown with a reason.
- Database: nullable columns mean "unknown". Operational tables (Phase 1+) will
  carry provenance columns (`source_kind`, `data_import_id`, `observed_at`,
  `recorded_at`); in Phase 0 the provenance anchor is `data_imports`.
- Freshness is computed by rule `FRESH-001`, never stored.

## Business rules

Rules live in `src/domain/**` as pure functions and are registered in
`src/domain/rules/registry.ts` with metadata (id, purpose, inputs, output,
assumptions, missing-data behaviour, thresholds, status). A test keeps
`docs/BUSINESS_RULES.md` and the registry in sync.

## Integration (future)

A future `src/ingestion/` will define a `SourceAdapter` interface: parse → validate (Zod)
→ preview → commit as a `data_imports` record with row-level results. CSV and
Excel adapters come first (Phase 4). No adapter for any proprietary system exists
or is assumed (P-1, ADR-005).

## Caching

Next.js Cache Components are enabled (ADR-006). Tenant data is not cached.

## Configuration

Validated with Zod in `src/server/env.ts`. See `.env.example`.

| Variable                      | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `DATABASE_URL`                | Postgres connection string                           |
| `AUTH_MODE`                   | `dev` (only mode in Phase 0) or `none`               |
| `DEV_AUTH_DEFAULT_USER_EMAIL` | Synthetic user used when no dev identity is chosen   |
| `TEST_DATABASE_URL`           | Database for integration tests (destroyed/recreated) |

## Deployment

Not in scope for Phase 0. The app is a standard Node.js Next.js server plus
Postgres; any host that runs both works.
