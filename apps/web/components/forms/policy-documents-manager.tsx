"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { buildApiAssetUrl, uploadPolicyDocument } from "@/lib/api";

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
  const [pending, setPending] = useState(false);

  async function handleUpload() {
    if (!selectedFile) {
      toast.error("Choose a file before upload.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Uploading document...");

    try {
      const created = await uploadPolicyDocument(
        policyId,
        selectedFile,
        token ?? undefined,
      );
      setDocuments((current) => [
        {
          label: created.fileName || selectedFile.name,
          status: created.sourceType || "Uploaded",
          url: created.fileUrl,
        },
        ...current,
      ]);
      setSelectedFile(null);
      toast.success("Document uploaded.", { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.", {
        id: toastId,
      });
    } finally {
      setPending(false);
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
        <button
          className="primary-button"
          type="button"
          onClick={handleUpload}
          disabled={pending}
        >
          {pending ? "Uploading..." : "Upload document"}
        </button>
      </div>

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
                href={buildApiAssetUrl(document.url) ?? "#"}
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
