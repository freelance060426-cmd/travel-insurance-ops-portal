import { notFound } from "next/navigation";
import { fetchPolicyById } from "@/lib/api";
import { EndorsePolicyForm } from "@/components/forms/endorse-policy-form";
import { getPolicyById } from "@/lib/mock-data";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function EndorsePolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let policy = null;

  try {
    const apiPolicy = await fetchPolicyById(id);
    policy = {
      id: apiPolicy.id,
      policyNumber: apiPolicy.policyNumber,
      partner: apiPolicy.partner.name,
      issueDate: formatDate(apiPolicy.issueDate),
      startDate: formatDate(apiPolicy.startDate),
      endDate: formatDate(apiPolicy.endDate),
      status: apiPolicy.status,
      travellers: apiPolicy.travellers.map((traveller) => ({
        name: traveller.travellerName,
        passport: traveller.passportNumber,
        ageOrDob: traveller.ageOrDob ?? "N/A",
        plan: traveller.planName || "Prime",
        premium:
          traveller.premiumAmount !== null &&
          traveller.premiumAmount !== undefined
            ? `₹ ${Number(traveller.premiumAmount).toLocaleString("en-IN")}`
            : apiPolicy.premiumAmount !== null &&
                apiPolicy.premiumAmount !== undefined
              ? `₹ ${Number(apiPolicy.premiumAmount).toLocaleString("en-IN")}`
              : "₹ 0",
      })),
    };
  } catch {
    policy = getPolicyById(id);
  }

  if (!policy) {
    notFound();
  }

  return <EndorsePolicyForm policy={policy} />;
}
