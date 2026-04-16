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
- invoice module
- dashboard and minimal reports

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

Completed:

- repo scaffolding
- working monorepo setup
- frontend app shell
- dashboard demo
- policy search/list demo
- create policy form demo
- policy detail demo
- invoice list placeholder

Next recommended work:

- endorsement screen
- invoice screen refinement
- backend module skeleton for auth, partners, and policies

## Notes

- Policy creation is manual-first in phase 1.
- Bajaj integration must not block core app development.
- Mobile number and email are optional on policy creation.
- Manual email entry is allowed while sending policy PDF from the portal.
- Proposal module is currently out of active scope.
