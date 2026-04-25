import { InvoiceManagementWorkspace } from "@/components/forms/invoice-management-workspace";
import {
  fetchEligibleInvoicePolicies,
  fetchInvoices,
  type ApiEligibleInvoicePolicy,
  type ApiInvoice,
} from "@/lib/api";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function InvoicesPage() {
  const token = await getServerAuthToken();
  let invoices: ApiInvoice[] = [];
  let eligiblePolicies: ApiEligibleInvoicePolicy[] = [];
  let error = "";

  try {
    invoices = await fetchInvoices(token ?? undefined);
    eligiblePolicies = await fetchEligibleInvoicePolicies(token ?? undefined);
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Invoice workspace could not be loaded.";
  }

  return (
    <div className="page-stack">
      {error ? (
        <section className="content-card">
          <p className="portal-eyebrow">INVOICE ERROR</p>
          <h1 className="page-title">Invoice data is unavailable</h1>
          <p className="page-subtitle">{error}</p>
        </section>
      ) : null}
      <InvoiceManagementWorkspace
        initialInvoices={invoices}
        initialEligiblePolicies={eligiblePolicies}
      />
    </div>
  );
}
