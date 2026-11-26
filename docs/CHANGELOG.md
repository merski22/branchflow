# Changelog

All notable changes. Newest first.

## Phase 0 — Foundation (`feature/phase-0-foundation`, awaiting review)

### Added

- **Documentation:** `CLAUDE.md` and `docs/` (vision, operational discovery
  with confidence levels, open questions, requirements, architecture, data
  model, business rules, provisional design system, roadmap, decisions
  ADR-001–011, testing, changelog). README expanded with setup instructions.
- **Application:** Next.js 16 App Router, React 19, strict TypeScript, Tailwind 4,
  shadcn-style primitives, provisional design tokens, ESLint layer boundaries.
- **Database:** PostgreSQL 16 + Drizzle with SQL migrations: organizations,
  branches, users, branch memberships, data imports, audit events. Composite
  tenant foreign keys; append-only audit trigger; docker-compose for local Postgres.
- **Authorization:** `authorizeBranchAccess` (AUTH-001, proposed role matrix),
  branded `AuthorizedBranch` required by branch-scoped repositories, 404 for
  every denial. Development identity (`AUTH_MODE=dev`) that is disabled in
  production builds and only resolves synthetic users.
- **Domain foundations:** `Observed<T>` unknowns, provenance types, FRESH-001
  freshness, TIME-001 branch business date with DST handling, exact money,
  business rule registry kept in sync with `docs/BUSINESS_RULES.md`.
- **Synthetic data:** seeded generator; foundation scenario (2 organizations,
  3 branches, 6 personas); transactional seed that refuses to touch real data
  and records its own provenance.
- **UI:** branch list; branch overview (time zone, local time, business date,
  data sources with freshness); audit log; development identity switcher;
  loading, empty, not-found and error states; synthetic-data banner.
- **Quality:** 111 unit/integration tests, 8 Playwright tests, GitHub Actions CI.

### Rules registered (all `proposed`)

FRESH-001, TIME-001, AUTH-001.

### Known limitations

See "Known limitations" in `docs/ROADMAP.md`.
