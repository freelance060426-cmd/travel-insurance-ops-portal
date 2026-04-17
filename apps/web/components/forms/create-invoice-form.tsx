"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiPartner, ApiPolicy } from "@/lib/api";
import { createInvoice } from "@/lib/api";

export function CreateInvoiceForm({
  initialPartners,
  initialPolicies,
}: {
  initialPartners: ApiPartner[];
  initialPolicies: ApiPolicy[];
}) {
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${String(Date.now()).slice(-8)}`,
  );
  const [policyId, setPolicyId] = useState(initialPolicies[0]?.id ?? "");
  const [partnerId, setPartnerId] = useState(
    initialPolicies[0]?.partner.id ?? initialPartners[0]?.id ?? "",
  );
  const [invoiceDate, setInvoiceDate] = useState("2026-04-17");
  const [amount, setAmount] = useState("20766");
  const [status, setStatus] = useState("READY");
  const [note, setNote] = useState(
    "Invoice linked to policy record and ready for PDF/download flow.",
  );
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "saving" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const selectedPolicy = useMemo(
    () => initialPolicies.find((policy) => policy.id === policyId),
    [initialPolicies, policyId],
  );

  const selectedPartner = useMemo(
    () => initialPartners.find((partner) => partner.id === partnerId),
    [initialPartners, partnerId],
  );

  async function handleCreateInvoice() {
    setSubmitState({
      status: "saving",
      message: "Creating invoice...",
    });

    try {
      const created = await createInvoice({
        invoiceNumber,
        policyId: policyId || undefined,
        partnerId,
        invoiceDate,
        amount: Number(amount),
        status,
        note,
      });

      setSubmitState({
        status: "success",
        message: `Invoice ${created.invoiceNumber} created successfully.`,
      });
      router.push(`/invoices/${created.id}`);
      router.refresh();
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to create invoice.",
      });
    }
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">CREATE INVOICE</p>
        <h1 className="page-title">Create invoice</h1>
        <p className="page-subtitle">
          This screen now uses the live backend contract. It links invoice
          creation to the current policy and partner data already stored in the
          system.
        </p>
        {submitState.status !== "idle" ? (
          <div className={`submit-banner submit-${submitState.status}`}>
            {submitState.message}
          </div>
        ) : null}
      </section>

      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">INVOICE HEADER</p>
              <h3>Basic invoice details</h3>
            </div>
          </div>

          <div className="form-grid form-grid--invoice">
            <label>
              <span>Invoice Number</span>
              <input
                value={invoiceNumber}
                onChange={(event) => setInvoiceNumber(event.target.value)}
              />
            </label>
            <label>
              <span>Linked Policy</span>
              <select
                value={policyId}
                onChange={(event) => {
                  const nextPolicyId = event.target.value;
                  setPolicyId(nextPolicyId);
                  const nextPolicy = initialPolicies.find(
                    (policy) => policy.id === nextPolicyId,
                  );
                  if (nextPolicy) {
                    setPartnerId(nextPolicy.partner.id);
                    setAmount(String(Number(nextPolicy.premiumAmount ?? 0)));
                  }
                }}
              >
                {initialPolicies.map((policy) => (
                  <option key={policy.id} value={policy.id}>
                    {policy.policyNumber} - {policy.primaryTravellerName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Partner</span>
              <select
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
              >
                {initialPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Invoice Date</span>
              <input
                type="date"
                value={invoiceDate}
                onChange={(event) => setInvoiceDate(event.target.value)}
              />
            </label>
            <label>
              <span>Amount</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </label>
            <label>
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="READY">Ready</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
              </select>
            </label>
          </div>

          <label className="invoice-notes">
            <span>Internal notes</span>
            <textarea
              rows={4}
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        </section>

        <aside className="content-card summary-card">
          <p className="portal-eyebrow">INVOICE PREVIEW</p>
          <h3>Expected output</h3>
          <div className="summary-pairs">
            <div>
              <span>Linked policy</span>
              <strong>{selectedPolicy?.policyNumber ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Partner</span>
              <strong>{selectedPartner?.name ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>
                ₹ {Number(amount || 0).toLocaleString("en-IN")}
              </strong>
            </div>
            <div>
              <span>PDF action</span>
              <strong>Generate and download</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="action-row">
        <button className="ghost-button" type="button">
          Save as draft
        </button>
        <button className="primary-button" type="button" onClick={handleCreateInvoice}>
          {submitState.status === "saving" ? "Creating..." : "Create invoice"}
        </button>
      </div>
    </div>
  );
}
