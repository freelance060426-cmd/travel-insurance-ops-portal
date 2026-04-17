"use client";

import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { uploadPolicyDocument } from "@/lib/api";

type PolicyDocumentView = {
  label: string;
  status: string;
  url?: string;
};

export function PolicyDocumentsManager({
  policyId,
  initialDocuments,
}: {
  policyId: string;
  initialDocuments: ReadonlyArray<PolicyDocumentView>;
}) {
  const { token } = useAuth();
  const [documents, setDocuments] = useState(initialDocuments);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "uploading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleUpload() {
    if (!selectedFile) {
      setSubmitState({
        status: "error",
        message: "Choose a file before upload.",
      });
      return;
    }

    setSubmitState({
      status: "uploading",
      message: "Uploading document...",
    });

    try {
      const created = await uploadPolicyDocument(policyId, selectedFile, token ?? undefined);
      setDocuments((current) => [
        {
          label: created.fileName || selectedFile.name,
          status: created.sourceType || "Uploaded",
          url: created.fileUrl,
        },
        ...current,
      ]);
      setSelectedFile(null);
      setSubmitState({
        status: "success",
        message: "Document uploaded successfully.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Upload failed.",
      });
    }
  }

  return (
    <div className="page-stack">
      <div className="upload-row">
        <input
          className="file-input"
          type="file"
          onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
        />
        <button className="primary-button" type="button" onClick={handleUpload}>
          {submitState.status === "uploading" ? "Uploading..." : "Upload document"}
        </button>
      </div>

      {submitState.status !== "idle" ? (
        <div
          className={`submit-banner submit-${
            submitState.status === "error"
              ? "error"
              : submitState.status === "success"
                ? "success"
                : "saving"
          }`}
        >
          {submitState.message}
        </div>
      ) : null}

      <div className="document-list">
        {documents.map((document) => (
          <div
            key={`${document.label}-${document.url ?? document.status}`}
            className="document-row"
          >
            <div>
              <strong>{document.label}</strong>
              <p>{document.status}</p>
            </div>
            {document.url ? (
              <a
                className="ghost-button"
                href={`http://localhost:4000${document.url}`}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            ) : (
              <button className="ghost-button" type="button">
                Open
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
