import { partners, policyRows } from "@/lib/mock-data";

export default function CreateInvoicePage() {
  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">CREATE INVOICE</p>
        <h1 className="page-title">Create invoice</h1>
        <p className="page-subtitle">
          This screen shows the intended phase 1 invoice creation workflow:
          choose the linked policy, confirm partner, set invoice date, amount,
          and keep the result downloadable.
        </p>
      </section>

      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">INVOICE HEADER</p>
              <h3>Basic invoice details</h3>
            </div>
          </div>

          <div className="form-grid form-grid--invoice">
            <label>
              <span>Invoice Number</span>
              <input defaultValue="INV-10401538" />
            </label>
            <label>
              <span>Linked Policy</span>
              <select defaultValue={policyRows[0]?.policyNumber}>
                {policyRows.map((policy) => (
                  <option key={policy.id} value={policy.policyNumber}>
                    {policy.policyNumber} - {policy.traveller}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Partner</span>
              <select defaultValue={partners[0]?.name}>
                {partners.map((partner) => (
                  <option key={partner.id}>{partner.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Invoice Date</span>
              <input type="date" defaultValue="2026-04-16" />
            </label>
            <label>
              <span>Amount</span>
              <input defaultValue="20766" />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Ready">
                <option>Ready</option>
                <option>Draft</option>
                <option>Sent</option>
              </select>
            </label>
          </div>

          <label className="invoice-notes">
            <span>Internal notes</span>
            <textarea
              rows={4}
              defaultValue="Invoice linked to policy IC259490. Ready for PDF generation and manual customer send."
            />
          </label>
        </section>

        <aside className="content-card summary-card">
          <p className="portal-eyebrow">INVOICE PREVIEW</p>
          <h3>Expected output</h3>
          <div className="summary-pairs">
            <div>
              <span>Linked policy</span>
              <strong>IC259490</strong>
            </div>
            <div>
              <span>Partner</span>
              <strong>Tourist Muse</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>₹ 20,766</strong>
            </div>
            <div>
              <span>PDF action</span>
              <strong>Generate and download</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="action-row">
        <button className="ghost-button" type="button">
          Save as draft
        </button>
        <button className="primary-button" type="button">
          Create invoice
        </button>
      </div>
    </div>
  );
}
