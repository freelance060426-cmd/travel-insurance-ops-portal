"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiPartner } from "@/lib/api";
import { createPartner, createUser } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

const BANK_ACCOUNT_TYPES = ["Savings", "Current", "OD", "CC", "NRE", "NRO"];

type PartnerDraft = {
  partnerCode: string;
  name: string;
  contactName: string;
  email: string;
  phone: string;
  gstNumber: string;
  panNumber: string;
  bankName: string;
  bankAddress: string;
  bankAccountType: string;
  bankAccountNumber: string;
  bankSwiftCode: string;
  ifscCode: string;
  micrCode: string;
  companyNameForInvoice: string;
};

const initialDraft: PartnerDraft = {
  partnerCode: "",
  name: "",
  contactName: "",
  email: "",
  phone: "",
  gstNumber: "",
  panNumber: "",
  bankName: "",
  bankAddress: "",
  bankAccountType: "",
  bankAccountNumber: "",
  bankSwiftCode: "",
  ifscCode: "",
  micrCode: "",
  companyNameForInvoice: "",
};

export function PartnerManagement({
  initialPartners,
}: {
  initialPartners: ApiPartner[];
}) {
  const router = useRouter();
  const { token } = useAuth();
  const [draft, setDraft] = useState<PartnerDraft>({
    ...initialDraft,
    partnerCode: `P-${String(initialPartners.length + 1).padStart(3, "0")}`,
  });
  const [pending, setPending] = useState(false);

  const activeCount = useMemo(
    () =>
      initialPartners.filter((partner) => partner.status === "ACTIVE").length,
    [initialPartners],
  );

  function updateDraft(field: keyof PartnerDraft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleCreatePartner() {
    setPending(true);
    const toastId = toast.loading("Saving partner...");

    try {
      const created = await createPartner(draft, token ?? undefined);
      toast.success(`Partner ${created.name} created.`, { id: toastId });
      setDraft({
        ...initialDraft,
        partnerCode: `P-${String(initialPartners.length + 2).padStart(3, "0")}`,
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create partner.",
        { id: toastId },
      );
    } finally {
      setPending(false);
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
              Create and manage partner records with contact and banking details
              for policy linkage and invoice generation.
            </p>
          </div>
        </div>

        <div className="metric-grid metric-grid--compact">
          <article className="metric-card tone-teal">
            <p>Total partners</p>
            <strong>{initialPartners.length}</strong>
            <span>Registered partner records</span>
          </article>
          <article className="metric-card tone-blue">
            <p>Active partners</p>
            <strong>{activeCount}</strong>
            <span>Available for policy linking</span>
          </article>
          <article className="metric-card tone-amber">
            <p>Inactive partners</p>
            <strong>{initialPartners.length - activeCount}</strong>
            <span>Hidden from create flow</span>
          </article>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">NEW PARTNER</p>
            <h3>Create partner record</h3>
          </div>
        </div>

        <div className="partner-form-sections">
          <div className="partner-form-section">
            <h4 className="partner-section-label">Basic Details</h4>
            <div className="form-grid form-grid--invoice">
              <label>
                <span>Partner Code *</span>
                <input
                  value={draft.partnerCode}
                  onChange={(event) =>
                    updateDraft("partnerCode", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Partner Name *</span>
                <input
                  value={draft.name}
                  onChange={(event) => updateDraft("name", event.target.value)}
                />
              </label>
              <label>
                <span>Contact Name</span>
                <input
                  value={draft.contactName}
                  onChange={(event) =>
                    updateDraft("contactName", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={draft.email}
                  onChange={(event) => updateDraft("email", event.target.value)}
                />
              </label>
              <label>
                <span>Phone</span>
                <input
                  value={draft.phone}
                  onChange={(event) => updateDraft("phone", event.target.value)}
                />
              </label>
              <label>
                <span>GST Number</span>
                <input
                  value={draft.gstNumber}
                  placeholder="e.g. 06AAGFU7535C1Z8"
                  onChange={(event) =>
                    updateDraft("gstNumber", event.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                <span>PAN Number</span>
                <input
                  value={draft.panNumber}
                  placeholder="e.g. AAGFU7535C"
                  onChange={(event) =>
                    updateDraft("panNumber", event.target.value.toUpperCase())
                  }
                />
              </label>
            </div>
          </div>

          <hr className="partner-section-divider" />

          <div className="partner-form-section">
            <h4 className="partner-section-label">Banking Details</h4>
            <div className="form-grid form-grid--invoice">
              <label>
                <span>Bank Name</span>
                <input
                  value={draft.bankName}
                  onChange={(event) =>
                    updateDraft("bankName", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Bank Address</span>
                <input
                  value={draft.bankAddress}
                  onChange={(event) =>
                    updateDraft("bankAddress", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Bank Account Type</span>
                <select
                  value={draft.bankAccountType}
                  onChange={(event) =>
                    updateDraft("bankAccountType", event.target.value)
                  }
                >
                  <option value="">Select Account Type</option>
                  {BANK_ACCOUNT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Bank Account Number</span>
                <input
                  value={draft.bankAccountNumber}
                  onChange={(event) =>
                    updateDraft("bankAccountNumber", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Bank SWIFT Code</span>
                <input
                  value={draft.bankSwiftCode}
                  onChange={(event) =>
                    updateDraft(
                      "bankSwiftCode",
                      event.target.value.toUpperCase(),
                    )
                  }
                />
              </label>
              <label>
                <span>IFSC Code</span>
                <input
                  value={draft.ifscCode}
                  onChange={(event) =>
                    updateDraft("ifscCode", event.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                <span>MICR Code</span>
                <input
                  value={draft.micrCode}
                  onChange={(event) =>
                    updateDraft("micrCode", event.target.value)
                  }
                />
              </label>
              <label>
                <span>Company Name For Invoice</span>
                <input
                  value={draft.companyNameForInvoice}
                  placeholder="e.g. Proprietorship"
                  onChange={(event) =>
                    updateDraft("companyNameForInvoice", event.target.value)
                  }
                />
              </label>
            </div>
          </div>
        </div>

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
          <button
            className="primary-button"
            type="button"
            onClick={handleCreatePartner}
            disabled={pending}
          >
            {pending ? "Saving..." : "Create Partner"}
          </button>
        </div>
      </section>

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
                <th>GST</th>
                <th>Bank</th>
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
                  <td>{partner.gstNumber || "—"}</td>
                  <td>{partner.bankName || "—"}</td>
                  <td>
                    <span
                      className={`status-pill status-${partner.status.toLowerCase()}`}
                    >
                      {partner.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PartnerLoginSection partners={initialPartners} />
    </div>
  );
}

/* ─── Partner Login Creation Section ─── */

function PartnerLoginSection({ partners }: { partners: ApiPartner[] }) {
  const { token } = useAuth();
  const [loginDraft, setLoginDraft] = useState({
    partnerId: "",
    email: "",
    password: "",
    name: "",
  });
  const [loginPending, setLoginPending] = useState(false);

  async function handleCreateLogin() {
    if (
      !loginDraft.partnerId ||
      !loginDraft.email ||
      !loginDraft.password ||
      !loginDraft.name
    ) {
      toast.error("All fields are required to create a partner login.");
      return;
    }

    setLoginPending(true);
    const toastId = toast.loading("Creating partner login...");

    try {
      const created = await createUser(
        {
          email: loginDraft.email,
          password: loginDraft.password,
          name: loginDraft.name,
          role: "PARTNER",
          partnerId: loginDraft.partnerId,
        },
        token ?? undefined,
      );
      toast.success(`Login created for ${created.name} (${created.email}).`, {
        id: toastId,
      });
      setLoginDraft({ partnerId: "", email: "", password: "", name: "" });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create login.",
        { id: toastId },
      );
    } finally {
      setLoginPending(false);
    }
  }

  return (
    <section className="content-card">
      <div className="section-heading">
        <div>
          <p className="portal-eyebrow">PARTNER ONBOARDING</p>
          <h3>Create partner login</h3>
          <p className="page-subtitle">
            Create a portal login for a partner. They will see only their own
            policies and invoices.
          </p>
        </div>
      </div>

      <div className="form-grid form-grid--invoice">
        <label>
          <span>Partner *</span>
          <select
            value={loginDraft.partnerId}
            onChange={(e) =>
              setLoginDraft((d) => ({ ...d, partnerId: e.target.value }))
            }
          >
            <option value="">Select partner</option>
            {partners
              .filter((p) => p.status === "ACTIVE")
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.partnerCode})
                </option>
              ))}
          </select>
        </label>
        <label>
          <span>Display Name *</span>
          <input
            value={loginDraft.name}
            placeholder="e.g. Partner staff name"
            onChange={(e) =>
              setLoginDraft((d) => ({ ...d, name: e.target.value }))
            }
          />
        </label>
        <label>
          <span>Email (login) *</span>
          <input
            type="email"
            value={loginDraft.email}
            placeholder="partner@example.com"
            onChange={(e) =>
              setLoginDraft((d) => ({ ...d, email: e.target.value }))
            }
          />
        </label>
        <label>
          <span>Password *</span>
          <input
            type="password"
            value={loginDraft.password}
            placeholder="Initial password"
            onChange={(e) =>
              setLoginDraft((d) => ({ ...d, password: e.target.value }))
            }
          />
        </label>
      </div>

      <div className="action-row">
        <button
          className="primary-button"
          type="button"
          onClick={handleCreateLogin}
          disabled={loginPending}
        >
          {loginPending ? "Creating..." : "Create Partner Login"}
        </button>
      </div>
    </section>
  );
}
