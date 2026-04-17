import Link from "next/link";
import { fetchInvoices } from "@/lib/api";
import { invoiceRows } from "@/lib/mock-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function InvoicesPage() {
  let rows = invoiceRows;

  try {
    const invoices = await fetchInvoices();
    rows = invoices.map((invoice) => ({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      policyNumber: invoice.policy?.policyNumber || "—",
      partner: invoice.partner.name,
      invoiceDate: formatDate(invoice.invoiceDate),
      amount: `₹ ${Number(invoice.amount).toLocaleString("en-IN")}`,
      status:
        invoice.status.charAt(0) + invoice.status.slice(1).toLowerCase(),
      note: invoice.note || "",
    }));
  } catch {
    rows = invoiceRows;
  }

  const totalInvoices = rows.length;
  const readyInvoices = rows.filter(
    (invoice) => invoice.status === "Ready",
  ).length;
  const draftInvoices = rows.filter(
    (invoice) => invoice.status === "Draft",
  ).length;

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">INVOICES</p>
            <h1 className="page-title">Central invoice module</h1>
            <p className="page-subtitle">
              Phase 1 invoice flow stays simple: create, list, search, open, and
              download linked invoice records without turning the product into a
              full finance system.
            </p>
          </div>

          <Link className="primary-button" href="/invoices/new">
            Create Invoice
          </Link>
        </div>

        <div className="metric-grid metric-grid--compact">
          <article className="metric-card tone-teal">
            <p>Total invoices</p>
            <strong>{totalInvoices}</strong>
            <span>Across all linked policies</span>
          </article>
          <article className="metric-card tone-blue">
            <p>Ready for download</p>
            <strong>{readyInvoices}</strong>
            <span>PDF available</span>
          </article>
          <article className="metric-card tone-amber">
            <p>Draft invoices</p>
            <strong>{draftInvoices}</strong>
            <span>Still waiting for final approval</span>
          </article>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">INVOICE SEARCH</p>
            <h3>List and review invoices</h3>
          </div>
        </div>

        <div className="filter-grid">
          <label>
            <span>Invoice Number</span>
            <input placeholder="Search by invoice number" />
          </label>
          <label>
            <span>Policy Number</span>
            <input placeholder="Search by linked policy" />
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
          <label>
            <span>Status</span>
            <select defaultValue="Any status">
              <option>Any status</option>
              <option>Ready</option>
              <option>Draft</option>
              <option>Sent</option>
            </select>
          </label>
        </div>
      </section>

      <section className="content-card">
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Policy No.</th>
                <th>Partner</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="table-link"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td>{invoice.policyNumber}</td>
                  <td>{invoice.partner}</td>
                  <td>{invoice.invoiceDate}</td>
                  <td>{invoice.amount}</td>
                  <td>
                    <span
                      className={`status-pill status-${invoice.status.toLowerCase()}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="table-link"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
