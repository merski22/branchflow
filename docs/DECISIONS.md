# Decisions

Architecture and product decision records. Append new decisions; never rewrite
history — supersede instead.

Format: context · decision · consequences · status.

---

## ADR-001 — Modular monolith

**Context.** Single founder, pre-product. Distributed systems add cost and
failure modes with no benefit at this stage.
**Decision.** One Next.js application. Modules are folders with enforced
boundaries, not services.
**Consequences.** Simple deployment and local development. Boundaries are kept by
lint rules and code review; extraction remains possible later.
**Status.** Approved by founder, 2026-11-26.

## ADR-002 — PostgreSQL + Drizzle instead of the local Supabase stack

**Context.** The Supabase local stack needs the Supabase CLI and ~10 Docker
containers. Relying on Row Level Security as the primary tenant guard spreads
authorization into SQL policies that are hard to test.
**Decision.** Plain PostgreSQL 16 with Drizzle ORM and drizzle-kit SQL migrations.
Tenant isolation enforced in the server layer. Hosted Postgres (including
Supabase) remains a deployment option; RLS may be added later as defense in depth.
**Consequences.** Light local setup; portable to any Postgres host. We own the
authorization layer and must test it thoroughly.
**Status.** Approved by founder, 2026-11-26.

## ADR-003 — Defer production authentication; build authorization now

**Context.** Choosing an auth provider is less important than getting the
authorization model right, and no real users exist yet.
**Decision.** Phase 0 builds users, branch memberships, roles, permissions and
server-side `authorizeBranchAccess`. Identity in development comes from a
development-only mechanism (`AUTH_MODE=dev`) that refuses to run when
`NODE_ENV=production`. A production provider (e.g. Better Auth on our Postgres,
or Supabase Auth) is selected before any real data.
**Consequences.** `next build && next start` has no identity source and shows a
"no authentication configured" state, by design.
**Status.** Approved by founder, 2026-11-26.

## ADR-004 — Provenance on every operational fact

**Context.** Managers must trust what they see; data comes from imports, manual
entry and derivation, at varying ages.
**Decision.** Operational records carry `source_kind` (synthetic / imported /
manual / derived), a reference to the import that produced them, `observed_at`
(when the source said it was true) and `recorded_at` (when we stored it). Unknown
is represented explicitly (SQL `NULL` with explicit unknown states; `Observed<T>`
in the domain), never as 0/false.
**Consequences.** Slightly wider tables; every view can show source and freshness.
**Status.** Approved (from founder directive §8), 2026-11-26.

## ADR-005 — No proprietary system names in the domain model

**Context.** The founder's knowledge comes from a large rental company's
operations. We have no authorized access to its systems, and the product must be
sellable to any operator.
**Decision.** Code, schema and UI use generic terms (e.g. "rental management
system", "contract export"). Proprietary names may appear only in discovery
documentation and, once authorized, as the name of a specific import adapter.
**Consequences.** Cleaner domain; lower IP/confidentiality risk. See Q-010.
**Status.** Approved, 2026-11-26.

## ADR-006 — Keep Next.js 16 Cache Components enabled; never cache tenant data implicitly

**Context.** Next.js 16 scaffolds with `cacheComponents` and `partialPrefetching`
enabled, and the framework states both become mandatory in the next major
release. With Cache Components, data fetching is dynamic by default; caching is
opt-in via `use cache`. Request-time reads (cookies, params) must sit behind
`<Suspense>`.
**Decision.** Keep both enabled. Branch-scoped data is fetched per request. Any
future `use cache` on tenant data must be keyed by an already-authorized branch
id and reviewed explicitly.
**Consequences.** Pages put request-dependent content inside Suspense boundaries.
No migration later.
**Status.** Accepted, 2026-11-26.

## ADR-007 — Roles and permissions defined in code; memberships in the database

**Context.** The role/permission matrix is unvalidated (Q-080) and will change.
**Decision.** Roles are a Postgres enum on `branch_memberships`; the
role→permission matrix is a typed constant in `src/domain/auth`. Organization
access is derived from branch membership for now.
**Consequences.** Changing permissions is a code change with tests, not a data
migration. A permissions table can be introduced if customer-configurable roles
are ever needed.
**Status.** Accepted, 2026-11-26.

## ADR-008 — Hand-written shadcn-style components

**Context.** The shadcn registry is unreachable from the development container.
shadcn components are copied source anyway.
**Decision.** Write the few primitives needed in shadcn's conventions (Radix +
class-variance-authority + tailwind-merge) and commit `components.json` so
`pnpm dlx shadcn add` works where the registry is reachable.
**Consequences.** None material; components can be regenerated or diffed later.
**Status.** Accepted, 2026-11-26.

## ADR-009 — Tenancy in the URL, authorization on the server

**Context.** Managers may belong to more than one branch; links should be
shareable and unambiguous.
**Decision.** Branch routes are `/o/[orgSlug]/[branchSlug]/…`. Every request
re-authorizes the current user against that branch; unauthorized or nonexistent
branches return 404.
**Consequences.** No hidden "current branch" state to drift; slugs are unique
per organization.
**Status.** Accepted, 2026-11-26.

## ADR-010 — Pin postgres.js to 3.4.x

**Context.** postgres.js 4.0 was released in late October 2026, weeks before Phase 0.
Drizzle's peer range is `>=3`, but its adapter has years of use with 3.x.
**Decision.** Pin `postgres@3.4.9`. Re-evaluate 4.x once it has matured and
Drizzle documents support.
**Consequences.** Lower supply-chain and compatibility risk; a deliberate upgrade later.
**Status.** Accepted, 2026-11-26.

## ADR-011 — End-to-end tests run against the development server

**Context.** The development identity is disabled in production builds (ADR-003),
so a production build has no identity source until real authentication exists.
**Decision.** Playwright starts `next dev` (port 3100) and reseeds `DATABASE_URL`
with the deterministic scenario. CI separately verifies `pnpm build`.
**Consequences.** E2E does not exercise production rendering. Revisit when real
authentication exists; then run E2E against `next start`.
**Status.** Accepted, 2026-11-26.
