"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { sendPolicyEmail, type ApiEmailLog } from "@/lib/api";

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

export function PolicyEmailActions({
  policyId,
  policyNumber,
  initialRecipient = "",
  initialLogs = [],
}: {
  policyId: string;
  policyNumber: string;
  initialRecipient?: string;
  initialLogs?: ApiEmailLog[];
}) {
  const { token } = useAuth();
  const [recipientEmail, setRecipientEmail] = useState(initialRecipient);
  const [subject, setSubject] = useState(`Policy ${policyNumber}`);
  const [message, setMessage] = useState(
    `Please find attached the policy PDF for ${policyNumber}.`,
  );
  const [logs, setLogs] = useState(initialLogs);
  const [pending, setPending] = useState(false);

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);

  async function handleSendEmail() {
    setPending(true);
    const toastId = toast.loading("Sending policy email...");

    try {
      const result = await sendPolicyEmail(
        policyId,
        {
          recipientEmail,
          subject,
          message,
        },
        token ?? undefined,
      );

      setLogs((current) => [result.log, ...current]);
      toast.success(`Email sent to ${result.log.recipientEmail}.`, {
        id: toastId,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Policy email request failed.",
        { id: toastId },
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="action-tile-grid">
      <div className="action-tile">
        <span>Email delivery</span>
        <strong>Send the latest policy PDF directly from the portal</strong>
      </div>

      <div className="form-grid" style={{ gridTemplateColumns: "1.25fr 1fr" }}>
        <label>
          <span>Recipient email</span>
          <input
            type="email"
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            placeholder="customer@example.com"
          />
        </label>
        <label>
          <span>Subject</span>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={`Policy ${policyNumber}`}
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
        <button
          className="primary-button"
          type="button"
          onClick={handleSendEmail}
          disabled={pending}
        >
          {pending ? "Sending..." : "Send policy email"}
        </button>
      </div>

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
