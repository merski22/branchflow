# Operational Discovery

The record of what we have learned about rental branch operations.

## How to read this file

Every finding has an id (`D-###`), a **status**, a **source** and a date.

| Status                           | Meaning                                                                                                         |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Confirmed (reference branch)** | Directly observed first-hand by the founder at the reference branch. True _there_; not yet shown to generalize. |
| **Preliminary**                  | An estimate or impression from first-hand experience, not measured.                                             |
| **Unverified**                   | Second-hand or anecdotal. Must never be presented as fact.                                                      |
| **Requires discovery**           | We know the area exists but not how it works.                                                                   |

Rules:

- Never promote a finding's status without new evidence. Record the evidence.
- When a finding changes, update it here and note which requirements
  (REQUIREMENTS.md) and rules (BUSINESS_RULES.md) are affected.
- Open questions live in OPEN_QUESTIONS.md and are cross-referenced here.
- "Confirmed (reference branch)" is not the same as "industry fact".

**Source key:** `FOUNDER-2026-11` = founder's first-hand experience (≈4–5 years of
frontline work in a large rental company's neighbourhood operations), recorded
November 2026.

## Reference environment

| ID    | Finding                                                                                                                                                                                                              | Status                                               | Source          |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------- |
| D-001 | Reference branch: high-volume Canadian neighbourhood branch, ≈200 vehicles.                                                                                                                                          | Confirmed (reference branch); fleet size approximate | FOUNDER-2026-11 |
| D-002 | Hours: Mon–Fri 08:00–20:00; Sat–Sun 09:00–13:00.                                                                                                                                                                     | Confirmed (reference branch)                         | FOUNDER-2026-11 |
| D-003 | Branch handles retail, insurance replacement and dealership rentals; reservations; returns; extensions; outstanding balances; cleaning and preparation; transfers; callbacks; fleet reconciliation; daily reporting. | Confirmed (reference branch)                         | FOUNDER-2026-11 |
| D-004 | Existing tools include the company's proprietary rental systems (referred to internally as ECARS and ARMS), spreadsheets, reports, internal communications and manual processes.                                     | Confirmed (reference branch)                         | FOUNDER-2026-11 |
| D-005 | Branch roles observed: branch managers, assistant managers, management trainees, vehicle preparation employees; external parties include customers and dealership partners.                                          | Confirmed (reference branch)                         | FOUNDER-2026-11 |

> We have **no authorized access** to any proprietary system. Names of proprietary
> systems are recorded here for context only and are not used in the product's
> domain model (see DECISIONS.md ADR-005).

## Fleet availability and reservations

| ID    | Finding                                                                                                                                                                                    | Status                            |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| D-010 | Reservations are generally made by vehicle **class**, not specific vehicle.                                                                                                                | Confirmed (reference branch)      |
| D-011 | Managers can often anticipate shortages ≈24–48 hours ahead.                                                                                                                                | Preliminary                       |
| D-012 | When a shortage is anticipated, managers may contact other branches to source vehicles.                                                                                                    | Confirmed (reference branch)      |
| D-013 | Vehicles at other branches may be visible in existing systems, but actual availability requires confirmation from that branch's manager. **A visible vehicle is not confirmed inventory.** | Confirmed (reference branch)      |
| D-014 | Most requested transfers are arranged successfully; cancellations can occur when no suitable vehicle is sourced.                                                                           | Preliminary (no measured rate)    |
| D-015 | Allocation rules, class substitution rules and reservation prioritization policies.                                                                                                        | Requires discovery (Q-020, Q-021) |

Supply states BranchFlow must keep distinct: confirmed local inventory · expected
returns · vehicles held for specific purposes · potential incoming transfers ·
confirmed incoming transfers · vehicles unavailable for rental · unknown or
unverified availability.

## Game plan and rush management

| ID    | Finding                                                                                       | Status                       |
| ----- | --------------------------------------------------------------------------------------------- | ---------------------------- |
| D-020 | Managers prepare for upcoming demand, reservations, returns and availability (a "game plan"). | Confirmed (reference branch) |
| D-021 | The plan becomes inaccurate when underlying information changes or is incomplete.             | Confirmed (reference branch) |
| D-022 | Game plan structure, source reports, calculation rules and update frequency.                  | Requires discovery (Q-030)   |

## Vehicle preparation

