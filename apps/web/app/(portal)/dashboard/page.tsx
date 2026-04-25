import { fetchDashboardReport } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

function formatCurrency(value: string | number | null | undefined) {
  return `₹ ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function DashboardPage() {
  const token = await getServerAuthToken();
  let dashboard = null;
  let error = "";

  try {
    dashboard = await fetchDashboardReport(token ?? undefined);
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Dashboard data could not be loaded.";
  }

  const metrics = dashboard
    ? [
        {
          label: "Total policies",
          value: dashboard.metrics.totalPolicies,
          delta: "All records in the portal",
          tone: "teal",
        },
        {
          label: "Issued today",
          value: dashboard.metrics.todayPolicies,
          delta: "Based on issue date",
          tone: "blue",
        },
        {
          label: "This month",
          value: dashboard.metrics.monthlyPolicies,
          delta: "Month-to-date policies",
          tone: "amber",
        },
        {
          label: "Invoices sent",
          value: dashboard.metrics.sentInvoices,
          delta: `${dashboard.metrics.readyInvoices} ready for client share`,
          tone: "rose",
        },
      ]
    : [];

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel--brand hero-panel--dashboard">
        <div className="hero-panel__content">
          <p className="portal-eyebrow">COVER EDGE DASHBOARD</p>
          <h1>Daily travel insurance control room</h1>
          <p className="hero-panel__text">
            Track travel protection operations with a brand-led dashboard built
            for policy issue, invoice dispatch, client communication, and daily
            servicing visibility.
          </p>
        </div>

        <div className="hero-panel__meta">
          <div className="dashboard-hero-visual">
            <div className="dashboard-hero-visual__glow" />
            <div className="dashboard-hero-visual__card">
              <span>Travel coverage</span>
              <strong>Inbound + outbound trip workflows</strong>
            </div>
            <div className="dashboard-hero-visual__card dashboard-hero-visual__card--secondary">
              <span>Today</span>
              <strong>Policies, invoices, and dispatch in one view</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="metric-grid">
        {metrics.map((metric) => (
          <article key={metric.label} className={`metric-card tone-${metric.tone}`}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.delta}</span>
          </article>
        ))}
      </section>

      {error ? (
        <section className="content-card">
          <p className="portal-eyebrow">DASHBOARD ERROR</p>
          <h3>Live dashboard data is unavailable</h3>
          <p className="page-subtitle">{error}</p>
        </section>
      ) : null}

      <section className="two-column-grid">
        <article className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">RECENT ACTIVITY</p>
              <h3>Ops updates</h3>
            </div>
          </div>

          <ul className="activity-list">
            {dashboard?.recentActions.length ? (
              dashboard.recentActions.map((activity) => (
                <li key={activity.id}>
                  {activity.policy.policyNumber}: {activity.actionSummary}
                </li>
              ))
            ) : (
              <li>No recent operational activity yet.</li>
            )}
          </ul>
        </article>

        <article className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">AT A GLANCE</p>
              <h3>Partner performance</h3>
            </div>
          </div>

          <div className="partner-stats">
            <div>
              <span>Top partner</span>
              <strong>{dashboard?.topPartner?.name ?? "No policy data"}</strong>
            </div>
            <div>
              <span>Pending PDF actions</span>
              <strong>{dashboard?.metrics.pendingPdfPolicies ?? 0}</strong>
            </div>
            <div>
              <span>Email sends today</span>
              <strong>{dashboard?.metrics.emailSendsToday ?? 0}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">QUICK VIEW</p>
            <h3>Recently touched policies</h3>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Traveller</th>
                <th>Partner</th>
                <th>Status</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {dashboard?.recentPolicies.map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.primaryTravellerName}</td>
                  <td>{policy.partner.name}</td>
                  <td>
                    <span
                      className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td>{formatCurrency(policy.premiumAmount)}</td>
                </tr>
              ))}
              {!dashboard?.recentPolicies.length ? (
                <tr>
                  <td colSpan={5}>No recent policies found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
