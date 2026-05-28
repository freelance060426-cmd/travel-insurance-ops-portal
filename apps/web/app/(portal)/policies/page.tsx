import Link from "next/link";
import { PolicyExportButton } from "@/components/forms/policy-export-button";
import { PolicyViewPdf } from "@/components/forms/policy-view-pdf";
import { fetchPartners, fetchPolicies } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { getServerAuthToken, decodeTokenPayload } from "@/lib/server-auth";
import { formatDDMMYYYY, calcTripDays } from "@/lib/format";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function PoliciesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const token = await getServerAuthToken();
  const decoded = decodeTokenPayload(token);
  const userRole = decoded?.role ?? "SUPER_ADMIN";
  const isAdmin = userRole === "SUPER_ADMIN";
  const params = await searchParams;
  const selected = {
    search: typeof params.search === "string" ? params.search : "",
    partnerId: typeof params.partnerId === "string" ? params.partnerId : "",
    issueFrom: typeof params.issueFrom === "string" ? params.issueFrom : "",
    status: typeof params.status === "string" ? params.status : "",
  };
  let rows: Array<{
    id: string;
    policyNumber: string;
    issueDate: string;
    partner: string;
    startDate: string;
    endDate: string;
    tripDays: number;
    insurerName: string;
    status: string;
    traveller: string;
    premium: string;
  }> = [];
  let partners: ApiPartner[] = [];
  let error = "";

  try {
    const results = await Promise.allSettled([
      fetchPolicies(token ?? undefined, selected),
      isAdmin ? fetchPartners(token ?? undefined) : Promise.resolve([]),
    ]);

    const policiesResult = results[0];
    const partnersResult = results[1];

    if (policiesResult.status === "fulfilled") {
      rows = policiesResult.value.map((policy) => ({
        id: policy.id,
        policyNumber: policy.policyNumber,
        issueDate: formatDate(policy.issueDate),
        partner: policy.partner.name,
        startDate: formatDDMMYYYY(policy.startDate),
        endDate: formatDDMMYYYY(policy.endDate),
        tripDays: calcTripDays(policy.startDate, policy.endDate),
        insurerName: policy.insurerName ?? "—",
        status: policy.status,
        traveller: policy.primaryTravellerName,
        premium:
          policy.premiumAmount !== null && policy.premiumAmount !== undefined
            ? `₹ ${Number(policy.premiumAmount).toLocaleString("en-IN")}`
            : "₹ 0",
      }));
    } else {
      error =
        policiesResult.reason?.message ?? "Policy search could not be loaded.";
    }

    if (partnersResult.status === "fulfilled") {
      partners = partnersResult.value;
    }
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Policy search could not be loaded.";
  }

  return (
    <div className="page-stack">
      <section className="content-card policy-search-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">POLICY SEARCH</p>
            <h3>Find policy records</h3>
          </div>

          <Link className="primary-button" href="/policies/new">
            Create Policy
          </Link>
        </div>

        <form className="filter-toolbar" action="/policies">
          <div className="filter-toolbar__fields">
            <label className="filter-field filter-field--wide">
              <span>Policy No.</span>
              <input
                name="search"
                placeholder="Enter policy number"
                defaultValue={selected.search}
              />
            </label>
            {isAdmin && (
              <label className="filter-field">
                <span>Partner</span>
                <select name="partnerId" defaultValue={selected.partnerId}>
                  <option value="">All partners</option>
                  {partners.map((partner) => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="filter-field">
              <span>Issue Date</span>
              <input
                type="date"
                name="issueFrom"
                defaultValue={selected.issueFrom}
              />
            </label>
            <label className="filter-field">
              <span>Status</span>
              <select name="status" defaultValue={selected.status}>
                <option value="">Any status</option>
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ENDORSED">Endorsed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </label>
          </div>
          <div className="filter-toolbar__actions">
            <div className="filter-summary filter-summary--compact">
              <span>Filtered result</span>
              <strong>{rows.length} policies</strong>
            </div>
            <div className="action-button-row">
              <button className="primary-button" type="submit">
                Search
              </button>
              <Link className="ghost-button" href="/policies">
                Clear
              </Link>
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
            <p className="portal-eyebrow">SEARCH RESULTS</p>
            <h3>Policy records</h3>
          </div>
          <span className="table-count-pill">{rows.length} rows</span>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Policy No.</th>
                <th>Issue Date</th>
                <th>Partner</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Insurer</th>
                <th>Status</th>
                <th>Traveller</th>
                <th>Premium</th>
                <th>Actions</th>
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
                  <td>{policy.issueDate}</td>
                  <td>{policy.partner}</td>
                  <td>{policy.startDate}</td>
                  <td>{policy.endDate}</td>
                  <td>{policy.tripDays}</td>
                  <td>{policy.insurerName}</td>
                  <td>
                    <span
                      className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {policy.status}
                    </span>
                  </td>
                  <td>{policy.traveller}</td>
                  <td>{policy.premium}</td>
                  <td>
                    <div className="table-action-row">
                      <PolicyViewPdf policyId={policy.id} />
                      <Link
                        className="table-action-link"
                        href={`/policies/${policy.id}/endorse`}
                      >
                        Endorse
                      </Link>
                      <Link
                        className="table-action-link"
                        href={`/policies/${policy.id}#policy-email`}
                      >
                        Email
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length ? (
                <tr>
                  <td colSpan={11}>
                    <div className="data-empty-state">
                      <span>No matching policies</span>
                      <strong>No policies match the current filters.</strong>
                      <p>
                        Try clearing filters or searching by a different policy,
                        passport, traveller, or partner value.
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
