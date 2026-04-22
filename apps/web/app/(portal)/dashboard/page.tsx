import { dashboardMetrics, recentActivities, policyRows } from "@/lib/mock-data";

export default function DashboardPage() {
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
        {dashboardMetrics.map((metric) => (
          <article key={metric.label} className={`metric-card tone-${metric.tone}`}>
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.delta}</span>
          </article>
        ))}
      </section>

      <section className="two-column-grid">
        <article className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">RECENT ACTIVITY</p>
              <h3>Ops updates</h3>
            </div>
          </div>

          <ul className="activity-list">
            {recentActivities.map((activity) => (
              <li key={activity}>{activity}</li>
            ))}
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
              <strong>WIC KB 14</strong>
            </div>
            <div>
              <span>Pending PDF actions</span>
              <strong>11</strong>
            </div>
            <div>
              <span>Email sends today</span>
              <strong>7</strong>
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
              {policyRows.slice(0, 4).map((policy) => (
                <tr key={policy.id}>
                  <td>{policy.policyNumber}</td>
                  <td>{policy.traveller}</td>
                  <td>{policy.partner}</td>
                  <td>
                    <span className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {policy.status}
                    </span>
                  </td>
                  <td>{policy.premium}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
