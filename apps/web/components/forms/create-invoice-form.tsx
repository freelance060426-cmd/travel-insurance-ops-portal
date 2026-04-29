"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiEligibleInvoicePolicy, ApiPartner } from "@/lib/api";
import { createInvoice } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

export function CreateInvoiceForm({
  initialPartners,
  initialPolicies,
}: {
  initialPartners: ApiPartner[];
  initialPolicies: ApiEligibleInvoicePolicy[];
}) {
  const router = useRouter();
  const { token } = useAuth();
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
    "Invoice generated from an eligible policy and ready for PDF/download flow.",
  );
  const [pending, setPending] = useState(false);

  const selectedPolicy = useMemo(
    () => initialPolicies.find((policy) => policy.id === policyId),
    [initialPolicies, policyId],
  );

  const selectedPartner = useMemo(
    () => initialPartners.find((partner) => partner.id === partnerId),
    [initialPartners, partnerId],
  );

  async function handleCreateInvoice() {
    if (!policyId) {
      toast.error("Select an eligible policy before generating an invoice.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Generating invoice...");

    try {
      const created = await createInvoice(
        {
          invoiceNumber,
          policyId: policyId || undefined,
          partnerId,
          invoiceDate,
          amount: Number(amount),
          status,
          note,
        },
        token ?? undefined,
      );

      toast.success(`Invoice ${created.invoiceNumber} generated.`, {
        id: toastId,
      });
      router.push(`/invoices/${created.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create invoice.",
        { id: toastId },
      );
      setPending(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">CREATE INVOICE</p>
        <h1 className="page-title">Generate invoice from eligible policy</h1>
        <p className="page-subtitle">
          This screen is the separate single-invoice generation path. It only
          works from policies that do not already have an invoice.
        </p>
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
                {initialPolicies.length === 0 ? (
                  <option value="">No eligible policies available</option>
                ) : null}
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
              <span>Eligible policy</span>
              <strong>{selectedPolicy?.policyNumber ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Partner</span>
              <strong>{selectedPartner?.name ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>₹ {Number(amount || 0).toLocaleString("en-IN")}</strong>
            </div>
            <div>
              <span>PDF action</span>
              <strong>Generate, view, and send</strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="action-row">
        <button
          className="ghost-button"
          type="button"
          onClick={() => router.push("/invoices")}
        >
          Back to invoice workspace
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={handleCreateInvoice}
          disabled={pending}
        >
          {pending ? "Generating..." : "Generate invoice"}
        </button>
      </div>
    </div>
  );
}
