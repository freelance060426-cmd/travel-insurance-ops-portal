# UI Density Cleanup Plan

## Purpose

The current portal is functional and validated, but the visual treatment is too heavy for daily operations. This pass should make the product feel calmer, cleaner, and less demo-like without redesigning workflows or changing backend behavior.

## Direction

- Keep the Cover Edge brand and current navigation.
- Reduce decorative gradients, glows, heavy shadows, and repeated chips.
- Make the app shell feel like an operations tool rather than a presentation page.
- Keep information hierarchy clear, but use fewer visual containers.
- Preserve existing routes, form behavior, API calls, and validation.

## Scope

### App Shell

- Simplify the sidebar by removing the marketing-style Phase 1 card.
- Make the topbar more compact.
- Reduce duplicate status chips in the topbar.
- Keep user identity and logout visible.

### Shared Visual System

- Flatten `content-card`, `metric-card`, filters, tables, and workflow cards.
- Reduce border radius and padding where screens feel bulky.
- Use brand color as an accent, not as a dominant background.
- Make internal hero panels lighter and less dramatic.
- Keep login page visually branded; cleanup focuses mainly on authenticated portal screens.

### Main Screens

- Dashboard should feel like an operational home, not a showcase hero.
- Policy create should keep the guided workflow but feel less boxed-in.
- Invoice workspace should keep generation/dispatch clarity with fewer nested panels.
- Policies and reports should prioritize scanability over decoration.

## Guardrails

- Do not remove working functionality.
- Do not introduce new data models.
- Do not start partner-scoped visibility in this pass.
- Do not start another full redesign.
- Do not touch unrelated untracked client files.

## Validation

- `npx pnpm --filter @travel/web build`
- `npx pnpm --filter @travel/web typecheck`
- Browser smoke for dashboard, policy creation, invoices, policies, and reports.
- Mobile smoke for dashboard, policy creation, invoices, and reports.

## Success Criteria

- Portal feels lighter and calmer.
- Main actions remain obvious.
- Tables and forms are easier to scan.
- No horizontal overflow on mobile.
- No backend behavior changes.
