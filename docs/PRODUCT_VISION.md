# Product Vision

## Company

**BranchFlow** — Rental Operations Intelligence and Workflow Management.

## The problem

Busy neighbourhood vehicle rental branches run on fragmented information: rental
management system screens, exported reports, spreadsheets, internal messages and
managers' memory. Managers spend significant time re-inspecting records to find
out whether anything has changed, assembling reports by hand, and anticipating
problems (vehicle shortages, unresolved contracts, insurance authorization gaps)
that the existing tools do not surface.

## What BranchFlow is

An **operational intelligence layer that works alongside existing rental
management systems**. It turns fragmented operational information into a short,
prioritized, explainable set of things a manager should look at, with the source
and freshness of every piece of information visible.

BranchFlow helps managers:

- understand the operational state of their branch;
- identify problems before they become urgent;
- reduce repetitive administrative work and repeated record inspections;
- improve reservation readiness and spot vehicle availability risks;
- reduce unnecessary contract reviews;
- monitor insurance authorization issues;
- see customer communication status;
- streamline end-of-day reporting;
- reduce avoidable customer delays and cancellations.

## What BranchFlow is not (initially)

- Not a replacement for rental management, accounting, payment or insurance systems.
- Not an autonomous agent. It never cancels, charges, modifies contracts, changes
  return dates, approves extensions, transfers vehicles or contacts customers.
- Not a tool for vehicle preparation employees to maintain. Their workflow works
  and must not be burdened.
- Not "AI for its own sake". Deterministic, explainable rules come first.

## Where we win

1. **Trust** — every flag explains why it fired, what data it used, where that
   data came from and how old it is. Unknown is shown as unknown.
2. **Work removed** — every feature must eliminate an inspection, calculation or
   transcription and must not add duplicate data entry.
3. **Workflow fit** — the system of record stays where it is; BranchFlow adapts
   to the branch, not the reverse.
4. **Reliability over sophistication** — lessons from prior technology adoption
   attempts (see OPERATIONAL_DISCOVERY.md, D-080) suggest reliability and
   workflow compatibility decide adoption.

## Markets

- **Initial:** high-volume neighbourhood vehicle rental branches.
- **Later:** regional operations, independent rental companies, multi-location
  operators and enterprise rental operators.

## Biggest product risk

**Data access.** Every module depends on data held in systems we are not
authorized to integrate with. If the only way to get data into BranchFlow is for
managers to retype it, BranchFlow fails principle 4.2 (reduce work). Module
selection and design are driven by what data can be legitimately obtained
(see OPEN_QUESTIONS.md Q-001, Q-002).

## Product principles (summary)

The full, non-negotiable principles are in `CLAUDE.md` and REQUIREMENTS.md:
companion not replacement · reduce work · do not burden preparation employees ·
human-controlled decisions · reliability over sophistication.

## Claims policy

We do not claim time or money savings, compliance, certifications or enterprise
approval without measurement or independent verification. No unverified claims
about any rental company appear in product or marketing material.
