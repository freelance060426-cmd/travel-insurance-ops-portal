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
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>(
    initialPolicies[0] ? [initialPolicies[0].id] : [],
  );
  const [partnerId, setPartnerId] = useState(
    initialPolicies[0]?.partner.id ?? initialPartners[0]?.id ?? "",
  );
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [status, setStatus] = useState("READY");
  const [note, setNote] = useState(
    "Invoice generated from eligible policy records.",
  );
  const [pending, setPending] = useState(false);

  const selectedPolicies = useMemo(
    () => initialPolicies.filter((p) => selectedPolicyIds.includes(p.id)),
    [initialPolicies, selectedPolicyIds],
  );

  const totalAmount = useMemo(
    () =>
      selectedPolicies.reduce(
        (sum, p) => sum + Number(p.premiumAmount ?? 0),
        0,
      ),
    [selectedPolicies],
  );

  const selectedPartner = useMemo(
    () => initialPartners.find((partner) => partner.id === partnerId),
    [initialPartners, partnerId],
  );

  function togglePolicy(id: string) {
    setSelectedPolicyIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  async function handleCreateInvoice() {
    if (selectedPolicyIds.length === 0) {
      toast.error("Select at least one eligible policy.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Generating invoice...");

    try {
      const created = await createInvoice(
        {
          invoiceNumber,
          policyIds: selectedPolicyIds,
          partnerId,
          invoiceDate,
          amount: totalAmount,
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
        <h1 className="page-title">Generate invoice from eligible policies</h1>
        <p className="page-subtitle">
          Select one or more eligible policies to include in this invoice.
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
              <span>Linked Policies ({selectedPolicyIds.length} selected)</span>
              <div
                className="table-shell"
                style={{ maxHeight: 200, overflowY: "auto" }}
              >
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}></th>
                      <th>Policy No.</th>
                      <th>Traveller</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {initialPolicies.length === 0 ? (
                      <tr>
                        <td colSpan={4}>No eligible policies available</td>
                      </tr>
                    ) : null}
                    {initialPolicies.map((policy) => (
                      <tr
                        key={policy.id}
                        className={
                          selectedPolicyIds.includes(policy.id)
                            ? "is-selected"
                            : ""
                        }
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedPolicyIds.includes(policy.id)}
                            onChange={() => {
                              togglePolicy(policy.id);
                              if (!partnerId && policy.partner?.id) {
                                setPartnerId(policy.partner.id);
                              }
                            }}
                          />
                        </td>
                        <td>{policy.policyNumber}</td>
                        <td>{policy.primaryTravellerName}</td>
                        <td>
                          ₹{" "}
                          {Number(policy.premiumAmount ?? 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                value={`₹ ${totalAmount.toLocaleString("en-IN")}`}
                readOnly
                className="input-readonly"
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
              <span>Linked policies</span>
              <strong>{selectedPolicyIds.length} selected</strong>
            </div>
            <div>
              <span>Partner</span>
              <strong>{selectedPartner?.name ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>₹ {totalAmount.toLocaleString("en-IN")}</strong>
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
