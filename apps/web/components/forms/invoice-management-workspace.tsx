"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
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
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  async function handleDownload() {
    setState({ status: "loading", message: "Preparing PDF..." });

    try {
      const result = await getInvoicePdf(invoice.id, token ?? undefined);
      window.open(`http://localhost:4000${result.fileUrl}`, "_blank");
      setState({ status: "success", message: "PDF ready." });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to fetch invoice PDF.",
      });
    }
  }

  async function handleSend() {
    if (!invoice.policy?.customerEmail) {
      setState({
        status: "error",
        message: "No customer email found on the linked policy.",
      });
      return;
    }

    setState({ status: "loading", message: "Sending invoice..." });

    try {
      await sendInvoiceEmail(
        invoice.id,
        {
          recipientEmail: invoice.policy.customerEmail,
          subject: `Invoice ${invoice.invoiceNumber}`,
          message: `Please find attached invoice ${invoice.invoiceNumber}.`,
        },
        token ?? undefined,
      );
      setState({ status: "success", message: "Invoice sent." });
      onSent(invoice.id);
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to send invoice.",
      });
    }
  }

  return (
    <div className="table-action-stack">
      <div className="table-action-row">
        <Link href={`/invoices/${invoice.id}`} className="table-link">
          View
        </Link>
        <button className="inline-action-button" type="button" onClick={handleDownload}>
          Download
        </button>
        <button className="inline-action-button" type="button" onClick={handleSend}>
          Send
        </button>
      </div>
      {state.status !== "idle" ? (
        <small
          className={`table-inline-note table-inline-note--${
            state.status === "error"
              ? "error"
              : state.status === "success"
                ? "success"
                : "loading"
          }`}
        >
          {state.message}
        </small>
      ) : null}
    </div>
  );
}

export function InvoiceManagementWorkspace({
  initialInvoices,
  initialEligiblePolicies,
}: {
  initialInvoices: ApiInvoice[];
  initialEligiblePolicies: ApiEligibleInvoicePolicy[];
}) {
  const { token } = useAuth();
  const [invoices, setInvoices] = useState(initialInvoices);
  const [eligiblePolicies, setEligiblePolicies] = useState(initialEligiblePolicies);
  const [selectedPolicyIds, setSelectedPolicyIds] = useState<string[]>([]);
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [note, setNote] = useState(
    "Invoice generated for an eligible policy record.",
  );
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const totalInvoices = invoices.length;
  const readyInvoices = invoices.filter(
    (invoice) => statusLabel(invoice.status) === "Ready",
  ).length;
  const sentInvoices = invoices.filter(
    (invoice) => statusLabel(invoice.status) === "Sent",
  ).length;

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
      setState({
        status: "error",
        message: "Select exactly one eligible policy for single invoice generation.",
      });
      return;
    }

    if (mode === "bulk" && selectedPolicyIds.length < 2) {
      setState({
        status: "error",
        message: "Select at least two eligible policies for bulk invoice generation.",
      });
      return;
    }

    setState({
      status: "loading",
      message:
        mode === "single"
          ? "Generating invoice..."
          : `Generating ${selectedPolicyIds.length} invoices...`,
    });

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
      setState({
        status: "success",
        message:
          mode === "single"
            ? `Invoice ${created[0]?.invoiceNumber ?? ""} generated successfully.`
            : `${created.length} invoices generated successfully.`,
      });
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Invoice generation failed.",
      });
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
        policyNumber: invoice.policy?.policyNumber || "—",
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
            Phase 1 invoice generation now starts from real policy eligibility.
            Single generation handles one policy, while bulk generation creates one
            invoice per selected eligible policy.
          </p>
        </div>

        <div className="hero-panel__meta">
          <span className="portal-chip">{eligiblePolicies.length} eligible policies</span>
          <span className="portal-chip">{readyInvoices} ready invoices</span>
          <span className="portal-chip">{sentInvoices} sent invoices</span>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">ELIGIBLE POLICIES</p>
            <h3>Choose policies without invoices</h3>
          </div>
          <Link className="ghost-button" href="/invoices/new">
            Single generate form
          </Link>
        </div>

        <div className="filter-grid filter-grid--secondary">
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

        <div className="action-button-row" style={{ marginBottom: 16 }}>
          <button className="ghost-button" type="button" onClick={() => handleGenerate("single")}>
            Generate Invoice
          </button>
          <button className="primary-button" type="button" onClick={() => handleGenerate("bulk")}>
            Generate Bulk Invoices
          </button>
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

        {eligiblePolicies.length === 0 ? (
          <div className="lookup-banner">
            No eligible policies are currently pending invoice generation.
          </div>
        ) : (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAllPolicies}
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
                {eligiblePolicies.map((policy) => (
                  <tr key={policy.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedPolicyIds.includes(policy.id)}
                        onChange={() => togglePolicy(policy.id)}
                      />
                    </td>
                    <td>{policy.policyNumber}</td>
                    <td>{policy.primaryTravellerName}</td>
                    <td>{policy.partner.name}</td>
                    <td>{formatTravelWindow(policy.startDate, policy.endDate)}</td>
                    <td>
                      ₹ {Number(policy.premiumAmount ?? 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">GENERATED INVOICES</p>
            <h3>List, download, and send invoices</h3>
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

        <div className="table-shell" style={{ marginTop: 16 }}>
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
