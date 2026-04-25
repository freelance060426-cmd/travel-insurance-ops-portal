"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { buildPolicyExportUrl } from "@/lib/api";

export function PolicyExportButton({
  params,
}: {
  params: Record<string, string | undefined>;
}) {
  const { token } = useAuth();
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleExport() {
    setState("loading");

    try {
      const response = await fetch(buildPolicyExportUrl(params), {
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.status}`);
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
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="table-action-stack">
      <button
        className="ghost-button"
        type="button"
        onClick={handleExport}
        disabled={state === "loading"}
      >
        {state === "loading" ? "Exporting..." : "Export CSV"}
      </button>
      {state === "error" ? (
        <small className="table-inline-note table-inline-note--error">
          Export failed. Try again.
        </small>
      ) : null}
    </div>
  );
}
