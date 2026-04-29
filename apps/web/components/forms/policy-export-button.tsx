"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { buildPolicyExportUrl } from "@/lib/api";

export function PolicyExportButton({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const { token } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleExport() {
    setPending(true);
    const toastId = toast.loading("Preparing export...");

    try {
      const response = await fetch(buildPolicyExportUrl(params), {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "policy-report.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed.", {
        id: toastId,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="table-action-stack">
      <button
        className="ghost-button"
        type="button"
        onClick={handleExport}
        disabled={pending}
      >
        {pending ? "Exporting..." : "Export CSV"}
      </button>
    </div>
  );
}
