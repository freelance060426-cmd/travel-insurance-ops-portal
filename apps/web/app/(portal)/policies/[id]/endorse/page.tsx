import { notFound } from "next/navigation";
import { EndorsePolicyForm } from "@/components/forms/endorse-policy-form";
import { getPolicyById } from "@/lib/mock-data";

export default async function EndorsePolicyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const policy = getPolicyById(id);

  if (!policy) {
    notFound();
  }

  return <EndorsePolicyForm policy={policy} />;
}
