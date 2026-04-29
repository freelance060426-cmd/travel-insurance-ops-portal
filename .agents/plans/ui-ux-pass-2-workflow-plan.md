# UI/UX Pass 2 Workflow Plan

## Purpose

Pass 1 improved the visual foundation, app shell, dashboard hierarchy, and started workflow affordances. Pass 2 should make the main operational workflows feel deliberate, safer, and easier to use every day.

This pass should not change backend behavior unless a UI workflow is blocked by missing API shape. The goal is product polish over existing Phase 1 functionality.

## Implementation Priority

### 1. Policy Creation Workflow UX

Policy creation is the highest-impact screen because it is the main daily data-entry workflow and the first serious product surface after login.

Current state:
- a workflow stepper exists
- the form works
- the live summary exists
- visual grouping is still closer to a long form than a guided workflow

Required improvements:
- make the stepper more useful as a progress/context element
- restructure the policy header and traveller entry into clearer workflow blocks
- make the right-side policy snapshot more action-oriented
- improve traveller cards so repeated traveller entry stays readable
- make the save action area feel like a final review bar
- improve empty, validation, saving, success, and error messages

Recommended UI shape:
- top intro card: concise explanation only
- workflow rail/stepper below intro
- main grid: form content on left, sticky policy snapshot on right
- traveller cards: numbered, compact, clear plan/premium display
- final action bar: add traveller, save policy, current premium/partner summary

Acceptance criteria:
- screen reads as a guided workflow at first glance
- operator can understand current policy state without scrolling too much
- save action is obvious but not noisy
- mobile layout remains usable
- no existing create-policy behavior breaks

### 2. Invoice Workspace UX

Invoice workflow is client-sensitive because invoice feedback came directly from the client/team. The current functionality is good, but the UI must better communicate what will happen before the user clicks generate.

Current state:
- eligible policy list works
- bulk generation works
- generated invoice table works
- readiness summary exists

Required improvements:
- separate generation setup from eligible policy selection more clearly
- make selected-policy count and total value visually prominent
- clarify single vs bulk behavior before action
- make generated invoice dispatch actions easier to scan
- improve empty state for no eligible policies
- improve success/error feedback after generation/send/download

Recommended UI shape:
- hero remains concise
- generation setup card with date/note and generation rules
- eligible policy table/card with selected count and bulk controls
- generated invoice dispatch section with stronger row actions

Acceptance criteria:
- user understands bulk generation creates one invoice per policy
- user can see how many invoices will be created before clicking
- already generated invoice list feels dispatch-oriented
- row actions are clear on desktop and mobile
- no existing invoice backend behavior breaks

### 3. Data Tables And Filters UX

After workflow screens, improve scanning and action clarity across policy search, invoices, partners, and reports.

Required improvements:
- consistent table header style
- better row hover and active affordance
- stronger status colors
- clearer table action buttons
- better empty states
- filters should look like a toolbar, not disconnected inputs
- responsive behavior should avoid cramped action columns

Acceptance criteria:
- policy search is easier to scan
- reports/export controls are easy to find
- invoice actions are visually distinct
- mobile tables remain usable through horizontal scroll or card-style fallback

## Work Order

1. Policy creation layout and workflow polish
2. Policy creation browser smoke on desktop and mobile
3. Invoice workspace layout and dispatch polish
4. Invoice workspace browser smoke on desktop and mobile
5. Shared table/filter polish
6. Reports/policy search browser smoke
7. Final `web build` and `web typecheck`

## Guardrails

- Do not redesign from scratch.
- Do not remove working backend calls.
- Do not introduce demo-only fake functionality.
- Do not add a runtime theme switch yet.
- Keep proposal module out of scope.
- Keep Bajaj integration readiness but do not start Bajaj work.
- Keep UI changes split enough for review and commit hygiene.

## Validation Plan

Run after each meaningful UI slice:
- `npx pnpm --filter @travel/web build`
- `npx pnpm --filter @travel/web typecheck`

Browser smoke before commit:
- login
- dashboard
- create policy
- invoice workspace
- policy search
- reports
- mobile dashboard
- mobile create policy

## Current Next Task

Policy creation workflow UX, invoice workspace UX, and table/filter/report polish are implemented.

Validation completed:
- API build passed
- web build passed
- web typecheck passed
- desktop browser pass covered login, dashboard, partners, policies, policy creation, policy detail, endorsement, invoices, and reports
- mobile browser pass covered login, dashboard, policies, policy creation, invoices, and reports with no horizontal overflow
- invoice generation empty-selection disabled-state finding was fixed after validation

Current next task:
- continue product polish from the remaining findings list after this commit set is clean
- decide the next product readiness slice before starting another broad UI pass
