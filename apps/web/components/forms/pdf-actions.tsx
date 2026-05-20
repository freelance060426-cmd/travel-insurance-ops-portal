"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildApiAssetUrl,
  getInvoicePdf,
  getPolicyPdf,
  regenerateInvoicePdf,
  regeneratePolicyPdf,
} from "@/lib/api";

export function PdfActions({
  entityType,
  entityId,
  initialUrl = null,
}: {
  entityType: "policy" | "invoice";
  entityId: string;
  initialUrl?: string | null;
}) {
  const { token } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialUrl);
  const [pending, setPending] = useState(false);

  async function handleGetPdf(forceRegenerate = false) {
    const shouldOpen = !forceRegenerate;
    const popup = shouldOpen ? window.open("about:blank", "_blank") : null;
    if (popup) {
      popup.opener = null;
    }

    setPending(true);
    const toastId = toast.loading(
      forceRegenerate ? "Regenerating PDF..." : "Fetching PDF...",
    );

    try {
      const result =
        entityType === "policy"
          ? forceRegenerate
            ? await regeneratePolicyPdf(entityId, token ?? undefined)
            : await getPolicyPdf(entityId, token ?? undefined)
          : forceRegenerate
            ? await regenerateInvoicePdf(entityId, token ?? undefined)
            : await getInvoicePdf(entityId, token ?? undefined);

      const nextPdfUrl = buildApiAssetUrl(result.fileUrl);
      setPdfUrl(nextPdfUrl);
      if (shouldOpen && nextPdfUrl) {
        if (popup) {
          popup.location.href = nextPdfUrl;
        } else {
          window.open(nextPdfUrl, "_blank");
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
    <div className="action-tile-grid">
      <div className="action-tile">
        <span>{entityType === "policy" ? "Policy PDF" : "Invoice PDF"}</span>
        <strong>
          {pdfUrl
            ? "Generated and ready to open"
            : "Generate and retrieve from backend"}
        </strong>
      </div>

      <div className="action-button-row">
        <button
          className="ghost-button"
          type="button"
          onClick={() => handleGetPdf(false)}
          disabled={pending}
        >
          {pending ? "Working..." : "Get PDF"}
        </button>
        <button
          className="ghost-button"
          type="button"
          onClick={() => handleGetPdf(true)}
          disabled={pending}
        >
          Regenerate PDF
        </button>
        {pdfUrl ? (
          <a
            className="primary-button"
            href={pdfUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open PDF
          </a>
        ) : null}
      </div>
    </div>
  );
}