| ID    | Finding                                                                                                                              | Status                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| D-025 | Returned vehicles go to a designated dirty area; preparation employees clean them and hand the keys back. The workflow is effective. | Confirmed (reference branch) |
| D-026 | A read-only preparation priority display might help; delivery method is unvalidated.                                                 | Requires discovery (Q-031)   |

## CARP

| ID    | Finding                                                                                        | Status                                           |
| ----- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| D-030 | CARP workflows involve customer contact and verification activities.                           | Confirmed (reference branch)                     |
| D-031 | A contact _attempt_ is not a successful contact, and a successful contact is not verification. | Confirmed (reference branch) — design constraint |
| D-032 | Exact CARP fields, policies and completion requirements.                                       | Requires discovery (Q-040)                       |

States to keep distinct: contact attempted · contact successful · information
verified · verification incomplete · follow-up required · unknown.

## PEND (unresolved / overdue contracts)

| ID    | Finding                                                                                                 | Status                                           |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| D-040 | Managers must review unresolved or overdue rental contracts.                                            | Confirmed (reference branch)                     |
| D-041 | ≈45–60 overdue contracts may require daily review at the reference branch.                              | Preliminary (range from experience)              |
| D-042 | The daily review can take more than an hour.                                                            | Preliminary (not timed)                          |
| D-043 | Managers inspect contracts, add notes, revisit previous notes and decide whether more action is needed. | Confirmed (reference branch)                     |
| D-044 | Notes are recorded in the existing contract system. BranchFlow must avoid duplicating them.             | Confirmed (reference branch) — design constraint |
| D-045 | Precise PEND definitions and classification rules.                                                      | Requires discovery (Q-050, Q-051)                |

## Callbacks

| ID    | Finding                                                                                                       | Status                                |
| ----- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| D-050 | The existing callback view shows customer name, rental type and outstanding balance.                          | Confirmed (reference branch)          |
| D-051 | The displayed balance does not show who is responsible for payment; managers must open contracts to find out. | Confirmed (reference branch)          |
| D-052 | Resolved extensions disappear from the callback list automatically.                                           | Confirmed (reference branch)          |
| D-053 | ≈30% of callbacks are straightforward extensions; ≈70% are other categories.                                  | Preliminary — not a general statistic |
| D-054 | Definitions of the non-extension callback categories.                                                         | Requires discovery (Q-060)            |

Design constraints: never infer financial responsibility from the presence of a
balance; never mark an issue resolved without supporting information.

## Insurance authorization and extensions

| ID    | Finding                                                                                                       | Status                                    |
| ----- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| D-060 | Insurance replacement rentals frequently require managers to verify authorization dates.                      | Confirmed (reference branch)              |
| D-061 | When an insurer authorizes an extension, the manager manually updates the return date to the authorized date. | Confirmed (reference branch)              |
| D-062 | Authorization changes do not necessarily notify managers.                                                     | Confirmed (reference branch)              |
| D-063 | Managers repeatedly inspect contracts to see whether authorization has changed.                               | Confirmed (reference branch)              |
| D-064 | Without authorization, customers may need to contact their insurer; managers record notes and revisit later.  | Confirmed (reference branch)              |
| D-065 | Whether the authorized date is available in any exportable report.                                            | Requires discovery (Q-004) — **critical** |

Design constraint: any authorization date shown must carry its source and
freshness. Never imply a live insurer update without a verified integration or
authorized import.

## End-of-day reporting

| ID    | Finding                                                                             | Status                       |
| ----- | ----------------------------------------------------------------------------------- | ---------------------------- |
| D-070 | Managers perform daily operational reporting and fleet reconciliation.              | Confirmed (reference branch) |
| D-071 | Some information is manually transferred between reports, spreadsheets and systems. | Confirmed (reference branch) |
| D-072 | Source reports, spreadsheet columns, definitions and reconciliation rules.          | Requires discovery (Q-070)   |

## Technology adoption history

| ID    | Finding                                                                                                                                                                                                                 | Status                                                     |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| D-080 | Anecdotal management feedback: an internal technology initiative (referred to as "Greenlight") was tried in airport operations, had reliability or functionality concerns, and was not adopted at the founder's branch. | **Unverified.** Never present as fact or use in marketing. |

Product lesson drawn (not a fact claim): reliability, workflow compatibility,
simplicity and employee adoption decide whether operational software is used.
