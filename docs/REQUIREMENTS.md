# Requirements

Requirement ids: `NFR-###` non-functional, `FR-<module>-###` functional.
Status: **Approved** (founder-approved), **Proposed**, **Requires discovery**.

## Product principles (binding on every requirement)

| ID  | Principle                                                                                                                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P-1 | **Companion, not replacement.** No assumed access to proprietary APIs, databases, credentials or infrastructure. Integration interfaces are designed, never pretended.                                                                                                                               |
| P-2 | **Reduce work.** Every feature states who benefits, what work it eliminates, whether it adds duplicate entry, which decision it improves, and whether a busy manager would use it.                                                                                                                   |
| P-3 | **Do not burden vehicle preparation employees.** No logins, status updates, QR scans, digital queues or completion forms for them.                                                                                                                                                                   |
| P-4 | **Human-controlled decisions.** BranchFlow never cancels reservations, modifies contracts, changes return dates, charges customers, approves extensions, transfers vehicles, contacts customers or overrides managers. Future external actions require authorization, validation and human approval. |
| P-5 | **Reliability over sophistication.** Deterministic, explainable rules before AI. AI only where it adds measurable value.                                                                                                                                                                             |

## Non-functional requirements

### Data integrity

| ID      | Requirement                                                                                                   | Status   |
| ------- | ------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-001 | Unknown values are never silently converted to zero, false or a confirmed value.                              | Approved |
| NFR-002 | Operational records carry branch ownership, identifiers, timestamps and source information.                   | Approved |
| NFR-003 | Data is distinguishable as confirmed, estimated, manually entered, imported, derived, missing or stale.       | Approved |
| NFR-004 | Timestamps are stored in UTC and displayed in the branch's configured IANA time zone (demo: America/Toronto). | Approved |
| NFR-005 | Money is stored as integer minor units with a currency code; never floating point.                            | Approved |
| NFR-006 | Displayed metrics are calculated from underlying data, never hardcoded.                                       | Approved |
| NFR-007 | Every displayed external fact (e.g. an authorization date) shows its source and freshness.                    | Approved |

### Security and privacy

| ID      | Requirement                                                                                                                                                         | Status   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-010 | Organization- and branch-level data isolation enforced server-side.                                                                                                 | Approved |
| NFR-011 | Role-based access control evaluated on the server for every data access.                                                                                            | Approved |
| NFR-012 | Requests for another tenant's resources return "not found", not "forbidden", to avoid revealing existence.                                                          | Approved |
| NFR-013 | All external input validated with Zod at the boundary.                                                                                                              | Approved |
| NFR-014 | No secrets in source control; configuration via environment variables with a committed `.env.example`.                                                              | Approved |
| NFR-015 | Append-only audit log for security- and data-relevant events; no sensitive customer data in audit metadata or logs.                                                 | Approved |
| NFR-016 | Never store payment card information.                                                                                                                               | Approved |
| NFR-017 | Synthetic data only in development and demos; it is clearly labelled as synthetic in the UI.                                                                        | Approved |
| NFR-018 | Development-only authentication can never run in a production build. Production authentication is required before any real data is used.                            | Approved |
| NFR-019 | Errors shown to users never expose stack traces, SQL or other tenants' data.                                                                                        | Approved |
| NFR-020 | Canadian privacy obligations (including PIPEDA where relevant) are assessed before any pilot with real data. No compliance claims without independent verification. | Approved |

### Engineering

| ID      | Requirement                                                                                                                                        | Status   |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| NFR-030 | Runs locally without paid services.                                                                                                                | Approved |
| NFR-031 | Business logic lives in pure TypeScript (`src/domain`) independent of UI, framework and database.                                                  | Approved |
| NFR-032 | Every business rule is registered with id, purpose, inputs, outputs, assumptions, missing-data behaviour, thresholds, tests and validation status. | Approved |
| NFR-033 | Strict TypeScript; type check, lint and tests pass in CI.                                                                                          | Approved |
| NFR-034 | Synthetic data is reproducible from a deterministic seed.                                                                                          | Approved |
| NFR-035 | UI handles loading, empty, error and success states.                                                                                               | Approved |
| NFR-036 | Desktop-first, usable on tablets; no horizontal page scroll on mobile.                                                                             | Approved |

## Functional requirements

### Phase 0 — Foundation

| ID       | Requirement                                                                                                     | Status   |
| -------- | --------------------------------------------------------------------------------------------------------------- | -------- |
| FR-F-001 | A user sees only branches they are a member of.                                                                 | Approved |
| FR-F-002 | Branch pages show the branch name, its time zone, and the current local date and time in that zone.             | Approved |
| FR-F-003 | Branch pages list the data sources (imports) for the branch with their as-of time and freshness.                | Approved |
| FR-F-004 | Branch pages show a persistent indicator when the branch's data is synthetic.                                   | Approved |
| FR-F-005 | Authorized users can view the branch's audit log.                                                               | Approved |
| FR-F-006 | In development only, a developer can switch between synthetic identities to exercise permissions and isolation. | Approved |

### Contract Intelligence Engine (Phase 1 — direction approved, design pending)

The shared engine will support the Contract Review Worklist, PEND Intelligence,
Callback Intelligence and the Insurance Authorization Monitor. Functional
requirements will be written collaboratively before implementation. Known
constraints from discovery:

- Store review **state**, not duplicated notes (D-044, Q-005).
- Never infer payment responsibility from a balance (D-051).
- Never mark resolved without supporting information.
- Authorization dates carry source and freshness; no implied live updates (D-062, Q-004).
- Distinguish verified from suggested classifications.

### Other modules

Availability Guard, Rush Management, CARP Intelligence, EOD Intelligence,
Branch Command Center and Regional Operations: see ROADMAP.md. Requirements are
**Requires discovery** until their open questions are answered.
