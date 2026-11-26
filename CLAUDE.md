# BranchFlow — engineering instructions

BranchFlow is an operational intelligence layer for vehicle rental branches that
works **alongside** existing rental management systems. Founder = product owner
and rental operations expert. Claude = CTO / architect / engineer / QA. Challenge
assumptions; don't blindly agree.

@AGENTS.md

## Non-negotiables

1. **Companion, not replacement.** We have NO access to proprietary systems
   (APIs, DBs, credentials). Never pretend an integration exists. Never scrape or
   bypass access controls.
2. **Reduce work.** No feature may add duplicate data entry. Don't duplicate notes
   that live in the system of record.
3. **Never burden vehicle preparation employees** (no logins, scans, status
   updates, forms).
4. **Humans decide.** BranchFlow never cancels, charges, modifies contracts or
   return dates, approves extensions, transfers vehicles or contacts customers.
5. **Deterministic, explainable rules** before AI. Managers must see why a flag fired.
6. **Unknown stays unknown.** Never coerce missing values to 0/false/confirmed.
   Show source and freshness of every external fact.
7. **Synthetic data only**, clearly labelled. No real customer data, ever.
8. **No invented operational policy.** Confirmed ≠ preliminary ≠ assumed. Check
   `docs/OPERATIONAL_DISCOVERY.md`; record new questions in `docs/OPEN_QUESTIONS.md`.
9. No proprietary system names in code/schema/UI (ADR-005).

## Where things are

- Product/domain knowledge: `docs/` (PRODUCT_VISION, OPERATIONAL_DISCOVERY,
  REQUIREMENTS, OPEN_QUESTIONS, ROADMAP). Decisions: `docs/DECISIONS.md`.
- Rules registry: `docs/BUSINESS_RULES.md` ⇄ `src/domain/rules/registry.ts`
  (kept in sync by a test).
- Layers (lint-enforced, see `docs/ARCHITECTURE.md`):
  `src/domain` pure TS · `src/server` server-only authz + repositories ·
  `src/db` Drizzle schema/migrations · `src/app` routes · `src/components` UI ·
  `src/synthetic` deterministic demo data.

## Rules for code

- Tenant data is read only via `authorizeBranchAccess` → branch-scoped repository.
  Unauthorized/nonexistent → 404, never 403.
- Times: `timestamptz` UTC; display in branch time zone via `src/domain/shared/time.ts`.
- Money: integer minor units (`src/domain/shared/money.ts`).
- Next.js 16 with Cache Components: request-time reads go inside `<Suspense>`;
  never `use cache` tenant data (ADR-006).
- Validate all external input with Zod. Never log customer personal data.
- No fake metrics, placeholder buttons or decorative UI. Design tokens only; no
  raw colours. Branding is provisional — don't finalize visual identity alone.

## Commands

```
pnpm dev              # app on :3000 (needs Postgres + migrated, seeded DB)
pnpm db:migrate       # apply migrations      pnpm db:generate  # new migration from schema
pnpm db:seed          # reset + seed synthetic data (deterministic)
pnpm typecheck && pnpm lint && pnpm test      # must pass before commit
pnpm test:unit        # domain only, no DB
pnpm test:e2e         # Playwright (starts dev server)
```

## Workflow

Inspect → read docs → plan → get founder approval for major product/architecture
changes → implement → test/typecheck/lint → update docs (CHANGELOG, affected
rules/requirements) → report honestly, including failures and limitations.
Work on feature branches; never merge to `main` or open PRs without approval.
