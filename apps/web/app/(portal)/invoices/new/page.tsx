import { fetchPartners, fetchPolicies } from "@/lib/api";
import type { ApiPartner, ApiPolicy } from "@/lib/api";
import { CreateInvoiceForm } from "@/components/forms/create-invoice-form";
import { partners as fallbackPartners, policyRows } from "@/lib/mock-data";

export default async function CreateInvoicePage() {
  let partners: ApiPartner[] = fallbackPartners.map((partner) => ({
    id: partner.id,
    partnerCode: partner.code,
    name: partner.name,
    contactName: null,
    email: null,
    phone: null,
    status: "ACTIVE",
  }));

  let policies: ApiPolicy[] = [];

  try {
    partners = await fetchPartners();
  } catch {
    partners = partners;
  }

  try {
    policies = await fetchPolicies();
  } catch {
    policies = [];
  }

  return <CreateInvoiceForm initialPartners={partners} initialPolicies={policies} />;
}
