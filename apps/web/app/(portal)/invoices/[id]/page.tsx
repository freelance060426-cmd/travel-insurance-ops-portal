import { notFound } from "next/navigation";
import { InvoiceEmailActions } from "@/components/forms/invoice-email-actions";
import { PdfActions } from "@/components/forms/pdf-actions";
import { buildApiAssetUrl, fetchInvoiceById } from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerAuthToken();
  let invoice = null;

  try {
    const apiInvoice = await fetchInvoiceById(id, token ?? undefined);
    const policyNumbers =
      apiInvoice.policies
        ?.map((lnk) => lnk.policy?.policyNumber)
        .filter(Boolean)
        .join(", ") || "—";
    const firstEmail = apiInvoice.policies?.[0]?.policy?.customerEmail || "";

    invoice = {
      id: apiInvoice.id,
      invoiceNumber: apiInvoice.invoiceNumber,
      policyNumbers,
      partner: apiInvoice.partner.name,
      invoiceDate: formatDate(apiInvoice.invoiceDate),
      amount: `₹ ${Number(apiInvoice.amount).toLocaleString("en-IN")}`,
      status:
        apiInvoice.status.charAt(0) + apiInvoice.status.slice(1).toLowerCase(),
      pdfUrl: apiInvoice.pdfUrl ? buildApiAssetUrl(apiInvoice.pdfUrl) : null,
      customerEmail: firstEmail,
      emailLogs: apiInvoice.emailLogs || [],
    };
  } catch {
    invoice = null;
  }

  if (!invoice) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel--brand">
        <div>
          <p className="portal-eyebrow">INVOICE</p>
          <h1>{invoice.invoiceNumber}</h1>
          <p className="hero-panel__text">
            {invoice.partner} · {invoice.policyNumbers} · {invoice.invoiceDate}{" "}
            · {invoice.amount}
          </p>
        </div>

        <div className="hero-panel__meta">
          <span
            className={`status-pill status-${invoice.status.toLowerCase()}`}
          >
            {invoice.status}
          </span>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">INVOICE PDF</p>
            <h3>View, generate, or regenerate the invoice document</h3>
          </div>
        </div>

        <PdfActions
          entityType="invoice"
          entityId={invoice.id}
          initialUrl={invoice.pdfUrl}
        />

        {invoice.pdfUrl ? (
          <div
            style={{
              marginTop: 16,
              border: "1px solid var(--line)",
              borderRadius: 8,
              overflow: "hidden",
            }}
          >
            <iframe
              src={invoice.pdfUrl}
              title={`Invoice ${invoice.invoiceNumber}`}
              style={{ width: "100%", height: 600, border: "none" }}
            />
          </div>
        ) : null}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">EMAIL</p>
            <h3>Send invoice to client</h3>
          </div>
        </div>

        <InvoiceEmailActions
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoiceNumber}
          initialRecipient={invoice.customerEmail}
          initialLogs={invoice.emailLogs}
        />
      </section>
    </div>
  );
}
