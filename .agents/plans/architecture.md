# Travel Insurance Internal Portal Architecture

## 1. Architecture Overview

The system will use a modular monolith architecture inside a monorepo.

- One frontend application
- One backend application
- One PostgreSQL database
- One file storage system
- One email provider
- One future insurer integration boundary

This architecture is chosen so phase 1 can ship quickly while still leaving a clean extension path for Bajaj integration later.

### Primary architecture principle

The core portal must work fully without Bajaj.

That means:
- policy creation is manual-first
- PDFs and emails work without insurer dependency
- invoices, reports, and documents are fully internal
- Bajaj is attached later through a backend integration module

## 2. Monorepo Structure

Recommended top-level structure:

```text
apps/
  web/
  api/
packages/
  db/
  config/
  shared/
  ui/        # optional shared UI layer if reuse becomes meaningful
docs/
  plan.md
  architecture.md
docker-compose.yml
```

### App ownership

- `apps/web`: internal admin frontend
- `apps/api`: backend API, business workflows, PDF, email, reports, future insurer integration
- `packages/db`: Prisma schema, migrations, seed helpers, database client wiring
- `packages/config`: shared linting, tsconfig, environment conventions
- `packages/shared`: shared enums, constants, DTO-adjacent types that are safe to share
- `packages/ui`: optional shared UI primitives if cross-app reuse becomes useful

### Local development infrastructure

- local PostgreSQL should run through `docker-compose`
- backend and frontend should use environment-specific local `.env` files
- seed data should include an admin user and a few sample partners for early development

## 3. Frontend Architecture

### Frontend purpose

The frontend is an internal admin portal for operational users, not a public marketing website and not a consumer purchase journey.

### Frontend module map

- `auth`
- `dashboard`
- `partners`
- `policies`
- `travellers`
- `documents`
- `pdf-email-actions`
- `invoices`
- `reports`
- `settings`
- later `integrations`

### Primary screens

- `/login`
- `/dashboard`
- `/partners`
- `/partners/new`
- `/partners/:id`
- `/policies`
- `/policies/new`
- `/policies/:id`
- `/policies/:id/endorse`
- `/invoices`
- `/invoices/new`
- `/invoices/:id`
- `/reports`

### Frontend behavior rules

- `Super Admin` can view all records
- non-admin users default to assigned/partner-scoped visibility
- policy search/list is a first-class operational screen
- policy detail is the main operational page for policy actions
- PDF preview/download/email actions live on the policy detail page
- invoice module exists as an independent sidebar module and not only inside policy detail

### Frontend state approach

- server state through API queries
- form state local to each module
- no global complex client state needed initially beyond auth/session and light filters

### Frontend component strategy

- reusable table layer for policy/invoice/report listing
- reusable form field layer for policy, traveller, partner, and invoice forms
- modal or drawer for send-email action
- preview panel or new-tab document view for PDFs
- theme-token layer with one active brand theme and one alternate preset kept ready

## 4. Backend Architecture

### Backend purpose

The backend owns all business logic, validation, persistence, PDF generation, email sending, reporting, and future insurer integration.

### Backend module map

- `auth`
- `users`
- `partners`
- `policies`
- `travellers`
- `documents`
- `pdf`
- `email`
- `invoices`
- `reports`
- `audit`
- later `integrations/bajaj`

### Module responsibilities

#### auth
- login
- session/JWT issuance
- route guards
- role checks

#### users
- internal users
- user profile
- role assignment

#### partners
- partner CRUD
- partner status
- partner code lookup

#### policies
- create policy
- fetch policy detail
- list/search policies
- endorse policy
- attach travellers/documents/invoices
- manage policy status limited to phase 1 create/endorse lifecycle
- validate policy number uniqueness
- support duplicate-warning flow in UI before final submission when possible
- expose expiry state derived from `end_date`

#### travellers
- multi-traveller persistence
- passport lookup source
- autofill support

#### documents
- upload file metadata
- storage path handling
- download access

#### pdf
- fallback policy PDF generation
- invoice PDF generation
- future reusable document templates

#### email
- send policy by email
- send invoice by email
- manual email recipient handling
- email logging

#### invoices
- create invoice
- fetch eligible policies without invoices
- generate one invoice from a selected eligible policy
- bulk-generate one invoice per selected eligible policy
- list/search invoices
- link invoice to policy when relevant
- invoice PDF handling
- invoice send logging through the shared email log table

#### reports
- dashboard aggregates
- date-wise policy reporting
- partner-wise policy reporting
- export support

#### audit
- policy action history
- endorsement history
- email send logs
- document activity logs if needed
- policy status transitions caused by scheduled expiry handling

#### integrations/bajaj
- disabled boundary in phase 1
- later quote/premium/issue/document/status adapter methods

## 5. API Architecture

The backend should expose REST APIs grouped by module.

### API groups

- `/auth`
- `/users`
- `/partners`
- `/policies`
- `/travellers`
- `/documents`
- `/invoices`
- `/reports`
- `/emails`
- later `/integrations/bajaj`

### Core phase 1 operations

#### auth
- login
- current user profile

#### partners
- create partner
- update partner
- list partners
- get partner detail

#### policies
- create policy
- list policies with filters
- get policy detail
- endorse policy

#### documents
- upload document for policy
- list policy documents
- download document

#### pdf/email
- get policy PDF
- generate/regenerate policy PDF
- send policy email
- get invoice PDF
- send invoice email

#### invoices
- create invoice
- fetch invoice-eligible policies
- bulk-generate invoices from selected policy IDs
- list invoices
- get invoice detail

#### reports
- dashboard summary
- date-wise policy report
- partner-wise policy report
- exports

