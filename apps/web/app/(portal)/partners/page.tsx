import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { partners as fallbackPartners } from "@/lib/mock-data";
import { PartnerManagement } from "@/components/forms/partner-management";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function PartnersPage() {
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

  try {
    partners = await fetchPartners(token ?? undefined);
  } catch {
    partners = partners;
  }

  return <PartnerManagement initialPartners={partners} />;
}
