"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiEligibleInvoicePolicy, ApiPartner } from "@/lib/api";
import { createInvoice } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { invoiceSchema, type InvoiceFormValues } from "@/lib/schemas";

export function CreateInvoiceForm({
  initialPartners,
  initialPolicies,
}: {
  initialPartners: ApiPartner[];
  initialPolicies: ApiEligibleInvoicePolicy[];
}) {
  const router = useRouter();
  const { token } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      invoiceNumber: `INV-${String(Date.now()).slice(-8)}`,
      invoiceDate: new Date().toISOString().slice(0, 10),
      partnerId: initialPolicies[0]?.partner.id ?? initialPartners[0]?.id ?? "",
      status: "READY",
      note: "Invoice generated from eligible policy records.",
    },
  });

  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>(
    initialPolicies[0] ? [initialPolicies[0].id] : [],
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

  function togglePolicy(id: string) {
    setSelectedPolicyIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );
  }

  const onSubmit = handleSubmit(async (values) => {
    if (selectedPolicyIds.length === 0) {
      toast.error("Select at least one eligible policy.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Generating invoice...");

    try {
      const created = await createInvoice(
        {
          invoiceNumber: values.invoiceNumber,
          policyIds: selectedPolicyIds,
          partnerId: values.partnerId,
          invoiceDate: values.invoiceDate,
          amount: totalAmount,
          status: values.status,
          note: values.note,
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
  });

  return (
    <div className="page-stack">
      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">INVOICE HEADER</p>
              <h3>Basic invoice details</h3>
            </div>
          </div>

          <div className="form-grid form-grid--invoice">
            <label className={errors.invoiceNumber ? "has-error" : ""}>
              <span>Invoice Number</span>
              <input
                {...register("invoiceNumber")}
                className={errors.invoiceNumber ? "input-invalid" : ""}
              />
              {errors.invoiceNumber && (
                <p className="field-error">{errors.invoiceNumber.message}</p>
              )}
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
            <label className={errors.partnerId ? "has-error" : ""}>
              <span>Partner</span>
              <select
                {...register("partnerId")}
                className={errors.partnerId ? "input-invalid" : ""}
              >
                {initialPartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
              {errors.partnerId && (
                <p className="field-error">{errors.partnerId.message}</p>
              )}
            </label>
            <label className={errors.invoiceDate ? "has-error" : ""}>
              <span>Invoice Date</span>
              <input
                type="date"
                {...register("invoiceDate")}
                className={errors.invoiceDate ? "input-invalid" : ""}
              />
              {errors.invoiceDate && (
                <p className="field-error">{errors.invoiceDate.message}</p>
              )}
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
              <select {...register("status")}>
                <option value="READY">Ready</option>
                <option value="DRAFT">Draft</option>
                <option value="SENT">Sent</option>
              </select>
            </label>
          </div>

          <label className="invoice-notes">
            <span>Internal notes</span>
            <textarea rows={4} {...register("note")} />
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
          onClick={onSubmit}
          disabled={pending}
        >
          {pending ? "Generating..." : "Generate invoice"}
        </button>
      </div>
    </div>
  );
}
