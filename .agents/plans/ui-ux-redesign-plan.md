# UI/UX Redesign And Product Polish Plan

## Current Assessment

The portal is functional and branded, but the interface still feels closer to a clean admin scaffold than a polished operations product. The strongest screen is the login page. The dashboard, policy creation, invoice workspace, reports, and data tables need a more intentional product system.

We should not restart from zero. The current routes, workflows, API contracts, and page structure are good enough to keep. The correct approach is a focused visual and UX refinement pass over the existing product.

## Design Positioning

Cover Edge should feel like a reliable internal operations desk for travel insurance servicing, not a generic CRM.

Target product feel:
- calm and trustworthy
- fast to scan during daily operations
- clearly branded without becoming decorative
- strong enough for client demos
- practical for repeated back-office use

Avoid:
- generic admin-dashboard visuals
- overuse of empty cards
- weak default typography
- visual noise that does not help operators complete work
- rebuilding working flows just for appearance

## Design System Direction

### Typography

Move away from the current default Arial feel.

Preferred direction:
- use a refined modern sans stack for body text
- use stronger heading sizing and weight
- keep labels compact and readable
- use letter spacing only for short operational labels

Goal: make the product feel custom and deliberate without adding external font-loading risk.

### Color

Keep the Cover Edge aqua/dark brand direction, but make it more controlled.

Active palette roles:
- dark navy/charcoal for shell and hero areas
- aqua/teal for primary actions and active states
- soft cyan backgrounds for informational states
- amber for pending attention
- green for completed/success
- rose/red only for error or risk

The UI should use accent color sparingly. Primary actions and active navigation should be obvious.

### Spacing And Layout

Current layouts are readable but too spread out in places, especially policy creation.

Required improvements:
- consistent card radius and padding
- tighter dashboard hierarchy
- clearer form grouping
- better table density
- stronger mobile wrapping rules
- reduce empty vertical space in workflow pages

### Components To Standardize

Create consistent visual behavior for:
- app shell and sidebar navigation
- topbar/user session area
- hero panels
- metrics and status cards
- data tables
- form sections
- inline action buttons
- error/loading/empty states
- workflow steppers

## Screen-Level Recommendations

### 1. App Shell

Keep the left navigation, but make it feel more product-grade.

Changes:
- cleaner sidebar spacing
- stronger active navigation state
- smaller and sharper phase/status card
- topbar should show current module context, not the same generic title everywhere
- mobile navigation should feel intentional, not compressed desktop layout

### 2. Dashboard

Dashboard should become the actual operations home.

It should answer:
- what happened today?
- what needs attention now?
- what can the team do next?
- which policies/invoices are blocked or pending?

Changes:
- stronger control-room hero
- replace generic recent activity feel with operational queue cards
- show policy, invoice, PDF, and email health as grouped signals
- add clear quick actions for create policy, search policy, invoice workspace, and reports
- keep recent policies table, but improve hierarchy

### 3. Policy Creation

This is the most important workflow screen.

Current issue:
- it works, but visually it looks like a long form.
- the user cannot instantly see the process.

Recommended direction:
- add workflow stepper: Policy details, Traveller details, Documents later, Review and Save
- keep the form on one page for now, but visually group it as a guided workflow
- make the live summary sticky or visually stronger
- improve primary action placement
- reduce empty card height

### 4. Invoice Workspace

Invoice screen is functionally good but needs clearer separation.

Recommended direction:
- separate three zones: generation setup, eligible policy selection, generated invoice dispatch
- show selected count and generation mode clearly
- make bulk generation feel safer with selected-policy summary
- improve invoice row actions so View, Download, Send are easier to distinguish

### 5. Reports

Reports are useful but visually basic.

Recommended direction:
- keep reports simple for Phase 1
- add stronger date-filter toolbar
- improve export affordance
- make partner report and policy report easier to scan

### 6. Login

Login is already the strongest branded screen.

Recommended direction:
- only refine typography, spacing, and contrast
- do not redesign the whole login screen unless client specifically asks

## Implementation Order

### Pass 1: Foundation

Goal: make every screen look more mature without changing workflows.

Tasks:
- update global design tokens
- improve typography stack
- polish sidebar/topbar shell
- add reusable workflow/status styles
- refine dashboard composition

### Pass 2: Workflow UX

Goal: make the daily operational flows clearer.

Tasks:
- add policy creation workflow stepper
- refine policy form section hierarchy
- improve invoice workspace generation/dispatch layout
- improve action and status affordances

### Pass 3: Data UX

Goal: make search, reports, and tables more usable.

Tasks:
- improve table density and hover states
- improve filters and empty states
- add better responsive table handling
- improve export/download/send feedback

### Pass 4: Final Visual QA

Goal: prepare for client-facing demo.

Tasks:
- desktop browser check
- mobile browser check
- verify no overflow or broken navigation
- verify primary workflows still work
- run web build and typecheck

## Acceptance Criteria

The UI polish pass is successful when:
- dashboard looks like the product home, not a generic stats page
- policy creation reads as a guided workflow
- invoice generation and dispatch states are clear
- tables are easier to scan
- mobile layout is usable without cramped controls
- login remains branded and clean
- no current backend/API workflow is broken
- builds and type checks pass

## Current Active Recommendation

Pass 1 is complete:
- design tokens
- typography polish
- app shell polish
- dashboard operations-home refresh
- initial workflow affordances for policy creation and invoice generation

Current active work should move to Pass 2:
- policy creation guided workflow UX
- invoice workspace generation and dispatch clarity
- data table and filter polish

Detailed Pass 2 plan:
- `.agents/plans/ui-ux-pass-2-workflow-plan.md`
