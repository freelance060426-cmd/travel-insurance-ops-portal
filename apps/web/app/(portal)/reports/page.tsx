import { PolicyExportButton } from "@/components/forms/policy-export-button";
import { fetchPartnerReport, fetchPolicyReport } from "@/lib/api";
import type { ApiPartnerReportRow, ApiPolicyReport } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { formatDDMMYYYY, calcTripDays } from "@/lib/format";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getServerAuthToken();
  const params = await searchParams;
  const selected = {
    issueFrom: typeof params.issueFrom === "string" ? params.issueFrom : "",
    issueTo: typeof params.issueTo === "string" ? params.issueTo : "",
  };
  let error = "";
  let policyReport: ApiPolicyReport | null = null;
  let partnerReport: ApiPartnerReportRow[] = [];

  try {
    const [policies, partners] = await Promise.all([
      fetchPolicyReport(token ?? undefined, selected),
      fetchPartnerReport(token ?? undefined, selected),
    ]);
    policyReport = policies;
    partnerReport = partners;
  } catch (caught) {
    error =
      caught instanceof Error ? caught.message : "Reports could not be loaded.";
  }

  const totalPremium = partnerReport.reduce(
    (sum, partner) => sum + partner.totalPremium,
    0,
  );
  const totalInvoices = partnerReport.reduce(
    (sum, partner) => sum + partner.invoiceCount,
    0,
  );

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel--brand">
        <div className="hero-panel__content">
          <p className="portal-eyebrow">REPORTS</p>
          <h1>Operational reports and CSV export</h1>
          <p className="hero-panel__text">
            Review policy activity by date and partner, then export the filtered
            policy report for offline follow-up.
          </p>
        </div>
        <div className="hero-panel__meta">
          <span className="portal-chip portal-chip--strong">
            {policyReport?.total ?? 0} policies
          </span>
          <span className="portal-chip">
            ₹ {totalPremium.toLocaleString("en-IN")} premium
          </span>
        </div>
      </section>

      <section className="metric-grid metric-grid--compact">
        <article className="metric-card tone-teal">
          <p>Total policies</p>
          <strong>{policyReport?.total ?? 0}</strong>
          <span>Matching current report range</span>
        </article>
        <article className="metric-card tone-blue">
          <p>Partner rows</p>
          <strong>{partnerReport.length}</strong>
          <span>Partners with policy activity</span>
        </article>
        <article className="metric-card tone-amber">
          <p>Invoice count</p>
          <strong>{totalInvoices}</strong>
          <span>Invoices linked to reported partners</span>
        </article>
      </section>

      <section className="content-card report-filter-card">
        <form
          className="filter-toolbar filter-toolbar--reports"
          action="/reports"
        >
          <div className="filter-toolbar__fields">
            <label className="filter-field">
              <span>Issue from</span>
              <input
                type="date"
                name="issueFrom"
                defaultValue={selected.issueFrom}
              />
            </label>
            <label className="filter-field">
              <span>Issue to</span>
              <input
                type="date"
                name="issueTo"
                defaultValue={selected.issueTo}
              />
            </label>
          </div>
          <div className="filter-toolbar__actions">
            <div className="filter-summary filter-summary--compact">
              <span>Report scope</span>
              <strong>
                {selected.issueFrom || selected.issueTo
                  ? "Date filtered"
                  : "All dates"}
              </strong>
            </div>
            <div className="action-button-row">
              <button className="primary-button" type="submit">
                Apply date range
              </button>
              <PolicyExportButton params={selected} />
            </div>
          </div>
        </form>

        {error ? (
          <div className="submit-banner submit-error">{error}</div>
        ) : null}
      </section>

      <section className="content-card data-table-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">PARTNER REPORT</p>
            <h3>Partner-wise policy and invoice totals</h3>
          </div>
          <span className="table-count-pill">{partnerReport.length} rows</span>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Code</th>
                <th>Policies</th>
                <th>Invoices</th>
                <th>Premium</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {partnerReport.map((partner) => (
                <tr key={partner.id}>
                  <td>{partner.name}</td>
                  <td>{partner.partnerCode}</td>
                  <td>{partner.policyCount}</td>
                  <td>{partner.invoiceCount}</td>
                  <td>₹ {partner.totalPremium.toLocaleString("en-IN")}</td>
                  <td>
                    <span
                      className={`status-pill status-${partner.status.toLowerCase()}`}
                    >
                      {partner.status}
                    </span>
                  </td>
                </tr>
              ))}
              {!partnerReport.length ? (
                <tr>
                  <td colSpan={6}>
                    <div className="data-empty-state">
                      <span>No partner activity</span>
                      <strong>No partner report data found.</strong>
                      <p>
                        Change the date range or create policies to populate
                        this report.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card data-table-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">POLICY REPORT</p>
            <h3>Date-wise policy records</h3>
          </div>
          <span className="table-count-pill">
            {policyReport?.rows.length ?? 0} rows
          </span>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Traveller</th>
                <th>Partner</th>
                <th>Issue Date</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Status</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {policyReport?.rows.map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.primaryTravellerName}</td>
                  <td>{policy.partner.name}</td>
                  <td>{formatDate(policy.issueDate)}</td>
                  <td>{formatDDMMYYYY(policy.startDate)}</td>
                  <td>{formatDDMMYYYY(policy.endDate)}</td>
                  <td>{calcTripDays(policy.startDate, policy.endDate)}</td>
                  <td>
                    <span
                      className={`status-pill status-${policy.status.toLowerCase()}`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td>
                    ₹{" "}
                    {Number(policy.premiumAmount ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {!policyReport?.rows.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="data-empty-state">
                      <span>No policy rows</span>
                      <strong>No policy report rows found.</strong>
                      <p>
                        Change the report filters or create new policy records.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyDocumentsManager } from "@/components/forms/policy-documents-manager";
import { PolicyEmailActions } from "@/components/forms/policy-email-actions";
import { PdfActions } from "@/components/forms/pdf-actions";
import { fetchPolicyById } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";
import { formatDDMMYYYY, calcTripDays } from "@/lib/format";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerAuthToken();
  let policy = null;

  try {
    const apiPolicy = await fetchPolicyById(id, token ?? undefined);
    policy = {
      id: apiPolicy.id,
      policyNumber: apiPolicy.policyNumber,
      traveller: apiPolicy.primaryTravellerName,
      passport: apiPolicy.travellers[0]?.passportNumber ?? "N/A",
      partner: apiPolicy.partner.name,
      issueDate: formatDate(apiPolicy.issueDate),
      startDate: formatDDMMYYYY(apiPolicy.startDate),
      endDate: formatDDMMYYYY(apiPolicy.endDate),
      tripDays:
        apiPolicy.tripDays ??
        calcTripDays(apiPolicy.startDate, apiPolicy.endDate),
      status: apiPolicy.status,
      travelRegion: apiPolicy.travelRegion ?? null,
      destination: apiPolicy.destination ?? null,
      premium:
        apiPolicy.premiumAmount !== null &&
        apiPolicy.premiumAmount !== undefined
          ? `Rs. ${Number(apiPolicy.premiumAmount).toLocaleString("en-IN")}`
          : "Rs. 0",
      documents:
        apiPolicy.documents?.map((document) => ({
          label: document.fileName || "Stored document",
          status: document.sourceType || "Uploaded",
          url: document.fileUrl,
        })) ?? [],
      customerEmail: apiPolicy.customerEmail ?? "",
      emailLogs: apiPolicy.emailLogs ?? [],
      travellers: apiPolicy.travellers.map((traveller) => ({
        name: traveller.travellerName,
        passport: traveller.passportNumber,
        gender: traveller.gender ?? "",
        dateOfBirth: traveller.dateOfBirth
          ? formatDDMMYYYY(
              new Date(traveller.dateOfBirth).toISOString().slice(0, 10),
            )
          : "",
        email: traveller.email ?? "",
        mobile: traveller.mobile ?? "",
        nominee: traveller.nominee ?? "",
        plan: traveller.planName || "—",
        premium:
          traveller.premiumAmount !== null &&
          traveller.premiumAmount !== undefined
            ? `Rs. ${Number(traveller.premiumAmount).toLocaleString("en-IN")}`
            : "—",
      })),
    };
  } catch {
    policy = null;
  }

  if (!policy) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="portal-eyebrow">POLICY DETAIL</p>
          <h1>{policy.policyNumber}</h1>
          <p className="hero-panel__text">
            {policy.traveller} · {policy.partner} · {policy.issueDate}
          </p>
        </div>

        <div className="hero-panel__meta">
          <span
            className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}
          >
            {policy.status}
          </span>
          <Link
            className="primary-button"
            href={`/policies/${policy.id}/endorse`}
          >
            Endorse policy
          </Link>
        </div>
      </section>

      <div className="two-column-grid">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">CORE INFORMATION</p>
              <h3>Policy summary</h3>
            </div>
          </div>

          <div className="summary-pairs">
            <div>
              <span>Partner</span>
              <strong>{policy.partner}</strong>
            </div>
            <div>
              <span>Issue date</span>
              <strong>{policy.issueDate}</strong>
            </div>
            <div>
              <span>Start date</span>
              <strong>{policy.startDate}</strong>
            </div>
            <div>
              <span>End date</span>
              <strong>{policy.endDate}</strong>
            </div>
            <div>
              <span>Trip days</span>
              <strong>{policy.tripDays}</strong>
            </div>
            <div>
              <span>Total premium</span>
              <strong>{policy.premium}</strong>
            </div>
            {policy.travelRegion && (
              <div>
                <span>Region</span>
                <strong>{policy.travelRegion}</strong>
              </div>
            )}
            {policy.destination && (
              <div>
                <span>Destination</span>
                <strong>{policy.destination}</strong>
              </div>
            )}
          </div>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">PDF & EMAIL</p>
              <h3>Manual customer actions</h3>
            </div>
          </div>

          <PdfActions entityType="policy" entityId={policy.id} />
          <div style={{ marginTop: 14 }}>
            <PolicyEmailActions
              policyId={policy.id}
              policyNumber={policy.policyNumber}
              initialRecipient={policy.customerEmail}
              initialLogs={policy.emailLogs}
            />
          </div>
        </section>
      </div>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">TRAVELLERS</p>
            <h3>Traveller list</h3>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Passport</th>
                <th>Gender</th>
                <th>DOB</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Nominee</th>
                <th>Plan</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {policy.travellers.map((traveller) => (
                <tr key={`${traveller.passport}-${traveller.name}`}>
                  <td>{traveller.name}</td>
                  <td>{traveller.passport}</td>
                  <td>{traveller.gender || "—"}</td>
                  <td>{traveller.dateOfBirth || "—"}</td>
                  <td>{traveller.email || "—"}</td>
                  <td>{traveller.mobile || "—"}</td>
                  <td>{traveller.nominee || "—"}</td>
                  <td>{traveller.plan}</td>
                  <td>{traveller.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">DOCUMENTS</p>
            <h3>Available files</h3>
          </div>
        </div>

        <PolicyDocumentsManager
          policyId={policy.id}
          initialDocuments={policy.documents}
        />
      </section>
    </div>
  );
}
