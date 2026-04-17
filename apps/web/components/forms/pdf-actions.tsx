"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
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
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleGetPdf(forceRegenerate = false) {
    setState({
      status: "loading",
      message: forceRegenerate ? "Regenerating PDF..." : "Fetching PDF...",
    });

    try {
      const result =
        entityType === "policy"
          ? forceRegenerate
            ? await regeneratePolicyPdf(entityId, token ?? undefined)
            : await getPolicyPdf(entityId, token ?? undefined)
          : forceRegenerate
            ? await regenerateInvoicePdf(entityId, token ?? undefined)
            : await getInvoicePdf(entityId, token ?? undefined);

      setPdfUrl(`http://localhost:4000${result.fileUrl}`);
      setState({
        status: "success",
        message: `PDF ready: ${result.fileName}`,
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "PDF request failed.",
      });
    }
  }

  return (
    <div className="action-tile-grid">
      <div className="action-tile">
        <span>{entityType === "policy" ? "Policy PDF" : "Invoice PDF"}</span>
        <strong>
          {pdfUrl ? "Generated and ready to open" : "Generate and retrieve from backend"}
        </strong>
      </div>

      <div className="action-button-row">
        <button className="ghost-button" type="button" onClick={() => handleGetPdf(false)}>
          {state.status === "loading" ? "Working..." : "Get PDF"}
        </button>
        <button className="ghost-button" type="button" onClick={() => handleGetPdf(true)}>
          Regenerate PDF
        </button>
        {pdfUrl ? (
          <a className="primary-button" href={pdfUrl} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        ) : null}
      </div>

      {state.status !== "idle" ? (
        <div
          className={`submit-banner submit-${
            state.status === "error"
              ? "error"
              : state.status === "success"
                ? "success"
                : "saving"
          }`}
        >
          {state.message}
        </div>
      ) : null}
    </div>
  );
}
