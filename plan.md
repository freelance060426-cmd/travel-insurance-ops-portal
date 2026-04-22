# Plan

## Done

### Project Foundation

- Repo scaffolding and monorepo setup (pnpm + turbo)
- Local PostgreSQL via Docker Compose (port 5433)
- Database schema with migrations (Prisma)
- Shared package for common enums and types

### Authentication

- Login flow with JWT
- Role-aware route protection
- Protected session with hydration
- Frontend auth provider and server-side check

### App Shell

- Sidebar navigation with dark theme
- Top bar with user info, status chip, logout
- Responsive layout with CSS grid (280px sidebar + content)

### Partner Module

- Partner create and list
- Partner management screen
- Frontend–backend contract alignment

### Policy Module

- Policy create with multi-traveller support
- Passport-based autofill from existing traveller records
- Policy list and search
- Policy detail view
- Duplicate policy number validation
- Button label: "Save draft policy" on create form

### Endorsement

- Endorse policy flow with change history
- Endorsement form with traveller editing and plan selection
- Button label: "Save endorsement draft" on endorsement form

### Invoice Module

- Invoice create, list, detail
- Invoice PDF generation and retrieval (pdf-lib)
- Link between invoice and policy (optional)

### Documents

- Document upload and storage
- Document download from policy detail

### PDF & Email

- Policy PDF generation, regeneration, and download
- Invoice PDF generation, regeneration, and download
- Policy email sending via SMTP with delivery logs
- Manual recipient email entry during send

### Dashboard

- Metric cards (policies, invoices, drafts)
- Recent activity feed
- Partner performance stats
- Recently touched policies table

### Polish

- Favicon and mobile layout
- Full browser flow validation
- HTTP end-to-end validation
- SMTP delivery validation

---

## Plan

### Invoice Enhancements

- Add invoice email/share to client (reuse policy email pattern — DB already supports `EmailLog.invoiceId`)
- Filter invoice list to show only invoices linked to existing policies
- Show only eligible/pending invoices for generation

### Login Page Redesign

- ~~Move login box to the right side~~
- ~~Add company logo (Cover Edge Assist) on the left/center~~
- ~~Add travel-related background image (placeholder for now)~~
- ~~Clean responsive split layout~~

### Dashboard Visual

- Add travel-related scenery banner at the top
- Responsive, high-quality display

### Theme & Branding

- Align brand colors with company logo palette (cyan/teal direction)
- Ensure consistent color usage across all screens
- Current palette: teal `#0f766e`, amber `#f59e0b`, dark sidebar

### Button Label & Terminology Audit

- Audit toast messages, pop-ups, and notifications for consistent wording
- Ensure labels match context (policy create vs endorsement edit)

### Reports & Export

- Date-wise policy reports
- Partner-wise policy reports
- Export from listings (CSV/Excel)

### Role-Based Visibility

- Partner/agent scoped data views
- Non-admin users see only assigned or partner-scoped records

### Policy Lifecycle

- Automatic expiration handling based on `end_date`

### Final Polish

- End-to-end QA pass after all above items
- Product cleanup and deploy readiness

---

## Open / Requires Input

- Final mandatory field list for policy creation (waiting on client)
- Exact invoice field requirements if more than basic (waiting on client)
- Confirmation of PDF source priority for policies (waiting on client)
- Color direction: logo-based cyan vs current teal (waiting on client decision)
- Theme toggle between two palettes (deferred — only if client wants it)
- Bulk invoice generation (deferred — client said not needed right now)
- Bajaj integration documents, credentials, and onboarding (Phase 2 blocker)
