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

  const allSelected =
    eligiblePolicies.length > 0 &&
    selectedPolicyIds.length === eligiblePolicies.length;

  function togglePolicy(policyId: string) {
    setSelectedPolicyIds((current) =>
      current.includes(policyId)
        ? current.filter((id) => id !== policyId)
        : [...current, policyId],
    );
  }

  function toggleAllPolicies() {
    setSelectedPolicyIds((current) =>
      current.length === eligiblePolicies.length
        ? []
        : eligiblePolicies.map((policy) => policy.id),
    );
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
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">GENERATION SETUP</p>
              <h3>Confirm rules before creating invoices</h3>
              <p className="section-note">
                Select eligible policies below to generate a combined invoice.
              </p>
            </div>
            <Link className="ghost-button" href="/invoices/new">
              Single generate form
            </Link>
          </div>

          <div className="invoice-generation-layout">
            <div className="invoice-setup-panel">
              <div className="filter-grid filter-grid--secondary invoice-setup-fields">
                <label>
                  <span>Invoice Date</span>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(event) => setInvoiceDate(event.target.value)}
                  />
                </label>
                <label className="invoice-notes">
                  <span>Generation note</span>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                </label>
              </div>

              <div className="generation-readiness">
                <div>
                  <span>Selected policies</span>
                  <strong>{selectedPolicyIds.length}</strong>
                </div>
                <div>
                  <span>Invoice records to create</span>
                  <strong>{selectedPolicyIds.length}</strong>
                </div>
                <div>
                  <span>Selected premium value</span>
                  <strong>
                    ₹ {selectedPremiumTotal.toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>

            <aside className="invoice-rule-panel">
              <p className="portal-eyebrow">GENERATION MODE</p>
              <div className="invoice-mode-grid">
                <div
                  className={`invoice-mode-card ${
                    selectedPolicyIds.length === 1 ? "is-ready" : ""
                  }`}
                >
                  <span>Single</span>
                  <strong>Exactly 1 policy</strong>
                  <small>Creates one invoice for one selected policy.</small>
                </div>
                <div
                  className={`invoice-mode-card ${
                    selectedPolicyIds.length >= 2 ? "is-ready" : ""
                  }`}
                >
                  <span>Combined</span>
                  <strong>2 or more policies</strong>
                  <small>
                    Creates one invoice covering all selected policies.
                  </small>
                </div>
              </div>
              <div className="invoice-selection-summary">
                <span>Current selection</span>
                <strong>
                  {selectedPolicyIds.length
                    ? `${selectedPolicyIds.length} selected`
                    : "No policies selected"}
                </strong>
                <small>
                  {selectedPolicies.length
                    ? selectedPolicies
                        .slice(0, 2)
                        .map((policy) => policy.policyNumber)
                        .join(", ") +
                      (selectedPolicies.length > 2
                        ? ` +${selectedPolicies.length - 2} more`
                        : "")
                    : "Choose policies below to unlock generation."}
                </small>
              </div>
            </aside>
          </div>

          <div className="invoice-generate-bar">
            <div>
              <span>Generation action</span>
              <strong>
                {selectedPolicyIds.length === 0
                  ? "Select policies to continue"
                  : `${selectedPolicyIds.length} invoice${
                      selectedPolicyIds.length === 1 ? "" : "s"
                    } will be created`}
              </strong>
            </div>
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

          <div className="invoice-selection-panel">
            <div className="invoice-selection-toolbar">
              <div>
                <p className="portal-eyebrow">ELIGIBLE POLICIES</p>
                <h3>Choose policies without invoices</h3>
              </div>
              {eligiblePolicies.length ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={toggleAllPolicies}
                >
                  {allSelected ? "Clear selection" : "Select all eligible"}
                </button>
              ) : null}
            </div>

            {eligiblePolicies.length === 0 ? (
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
                          checked={allSelected}
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
                    {eligiblePolicies.map((policy) => {
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
