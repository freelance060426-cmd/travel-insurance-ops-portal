import { InvoiceManagementWorkspace } from "@/components/forms/invoice-management-workspace";
import {
  fetchEligibleInvoicePolicies,
  fetchInvoices,
  type ApiEligibleInvoicePolicy,
  type ApiInvoice,
} from "@/lib/api";
import { invoiceRows, policyRows } from "@/lib/mock-data";
import { getServerAuthToken } from "@/lib/server-auth";

function buildFallbackInvoices(): ApiInvoice[] {
  return invoiceRows.map((invoice) => ({
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    partnerId: invoice.partner,
    invoiceDate: invoice.invoiceDate,
    amount: Number(invoice.amount.replace(/[^\d]/g, "")),
    status: invoice.status.toUpperCase(),
    note: invoice.note,
    pdfUrl: null,
    partner: {
      id: invoice.partner,
      partnerCode: invoice.partner,
      name: invoice.partner,
      status: "ACTIVE",
    },
    policy: {
      id: invoice.policyNumber,
      policyNumber: invoice.policyNumber,
      primaryTravellerName: "Traveller",
      customerEmail: null,
    },
    emailLogs: [],
  }));
}

function buildFallbackEligiblePolicies(): ApiEligibleInvoicePolicy[] {
  return policyRows
    .filter((policy) => !invoiceRows.some((invoice) => invoice.policyNumber === policy.policyNumber))
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
        status: "ACTIVE",
      },
      travellers: [],
    }));
}

export default async function InvoicesPage() {
  const token = await getServerAuthToken();
  let invoices: ApiInvoice[] = buildFallbackInvoices();
  let eligiblePolicies: ApiEligibleInvoicePolicy[] = buildFallbackEligiblePolicies();

  try {
    invoices = await fetchInvoices(token ?? undefined);
  } catch {
    invoices = buildFallbackInvoices();
  }

  try {
    eligiblePolicies = await fetchEligibleInvoicePolicies(token ?? undefined);
  } catch {
    eligiblePolicies = buildFallbackEligiblePolicies();
  }

  return (
    <InvoiceManagementWorkspace
      initialInvoices={invoices}
      initialEligiblePolicies={eligiblePolicies}
    />
  );
}
