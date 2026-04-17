"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiPartner } from "@/lib/api";
import { createPartner } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

type PartnerDraft = {
  partnerCode: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
};

const initialDraft: PartnerDraft = {
  partnerCode: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
};

export function PartnerManagement({ initialPartners }: { initialPartners: ApiPartner[] }) {
  const router = useRouter();
  const { token } = useAuth();
  const [draft, setDraft] = useState<PartnerDraft>({
    ...initialDraft,
    partnerCode: `P-${String(initialPartners.length + 1).padStart(3, "0")}`,
  });
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "saving" | "success" | "error";
    message: string;
  }>({ status: "idle", message: "" });

  const activeCount = useMemo(
    () => initialPartners.filter((partner) => partner.status === "ACTIVE").length,
    [initialPartners],
  );

  function updateDraft(field: keyof PartnerDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleCreatePartner() {
    setSubmitState({
      status: "saving",
      message: "Saving partner...",
    });

    try {
      const created = await createPartner(draft, token ?? undefined);
      setSubmitState({
        status: "success",
        message: `Partner ${created.name} created successfully.`,
      });
      setDraft({
        ...initialDraft,
        partnerCode: `P-${String(initialPartners.length + 2).padStart(3, "0")}`,
      });
      router.refresh();
    } catch (error) {
      setSubmitState({
        status: "error",
        message: error instanceof Error ? error.message : "Failed to create partner.",
      });
    }
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">PARTNER MANAGEMENT</p>
            <h1 className="page-title">Manage partners and lookup codes</h1>
            <p className="page-subtitle">
              This phase 1 screen handles the simple partner master: create, list, and keep partner
              code, status, and contact details ready for policy linkage.
            </p>
          </div>
        </div>

        <div className="metric-grid metric-grid--compact">
          <article className="metric-card tone-teal">
            <p>Total partners</p>
            <strong>{initialPartners.length}</strong>
            <span>Across current phase 1 operations</span>
          </article>
          <article className="metric-card tone-blue">
            <p>Active partners</p>
            <strong>{activeCount}</strong>
            <span>Available for policy linking</span>
          </article>
          <article className="metric-card tone-amber">
            <p>Inactive partners</p>
            <strong>{initialPartners.length - activeCount}</strong>
            <span>Hidden from normal create flow</span>
          </article>
        </div>
      </section>

      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">NEW PARTNER</p>
              <h3>Create partner record</h3>
            </div>
          </div>

          <div className="form-grid form-grid--invoice">
            <label>
              <span>Partner Code</span>
              <input value={draft.partnerCode} onChange={(event) => updateDraft("partnerCode", event.target.value)} />
            </label>
            <label>
              <span>Partner Name</span>
              <input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} />
            </label>
            <label>
              <span>Contact Name</span>
              <input
                value={draft.contactName}
                onChange={(event) => updateDraft("contactName", event.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input value={draft.email} onChange={(event) => updateDraft("email", event.target.value)} />
            </label>
            <label>
              <span>Phone</span>
              <input value={draft.phone} onChange={(event) => updateDraft("phone", event.target.value)} />
            </label>
          </div>

          {submitState.status !== "idle" ? (
            <div className={`submit-banner submit-${submitState.status}`}>{submitState.message}</div>
          ) : null}

          <div className="action-row">
            <button
              className="ghost-button"
              type="button"
              onClick={() =>
                setDraft({
                  ...initialDraft,
                  partnerCode: `P-${String(initialPartners.length + 1).padStart(3, "0")}`,
                })
              }
            >
              Reset
            </button>
            <button className="primary-button" type="button" onClick={handleCreatePartner}>
              {submitState.status === "saving" ? "Saving..." : "Create partner"}
            </button>
          </div>
        </section>

        <aside className="content-card summary-card">
          <p className="portal-eyebrow">PARTNER RULES</p>
          <h3>Phase 1 assumptions</h3>
          <ul className="activity-list">
            <li>Partner master is a simple lookup table, not a full onboarding workflow.</li>
            <li>Partner code should stay unique.</li>
            <li>Only active partners should be shown in normal policy creation later.</li>
          </ul>
        </aside>
      </div>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">PARTNER LIST</p>
            <h3>Current partner records</h3>
          </div>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Partner Code</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {initialPartners.map((partner) => (
                <tr key={partner.id}>
                  <td>{partner.partnerCode}</td>
                  <td>{partner.name}</td>
                  <td>{partner.contactName || "—"}</td>
                  <td>{partner.email || "—"}</td>
                  <td>{partner.phone || "—"}</td>
                  <td>
                    <span className={`status-pill status-${partner.status.toLowerCase()}`}>{partner.status}</span>
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
