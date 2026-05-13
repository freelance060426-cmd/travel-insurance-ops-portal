"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiPartner } from "@/lib/api";
import { createPartner, createUser } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  partnerSchema,
  partnerLoginSchema,
  type PartnerFormValues,
  type PartnerLoginFormValues,
} from "@/lib/schemas";

const BANK_ACCOUNT_TYPES = ["Savings", "Current", "OD", "CC", "NRE", "NRO"];

export function PartnerManagement({
  initialPartners,
}: {
  initialPartners: ApiPartner[];
}) {
  const router = useRouter();
  const { token } = useAuth();

  const activeCount = useMemo(
    () =>
      initialPartners.filter((partner) => partner.status === "ACTIVE").length,
    [initialPartners],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      partnerCode: `P-${String(initialPartners.length + 1).padStart(3, "0")}`,
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
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const toastId = toast.loading("Saving partner...");
    try {
      const created = await createPartner(values, token ?? undefined);
      toast.success(`Partner ${created.name} created.`, { id: toastId });
      reset({
        partnerCode: `P-${String(initialPartners.length + 2).padStart(3, "0")}`,
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
      });
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create partner.",
        { id: toastId },
      );
    }
  });

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
          <div className="wizard-field-group">
            <h5 className="wizard-field-group__label">Basic Details</h5>
            <div className="form-grid form-grid--invoice">
              <label className={errors.partnerCode ? "has-error" : ""}>
                <span>Partner Code *</span>
                <input
                  {...register("partnerCode")}
                  className={errors.partnerCode ? "input-invalid" : ""}
                />
                {errors.partnerCode && (
                  <p className="field-error">{errors.partnerCode.message}</p>
                )}
              </label>
              <label className={errors.name ? "has-error" : ""}>
                <span>Partner Name *</span>
                <input
                  {...register("name")}
                  className={errors.name ? "input-invalid" : ""}
                />
                {errors.name && (
                  <p className="field-error">{errors.name.message}</p>
                )}
              </label>
              <label>
                <span>Contact Name</span>
                <input {...register("contactName")} />
              </label>
              <label className={errors.email ? "has-error" : ""}>
                <span>Email</span>
                <input
                  type="email"
                  {...register("email")}
                  className={errors.email ? "input-invalid" : ""}
                />
                {errors.email && (
                  <p className="field-error">{errors.email.message}</p>
                )}
              </label>
              <label>
                <span>Phone</span>
                <input {...register("phone")} />
              </label>
              <label>
                <span>GST Number</span>
                <input
                  {...register("gstNumber")}
                  placeholder="e.g. 06AAGFU7535C1Z8"
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                <span>PAN Number</span>
                <input
                  {...register("panNumber")}
                  placeholder="e.g. AAGFU7535C"
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
              </label>
            </div>
          </div>

          <div className="wizard-field-group">
            <h5 className="wizard-field-group__label">Banking Details</h5>
            <div className="form-grid form-grid--invoice">
              <label>
                <span>Bank Name</span>
                <input {...register("bankName")} />
              </label>
              <label>
                <span>Bank Address</span>
                <input {...register("bankAddress")} />
              </label>
              <label>
                <span>Bank Account Type</span>
                <select {...register("bankAccountType")}>
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
                <input {...register("bankAccountNumber")} />
              </label>
              <label>
                <span>Bank SWIFT Code</span>
                <input
                  {...register("bankSwiftCode")}
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                <span>IFSC Code</span>
                <input
                  {...register("ifscCode")}
                  onChange={(e) =>
                    (e.target.value = e.target.value.toUpperCase())
                  }
                />
              </label>
              <label>
                <span>MICR Code</span>
                <input {...register("micrCode")} />
              </label>
              <label>
                <span>Company Name For Invoice</span>
                <input
                  {...register("companyNameForInvoice")}
                  placeholder="e.g. Proprietorship"
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
              reset({
                partnerCode: `P-${String(initialPartners.length + 1).padStart(3, "0")}`,
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
              })
            }
          >
            Reset
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Create Partner"}
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PartnerLoginFormValues>({
    resolver: zodResolver(partnerLoginSchema),
    defaultValues: { partnerId: "", name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    const toastId = toast.loading("Creating partner login...");
    try {
      const created = await createUser(
        {
          email: values.email,
          password: values.password,
          name: values.name,
          role: "PARTNER",
          partnerId: values.partnerId,
        },
        token ?? undefined,
      );
      toast.success(`Login created for ${created.name} (${created.email}).`, {
        id: toastId,
      });
      reset();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create login.",
        { id: toastId },
      );
    }
  });

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
        <label className={errors.partnerId ? "has-error" : ""}>
          <span>Partner *</span>
          <select
            {...register("partnerId")}
            className={errors.partnerId ? "input-invalid" : ""}
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
          {errors.partnerId && (
            <p className="field-error">{errors.partnerId.message}</p>
          )}
        </label>
        <label className={errors.name ? "has-error" : ""}>
          <span>Display Name *</span>
          <input
            {...register("name")}
            placeholder="e.g. Partner staff name"
            className={errors.name ? "input-invalid" : ""}
          />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </label>
        <label className={errors.email ? "has-error" : ""}>
          <span>Email (login) *</span>
          <input
            type="email"
            {...register("email")}
            placeholder="partner@example.com"
            className={errors.email ? "input-invalid" : ""}
          />
          {errors.email && (
            <p className="field-error">{errors.email.message}</p>
          )}
        </label>
        <label className={errors.password ? "has-error" : ""}>
          <span>Password *</span>
          <input
            type="password"
            {...register("password")}
            placeholder="Initial password"
            className={errors.password ? "input-invalid" : ""}
          />
          {errors.password && (
            <p className="field-error">{errors.password.message}</p>
          )}
        </label>
      </div>

      <div className="action-row">
        <button
          className="primary-button"
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating..." : "Create Partner Login"}
        </button>
      </div>
    </section>
  );
}
