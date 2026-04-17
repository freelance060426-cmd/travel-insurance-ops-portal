import { notFound } from "next/navigation";
import { fetchInvoiceById } from "@/lib/api";
import { getInvoiceById } from "@/lib/mock-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let invoice = null;

  try {
    const apiInvoice = await fetchInvoiceById(id);
    invoice = {
      id: apiInvoice.id,
      invoiceNumber: apiInvoice.invoiceNumber,
      policyNumber: apiInvoice.policy?.policyNumber || "—",
      partner: apiInvoice.partner.name,
      invoiceDate: formatDate(apiInvoice.invoiceDate),
      amount: `₹ ${Number(apiInvoice.amount).toLocaleString("en-IN")}`,
      status:
        apiInvoice.status.charAt(0) +
        apiInvoice.status.slice(1).toLowerCase(),
      note: apiInvoice.note || "No internal note recorded.",
    };
  } catch {
    invoice = getInvoiceById(id);
  }

  if (!invoice) {
    notFound();
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="portal-eyebrow">INVOICE DETAIL</p>
          <h1>{invoice.invoiceNumber}</h1>
          <p className="hero-panel__text">
            {invoice.partner} · Linked policy {invoice.policyNumber} ·{" "}
            {invoice.invoiceDate}
          </p>
        </div>

        <div className="hero-panel__meta">
          <span
            className={`status-pill status-${invoice.status.toLowerCase()}`}
          >
            {invoice.status}
          </span>
          <button className="primary-button" type="button">
            Download PDF
          </button>
        </div>
      </section>

      <div className="two-column-grid">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">SUMMARY</p>
              <h3>Invoice information</h3>
            </div>
          </div>

          <div className="summary-pairs">
            <div>
              <span>Policy Number</span>
              <strong>{invoice.policyNumber}</strong>
            </div>
            <div>
              <span>Partner</span>
              <strong>{invoice.partner}</strong>
            </div>
            <div>
              <span>Invoice Date</span>
              <strong>{invoice.invoiceDate}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>{invoice.amount}</strong>
            </div>
          </div>
        </section>

        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">ACTIONS</p>
              <h3>Document handling</h3>
            </div>
          </div>

          <div className="action-tile-grid">
            <div className="action-tile">
              <span>PDF</span>
              <strong>Preview and download invoice PDF</strong>
            </div>
            <div className="action-tile">
              <span>Linked policy</span>
              <strong>Trace invoice back to its policy record</strong>
            </div>
          </div>
        </section>
      </div>

      <section className="content-card">
        <p className="portal-eyebrow">NOTES</p>
        <h3>Internal note</h3>
        <p className="page-subtitle">{invoice.note}</p>
      </section>
    </div>
  );
}
