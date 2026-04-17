import { fetchPartners, fetchPolicies } from "@/lib/api";
import type { ApiPartner, ApiPolicy } from "@/lib/api";
import { CreateInvoiceForm } from "@/components/forms/create-invoice-form";
import { partners as fallbackPartners, policyRows } from "@/lib/mock-data";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function CreateInvoicePage() {
  const token = await getServerAuthToken();
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
    partners = await fetchPartners(token ?? undefined);
  } catch {
    partners = partners;
  }

  try {
    policies = await fetchPolicies(token ?? undefined);
  } catch {
    policies = [];
  }

  return <CreateInvoiceForm initialPartners={partners} initialPolicies={policies} />;
}
