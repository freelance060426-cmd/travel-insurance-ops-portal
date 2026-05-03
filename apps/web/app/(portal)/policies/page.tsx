import Link from "next/link";
import { PolicyExportButton } from "@/components/forms/policy-export-button";
import { fetchPartners, fetchPolicies } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { getServerAuthToken, decodeTokenPayload } from "@/lib/server-auth";

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
    traveller: string;
    passport: string;
    partner: string;
    issueDate: string;
    travelWindow: string;
    status: string;
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
            <h1 className="page-title">Find and manage policy records</h1>
            <p className="section-note">
              Search by policy number, traveller, passport, or partner, then
              open the record for endorsement, PDF, document, and email actions.
            </p>
          </div>

          <Link className="primary-button" href="/policies/new">
            Create Policy
          </Link>
        </div>

        <form className="filter-toolbar" action="/policies">
          <div className="filter-toolbar__fields">
            <label className="filter-field filter-field--wide">
              <span>Policy / Passport / Traveller</span>
              <input
                name="search"
                placeholder="Search policy, passport, traveller, partner"
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
                Apply filters
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
              {!rows.length ? (
                <tr>
                  <td colSpan={8}>
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
