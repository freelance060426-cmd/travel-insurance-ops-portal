import { PolicyExportButton } from "@/components/forms/policy-export-button";
import { fetchPartnerReport, fetchPolicyReport } from "@/lib/api";
import type { ApiPartnerReportRow, ApiPolicyReport } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

function formatTravelWindow(startDate: string, endDate: string) {
  const start = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(startDate));
  const end = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(endDate));
  return `${start} - ${end}`;
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
      caught instanceof Error
        ? caught.message
        : "Reports could not be loaded.";
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
        <form className="filter-toolbar filter-toolbar--reports" action="/reports">
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
              <input type="date" name="issueTo" defaultValue={selected.issueTo} />
            </label>
          </div>
          <div className="filter-toolbar__actions">
            <div className="filter-summary filter-summary--compact">
              <span>Report scope</span>
              <strong>
                {selected.issueFrom || selected.issueTo ? "Date filtered" : "All dates"}
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
                      <p>Change the date range or create policies to populate this report.</p>
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
          <span className="table-count-pill">{policyReport?.rows.length ?? 0} rows</span>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Traveller</th>
                <th>Partner</th>
                <th>Issue Date</th>
                <th>Travel</th>
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
                  <td>{formatTravelWindow(policy.startDate, policy.endDate)}</td>
                  <td>
                    <span
                      className={`status-pill status-${policy.status.toLowerCase()}`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td>
                    ₹ {Number(policy.premiumAmount ?? 0).toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
              {!policyReport?.rows.length ? (
                <tr>
                  <td colSpan={7}>
                    <div className="data-empty-state">
                      <span>No policy rows</span>
                      <strong>No policy report rows found.</strong>
                      <p>Change the report filters or create new policy records.</p>
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
