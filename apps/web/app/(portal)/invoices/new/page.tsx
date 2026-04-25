import { fetchEligibleInvoicePolicies, fetchPartners } from "@/lib/api";
import type { ApiEligibleInvoicePolicy, ApiPartner } from "@/lib/api";
import { CreateInvoiceForm } from "@/components/forms/create-invoice-form";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function CreateInvoicePage() {
  const token = await getServerAuthToken();
  let partners: ApiPartner[] = [];
  let policies: ApiEligibleInvoicePolicy[] = [];
  let error = "";

  try {
    [partners, policies] = await Promise.all([
      fetchPartners(token ?? undefined),
      fetchEligibleInvoicePolicies(token ?? undefined),
    ]);
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Invoice generation data could not be loaded.";
  }

  return (
    <div className="page-stack">
      {error ? (
        <section className="content-card">
          <p className="portal-eyebrow">INVOICE ERROR</p>
          <h1 className="page-title">Invoice generation is unavailable</h1>
          <p className="page-subtitle">{error}</p>
        </section>
      ) : null}
      <CreateInvoiceForm initialPartners={partners} initialPolicies={policies} />
    </div>
  );
}
