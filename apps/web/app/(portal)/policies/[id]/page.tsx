import Link from "next/link";
import { notFound } from "next/navigation";
import { PolicyDocumentsManager } from "@/components/forms/policy-documents-manager";
import { PolicyEmailActions } from "@/components/forms/policy-email-actions";
import { PdfActions } from "@/components/forms/pdf-actions";
import { fetchPolicyById } from "@/lib/api";
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
      travelWindow: formatTravelWindow(apiPolicy.startDate, apiPolicy.endDate),
      startDate: formatDate(apiPolicy.startDate),
      endDate: formatDate(apiPolicy.endDate),
      status: apiPolicy.status,
      premium:
        apiPolicy.premiumAmount !== null &&
        apiPolicy.premiumAmount !== undefined
          ? `₹ ${Number(apiPolicy.premiumAmount).toLocaleString("en-IN")}`
          : "₹ 0",
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
        ageOrDob: traveller.ageOrDob ?? "N/A",
        plan: traveller.planName || "Prime",
        premium:
          traveller.premiumAmount !== null &&
          traveller.premiumAmount !== undefined
            ? `₹ ${Number(traveller.premiumAmount).toLocaleString("en-IN")}`
            : apiPolicy.premiumAmount !== null &&
                apiPolicy.premiumAmount !== undefined
              ? `₹ ${Number(apiPolicy.premiumAmount).toLocaleString("en-IN")}`
              : "₹ 0",
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

        <PolicyDocumentsManager
          policyId={policy.id}
          initialDocuments={policy.documents}
        />
      </section>
    </div>
  );
}
