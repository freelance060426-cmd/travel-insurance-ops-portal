import { fetchPartners, fetchPlans } from "@/lib/api";
import type { ApiPartner, ApiPlan } from "@/lib/api";
import { CreatePolicyForm } from "@/components/forms/create-policy-form";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function CreatePolicyPage() {
  const token = await getServerAuthToken();
  let partners: ApiPartner[] = [];
  let plans: ApiPlan[] = [];
  let error = "";

  try {
    [partners, plans] = await Promise.all([
      fetchPartners(token ?? undefined),
      fetchPlans(token ?? undefined),
    ]);
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Policy creation data could not be loaded.";
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
      <CreatePolicyForm initialPartners={partners} initialPlans={plans} />
    </div>
  );
}
