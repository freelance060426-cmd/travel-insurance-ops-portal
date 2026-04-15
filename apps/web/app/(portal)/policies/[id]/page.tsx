import Link from "next/link";
import { notFound } from "next/navigation";
import { getPolicyById } from "@/lib/mock-data";

export default async function PolicyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const policy = getPolicyById(id);

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
          <span className={`status-pill status-${policy.status.toLowerCase().replace(/\s+/g, "-")}`}>
            {policy.status}
          </span>
          <Link className="primary-button" href={`/policies/${policy.id}/endorse`}>
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
              <span>Travel window</span>
              <strong>{policy.travelWindow}</strong>
            </div>
            <div>
              <span>Total premium</span>
              <strong>{policy.premium}</strong>
            </div>
          </div>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">PDF & EMAIL</p>
              <h3>Manual customer actions</h3>
            </div>
          </div>

          <div className="action-tile-grid">
            <div className="action-tile">
              <span>Policy PDF</span>
              <strong>View / regenerate / download</strong>
            </div>
            <div className="action-tile">
              <span>Email</span>
              <strong>Send from portal with manual recipient entry</strong>
            </div>
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
                <th>DOB / Age</th>
                <th>Plan</th>
                <th>Premium</th>
              </tr>
            </thead>
            <tbody>
              {policy.travellers.map((traveller) => (
                <tr key={`${traveller.passport}-${traveller.name}`}>
                  <td>{traveller.name}</td>
                  <td>{traveller.passport}</td>
                  <td>{traveller.ageOrDob}</td>
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

        <div className="document-list">
          {policy.documents.map((document) => (
            <div key={document.label} className="document-row">
              <div>
                <strong>{document.label}</strong>
                <p>{document.status}</p>
              </div>
              <button className="ghost-button" type="button">
                Open
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
