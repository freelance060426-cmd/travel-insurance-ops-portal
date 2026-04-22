import { fetchEligibleInvoicePolicies, fetchPartners } from "@/lib/api";
import type { ApiEligibleInvoicePolicy, ApiPartner } from "@/lib/api";
import { CreateInvoiceForm } from "@/components/forms/create-invoice-form";
import { invoiceRows, partners as fallbackPartners, policyRows } from "@/lib/mock-data";
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

  let policies: ApiEligibleInvoicePolicy[] = policyRows
    .filter(
      (policy) =>
        !invoiceRows.some((invoice) => invoice.policyNumber === policy.policyNumber),
    )
    .map((policy) => ({
      id: policy.id,
      policyNumber: policy.policyNumber,
      primaryTravellerName: policy.traveller,
      issueDate: policy.issueDate,
      startDate: policy.startDate,
      endDate: policy.endDate,
      premiumAmount: Number(policy.premium.replace(/[^\d]/g, "")),
      customerEmail: null,
      partner: {
        id: policy.partner,
        partnerCode: policy.partner,
        name: policy.partner,
        contactName: null,
        email: null,
        phone: null,
        status: "ACTIVE",
      },
      travellers: [],
    }));

  try {
    partners = await fetchPartners(token ?? undefined);
  } catch {
    partners = partners;
  }

  try {
    policies = await fetchEligibleInvoicePolicies(token ?? undefined);
  } catch {
    policies = policies;
  }

  return <CreateInvoiceForm initialPartners={partners} initialPolicies={policies} />;
}
