# Design System

**Status: provisional.** Branding, colour palette, typography and module layouts
are _not_ decided. They will be designed collaboratively, module by module. The
current tokens are neutral placeholders chosen to be easy to replace.

## Direction (agreed)

Serious, premium enterprise operations software: professional, reliable, clear,
fast, confident, simple. Desktop-first; dense enough for operational work.

General inspiration only (never copied): Linear, Ramp, Stripe Dashboard, Vercel,
ServiceNow.

**Avoid:** heavy gradients, glassmorphism, gratuitous animation, oversized
headings, card grids everywhere, excessive whitespace, decorative icons,
marketing copy inside the app, unnecessary charts, placeholder buttons, fake
functionality.

## Tokens

Defined once as CSS variables in `src/app/globals.css` and exposed to Tailwind
through `@theme inline`. Components use semantic names only
(`bg-background`, `text-muted-foreground`, `border-border`), never raw colours,
so a palette change is a one-file edit.

| Token                                                                           | Role                                                                      |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `background` / `foreground`                                                     | Page surface and body text                                                |
| `surface`                                                                       | Slightly raised areas (sidebar, table header)                             |
| `muted` / `muted-foreground`                                                    | Secondary surfaces and text                                               |
| `border`                                                                        | Hairlines and dividers                                                    |
| `primary` / `primary-foreground`                                                | The one emphasis colour (provisional: near-black)                         |
| `ring`                                                                          | Focus outline                                                             |
| `status-ok`, `status-warn`, `status-danger`, `status-unknown` (+ `-foreground`) | Status signals. **Unknown has its own token** — it is never styled as OK. |
| `synthetic` / `synthetic-foreground`                                            | Synthetic-data indicator                                                  |
| `radius`                                                                        | Corner radius (small)                                                     |

Dark mode: follows the OS preference; tokens are redefined under
`prefers-color-scheme: dark`.

## Typography

System font stack for now (no web-font dependency until branding is chosen).
Base size 14px for operational density; tabular numerals (`tabular-nums`) for
times, counts and money.

## Components

`src/components/ui/` holds primitives in shadcn/ui conventions (ADR-008):
Radix where behaviour is needed, `class-variance-authority` for variants,
`cn()` (`clsx` + `tailwind-merge`) for class merging.

Current primitives: `Button`, `Badge` (tones: neutral, ok, warn, danger,
unknown, synthetic), `Table`.
BranchFlow composites (`src/components/`): `SyntheticDataBanner`,
`FreshnessBadge` (label always paired with its basis, e.g. "2 min old"),
`EmptyState`, `LoadingState`, `PageHeader`, `Section`, `BranchNav`.

## Application shell (provisional)

A 44px top bar (wordmark, identity indicator), then per branch: synthetic-data
banner, a breadcrumb (organization / branch) and branch navigation, and a
centred content column (max 72rem). This is a working frame, not a decided
layout — module layouts will be designed together.

## Patterns

- **Every status shows its basis.** A freshness badge shows the as-of time on
  hover/title and in text where space allows.
- **Unknown is visible.** Show "Unknown" (with a reason when known), never blank,
  "0" or "—" alone.
- **Times** are shown in the branch time zone, with the zone abbreviation where
  ambiguity is possible.
- **No dead controls.** A control appears only when its action works.
- **States:** every data view designs loading, empty, error and success states.
