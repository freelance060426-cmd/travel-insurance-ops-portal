import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { CreatePolicyForm } from "@/components/forms/create-policy-form";
import { getServerAuthToken } from "@/lib/server-auth";

export default async function CreatePolicyPage() {
  const token = await getServerAuthToken();
  let partners: ApiPartner[] = [];

  try {
    partners = await fetchPartners(token ?? undefined);
  } catch {
    partners = [];
  }

  return <CreatePolicyForm initialPartners={partners} />;
}
