import { fetchPartners } from "@/lib/api";
import type { ApiPartner } from "@/lib/api";
import { CreatePolicyForm } from "@/components/forms/create-policy-form";

export default async function CreatePolicyPage() {
  let partners: ApiPartner[] = [];

  try {
    partners = await fetchPartners();
  } catch {
    partners = [];
  }

  return <CreatePolicyForm initialPartners={partners} />;
}