#### system jobs
- automatic policy expiration job based on `end_date`

## 6. Database Architecture

### Core entities

#### users
- `id`
- `name`
- `email_or_username`
- `password_hash`
- `role`
- `status`
- `created_at`
- `updated_at`

#### partners
- `id`
- `partner_code`
- `name`
- `contact_name`
- `email`
- `phone`
- `status`
- `created_at`
- `updated_at`

#### policies
- `id`
- `policy_number`
- `partner_id`
- `issue_date`
- `start_date`
- `end_date`
- `insurer_name`
- `product_code` nullable
- `status`
- `primary_traveller_name`
- `customer_email` nullable
- `customer_mobile` nullable
- `premium_amount` nullable
- `created_by`
- `updated_by`
- `created_at`
- `updated_at`

#### policy_travellers
- `id`
- `policy_id`
- `traveller_name`
- `passport_number`
- `age_or_dob`
- `email` nullable
- `mobile` nullable
- `created_at`
- `updated_at`

#### policy_documents
- `id`
- `policy_id`
- `file_name`
- `file_type`
- `file_url`
- `source_type`
- `uploaded_by`
- `uploaded_at`

#### policy_actions
- `id`
- `policy_id`
- `action_type`
- `action_summary`
- `before_json` nullable
- `after_json` nullable
- `done_by`
- `done_at`

#### invoices
- `id`
- `invoice_number`
- `policy_id` nullable
- `partner_id`
- `invoice_date`
- `amount`
- `status`
- `pdf_url` nullable
- `created_by`
- `created_at`

#### email_logs
- `id`
- `related_entity_type`
- `related_entity_id`
- `recipient_email`
- `subject`
- `provider`
- `status`
- `sent_by`
- `sent_at`
- `provider_reference` nullable

### Database rules

- passport is not unique globally
- one passport can exist across multiple policies
- internal `id` values are system-generated and authoritative
- policy number is externally meaningful but not treated as the only primary identifier
- policy number should still be unique in phase 1 unless future business rules require duplicates
- phase 1 lifecycle is limited to `create` and `endorse`

## 7. Policy Workflow Architecture

### Create policy

1. User opens create policy form
2. User enters primary traveller or traveller passport
3. Backend checks traveller history by passport
4. UI offers autofill from prior matching record
5. User completes policy and traveller details
6. Backend checks policy number uniqueness before write
7. Backend persists policy, travellers, and initial create action log

### Endorse policy

1. User opens an existing policy
2. User enters endorsement/edit flow
3. Allowed fields are updated
4. Backend records before/after or action summary
5. Policy detail reflects latest state

### PDF and email flow

1. User opens policy detail
2. If external/stored PDF exists, show that first
3. If not, backend can generate fallback PDF
4. User may download the PDF
5. User may send the PDF by email
6. Manual email entry is allowed at send time
7. Email action is logged

## 8. Invoice Architecture

Invoice is both:
- related to policy when applicable
- available through a separate invoice module

### Phase 1 invoice behavior

- create invoice
- list/search invoices centrally
- open invoice detail
- download invoice PDF
- no payment gateway logic
- no settlement logic
- no advanced accounting engine

## 9. Reporting Architecture

Phase 1 reporting stays intentionally minimal.

### Included reports

- dashboard summary cards
- policy list export
- date-wise policy report
- partner-wise policy report

### Excluded from phase 1

- advanced analytics
- forecasting
- complex finance reports
- insurer reconciliation reports

## 10. File, PDF, and Email Architecture

### File storage

Use object storage for:
- uploaded policy documents
- generated PDFs
- invoice PDFs

### PDF strategy

Policy PDF uses `store existing + generate fallback`.

- if an uploaded or insurer-provided PDF exists, prefer that
- if not, generate from internal data using backend PDF templates

Invoice PDF should be backend-generated from invoice data.

### Email strategy

- transactional email only
- manual trigger from UI
- manual recipient entry allowed
- provider-backed send from backend
- all sends logged

## 11. Background Job Architecture

Phase 1 should include a lightweight scheduled backend job for policy expiry handling.

- run at least daily
- mark policies as expired when `end_date` is in the past
- write an action log when status changes automatically
- keep this as an internal backend scheduler job, not a separate worker service in phase 1

## 12. Bajaj Integration-Ready Design

Phase 1 must not implement live Bajaj calls, but it must leave clean extension points.

### Required future adapter boundary

Define a backend integration service interface with methods like:

- `getPlans()`
- `getPremium()`
- `issuePolicy()`
- `fetchPolicyDocument()`
- `syncStatus()`

### Required future integration data

Plan phase 1 schemas so later fields can be added cleanly for:
- product code
- branch code
- intermediary code
- webservice user
- integration request/response logs
- integration status

### Integration constraints already known

From received prerequisites, future Bajaj integration may require:
- UAT and production separation
- public IP visibility or whitelisting
- official onboarding data
- insurer-side SPOC
- environment-specific credentials

## 13. Deployment Architecture

### Environments

- local development
- UAT/staging
- production

### Environment rule

Even in phase 1, configure the backend so it can later support UAT and production separation for insurer integration without major refactoring.

## 14. Known Open Items That Do Not Block Architecture

- final manual field list for policy creation
- final exact invoice field list beyond basic create/list/download
- exact policy PDF template if internal generation becomes primary
- final Bajaj docs and credentials
- later lifecycle actions like recreate/extend/cancel

## 15. Final Architecture Decision

Build phase 1 as a complete manual-first internal portal with clean backend module boundaries and a future Bajaj integration adapter. Keep the app fully operational without insurer dependency, and design the backend so insurer integration can be added later without changing the core policy, invoice, document, PDF, email, and reporting modules.
