import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { partners as fallbackPartners } from "@/lib/mock-data";
import { PartnerManagement } from "@/components/forms/partner-management";

export default async function PartnersPage() {
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
    partners = await fetchPartners();
  } catch {
    partners = partners;
  }

  return <PartnerManagement initialPartners={partners} />;
}
