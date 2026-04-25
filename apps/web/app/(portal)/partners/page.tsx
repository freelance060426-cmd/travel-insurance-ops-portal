import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { PartnerManagement } from "@/components/forms/partner-management";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function PartnersPage() {
  const token = await getServerAuthToken();
  let partners: ApiPartner[] = [];
  let error = "";

  try {
    partners = await fetchPartners(token ?? undefined);
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Partner records could not be loaded.";
  }

  return (
    <div className="page-stack">
      {error ? (
        <section className="content-card">
          <p className="portal-eyebrow">PARTNER ERROR</p>
          <h1 className="page-title">Partner data is unavailable</h1>
          <p className="page-subtitle">{error}</p>
        </section>
      ) : null}
      <PartnerManagement initialPartners={partners} />
    </div>
  );
}
