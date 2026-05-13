"use client";

import type { ApiPlan } from "@/lib/api";
import { ALL_COUNTRIES, NOMINEE_RELATIONSHIPS } from "@/lib/travel-constants";

/* ─── Shared TravellerDraft type ─── */

export type TravellerDraft = {
  _key: string;
  passportNumber: string;
  travellerName: string;
  gender: string;
  dateOfBirth: string;
  nominee: string;
  nomineeRelationship: string;
  address: string;
  pincode: string;
  city: string;
  district: string;
  state: string;
  country: string;
  email: string;
  mobile: string;
  remarks: string;
  crReferenceNumber: string;
  pastIllness: string;
  emergencyContactPerson: string;
  emergencyContactNumber: string;
  emergencyEmail: string;
  gstNumber: string;
  gstState: string;
  planId: string;
  premiumAmount: number;
  lookupStatus: "idle" | "checking" | "found" | "not-found";
  pincodeStatus: "idle" | "loading" | "done" | "not-found";
  sameAddressAsTraveller1: boolean;
  samePlanAsTraveller1: boolean;
};

export type TravellerFieldErrors = Partial<
  Record<keyof TravellerDraft, string>
>;

/* ─── Helpers ─── */

function computeAge(dob: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

/* ─── Props ─── */

type TravellerCardMode = "create" | "endorse";

type TravellerCardProps = {
  traveller: TravellerDraft;
  index: number;
  mode?: TravellerCardMode;
  /** Required in create mode for plan dropdown */
  plans?: ApiPlan[];
  canRemove?: boolean;
  fieldErrors?: TravellerFieldErrors;
  /** Pass traveller[0] for index > 0 to enable same-as-T1 checkboxes (create mode only) */
  traveller1?: TravellerDraft | null;
  onUpdate: (field: keyof TravellerDraft, value: string) => void;
  /** Called with planId when plan is selected (create mode) */
  onSelectPlan?: (planId: string) => void;
  onRemove?: () => void;
  /** Triggered on passport field blur (create mode) */
  onPassportBlur?: () => void;
  /** Triggered on pincode field blur */
  onPincodeBlur?: () => void;
  /** Same-address checkbox toggle (create mode) */
  onSameAddress?: (checked: boolean) => void;
  /** Same-plan checkbox toggle (create mode) */
  onSamePlan?: (checked: boolean) => void;
};

/* ─── Component ─── */

export function TravellerCard({
  traveller: t,
  index,
  mode = "create",
  plans = [],
  canRemove = false,
  fieldErrors = {},
  traveller1 = null,
  onUpdate,
  onSelectPlan,
  onRemove,
  onPassportBlur,
  onPincodeBlur,
  onSameAddress,
  onSamePlan,
}: TravellerCardProps) {
  const age = computeAge(t.dateOfBirth);
  const fe = fieldErrors;
  const isCreate = mode === "create";
  const dataAttr = isCreate
    ? { "data-traveller-key": t._key }
    : { "data-endorse-id": t._key };

  return (
    <article className="traveller-entry-card" {...dataAttr}>
      <div className="traveller-entry-card__header">
        <div className="traveller-title-row">
          <span className="traveller-index-pill">{index + 1}</span>
          <div>
            <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
            <h4>{t.travellerName || "New traveller"}</h4>
          </div>
        </div>
        <div className="traveller-meta-row">
          {isCreate && t.lookupStatus === "found" && (
            <span className="status-pill status-active">Autofilled</span>
          )}
          {isCreate && t.lookupStatus === "checking" && (
            <span className="status-pill status-draft">Checking...</span>
          )}
          {canRemove && onRemove && (
            <button
              className="inline-action-button"
              type="button"
              onClick={onRemove}
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="traveller-entry-card__body">
        {/* ── Identity ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">Identity</h5>
          <div className="traveller-card-grid">
            <label className={fe.passportNumber ? "has-error" : ""}>
              <span>Passport Number *</span>
              <div className="passport-row">
                <input
                  value={t.passportNumber}
                  placeholder="Enter passport number"
                  className={fe.passportNumber ? "input-invalid" : ""}
                  onChange={(e) =>
                    onUpdate("passportNumber", e.target.value.toUpperCase())
                  }
                  onBlur={isCreate ? onPassportBlur : undefined}
                />
              </div>
              {fe.passportNumber && (
                <p className="field-error">{fe.passportNumber}</p>
              )}
            </label>
            <label className={fe.travellerName ? "has-error" : ""}>
              <span>Name *</span>
              <input
                value={t.travellerName}
                className={fe.travellerName ? "input-invalid" : ""}
                onChange={(e) => onUpdate("travellerName", e.target.value)}
              />
              {fe.travellerName && (
                <p className="field-error">{fe.travellerName}</p>
              )}
            </label>
            <label className={fe.gender ? "has-error" : ""}>
              <span>Gender *</span>
              <select
                value={t.gender}
                className={fe.gender ? "input-invalid" : ""}
                onChange={(e) => onUpdate("gender", e.target.value)}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {fe.gender && <p className="field-error">{fe.gender}</p>}
            </label>
            <label className={fe.dateOfBirth ? "has-error" : ""}>
              <span>Date of Birth *</span>
              <input
                type="date"
                value={t.dateOfBirth}
                className={fe.dateOfBirth ? "input-invalid" : ""}
                onChange={(e) => onUpdate("dateOfBirth", e.target.value)}
              />
              {fe.dateOfBirth && (
                <p className="field-error">{fe.dateOfBirth}</p>
              )}
            </label>
            <label>
              <span>Age</span>
              <input
                type="text"
                value={age != null ? `${age} years` : "—"}
                readOnly
                className="input-readonly"
              />
            </label>
          </div>
        </div>

        {/* ── Contact ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">Contact</h5>
          <div className="traveller-card-grid">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={t.email}
                onChange={(e) => onUpdate("email", e.target.value)}
              />
            </label>
            <label>
              <span>Mobile</span>
              <input
                value={t.mobile}
                onChange={(e) => onUpdate("mobile", e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* ── Address ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">
            Address
            {isCreate && index > 0 && traveller1 && onSameAddress && (
              <label className="same-as-t1-check">
                <input
                  type="checkbox"
                  checked={t.sameAddressAsTraveller1}
                  onChange={(e) => onSameAddress(e.target.checked)}
                />
                <span>Same as Traveller 1</span>
              </label>
            )}
          </h5>
          <div className="traveller-card-grid">
            <label className={`span-full${fe.address ? " has-error" : ""}`}>
              <span>Address *</span>
              <input
                value={t.address}
                className={fe.address ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => onUpdate("address", e.target.value)}
              />
              {fe.address && <p className="field-error">{fe.address}</p>}
            </label>
            <label className={fe.pincode ? "has-error" : ""}>
              <span>Pincode *</span>
              <input
                value={t.pincode}
                className={fe.pincode ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => {
                  onUpdate("pincode", e.target.value);
                  if (t.pincodeStatus !== "idle")
                    onUpdate("pincodeStatus", "idle");
                }}
                onBlur={onPincodeBlur}
              />
              {t.pincodeStatus === "loading" && (
                <p className="pincode-lookup-msg pincode-lookup-msg--loading">
                  <span className="pincode-spinner" /> Looking up address…
                </p>
              )}
              {t.pincodeStatus === "not-found" && (
                <p className="pincode-lookup-msg pincode-lookup-msg--error">
                  Pincode not found
                </p>
              )}
              {fe.pincode && <p className="field-error">{fe.pincode}</p>}
            </label>
            <label className={fe.city ? "has-error" : ""}>
              <span>City *</span>
              <input
                value={t.city}
                className={fe.city ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => onUpdate("city", e.target.value)}
              />
              {fe.city && <p className="field-error">{fe.city}</p>}
            </label>
            <label className={fe.district ? "has-error" : ""}>
              <span>District *</span>
              <input
                value={t.district}
                className={fe.district ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => onUpdate("district", e.target.value)}
              />
              {fe.district && <p className="field-error">{fe.district}</p>}
            </label>
            <label className={fe.state ? "has-error" : ""}>
              <span>State *</span>
              <input
                value={t.state}
                className={fe.state ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => onUpdate("state", e.target.value)}
              />
              {fe.state && <p className="field-error">{fe.state}</p>}
            </label>
            <label className={fe.country ? "has-error" : ""}>
              <span>Country *</span>
              <select
                value={t.country}
                className={fe.country ? "input-invalid" : ""}
                disabled={isCreate && t.sameAddressAsTraveller1}
                onChange={(e) => onUpdate("country", e.target.value)}
              >
                <option value="">Select country</option>
                {ALL_COUNTRIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {fe.country && <p className="field-error">{fe.country}</p>}
            </label>
          </div>
        </div>

        {/* ── Nominee ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">Nominee</h5>
          <div className="traveller-card-grid">
            <label className={fe.nominee ? "has-error" : ""}>
              <span>Nominee Name *</span>
              <input
                value={t.nominee}
                className={fe.nominee ? "input-invalid" : ""}
                onChange={(e) => onUpdate("nominee", e.target.value)}
              />
              {fe.nominee && <p className="field-error">{fe.nominee}</p>}
            </label>
            <label className={fe.nomineeRelationship ? "has-error" : ""}>
              <span>Relationship *</span>
              <select
                value={t.nomineeRelationship}
                className={fe.nomineeRelationship ? "input-invalid" : ""}
                onChange={(e) =>
                  onUpdate("nomineeRelationship", e.target.value)
                }
              >
                <option value="">Select</option>
                {NOMINEE_RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {fe.nomineeRelationship && (
                <p className="field-error">{fe.nomineeRelationship}</p>
              )}
            </label>
          </div>
        </div>

        {/* ── Emergency Contact ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">Emergency Contact</h5>
          <div className="traveller-card-grid">
            <label>
              <span>Contact Person</span>
              <input
                value={t.emergencyContactPerson}
                onChange={(e) =>
                  onUpdate("emergencyContactPerson", e.target.value)
                }
              />
            </label>
            <label>
              <span>Contact Number</span>
              <input
                value={t.emergencyContactNumber}
                onChange={(e) =>
                  onUpdate("emergencyContactNumber", e.target.value)
                }
              />
            </label>
            <label>
              <span>Contact Email</span>
              <input
                type="email"
                value={t.emergencyEmail}
                onChange={(e) => onUpdate("emergencyEmail", e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* ── Other Details ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">Other Details</h5>
          <div className="traveller-card-grid">
            <label>
              <span>Past Illness</span>
              <input
                value={t.pastIllness}
                onChange={(e) => onUpdate("pastIllness", e.target.value)}
              />
            </label>
            <label>
              <span>Remarks</span>
              <input
                value={t.remarks}
                onChange={(e) => onUpdate("remarks", e.target.value)}
              />
            </label>
            <label>
              <span>CR Reference Number</span>
              <input
                value={t.crReferenceNumber}
                onChange={(e) => onUpdate("crReferenceNumber", e.target.value)}
              />
            </label>
            <label>
              <span>GST Number</span>
              <input
                value={t.gstNumber}
                onChange={(e) => onUpdate("gstNumber", e.target.value)}
              />
            </label>
            <label>
              <span>GST State</span>
              <input
                value={t.gstState}
                onChange={(e) => onUpdate("gstState", e.target.value)}
              />
            </label>
          </div>
        </div>

        {/* ── Plan & Premium ── */}
        <div className="wizard-field-group">
          <h5 className="wizard-field-group__label">
            Plan &amp; Premium
            {isCreate && index > 0 && traveller1 && onSamePlan && (
              <label className="same-as-t1-check">
                <input
                  type="checkbox"
                  checked={t.samePlanAsTraveller1}
                  onChange={(e) => onSamePlan(e.target.checked)}
                />
                <span>Same as Traveller 1</span>
              </label>
            )}
          </h5>
          <div className="traveller-card-grid">
            <label>
              <span>Plan</span>
              {isCreate ? (
                <select
                  value={t.planId}
                  disabled={t.samePlanAsTraveller1}
                  onChange={(e) => onSelectPlan?.(e.target.value)}
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{" "}
                      {Number(p.premiumAmount).toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  value={t.planId}
                  onChange={(e) => onUpdate("planId", e.target.value)}
                />
              )}
            </label>
            <label>
              <span>Premium</span>
              {isCreate ? (
                <input
                  type="text"
                  value={
                    t.premiumAmount > 0
                      ? `₹ ${t.premiumAmount.toLocaleString("en-IN")}`
                      : "—"
                  }
                  readOnly
                  className="input-readonly"
                />
              ) : (
                <input
                  value={t.premiumAmount > 0 ? String(t.premiumAmount) : ""}
                  onChange={(e) => onUpdate("premiumAmount", e.target.value)}
                />
              )}
            </label>
          </div>
        </div>
      </div>
      {/* traveller-entry-card__body */}
    </article>
  );
}
("use client");

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
