import { notFound } from "next/navigation";
import { fetchPolicyById } from "@/lib/api";
import { EndorsePolicyForm } from "@/components/forms/endorse-policy-form";
import { getServerAuthToken } from "@/lib/server-auth";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

export default async function EndorsePolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getServerAuthToken();
  let policy = null;

  try {
    const apiPolicy = await fetchPolicyById(id, token ?? undefined);
    policy = {
      id: apiPolicy.id,
      policyNumber: apiPolicy.policyNumber,
      partner: apiPolicy.partner.name,
      issueDate: formatDate(apiPolicy.issueDate),
      startDate: formatDate(apiPolicy.startDate),
      endDate: formatDate(apiPolicy.endDate),
      travelRegion: apiPolicy.travelRegion ?? "",
      destination: apiPolicy.destination ?? "",
      status: apiPolicy.status,
      travellers: apiPolicy.travellers.map((traveller) => ({
        name: traveller.travellerName,
        passport: traveller.passportNumber,
        gender: traveller.gender ?? "",
        dateOfBirth: traveller.dateOfBirth
          ? new Date(traveller.dateOfBirth).toISOString().slice(0, 10)
          : "",
        nominee: traveller.nominee ?? "",
        nomineeRelationship: traveller.nomineeRelationship ?? "",
        address: traveller.address ?? "",
        pincode: traveller.pincode ?? "",
        city: traveller.city ?? "",
        district: traveller.district ?? "",
        state: traveller.state ?? "",
        country: traveller.country ?? "",
        email: traveller.email ?? "",
        mobile: traveller.mobile ?? "",
        plan: traveller.planName || "",
        premium:
          traveller.premiumAmount !== null &&
          traveller.premiumAmount !== undefined
            ? String(Number(traveller.premiumAmount))
            : "0",
        remarks: traveller.remarks ?? "",
        pastIllness: traveller.pastIllness ?? "",
        crReferenceNumber: traveller.crReferenceNumber ?? "",
        emergencyContactPerson: traveller.emergencyContactPerson ?? "",
        emergencyContactNumber: traveller.emergencyContactNumber ?? "",
        emergencyEmail: traveller.emergencyEmail ?? "",
        gstNumber: traveller.gstNumber ?? "",
        gstState: traveller.gstState ?? "",
      })),
    };
  } catch {
    policy = null;
  }

  if (!policy) {
    notFound();
  }

  return <EndorsePolicyForm policy={policy} />;
}
