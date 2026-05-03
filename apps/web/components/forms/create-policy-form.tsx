"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiPartner, ApiPlan } from "@/lib/api";
import { checkPassport, createPolicy } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";

/* ─── constants ─── */

const TRAVEL_REGIONS = ["Asia", "Europe", "Americas", "Worldwide"];

const NOMINEE_RELATIONSHIPS = [
  "Father",
  "Mother",
  "Spouse",
  "Brother",
  "Sister",
  "Son",
  "Daughter",
  "Uncle",
  "Aunty",
  "Friend",
  "Others",
];

const today = () => new Date().toISOString().slice(0, 10);

/* ─── types ─── */

type TravellerDraft = {
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
};

type TripDraft = {
  travelRegion: string;
  destination: string;
  partnerId: string;
  startDate: string;
  endDate: string;
};

/* ─── helpers ─── */

function computeDays(start: string, end: string) {
  if (!start || !end) return 0;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return ms > 0 ? Math.ceil(ms / (1000 * 60 * 60 * 24)) : 0;
}

function computeAge(dob: string) {
  if (!dob) return null;
  const birth = new Date(dob);
  const diff = Date.now() - birth.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function freshTraveller(): TravellerDraft {
  return {
    _key: crypto.randomUUID(),
    passportNumber: "",
    travellerName: "",
    gender: "",
    dateOfBirth: "",
    nominee: "",
    nomineeRelationship: "",
    address: "",
    pincode: "",
    city: "",
    district: "",
    state: "",
    country: "",
    email: "",
    mobile: "",
    remarks: "",
    crReferenceNumber: "",
    pastIllness: "",
    emergencyContactPerson: "",
    emergencyContactNumber: "",
    emergencyEmail: "",
    gstNumber: "",
    gstState: "",
    planId: "",
    premiumAmount: 0,
    lookupStatus: "idle",
  };
}

/* ─── component ─── */

export function CreatePolicyForm({
  initialPartners,
  initialPlans,
  userRole = "SUPER_ADMIN",
  userPartnerId = null,
}: {
  initialPartners: ApiPartner[];
  initialPlans: ApiPlan[];
  userRole?: string;
  userPartnerId?: string | null;
}) {
  const router = useRouter();
  const { token } = useAuth();

  const isPartnerUser = userRole === "PARTNER";

  const [step, setStep] = useState(1);

  const [trip, setTrip] = useState<TripDraft>({
    travelRegion: "",
    destination: "",
    partnerId:
      isPartnerUser && userPartnerId
        ? userPartnerId
        : (initialPartners[0]?.id ?? ""),
    startDate: today(),
    endDate: "",
  });

  const [travellers, setTravellers] = useState<TravellerDraft[]>([
    freshTraveller(),
  ]);

  const [pending, setPending] = useState(false);

  const tripDays = computeDays(trip.startDate, trip.endDate);
  const selectedPartner = initialPartners.find((p) => p.id === trip.partnerId);

  const applicablePlans = useMemo(
    () =>
      initialPlans.filter((plan) => {
        if (
          trip.travelRegion &&
          plan.region &&
          plan.region !== trip.travelRegion
        )
          return false;
        if (tripDays > 0) {
          if (plan.minDays != null && tripDays < plan.minDays) return false;
          if (plan.maxDays != null && tripDays > plan.maxDays) return false;
        }
        return true;
      }),
    [initialPlans, trip.travelRegion, tripDays],
  );

  const totalPremium = useMemo(
    () => travellers.reduce((sum, t) => sum + t.premiumAmount, 0),
    [travellers],
  );

  function updateTrip<K extends keyof TripDraft>(key: K, value: TripDraft[K]) {
    setTrip((c) => ({ ...c, [key]: value }));
  }

  function updateTraveller(
    key: string,
    field: keyof TravellerDraft,
    value: string | number | boolean,
  ) {
    setTravellers((c) =>
      c.map((t) => (t._key === key ? { ...t, [field]: value } : t)),
    );
  }

  function removeTraveller(key: string) {
    setTravellers((c) =>
      c.length === 1 ? c : c.filter((t) => t._key !== key),
    );
  }

  function addTraveller() {
    setTravellers((c) => [...c, freshTraveller()]);
  }

  function selectPlan(travellerKey: string, planId: string) {
    const plan = applicablePlans.find((p) => p.id === planId);
    setTravellers((c) =>
      c.map((t) =>
        t._key === travellerKey
          ? {
              ...t,
              planId,
              premiumAmount: plan ? Number(plan.premiumAmount) : 0,
            }
          : t,
      ),
    );
  }

  const doPassportLookup = useCallback(
    async (travellerKey: string, passport: string) => {
      const normalized = passport.trim().toUpperCase();
      if (!normalized) return;

      updateTraveller(travellerKey, "lookupStatus", "checking");

      try {
        const result = await checkPassport(normalized, token ?? undefined);
        if (result.exists && result.traveller) {
          setTravellers((c) =>
            c.map((t) =>
              t._key === travellerKey
                ? {
                    ...t,
                    passportNumber: normalized,
                    travellerName:
                      result.traveller!.travellerName || t.travellerName,
                    gender: result.traveller!.gender || t.gender,
                    dateOfBirth: result.traveller!.dateOfBirth
                      ? result.traveller!.dateOfBirth.slice(0, 10)
                      : t.dateOfBirth,
                    nominee: result.traveller!.nominee || t.nominee,
                    nomineeRelationship:
                      result.traveller!.nomineeRelationship ||
                      t.nomineeRelationship,
                    address: result.traveller!.address || t.address,
                    pincode: result.traveller!.pincode || t.pincode,
                    city: result.traveller!.city || t.city,
                    district: result.traveller!.district || t.district,
                    state: result.traveller!.state || t.state,
                    country: result.traveller!.country || t.country,
                    email: result.traveller!.email || t.email,
                    mobile: result.traveller!.mobile || t.mobile,
                    emergencyContactPerson:
                      result.traveller!.emergencyContactPerson ||
                      t.emergencyContactPerson,
                    emergencyContactNumber:
                      result.traveller!.emergencyContactNumber ||
                      t.emergencyContactNumber,
                    emergencyEmail:
                      result.traveller!.emergencyEmail || t.emergencyEmail,
                    lookupStatus: "found" as const,
                  }
                : t,
            ),
          );
          toast.info(
            `Existing policy ${result.policyNumber} found for this passport. Fields autofilled.`,
          );
        } else {
          updateTraveller(travellerKey, "lookupStatus", "not-found");
        }
      } catch {
        updateTraveller(travellerKey, "lookupStatus", "not-found");
      }
    },
    [token],
  );

  async function handleSave() {
    if (!trip.partnerId && !isPartnerUser) {
      toast.error("Select a partner before saving.");
      return;
    }
    if (travellers.every((t) => !t.travellerName.trim())) {
      toast.error("At least one traveller name is required.");
      return;
    }

    setPending(true);
    const toastId = toast.loading("Creating policy...");

    try {
      const payload = {
        policyNumber: `IC${Date.now().toString().slice(-6)}`,
        partnerId: trip.partnerId,
        issueDate: today(),
        startDate: trip.startDate,
        endDate: trip.endDate,
        insurerName: "Bajaj Allianz",
        travelRegion: trip.travelRegion || undefined,
        destination: trip.destination || undefined,
        tripDays: tripDays || undefined,
        primaryTravellerName:
          travellers[0]?.travellerName || "Primary traveller",
        customerEmail: travellers[0]?.email || "",
        customerMobile: travellers[0]?.mobile || "",
        premiumAmount: totalPremium,
        travellers: travellers.map((t) => {
          const age = computeAge(t.dateOfBirth);
          return {
            travellerName: t.travellerName || "Unnamed traveller",
            passportNumber: t.passportNumber || "UNKNOWN",
            gender: t.gender || undefined,
            dateOfBirth: t.dateOfBirth || undefined,
            age: age ?? undefined,
            nominee: t.nominee || undefined,
            nomineeRelationship: t.nomineeRelationship || undefined,
            address: t.address || undefined,
            pincode: t.pincode || undefined,
            city: t.city || undefined,
            district: t.district || undefined,
            state: t.state || undefined,
            country: t.country || undefined,
            email: t.email || undefined,
            mobile: t.mobile || undefined,
            remarks: t.remarks || undefined,
            crReferenceNumber: t.crReferenceNumber || undefined,
            pastIllness: t.pastIllness || undefined,
            emergencyContactPerson: t.emergencyContactPerson || undefined,
            emergencyContactNumber: t.emergencyContactNumber || undefined,
            emergencyEmail: t.emergencyEmail || undefined,
            gstNumber: t.gstNumber || undefined,
            gstState: t.gstState || undefined,
            planName:
              applicablePlans.find((p) => p.id === t.planId)?.name || undefined,
            premiumAmount: t.premiumAmount || undefined,
          };
        }),
      };

      const created = await createPolicy(payload, token ?? undefined);
      toast.success(`Policy ${created.policyNumber} created.`, { id: toastId });
      router.push(`/policies/${created.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create policy.",
        { id: toastId },
      );
      setPending(false);
    }
  }

  function goNext() {
    if (step === 1) {
      if (!trip.partnerId && !isPartnerUser) {
        toast.error("Select a partner to continue.");
        return;
      }
      if (!trip.startDate || !trip.endDate) {
        toast.error("Travel start and end dates are required.");
        return;
      }
    }
    if (step === 2) {
      if (travellers.every((t) => !t.travellerName.trim())) {
        toast.error("Enter at least one traveller name.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setStep((s) => Math.max(s - 1, 1));
  }

  const stepsMeta = [
    { label: "Trip Details", detail: "Region, partner, dates" },
    {
      label: "Traveller Details",
      detail: `${travellers.length} traveller${travellers.length === 1 ? "" : "s"}`,
    },
    {
      label: "Review & Confirm",
      detail: `₹ ${totalPremium.toLocaleString("en-IN")}`,
    },
  ];

  return (
    <div className="page-stack">
      <section className="content-card policy-intro-card">
        <div className="policy-intro-card__copy">
          <p className="portal-eyebrow">NEW POLICY</p>
          <h1 className="page-title">Create travel policy</h1>
          <p className="page-subtitle">
            Capture trip, traveller, and plan details through a guided flow.
          </p>
        </div>
        <div className="policy-intro-card__meta">
          <div>
            <span>Partner</span>
            <strong>{selectedPartner?.name ?? "Not selected"}</strong>
          </div>
          <div>
            <span>Travellers</span>
            <strong>{travellers.length}</strong>
          </div>
          <div>
            <span>Premium</span>
            <strong>₹ {totalPremium.toLocaleString("en-IN")}</strong>
          </div>
        </div>
      </section>

      <section className="workflow-stepper workflow-stepper--3">
        {stepsMeta.map((s, i) => {
          const num = i + 1;
          const status =
            num < step ? "done" : num === step ? "active" : "pending";
          return (
            <button
              key={s.label}
              type="button"
              className={`workflow-step workflow-step--${status}`}
              onClick={() => num < step && setStep(num)}
              disabled={num > step}
            >
              <span className="workflow-step__index">
                {status === "done" ? "✓" : num}
              </span>
              <div>
                <strong>{s.label}</strong>
                <span>{s.detail}</span>
              </div>
            </button>
          );
        })}
      </section>

      {step === 1 && (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">STEP 1</p>
              <h3>Trip details</h3>
            </div>
          </div>

          <div className="form-grid form-grid--policy-header">
            <label>
              <span>Travel Region</span>
              <select
                value={trip.travelRegion}
                onChange={(e) => updateTrip("travelRegion", e.target.value)}
              >
                <option value="">Select region</option>
                {TRAVEL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Destination</span>
              <input
                value={trip.destination}
                placeholder="Country name(s)"
                onChange={(e) => updateTrip("destination", e.target.value)}
              />
            </label>
            {!isPartnerUser && (
              <label>
                <span>Partner *</span>
                <select
                  value={trip.partnerId}
                  onChange={(e) => updateTrip("partnerId", e.target.value)}
                >
                  <option value="">Select partner</option>
                  {initialPartners
                    .filter((p) => p.status === "ACTIVE")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.partnerCode})
                      </option>
                    ))}
                </select>
              </label>
            )}
            <label>
              <span>Travel Start *</span>
              <input
                type="date"
                value={trip.startDate}
                onChange={(e) => updateTrip("startDate", e.target.value)}
              />
            </label>
            <label>
              <span>Travel End *</span>
              <input
                type="date"
                value={trip.endDate}
                onChange={(e) => updateTrip("endDate", e.target.value)}
              />
            </label>
            <label>
              <span>Trip Days</span>
              <input
                type="text"
                value={tripDays > 0 ? `${tripDays} days` : "—"}
                readOnly
                className="input-readonly"
              />
            </label>
          </div>

          <div className="action-row">
            <span />
            <button className="primary-button" type="button" onClick={goNext}>
              Next → Traveller Details
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">STEP 2</p>
              <h3>Traveller details</h3>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={addTraveller}
            >
              + Add Traveller
            </button>
          </div>

          <div className="traveller-stack">
            {travellers.map((t, index) => (
              <TravellerCard
                key={t._key}
                traveller={t}
                index={index}
                plans={applicablePlans}
                canRemove={travellers.length > 1}
                onUpdate={(field, value) =>
                  updateTraveller(t._key, field, value)
                }
                onSelectPlan={(planId) => selectPlan(t._key, planId)}
                onRemove={() => removeTraveller(t._key)}
                onPassportBlur={() =>
                  doPassportLookup(t._key, t.passportNumber)
                }
              />
            ))}
          </div>

          <div className="action-row">
            <button className="ghost-button" type="button" onClick={goBack}>
              ← Back
            </button>
            <button className="primary-button" type="button" onClick={goNext}>
              Next → Review & Confirm
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">STEP 3</p>
              <h3>Review & confirm</h3>
            </div>
          </div>

          <div className="review-grid">
            <div className="review-section">
              <h4 className="partner-section-label">Trip Summary</h4>
              <div className="summary-pairs">
                <div>
                  <span>Partner</span>
                  <strong>{selectedPartner?.name ?? "—"}</strong>
                </div>
                <div>
                  <span>Region</span>
                  <strong>{trip.travelRegion || "—"}</strong>
                </div>
                <div>
                  <span>Destination</span>
                  <strong>{trip.destination || "—"}</strong>
                </div>
                <div>
                  <span>Travel window</span>
                  <strong>
                    {trip.startDate} to {trip.endDate} ({tripDays} days)
                  </strong>
                </div>
              </div>
            </div>

            <div className="review-section">
              <h4 className="partner-section-label">
                Travellers ({travellers.length})
              </h4>
              <div className="table-shell">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Passport</th>
                      <th>Gender</th>
                      <th>DOB</th>
                      <th>Plan</th>
                      <th>Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travellers.map((t, i) => {
                      const plan = applicablePlans.find(
                        (p) => p.id === t.planId,
                      );
                      return (
                        <tr key={t._key}>
                          <td>{i + 1}</td>
                          <td>{t.travellerName || "—"}</td>
                          <td>{t.passportNumber || "—"}</td>
                          <td>{t.gender || "—"}</td>
                          <td>{t.dateOfBirth || "—"}</td>
                          <td>{plan?.name || "—"}</td>
                          <td>₹ {t.premiumAmount.toLocaleString("en-IN")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="review-section">
              <h4 className="partner-section-label">Payment Breakdown</h4>
              <div className="summary-pairs">
                <div>
                  <span>Subtotal</span>
                  <strong>₹ {totalPremium.toLocaleString("en-IN")}</strong>
                </div>
                <div>
                  <span>GST (18%)</span>
                  <strong>
                    ₹ {Math.round(totalPremium * 0.18).toLocaleString("en-IN")}
                  </strong>
                </div>
                <div>
                  <span>Total</span>
                  <strong>
                    ₹ {Math.round(totalPremium * 1.18).toLocaleString("en-IN")}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          <div className="action-row">
            <button className="ghost-button" type="button" onClick={goBack}>
              ← Back
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={handleSave}
              disabled={pending}
            >
              {pending ? "Creating..." : "Confirm & Create Policy"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

/* ─── traveller card sub-component ─── */

function TravellerCard({
  traveller: t,
  index,
  plans,
  canRemove,
  onUpdate,
  onSelectPlan,
  onRemove,
  onPassportBlur,
}: {
  traveller: TravellerDraft;
  index: number;
  plans: ApiPlan[];
  canRemove: boolean;
  onUpdate: (field: keyof TravellerDraft, value: string) => void;
  onSelectPlan: (planId: string) => void;
  onRemove: () => void;
  onPassportBlur: () => void;
}) {
  const age = computeAge(t.dateOfBirth);

  return (
    <article className="traveller-entry-card">
      <div className="traveller-entry-card__header">
        <div className="traveller-title-row">
          <span className="traveller-index-pill">{index + 1}</span>
          <div>
            <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
            <h4>{t.travellerName || "New traveller"}</h4>
          </div>
        </div>
        <div className="traveller-meta-row">
          {t.lookupStatus === "found" && (
            <span className="status-pill status-active">Autofilled</span>
          )}
          {t.lookupStatus === "checking" && (
            <span className="status-pill status-draft">Checking...</span>
          )}
          {canRemove && (
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

      <div className="wizard-field-group">
        <h5 className="wizard-field-group__label">Identity</h5>
        <div className="traveller-card-grid">
          <label>
            <span>Passport Number *</span>
            <div className="passport-row">
              <input
                value={t.passportNumber}
                placeholder="Enter passport number"
                onChange={(e) =>
                  onUpdate("passportNumber", e.target.value.toUpperCase())
                }
                onBlur={onPassportBlur}
              />
            </div>
          </label>
          <label>
            <span>Name *</span>
            <input
              value={t.travellerName}
              onChange={(e) => onUpdate("travellerName", e.target.value)}
            />
          </label>
          <label>
            <span>Gender *</span>
            <select
              value={t.gender}
              onChange={(e) => onUpdate("gender", e.target.value)}
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </label>
          <label>
            <span>Date of Birth *</span>
            <input
              type="date"
              value={t.dateOfBirth}
              onChange={(e) => onUpdate("dateOfBirth", e.target.value)}
            />
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

      <div className="wizard-field-group">
        <h5 className="wizard-field-group__label">Contact</h5>
        <div className="traveller-card-grid">
          <label>
            <span>Email *</span>
            <input
              type="email"
              value={t.email}
              onChange={(e) => onUpdate("email", e.target.value)}
            />
          </label>
          <label>
            <span>Mobile *</span>
            <input
              value={t.mobile}
              onChange={(e) => onUpdate("mobile", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="wizard-field-group">
        <h5 className="wizard-field-group__label">Address</h5>
        <div className="traveller-card-grid">
          <label className="span-full">
            <span>Address *</span>
            <input
              value={t.address}
              onChange={(e) => onUpdate("address", e.target.value)}
            />
          </label>
          <label>
            <span>Pincode *</span>
            <input
              value={t.pincode}
              onChange={(e) => onUpdate("pincode", e.target.value)}
            />
          </label>
          <label>
            <span>City *</span>
            <input
              value={t.city}
              onChange={(e) => onUpdate("city", e.target.value)}
            />
          </label>
          <label>
            <span>District *</span>
            <input
              value={t.district}
              onChange={(e) => onUpdate("district", e.target.value)}
            />
          </label>
          <label>
            <span>State *</span>
            <input
              value={t.state}
              onChange={(e) => onUpdate("state", e.target.value)}
            />
          </label>
          <label>
            <span>Country *</span>
            <input
              value={t.country}
              onChange={(e) => onUpdate("country", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="wizard-field-group">
        <h5 className="wizard-field-group__label">Nominee</h5>
        <div className="traveller-card-grid">
          <label>
            <span>Nominee Name *</span>
            <input
              value={t.nominee}
              onChange={(e) => onUpdate("nominee", e.target.value)}
            />
          </label>
          <label>
            <span>Relationship *</span>
            <select
              value={t.nomineeRelationship}
              onChange={(e) => onUpdate("nomineeRelationship", e.target.value)}
            >
              <option value="">Select</option>
              {NOMINEE_RELATIONSHIPS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

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

      <div className="wizard-field-group">
        <h5 className="wizard-field-group__label">Plan & Premium</h5>
        <div className="traveller-card-grid">
          <label>
            <span>Plan</span>
            <select
              value={t.planId}
              onChange={(e) => onSelectPlan(e.target.value)}
            >
              <option value="">Select plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ₹ {Number(p.premiumAmount).toLocaleString("en-IN")}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Premium</span>
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
          </label>
        </div>
      </div>
    </article>
  );
}
