"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { sendInvoiceEmail, type ApiEmailLog } from "@/lib/api";

function formatDate(value?: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function InvoiceEmailActions({
  invoiceId,
  invoiceNumber,
  initialRecipient = "",
  initialLogs = [],
  onSent,
}: {
  invoiceId: string;
  invoiceNumber: string;
  initialRecipient?: string;
  initialLogs?: ApiEmailLog[];
  onSent?: () => void;
}) {
  const { token } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [subject, setSubject] = useState(`Invoice ${invoiceNumber}`);
  const [message, setMessage] = useState(
    `Please find attached invoice ${invoiceNumber}.`,
  );
  const [logs, setLogs] = useState(initialLogs);
  const [state, setState] = useState<{
    status: "idle" | "loading" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

  async function handleSendEmail() {
    setState({ status: "loading", message: "Sending invoice..." });

    try {
      const result = await sendInvoiceEmail(
        invoiceId,
        {
          recipientEmail,
          subject,
          message,
        },
        token ?? undefined,
      );

      setLogs((current) => [result.log, ...current]);
      setState({
        status: "success",
        message: `Invoice sent to ${result.log.recipientEmail}.`,
      });
      onSent?.();
    } catch (error) {
      setState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Invoice email request failed.",
      });
    }
  }

  return (
    <div className="action-tile-grid">
      <div className="action-tile">
        <span>Invoice delivery</span>
        <strong>Send the generated invoice PDF directly to the client</strong>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "1.25fr 1fr" }}>
        <label>
          <span>Recipient email</span>
          <input
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="client@example.com"
          />
        </label>
        <label>
          <span>Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={`Invoice ${invoiceNumber}`}
          />
        </label>
      </div>

      <label className="invoice-notes">
        <span>Message</span>
        <textarea
          rows={4}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      <div className="action-button-row">
        <button className="primary-button" type="button" onClick={handleSendEmail}>
          {state.status === "loading" ? "Sending..." : "Send invoice"}
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

      {recentLogs.length ? (
        <div className="document-list">
          {recentLogs.map((log) => (
            <div className="document-row" key={log.id}>
              <div>
                <strong>{log.recipientEmail}</strong>
                <p>
                  {log.subject} · {formatDate(log.sentAt || log.createdAt)}
                </p>
              </div>
              <div style={{ textAlign: "right" }}>
                <span
                  className={`status-pill status-${log.status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {log.status}
                </span>
                {log.errorMessage ? <p>{log.errorMessage}</p> : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
