# Open Questions

Unresolved operational, product and business questions. Each question lists what
it blocks. Close a question by recording the answer, its source and date, then
updating OPERATIONAL_DISCOVERY.md and any affected rules or requirements.

Priority: **P0** blocks module selection or design · **P1** blocks a rule ·
**P2** nice to know.

## Data access (P0)

| ID    | Question                                                                                                                                                     | Blocks                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| Q-001 | Which reports can a branch manager export today? For each: name, format (CSV / Excel / PDF / screen only), columns, row grain, how often it can be produced. | All modules; Contract Intelligence Engine design |
| Q-002 | Is exporting those reports for use in a third-party tool permitted by employer policy? Who could authorize it?                                               | Any pilot with real data                         |
| Q-003 | Does any export include, per open contract: rental type, scheduled return date, days overdue, balance, payer/bill-to party, insurer, claim reference?        | Contract Review Worklist                         |
| Q-004 | Is the insurer **authorized-through date** stored in a field that appears in any export, or only on the contract screen?                                     | Insurance Authorization Monitor (critical)       |
| Q-005 | Where do review notes live, and can they be exported? Can BranchFlow store only review _state_ (reviewed, awaiting, next look) without duplicating notes?    | Contract Review Worklist, PEND                   |

## Business and legal (P0)

| ID    | Question                                                                                                                                  | Blocks                   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| Q-010 | Founder's employment agreement: confidentiality, IP assignment and non-compete terms. Needs legal advice before any pilot or fundraising. | Pilot; commercialization |
| Q-011 | Pilot branch: which branch, who sponsors it, what data may be used?                                                                       | Phase 4                  |

## Fleet and reservations (P1)

| ID    | Question                                                                      | Blocks             |
| ----- | ----------------------------------------------------------------------------- | ------------------ |
| Q-020 | How does a manager decide which reservations a vehicle goes to?               | Availability Guard |
| Q-021 | Which class substitutions (upgrades/downgrades) are allowed, and who decides? | Availability Guard |
| Q-022 | How reliable are expected return times? What makes a return "uncertain"?      | Availability Guard |
| Q-023 | How are transfers requested, confirmed and tracked today?                     | Availability Guard |

## Game plan / rush (P1)

| ID    | Question                                                                                | Blocks          |
| ----- | --------------------------------------------------------------------------------------- | --------------- |
| Q-030 | What does the current game plan contain, what are its sources, how often is it updated? | Rush Management |
| Q-031 | Would a read-only preparation priority display help, and through what medium (if any)?  | Rush Management |
| Q-032 | How are customer wait times measured today, if at all?                                  | Rush metrics    |

## CARP (P1)

| ID    | Question                                                        | Blocks            |
| ----- | --------------------------------------------------------------- | ----------------- |
| Q-040 | What fields, policies and completion criteria define CARP work? | CARP Intelligence |

## Contracts / PEND (P1)

| ID    | Question                                                                               | Blocks                   |
| ----- | -------------------------------------------------------------------------------------- | ------------------------ |
| Q-050 | Precisely what makes a contract appear in the PEND review?                             | PEND rules               |
| Q-051 | During review, what decisions does a manager make, and what outcomes are possible?     | Worklist workflow design |
| Q-052 | What does "reviewed" mean — and how long until a reviewed contract needs another look? | Review-state rules       |
| Q-053 | Baseline: how long does the daily review actually take (timed, several days)?          | Pilot measurement        |

## Callbacks (P1)

| ID    | Question                                                                    | Blocks                |
| ----- | --------------------------------------------------------------------------- | --------------------- |
| Q-060 | What are the non-extension callback categories, and how is each recognized? | Callback Intelligence |
| Q-061 | How is payment responsibility determined when investigating a balance?      | Callback Intelligence |

## EOD (P1)

| ID    | Question                                                                                                               | Blocks           |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | ---------------- |
| Q-070 | Which reports and spreadsheet columns make up EOD reporting and reconciliation; what are the formulas and definitions? | EOD Intelligence |

## Users and permissions (P1)

| ID    | Question                                                                                                                    | Blocks                                      |
| ----- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Q-080 | Who would use BranchFlow — branch manager only, or assistant managers and management trainees too? What may each see or do? | Role/permission matrix (currently proposed) |
| Q-081 | Do area/regional managers need read access to several branches?                                                             | Multi-branch roles                          |
