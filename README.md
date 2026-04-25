# Travel Insurance Ops Portal

Internal web portal for managing travel insurance operations.

This project is being built as a manual-first backoffice system for a travel insurance business. It is intended for internal users such as admin, partner, agent, or employee. It is not a consumer-facing website.

Phase 1 focuses on:

- authentication and role-based access
- partner management
- policy creation and search
- multi-traveller support
- passport-based autofill
- policy detail and endorsement-ready workflow
- policy PDF actions
- policy email send from portal
- invoice module with eligible-policy generation and bulk generation
- invoice client-send flow
- dashboard and minimal reports
- branded login and dashboard experience

Phase 2 is reserved for Bajaj integration and other insurer-dependent workflows once external documentation, credentials, and onboarding details are available.

## Repository Structure

```text
travel-insuranc-ops-portal/
├── .agents/
│   ├── plans/
│   │   ├── plan.md
│   │   └── architecture.md
│   ├── agents/
│   ├── skills/
│   └── tasks.yml
├── apps/
│   ├── web/
│   └── api/
├── packages/
│   ├── db/
│   └── shared/
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Planning Docs

Canonical planning lives in:

- [.agents/plans/plan.md](./.agents/plans/plan.md)
- [.agents/plans/architecture.md](./.agents/plans/architecture.md)
- [.agents/tasks.yml](./.agents/tasks.yml)

These files should be kept in sync as major milestones are completed.

## Tech Stack

- Monorepo: `pnpm` workspaces + `turbo`
- Frontend: `Next.js`
- Backend: `NestJS`
- Database: `PostgreSQL`
- ORM: `Prisma`
- Shared package: common enums and types
- Local DB: `docker-compose`

## Local Development

### 1. Install dependencies

```bash
npx pnpm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Copy environment variables

```bash
cp .env.example .env
```

Local PostgreSQL for this project uses port `5433` to avoid conflicts with any existing local Postgres running on `5432`.

Local authentication defaults:

```env
DEFAULT_ADMIN_EMAIL=admin@travel-ops.local
DEFAULT_ADMIN_PASSWORD=admin123
```

These defaults are for local development only.

Email sending uses SMTP. For a working outbound policy-email flow, configure:

```env
EMAIL_FROM=noreply@example.com
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASS=password
```

### 4. Generate Prisma client

```bash
npx pnpm --filter @travel/db generate
```

### 5. Start development servers

```bash
npx pnpm dev
```

Useful alternatives:

```bash
npx pnpm dev:web
npx pnpm dev:api
```

## Current Status

Phase 1 core is functionally complete. The portal supports end-to-end flows for partners, policies, endorsements, invoices, PDFs, and email delivery.

Completed:

- repo scaffolding and monorepo setup
- frontend app shell and protected session flow
- backend authentication with JWT
- partner create/list flow
- policy create/list/detail flow with multi-traveller and passport autofill
- endorsement flow with action history
- invoice create/list/detail flow with PDF generation
- document upload and storage
- policy and invoice PDF generation/retrieval
- policy email sending with SMTP-backed delivery logs
- dashboard with metrics and activity feed
- invoice eligibility, single generate, and bulk generation flow
- invoice email sending
- reports dashboard, partner report, policy report, and CSV export
- automatic policy expiry handling
- branded login, dashboard, and theme foundation
- policy terminology cleanup (`Save Policy`)

Next recommended work:

- partner-scoped role visibility model
- production storage decision for uploaded files and generated PDFs
- final polish and release-style QA

## Notes

- Policy creation is manual-first in phase 1.
- Bajaj integration must not block core app development.
- Mobile number and email are optional on policy creation.
- Manual email entry is allowed while sending policy PDF from the portal.
- Proposal module is currently out of active scope.
