import { fetchPartners, fetchPlans } from "@/lib/api";
import type { ApiPartner, ApiPlan } from "@/lib/api";
import { CreatePolicyForm } from "@/components/forms/create-policy-form";
import { getServerAuthToken, decodeTokenPayload } from "@/lib/server-auth";

export default async function CreatePolicyPage() {
  const token = await getServerAuthToken();
  const payload = decodeTokenPayload(token);
  const userRole = payload?.role ?? "SUPER_ADMIN";
  const userPartnerId = payload?.partnerId ?? null;

  let partners: ApiPartner[] = [];
  let plans: ApiPlan[] = [];
  let error = "";

  try {
    const results = await Promise.allSettled([
      fetchPartners(token ?? undefined),
      fetchPlans(token ?? undefined),
    ]);

    if (results[0].status === "fulfilled") {
      partners = results[0].value;
    }
    if (results[1].status === "fulfilled") {
      plans = results[1].value;
    }
    if (results[1].status === "rejected") {
      throw results[1].reason;
    }
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
      <CreatePolicyForm
        initialPartners={partners}
        initialPlans={plans}
        userRole={userRole}
        userPartnerId={userPartnerId}
      />
    </div>
  );
}
