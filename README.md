# branchflow
Rental Operations Intelligence Platform

BranchFlow is an operational intelligence layer for vehicle rental branches. It
works **alongside** existing rental management systems and turns fragmented
operational information into a short, prioritized, explainable view of what a
branch manager should look at — with the source and freshness of every fact
visible.

> **Status: Phase 0 (foundation).** No operational modules are implemented yet.
> All data in this repository is **synthetic**. BranchFlow has no access to, and
> does not integrate with, any proprietary rental system.

See [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) for the product direction
and [`docs/ROADMAP.md`](docs/ROADMAP.md) for what comes next.

## Tech stack

Next.js 16 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS 4 ·
shadcn/ui-style components · PostgreSQL 16 · Drizzle ORM · Zod · Vitest ·
Playwright · GitHub Actions.

## Prerequisites

- **Node.js 22 LTS** (or newer) — <https://nodejs.org>
- **pnpm 10** — `corepack enable` (ships with Node)
- **PostgreSQL 16** — either **Docker Desktop** (recommended; uses
  `docker-compose.yml`) or a native install such as Postgres.app
- **Git**

## Quick start

```bash
git clone https://github.com/merski22/branchflow.git && cd branchflow
cp .env.example .env
pnpm install
docker compose up -d db          # or start your own Postgres 16 (see below)
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open <http://localhost:3000>. You are signed in as a **synthetic development
identity**; switch identities at <http://localhost:3000/dev/identity> to see how
branch access and isolation behave.

### Using your own Postgres instead of Docker

Create a role and two databases, then set `DATABASE_URL` and `TEST_DATABASE_URL`
in `.env`:

```sql
CREATE ROLE branchflow LOGIN PASSWORD 'branchflow';
CREATE DATABASE branchflow OWNER branchflow;
CREATE DATABASE branchflow_test OWNER branchflow;
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` / `pnpm start` | Production build / server (no dev identity — see ADR-003) |
| `pnpm typecheck` | TypeScript, strict |
| `pnpm lint` | ESLint, including architecture boundary rules |
| `pnpm test` | All Vitest tests (unit + database integration) |
| `pnpm test:unit` | Domain unit tests only (no database needed) |
| `pnpm test:integration` | Database integration tests (needs `TEST_DATABASE_URL`) |
| `pnpm test:e2e` | Playwright end-to-end tests (needs a migrated, seeded `DATABASE_URL`) |
| `pnpm db:generate` | Generate a SQL migration from schema changes |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:seed` | Reset and reseed deterministic synthetic data |

## Repository layout

```
src/
  app/          Next.js routes (thin)
  components/   UI primitives (ui/) and BranchFlow components
  domain/       Pure TypeScript business logic and rules
  server/       Server-only: env, identity, authorization, repositories
  db/           Drizzle schema and SQL migrations
  synthetic/    Deterministic synthetic data generators
scripts/        migrate / seed entry points
tests/e2e/      Playwright tests
docs/           Product, discovery, architecture and decision records
```

## Documentation

| File | Contents |
|---|---|
| [`CLAUDE.md`](CLAUDE.md) | Persistent engineering instructions |
| [`docs/PRODUCT_VISION.md`](docs/PRODUCT_VISION.md) | Company and product direction |
| [`docs/OPERATIONAL_DISCOVERY.md`](docs/OPERATIONAL_DISCOVERY.md) | Operational findings, with confidence levels |
| [`docs/OPEN_QUESTIONS.md`](docs/OPEN_QUESTIONS.md) | Unresolved questions and what they block |
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | Principles, functional and non-functional requirements |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Technical architecture |
| [`docs/DATA_MODEL.md`](docs/DATA_MODEL.md) | Database design |
| [`docs/BUSINESS_RULES.md`](docs/BUSINESS_RULES.md) | Business rule registry |
| [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) | Interface standards (provisional) |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Phases and milestones |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Architecture/product decision records |
| [`docs/TESTING.md`](docs/TESTING.md) | Testing strategy and instructions |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md) | Completed work |

## Data and privacy

- Synthetic data only. Synthetic organizations, branches and people are flagged
  `is_synthetic` and labelled in the interface.
- Never commit credentials. Configuration lives in `.env` (git-ignored); see
  `.env.example`.
- BranchFlow makes no compliance or certification claims.
