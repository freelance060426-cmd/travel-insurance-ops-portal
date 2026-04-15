# Travel Insurance Internal Portal Plan

## Summary

This project will be built in two phases.

- Phase 1 delivers a complete internal operations portal that works without live insurer integration.
- Phase 2 adds Bajaj webservice integration and any deferred insurer-dependent workflows once the remaining documentation, credentials, and onboarding requirements are available.

The current plan intentionally excludes the proposal module from active scope. The system will be manual-first, integration-ready, and optimized for internal business users rather than end customers.

## Phase 1 Delivery Plan

### Core goal

Deliver a production-ready internal portal for policy operations with document, PDF, email, invoice, dashboard, and reporting support.

### Modules in scope

1. Authentication and access control
- Login for internal users
- Role-based access for `Super Admin` and `Partner/Agent/Employee`
- Protected routes and session handling

2. Partner management
- Create, edit, list, and activate/deactivate partners
- Basic partner profile and partner code management

3. Policy management
- Create policy
- Multi-traveller entry
- Passport-based autofill from existing traveller records
- Policy list and search
- Policy detail view
- Endorse policy with change history

4. Policy PDF and email actions
- View existing policy PDF
- Generate or regenerate fallback policy PDF when needed
- Download policy PDF
- Send policy by email directly from the portal
- Allow manual email entry during send flow

5. Document management
- Upload and store policy-related documents
- Download stored documents from the policy detail page

6. Invoice module
- Separate invoice module in the sidebar
- Create invoice
- List and search invoices
- Download invoice PDF
- Optional link between invoice and policy

7. Dashboard and reports
- Dashboard counts for total policies, today, month, and recent activity
- Date-wise policy reporting
- Partner-wise policy reporting
- Search/export from listings

### Explicit phase 1 exclusions

- Proposal module
- Payment gateway and UPI
- Settlement tracking
- Full accounting system
- WhatsApp automation
- Recreate/extend/cancel workflows
- Advanced analytics
- Live Bajaj integration

### Phase 1 assumptions

- Policy lifecycle for now is limited to `create` and `endorse`
- Mobile number and email remain optional on policy creation
- Manual recipient email entry is allowed when sending policy email
- Reports remain minimal operational reports only
- Manual field-level policy form finalization is still pending and will be added later
- Non-admin visibility defaults to assigned or partner-scoped data
- Policy number remains manual entry, but phase 1 will treat it as unique unless the client explicitly asks otherwise
- Duplicate policy number should show a clear warning in UI and be rejected by backend validation on save
- Policy expiration should be handled automatically based on `end_date`

### Phase 1 deliverables

- Web frontend
- Backend API
- Database schema and migrations
- File storage integration
- Email integration
- PDF generation pipeline
- Environment documentation
- Admin-ready deployment configuration

## Phase 2 Extension Plan

### Core goal

Add Bajaj integration without restructuring the phase 1 app.

### Phase 2 scope

- Bajaj plan and premium fetch
- Bajaj policy issuance
- Bajaj policy document retrieval
- Bajaj sync logs and request/response tracking
- Later support for additional insurer-driven workflows if docs exist

### Phase 2 dependencies

- API/webservice documentation
- UAT credentials
- Production credentials
- Product code mapping
- Intermediary code
- Branch code
- UAT and production environment requirements
- Public IP or whitelisting requirements
- Insurer-side SPOC for testing and sign-off

### Phase 2 implementation rule

No phase 2 work should block phase 1 architecture or delivery. Bajaj integration is an extension module, not a dependency of core portal behavior.

## Immediate Planning Priorities

1. Finalize architecture and repo structure
2. Finalize phase 1 database entities
3. Finalize backend modules and API groups
4. Finalize phase 1 screens and route map
5. Add manual field list once provided
6. Start implementation with manual-first workflow

## Recommended Implementation Order

### Phase 1A - Project setup

- Initialize monorepo structure
- Create frontend app and backend app
- Add shared package and database package
- Add local PostgreSQL via Docker Compose
- Create initial database migration and seed basics

### Phase 1B - Auth and shell

- Implement login flow
- Add role-aware route protection
- Build app shell, sidebar, and base layouts

### Phase 1C - Core policy flow

- Implement partner module
- Implement create policy flow with multi-traveller support
- Add passport-based autofill lookup
- Add duplicate policy-number validation flow
- Build policy search/list/detail pages

### Phase 1D - Endorsement and documents

- Implement endorse flow with action history
- Add document upload/download
- Add policy PDF preview, download, and fallback generation
- Add policy email send with manual recipient entry

### Phase 1E - Invoice, dashboard, and reports

- Implement invoice create/list/detail/download
- Add dashboard summary endpoints and UI
- Add minimal reports and export support
- Add automatic expiration handling

## Open Items Still Expected From Client

- Final mandatory field list for policy creation
- Exact invoice field requirements if more than basic create/list/download is expected
- Confirmation of PDF source priority for policies that already exist
- Final Bajaj integration documents and onboarding inputs
