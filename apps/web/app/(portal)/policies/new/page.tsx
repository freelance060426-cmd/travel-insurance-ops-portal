import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { CreatePolicyForm } from "@/components/forms/create-policy-form";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function CreatePolicyPage() {
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
          <p className="portal-eyebrow">POLICY ERROR</p>
          <h1 className="page-title">Policy creation data is unavailable</h1>
          <p className="page-subtitle">{error}</p>
        </section>
      ) : null}
      <CreatePolicyForm initialPartners={partners} />
    </div>
  );
}
