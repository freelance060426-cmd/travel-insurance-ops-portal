export default function InvoicesPage() {
  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">INVOICES</p>
        <h1 className="page-title">Central invoice module</h1>
        <p className="page-subtitle">
          Phase 1 will include a separate invoice list with create, search, and download flow. This
          page is intentionally simple for the first frontend milestone.
        </p>

        <div className="partner-stats">
          <div>
            <span>Total invoices</span>
            <strong>178</strong>
          </div>
          <div>
            <span>Ready for download</span>
            <strong>155</strong>
          </div>
          <div>
            <span>Draft invoices</span>
            <strong>23</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
