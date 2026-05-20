import Link from "next/link";
import { fetchDashboardReport } from "@/lib/api";
import { getServerAuthToken, decodeTokenPayload } from "@/lib/server-auth";

function formatCurrency(value: string | number | null | undefined) {
  return `₹ ${Number(value ?? 0).toLocaleString("en-IN")}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function todayParts() {
  const now = new Date();
  return {
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now),
    date: new Intl.DateTimeFormat("en-GB", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(now),
  };
}

export default async function DashboardPage() {
  const token = await getServerAuthToken();
  const decoded = decodeTokenPayload(token);
  const userName = decoded?.email?.split("@")[0] ?? "there";
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

  const m = dashboard?.metrics;
  const today = todayParts();

  return (
    <div className="dash">
      {/* ── Header row ── */}
      <header className="dash-header">
        <div className="dash-header__left">
          <h1 className="dash-header__greeting">
            {greeting()}, {userName}! 👋
          </h1>
        </div>

        {/* Decorative flight trail */}
        <div className="dash-header__decor" aria-hidden="true">
          <svg width="340" height="80" viewBox="0 0 220 50" fill="none">
            <path
              d="M10 38 C50 38 80 14 120 14 S180 32 200 16"
              stroke="#1492ab"
              strokeOpacity="0.55"
              strokeWidth="1.5"
              strokeDasharray="5 5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Plane glyph at the trail tip */}
            <g transform="translate(196 8) rotate(-28)" fill="#1492ab">
              <path d="M0 6 L18 4 L22 0 L24 0 L21 6 L24 12 L22 12 L18 8 L0 6 Z M4 7 L4 11 L6 11 L8 7 Z" />
            </g>
          </svg>
        </div>

        <div className="dash-header__date-card">
          <svg
            width="18"
            height="18"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <div>
            <strong>{today.date}</strong>
            <span>{today.weekday}</span>
          </div>
        </div>
      </header>

      {error && (
        <div className="dash-error">
          <strong>Dashboard unavailable</strong>
          <span>{error}</span>
        </div>
      )}

      {/* ── Stat cards ── */}
      {m && (
        <section className="dash-stats">
          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--mint">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{m.totalPolicies}</span>
              <span className="dash-stat__label">Policies Created</span>
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--lavender">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{m.todayPolicies}</span>
              <span className="dash-stat__label">Issued Today</span>
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--peach">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{m.monthlyPolicies}</span>
              <span className="dash-stat__label">This Month</span>
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--amber">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{m.sentInvoices}</span>
              <span className="dash-stat__label">Invoices Sent</span>
            </div>
          </div>

          <div className="dash-stat">
            <div className="dash-stat__icon dash-stat__icon--sky">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <div className="dash-stat__body">
              <span className="dash-stat__value">{m.uninvoicedPolicies}</span>
              <span className="dash-stat__label">Awaiting Invoices</span>
            </div>
          </div>
        </section>
      )}

      {/* ── Quick Actions ── */}
      <section className="dash-quick">
        <h3 className="dash-quick__title">Quick Actions</h3>
        <div className="dash-quick__grid">
          <Link href="/policies/new" className="dash-quick__card">
            <div className="dash-quick__icon">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <span>Create Policy</span>
          </Link>
          <Link href="/invoices" className="dash-quick__card">
            <div className="dash-quick__icon">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
                />
              </svg>
            </div>
            <span>Generate Invoice</span>
          </Link>
          <Link href="/partners" className="dash-quick__card">
            <div className="dash-quick__icon">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span>Manage Partners</span>
          </Link>
          <Link href="/reports" className="dash-quick__card">
            <div className="dash-quick__icon">
              <svg
                width="22"
                height="22"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <span>View Reports</span>
          </Link>
        </div>
      </section>

      {/* ── Recent Issued Policies ── */}
      {dashboard && dashboard.recentPolicies.length > 0 && (
        <section className="dash-table-section">
          <div className="dash-table-section__header">
            <h3 className="dash-table-section__title">
              Recent Issued Policies
            </h3>
            <Link href="/policies" className="dash-table-section__link">
              View all policies →
            </Link>
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
                {dashboard.recentPolicies.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link href={`/policies/${p.id}`} className="table-link">
                        {p.policyNumber}
                      </Link>
                    </td>
                    <td>{p.primaryTravellerName}</td>
                    <td>{p.partner.name}</td>
                    <td>
                      <span
                        className={`status-pill status-${p.status.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td>{formatCurrency(p.premiumAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
