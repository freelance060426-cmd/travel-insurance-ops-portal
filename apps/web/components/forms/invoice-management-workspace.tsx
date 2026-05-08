"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import {
  buildApiAssetUrl,
  bulkGenerateInvoices,
  getInvoicePdf,
  sendInvoiceEmail,
  type ApiEligibleInvoicePolicy,
  type ApiInvoice,
} from "@/lib/api";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-CA").format(new Date(value));
}

function formatTravelWindow(startDate: string, endDate: string) {
  const start = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(startDate));
  const end = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(new Date(endDate));
  return `${start} - ${end}`;
}

function statusLabel(value: string) {
  return value.charAt(0) + value.slice(1).toLowerCase();
}

function InvoiceRowActions({
  invoice,
  onSent,
}: {
  invoice: ApiInvoice;
  onSent: (invoiceId: string) => void;
}) {
  const { token } = useAuth();
  const [pending, setPending] = useState(false);

  async function handleDownload() {
    setPending(true);
    const toastId = toast.loading("Preparing PDF...");

    try {
      const result = await getInvoicePdf(invoice.id, token ?? undefined);
      window.open(buildApiAssetUrl(result.fileUrl) ?? result.fileUrl, "_blank");
      toast.success("PDF ready.", { id: toastId });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch invoice PDF.",
        { id: toastId },
      );
    } finally {
      setPending(false);
    }
  }

  async function handleSend() {
    const firstEmail = invoice.policies?.[0]?.policy?.customerEmail;
    if (!firstEmail) {
      toast.error("No customer email found on the linked policies.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Sending invoice...");

    try {
      await sendInvoiceEmail(
        invoice.id,
        {
          recipientEmail: firstEmail,
          subject: `Invoice ${invoice.invoiceNumber}`,
          message: `Please find attached invoice ${invoice.invoiceNumber}.`,
        },
        token ?? undefined,
      );
      toast.success("Invoice sent.", { id: toastId });
      onSent(invoice.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send invoice.",
        { id: toastId },
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="table-action-stack">
      <div className="table-action-row invoice-row-actions">
        <Link
          href={`/invoices/${invoice.id}`}
          className="invoice-action-button invoice-action-button--view"
        >
          View
        </Link>
        <button
          className="invoice-action-button"
          type="button"
          onClick={handleDownload}
          disabled={pending}
        >
          Download
        </button>
        <button
          className="invoice-action-button invoice-action-button--send"
          type="button"
          onClick={handleSend}
          disabled={pending}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export function InvoiceManagementWorkspace({
  initialInvoices,
  initialEligiblePolicies,
  userRole = "SUPER_ADMIN",
}: {
  initialInvoices: ApiInvoice[];
  initialEligiblePolicies: ApiEligibleInvoicePolicy[];
  userRole?: string;
}) {
  const isAdmin = userRole === "SUPER_ADMIN";
  const { token } = useAuth();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [eligiblePolicies, setEligiblePolicies] = useState(
    initialEligiblePolicies,
  );
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(
    "Invoice generated for an eligible policy record.",
  );
  const [pending, setPending] = useState(false);
  const [partnerFilter, setPartnerFilter] = useState("");

  const totalInvoices = invoices.length;
  const readyInvoices = invoices.filter(
    (invoice) => statusLabel(invoice.status) === "Ready",
  ).length;
  const sentInvoices = invoices.filter(
    (invoice) => statusLabel(invoice.status) === "Sent",
  ).length;
  const selectedPolicies = eligiblePolicies.filter((policy) =>
    selectedPolicyIds.includes(policy.id),
  );
  const selectedPremiumTotal = eligiblePolicies
    .filter((policy) => selectedPolicyIds.includes(policy.id))
    .reduce((sum, policy) => sum + Number(policy.premiumAmount ?? 0), 0);
  const isGenerating = pending;
  const canGenerateSingle = selectedPolicyIds.length === 1 && !isGenerating;
  const canGenerateBulk = selectedPolicyIds.length >= 2 && !isGenerating;

  const uniquePartners = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of eligiblePolicies) {
      map.set(p.partner.id ?? p.partner.name, p.partner.name);
    }
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [eligiblePolicies]);

  const filteredPolicies = useMemo(
    () =>
      partnerFilter
        ? eligiblePolicies.filter(
            (p) => (p.partner.id ?? p.partner.name) === partnerFilter,
          )
        : eligiblePolicies,
    [eligiblePolicies, partnerFilter],
  );

  const allFiltered =
    filteredPolicies.length > 0 &&
    filteredPolicies.every((p) => selectedPolicyIds.includes(p.id));

  function togglePolicy(policyId: string) {
    setSelectedPolicyIds((current) =>
      current.includes(policyId)
        ? current.filter((id) => id !== policyId)
        : [...current, policyId],
    );
  }

  function toggleAllPolicies() {
    const filteredIds = filteredPolicies.map((p) => p.id);
    setSelectedPolicyIds((current) => {
      const allChecked = filteredIds.every((id) => current.includes(id));
      if (allChecked) {
        return current.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...current, ...filteredIds])];
    });
  }

  async function handleGenerate(mode: "single" | "bulk") {
    if (mode === "single" && selectedPolicyIds.length !== 1) {
      toast.error(
        "Select exactly one eligible policy for single invoice generation.",
      );
      return;
    }

    if (mode === "bulk" && selectedPolicyIds.length < 2) {
      toast.error(
        "Select at least two eligible policies for bulk invoice generation.",
      );
      return;
    }

    setPending(true);
    const toastId = toast.loading(
      mode === "single"
        ? "Generating invoice..."
        : `Generating ${selectedPolicyIds.length} invoices...`,
    );

    try {
      const created = await bulkGenerateInvoices(
        {
          policyIds: selectedPolicyIds,
          invoiceDate,
          status: "READY",
          note,
        },
        token ?? undefined,
      );

      setInvoices((current) => [...created, ...current]);
      setEligiblePolicies((current) =>
        current.filter((policy) => !selectedPolicyIds.includes(policy.id)),
      );
      setSelectedPolicyIds([]);
      toast.success(
        mode === "single"
          ? `Invoice ${created[0]?.invoiceNumber ?? ""} generated.`
          : `Combined invoice ${created[0]?.invoiceNumber ?? ""} generated for ${selectedPolicyIds.length} policies.`,
        { id: toastId },
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Invoice generation failed.",
        { id: toastId },
      );
    } finally {
      setPending(false);
    }
  }

  function handleInvoiceSent(invoiceId: string) {
    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === invoiceId
          ? {
              ...invoice,
              status: "SENT",
            }
          : invoice,
      ),
    );
  }

  const invoiceRows = useMemo(
    () =>
      invoices.map((invoice) => ({
        ...invoice,
        policyNumber:
          invoice.policies
            ?.map((lnk) => lnk.policy?.policyNumber)
            .filter(Boolean)
            .join(", ") || "—",
        partnerName: invoice.partner.name,
        invoiceDateLabel: formatDate(invoice.invoiceDate),
        amountLabel: `₹ ${Number(invoice.amount).toLocaleString("en-IN")}`,
        statusLabel: statusLabel(invoice.status),
      })),
    [invoices],
  );

  return (
    <div className="page-stack">
      <section className="hero-panel hero-panel--brand">
        <div className="hero-panel__content">
          <p className="portal-eyebrow">INVOICE WORKSPACE</p>
          <h1>Generate and dispatch invoices from eligible policy records</h1>
          <p className="hero-panel__text">
            Select policies without invoices, confirm generation rules, create
            one invoice per policy, then download or send each invoice from the
            dispatch list.
          </p>
        </div>

        <div className="hero-panel__meta">
          <span className="portal-chip portal-chip--strong">
            {eligiblePolicies.length} eligible policies
          </span>
          <span className="portal-chip">{readyInvoices} ready invoices</span>
          <span className="portal-chip">{sentInvoices} sent invoices</span>
        </div>
      </section>

      {isAdmin && (
        <section className="content-card invoice-generation-card">
          <div className="invoice-selection-panel">
            <div className="invoice-selection-toolbar">
              <div>
                <p className="portal-eyebrow">ELIGIBLE POLICIES</p>
                <h3>Choose policies without invoices</h3>
              </div>
              <div className="invoice-selection-toolbar__actions">
                {uniquePartners.length > 1 && (
                  <select
                    className="invoice-partner-filter"
                    value={partnerFilter}
                    onChange={(e) => setPartnerFilter(e.target.value)}
                  >
                    <option value="">All partners</option>
                    {uniquePartners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
                {filteredPolicies.length ? (
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={toggleAllPolicies}
                  >
                    {allFiltered ? "Clear selection" : "Select all eligible"}
                  </button>
                ) : null}
              </div>
            </div>

            {filteredPolicies.length === 0 ? (
              <div className="invoice-empty-state">
                <span>No pending candidates</span>
                <strong>Every eligible policy already has an invoice.</strong>
                <p>
                  New policies will appear here automatically once they exist
                  and do not have an invoice yet.
                </p>
              </div>
            ) : (
              <div className="table-shell">
                <table className="data-table invoice-select-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allFiltered}
                          onChange={toggleAllPolicies}
                          aria-label="Select all eligible policies"
                        />
                      </th>
                      <th>Policy No.</th>
                      <th>Traveller</th>
                      <th>Partner</th>
                      <th>Travel</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPolicies.map((policy) => {
                      const isSelected = selectedPolicyIds.includes(policy.id);

                      return (
                        <tr
                          key={policy.id}
                          className={isSelected ? "is-selected" : ""}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePolicy(policy.id)}
                              aria-label={`Select policy ${policy.policyNumber}`}
                            />
                          </td>
                          <td>{policy.policyNumber}</td>
                          <td>{policy.primaryTravellerName}</td>
                          <td>{policy.partner.name}</td>
                          <td>
                            {formatTravelWindow(
                              policy.startDate,
                              policy.endDate,
                            )}
                          </td>
                          <td>
                            ₹{" "}
                            {Number(policy.premiumAmount ?? 0).toLocaleString(
                              "en-IN",
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="invoice-gen-unified">
            <div className="section-heading" style={{ padding: 0 }}>
              <div>
                <p className="portal-eyebrow">GENERATE INVOICES</p>
                <h3>Configure and generate</h3>
              </div>
              <Link className="ghost-button" href="/invoices/new">
                Single generate form
              </Link>
            </div>

            <div className="invoice-gen-fields">
              <label>
                <span>Invoice Date</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(event) => setInvoiceDate(event.target.value)}
                />
              </label>
              <label>
                <span>Note</span>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
            </div>

            <div className="invoice-gen-summary">
              <div className="invoice-gen-stat">
                <span>{selectedPolicyIds.length}</span>
                <small>
                  {selectedPolicyIds.length === 1 ? "policy" : "policies"}{" "}
                  selected
                </small>
              </div>
              <div className="invoice-gen-stat">
                <span>₹ {selectedPremiumTotal.toLocaleString("en-IN")}</span>
                <small>premium total</small>
              </div>
              <div className="invoice-gen-stat">
                <span>
                  {selectedPolicyIds.length === 0
                    ? "—"
                    : selectedPolicyIds.length === 1
                      ? "Single"
                      : "Combined"}
                </span>
                <small>
                  {selectedPolicyIds.length === 0
                    ? "select policies above"
                    : selectedPolicyIds.length === 1
                      ? "one invoice for one policy"
                      : `one invoice for ${selectedPolicyIds.length} policies`}
                </small>
              </div>
              {selectedPolicies.length > 0 && (
                <div className="invoice-gen-selection-hint">
                  {selectedPolicies
                    .slice(0, 3)
                    .map((p) => p.policyNumber)
                    .join(", ")}
                  {selectedPolicies.length > 3 &&
                    ` +${selectedPolicies.length - 3} more`}
                </div>
              )}
            </div>

            <div className="invoice-gen-actions">
              <button
                className="ghost-button"
                type="button"
                disabled={!canGenerateSingle}
                onClick={() => handleGenerate("single")}
              >
                Generate Invoice
              </button>
              <button
                className="primary-button"
                type="button"
                disabled={!canGenerateBulk}
                onClick={() => handleGenerate("bulk")}
              >
                Generate Combined Invoice
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="content-card invoice-dispatch-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">DISPATCH QUEUE</p>
            <h3>Generated invoices ready for follow-up</h3>
            <p className="section-note">
              Use this queue to view invoice detail, download the PDF, or send a
              single invoice to the linked policy email.
            </p>
          </div>
        </div>

        <div className="metric-grid metric-grid--compact">
          <article className="metric-card tone-teal">
            <p>Total invoices</p>
            <strong>{totalInvoices}</strong>
            <span>Across linked policy records</span>
          </article>
          <article className="metric-card tone-blue">
            <p>Ready for client share</p>
            <strong>{readyInvoices}</strong>
            <span>Generated but not yet sent</span>
          </article>
          <article className="metric-card tone-rose">
            <p>Already sent</p>
            <strong>{sentInvoices}</strong>
            <span>Tracked through invoice email logs</span>
          </article>
        </div>

        <div className="table-shell invoice-dispatch-table">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice No.</th>
                <th>Policy No.</th>
                <th>Partner</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoiceRows.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.invoiceNumber}</td>
                  <td>{invoice.policyNumber}</td>
                  <td>{invoice.partnerName}</td>
                  <td>{invoice.invoiceDateLabel}</td>
                  <td>{invoice.amountLabel}</td>
                  <td>
                    <span
                      className={`status-pill status-${invoice.statusLabel.toLowerCase()}`}
                    >
                      {invoice.statusLabel}
                    </span>
                  </td>
                  <td>
                    <InvoiceRowActions
                      invoice={invoice}
                      onSent={handleInvoiceSent}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
