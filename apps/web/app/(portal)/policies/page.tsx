import Link from "next/link";
import { fetchPolicies } from "@/lib/api";
import { policyRows } from "@/lib/mock-data";
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

export default async function PoliciesPage() {
  const token = await getServerAuthToken();
  let rows = policyRows;

  try {
    const policies = await fetchPolicies(token ?? undefined);
    rows = policies.map((policy) => ({
      id: policy.id,
      policyNumber: policy.policyNumber,
      traveller: policy.primaryTravellerName,
      passport: policy.travellers[0]?.passportNumber ?? "N/A",
      partner: policy.partner.name,
      issueDate: formatDate(policy.issueDate),
      travelWindow: formatTravelWindow(policy.startDate, policy.endDate),
      startDate: formatDate(policy.startDate),
      endDate: formatDate(policy.endDate),
      status: policy.status,
      premium:
        policy.premiumAmount !== null && policy.premiumAmount !== undefined
          ? `₹ ${Number(policy.premiumAmount).toLocaleString("en-IN")}`
          : "₹ 0",
    }));
  } catch {
    rows = policyRows;
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">POLICY SEARCH</p>
            <h1 className="page-title">Find and manage policy records</h1>
          </div>

          <Link className="primary-button" href="/policies/new">
            Create Policy
          </Link>
        </div>

        <div className="filter-grid">
          <label>
            <span>Policy Number</span>
            <input placeholder="Search by policy number" />
          </label>
          <label>
            <span>Passport Number</span>
            <input placeholder="Search by passport" />
          </label>
          <label>
            <span>Traveller Name</span>
            <input placeholder="Search by traveller" />
          </label>
          <label>
            <span>Partner</span>
            <select defaultValue="All partners">
              <option>All partners</option>
              <option>Tourist Muse</option>
              <option>WIC KB 14</option>
              <option>Urbane Travel LLP</option>
            </select>
          </label>
        </div>

        <div className="filter-grid filter-grid--secondary">
          <label>
            <span>Issue Date</span>
            <input type="date" defaultValue="2026-04-03" />
          </label>
          <label>
            <span>Status</span>
            <select defaultValue="Any status">
              <option>Any status</option>
              <option>Draft</option>
              <option>Active</option>
              <option>Endorsed</option>
              <option>PDF Pending</option>
            </select>
          </label>
          <div className="filter-summary">
            <span>Specific date result</span>
            <strong>19 policies found</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Traveller</th>
                <th>Passport</th>
                <th>Partner</th>
                <th>Issue Date</th>
                <th>Travel</th>
                <th>Status</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((policy) => (
                <tr key={policy.id}>
                  <td>
                    <Link
                      href={`/policies/${policy.id}`}
                      className="table-link"
                    >
                      {policy.policyNumber}
                    </Link>
                  </td>
                  <td>{policy.traveller}</td>
                  <td>{policy.passport}</td>
                  <td>{policy.partner}</td>
                  <td>{policy.issueDate}</td>
                  <td>{policy.travelWindow}</td>
                  <td>
                    <span
                      className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
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
