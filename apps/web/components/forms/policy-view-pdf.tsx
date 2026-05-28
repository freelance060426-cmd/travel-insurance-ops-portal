"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { getPolicyPdf, buildApiAssetUrl } from "@/lib/api";

export function PolicyViewPdf({ policyId }: { policyId: string }) {
  const { token } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleClick() {
    const popup = window.open("about:blank", "_blank");
    if (popup) {
      popup.opener = null;
    }

    setPending(true);
    const toastId = toast.loading("Fetching PDF...");

    try {
      const result = await getPolicyPdf(policyId, token ?? undefined);
      const pdfUrl = buildApiAssetUrl(result.fileUrl);

      if (pdfUrl) {
        if (popup) {
          popup.location.href = pdfUrl;
        } else {
          window.open(pdfUrl, "_blank");
        }
      }

      toast.success(`PDF ready: ${result.fileName}`, { id: toastId });
    } catch (error) {
      popup?.close();
      toast.error(
        error instanceof Error ? error.message : "PDF request failed.",
        { id: toastId },
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      className="table-action-link"
      type="button"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? "Loading..." : "View"}
    </button>
  );
}
