# Data Model

Source of truth: `src/db/schema/*.ts` (Drizzle). Migrations: `src/db/migrations/`.

## Conventions

- Primary keys: `uuid` (`gen_random_uuid()`).
- Timestamps: `timestamptz`, stored UTC. `created_at`, `updated_at` on mutable
  tables.
- **Branch ownership:** every operational table has `branch_id` (and
  `organization_id` where it simplifies isolation checks).
- **Unknown = `NULL`**, never `0`, `false` or a placeholder. Where a state matters
  (e.g. verification), use an enum that includes an explicit `unknown` value.
- **Provenance** on operational tables (Phase 1+):
  `source_kind` (`synthetic` | `imported` | `manual` | `derived`),
  `data_import_id` (nullable FK), `observed_at` (as-of time of the source),
  `recorded_at` (when stored).
- **Money:** `bigint` minor units + `char(3)` currency.
- **Synthetic flag:** `is_synthetic` on organizations, branches and users so
  synthetic tenants can never be mistaken for real ones.

## Migration strategy

1. Edit schema in `src/db/schema/`.
2. `pnpm db:generate` — drizzle-kit writes a SQL migration.
3. Review the SQL; hand-edit only for things Drizzle can't express (triggers),
   or add a `--custom` migration.
4. `pnpm db:migrate` applies migrations in order (tracked in `drizzle.__drizzle_migrations`).
5. Migrations are committed and never edited after they reach `main`.

## Phase 0 entities (implemented)

### organizations
A customer (rental company or operator).
`id`, `slug` (unique), `name`, `is_synthetic`, `created_at`, `updated_at`.

### branches
A rental location belonging to one organization.
`id`, `organization_id` → organizations, `slug` (unique per organization),
`name`, `time_zone` (IANA, validated by check in application layer),
`is_synthetic`, `created_at`, `updated_at`.

### users
A person who can sign in. `id`, `email` (unique, stored lower-case),
`display_name`, `is_synthetic`, `created_at`, `updated_at`.
No passwords are stored in Phase 0 (ADR-003).

### branch_memberships
Grants a user a role at a branch.
`id`, `user_id`, `branch_id`, `role` (enum `branch_role`), `created_at`.
Unique `(user_id, branch_id)`.

`branch_role` values (**proposed**, Q-080): `branch_manager`,
`assistant_manager`, `management_trainee`, `read_only`.
Permissions per role are defined in code (ADR-007, `src/domain/auth/permissions.ts`).

### data_imports
One ingestion of data into a branch: the provenance anchor for imported rows.
`id`, `organization_id`, `branch_id`, `source_kind` (enum `import_source_kind`:
`synthetic_seed` | `file_upload`), `source_label`, `file_name` (nullable),
`content_sha256` (nullable; unique per branch → idempotent imports),
`status` (enum `import_status`: `pending` | `completed` | `failed`),
`data_as_of` (nullable: the time the source data describes; **unknown if null**),
`row_count`, `accepted_row_count`, `rejected_row_count` (nullable until known),
`created_by_user_id` (nullable for system), `started_at`, `completed_at`.

### audit_events
Append-only record of security- and data-relevant events.
`id`, `organization_id` (nullable for system-level events), `branch_id`
(nullable), `actor_kind` (enum: `user` | `system`), `actor_user_id` (nullable),
`action` (dotted string, e.g. `synthetic_seed.applied`), `entity_type`,
`entity_id`, `metadata` (jsonb; **no customer personal data**), `occurred_at`.
A database trigger rejects `UPDATE` and `DELETE` (except `TRUNCATE` used by the
test suite and the seed reset).

## Planned entities (not implemented)

Created with the module that needs them, after design approval:

| Entity | First needed by |
|---|---|
| rental_contracts, contract_review_states, follow_ups | Contract Intelligence Engine (Phase 1) |
| insurance_authorizations (observed snapshots, never "live") | Insurance Authorization Monitor |
| callback_records, customer_contact_events | Callback / CARP Intelligence |
| import_row_results, import column mappings | Phase 4 ingestion |
| vehicle_classes, vehicles, reservations, expected_returns, vehicle_holds, vehicle_transfers | Availability Guard |
| operational_exceptions | Command Center |
| daily_operational_snapshots, report_definitions | EOD Intelligence |
| organization-level roles, regions | Regional Operations |
