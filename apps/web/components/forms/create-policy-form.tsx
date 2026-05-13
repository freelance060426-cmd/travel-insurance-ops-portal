"use client";

import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { ApiPartner, ApiPlan } from "@/lib/api";
import { checkPassport, createPolicy } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { MultiSelect } from "@/components/ui/multi-select";
import { REGION_COUNTRIES, TRAVEL_REGIONS } from "@/lib/travel-constants";
import { tripSchema, type TripFormValues } from "@/lib/schemas";
import {
  TravellerCard,
  type TravellerDraft,
  type TravellerFieldErrors,
} from "@/components/forms/traveller-card";

const today = () => new Date().toISOString().slice(0, 10);

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
    pincodeStatus: "idle",
    sameAddressAsTraveller1: false,
    samePlanAsTraveller1: false,
  };
}

/* ─── component ─── */

type TravellerErrorMap = Record<string, TravellerFieldErrors>; // keyed by _key

const TRAVELLER_REQUIRED: Array<[keyof TravellerDraft, string]> = [
  ["passportNumber", "Passport number is required"],
  ["travellerName", "Name is required"],
  ["gender", "Gender is required"],
  ["dateOfBirth", "Date of birth is required"],
  ["address", "Address is required"],
  ["pincode", "Pincode is required"],
  ["city", "City is required"],
  ["district", "District is required"],
  ["state", "State is required"],
  ["country", "Country is required"],
  ["nominee", "Nominee name is required"],
  ["nomineeRelationship", "Nominee relationship is required"],
];

function validateTravellers(travellers: TravellerDraft[]): TravellerErrorMap {
  const map: TravellerErrorMap = {};
  for (const t of travellers) {
    const fieldErrors: TravellerFieldErrors = {};
    for (const [field, msg] of TRAVELLER_REQUIRED) {
      const val = t[field];
      if (typeof val === "string" && !val.trim()) {
        fieldErrors[field] = msg;
      }
    }
    if (Object.keys(fieldErrors).length > 0) map[t._key] = fieldErrors;
  }
  return map;
}

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

  const defaultPartnerId =
    isPartnerUser && userPartnerId
      ? userPartnerId
      : (initialPartners[0]?.id ?? "");

  const {
    register: registerTrip,
    handleSubmit: handleTripSubmit,
    watch: watchTrip,
    setValue: setTripValue,
    formState: { errors: tripErrors },
  } = useForm<TripFormValues>({
    mode: "onChange",
    resolver: zodResolver(tripSchema),
    defaultValues: {
      travelRegion: "",
      destination: [],
      partnerId: defaultPartnerId,
      startDate: today(),
      endDate: "",
    },
  });

  const tripValues = watchTrip();

  const [travellers, setTravellers] = useState<TravellerDraft[]>([
    freshTraveller(),
  ]);
  const [travellerErrors, setTravellerErrors] = useState<TravellerErrorMap>({});

  const [pending, setPending] = useState(false);

  const tripDays = computeDays(tripValues.startDate, tripValues.endDate);
  const selectedPartner = initialPartners.find(
    (p) => p.id === tripValues.partnerId,
  );

  const applicablePlans = useMemo(
    () =>
      initialPlans.filter((plan) => {
        if (
          tripValues.travelRegion &&
          plan.region &&
          plan.region !== tripValues.travelRegion
        )
          return false;
        if (tripDays > 0) {
          if (plan.minDays != null && tripDays < plan.minDays) return false;
          if (plan.maxDays != null && tripDays > plan.maxDays) return false;
        }
        return true;
      }),
    [initialPlans, tripValues.travelRegion, tripDays],
  );

  const totalPremium = useMemo(
    () => travellers.reduce((sum, t) => sum + t.premiumAmount, 0),
    [travellers],
  );

  function updateTripDays(days: number) {
    if (!tripValues.startDate || days <= 0) return;
    const start = new Date(tripValues.startDate);
    start.setDate(start.getDate() + days);
    setTripValue("endDate", start.toISOString().slice(0, 10), {
      shouldValidate: true,
    });
  }

  function toggleDestination(country: string) {
    const current = tripValues.destination;
    const next = current.includes(country)
      ? current.filter((d) => d !== country)
      : [...current, country];
    setTripValue("destination", next, { shouldValidate: true });
  }

  const availableCountries = tripValues.travelRegion
    ? (REGION_COUNTRIES[tripValues.travelRegion] ?? [])
    : [];

  const ADDRESS_FIELDS: Array<keyof TravellerDraft> = [
    "address",
    "pincode",
    "city",
    "district",
    "state",
    "country",
  ];

  function updateTraveller(
    key: string,
    field: keyof TravellerDraft,
    value: string | number | boolean,
  ) {
    setTravellers((c) => {
      const isT1 = c[0]?._key === key;
      return c.map((t) => {
        if (t._key === key) return { ...t, [field]: value };
        // Sync address fields to T1-linked travellers
        if (
          isT1 &&
          t.sameAddressAsTraveller1 &&
          ADDRESS_FIELDS.includes(field)
        ) {
          return { ...t, [field]: value };
        }
        return t;
      });
    });
    // Clear the error for this field when user changes it
    setTravellerErrors((prev) => {
      if (!prev[key]?.[field]) return prev;
      const updated = { ...prev[key] };
      delete updated[field];
      return Object.keys(updated).length === 0
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
        : { ...prev, [key]: updated };
    });
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
    const premium = plan ? Number(plan.premiumAmount) : 0;
    setTravellers((c) => {
      const isT1 = c[0]?._key === travellerKey;
      return c.map((t) => {
        if (t._key === travellerKey)
          return { ...t, planId, premiumAmount: premium };
        // Sync plan to T1-linked travellers
        if (isT1 && t.samePlanAsTraveller1)
          return { ...t, planId, premiumAmount: premium };
        return t;
      });
    });
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

  async function handlePincodeLookup(travellerKey: string, pin: string) {
    const clean = pin.trim();
    if (clean.length !== 6 || !/^\d{6}$/.test(clean)) return;
    setTravellers((c) =>
      c.map((t) =>
        t._key === travellerKey
          ? { ...t, pincodeStatus: "loading" as const }
          : t,
      ),
    );
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${clean}`);
      const data = await res.json();
      if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        const filled = {
          city: po.Division ?? "",
          district: po.District ?? "",
          state: po.State ?? "",
          country: po.Country === "India" ? "India" : (po.Country ?? ""),
        };
        setTravellers((c) => {
          const isT1 = c[0]?._key === travellerKey;
          return c.map((t) => {
            if (t._key === travellerKey) {
              return {
                ...t,
                pincodeStatus: "done" as const,
                city: filled.city || t.city,
                district: filled.district || t.district,
                state: filled.state || t.state,
                country: filled.country || t.country,
              };
            }
            // Sync auto-filled address to T1-linked travellers
            if (isT1 && t.sameAddressAsTraveller1) {
              return {
                ...t,
                city: filled.city || t.city,
                district: filled.district || t.district,
                state: filled.state || t.state,
                country: filled.country || t.country,
              };
            }
            return t;
          });
        });
        // Clear any field errors for auto-filled fields
        setTravellerErrors((prev) => {
          if (!prev[travellerKey]) return prev;
          const updated = { ...prev[travellerKey] };
          delete updated.city;
          delete updated.district;
          delete updated.state;
          delete updated.country;
          return Object.keys(updated).length === 0
            ? Object.fromEntries(
                Object.entries(prev).filter(([k]) => k !== travellerKey),
              )
            : { ...prev, [travellerKey]: updated };
        });
      } else {
        setTravellers((c) =>
          c.map((t) =>
            t._key === travellerKey
              ? { ...t, pincodeStatus: "not-found" as const }
              : t,
          ),
        );
      }
    } catch {
      setTravellers((c) =>
        c.map((t) =>
          t._key === travellerKey
            ? { ...t, pincodeStatus: "not-found" as const }
            : t,
        ),
      );
    }
  }

  function handleSameAddress(travellerKey: string, checked: boolean) {
    const t1 = travellers[0];
    setTravellers((c) =>
      c.map((t) =>
        t._key === travellerKey
          ? {
              ...t,
              sameAddressAsTraveller1: checked,
              ...(checked && t1
                ? {
                    address: t1.address,
                    pincode: t1.pincode,
                    city: t1.city,
                    district: t1.district,
                    state: t1.state,
                    country: t1.country,
                  }
                : {}),
            }
          : t,
      ),
    );
  }

  function handleSamePlan(travellerKey: string, checked: boolean) {
    const t1 = travellers[0];
    setTravellers((c) =>
      c.map((t) =>
        t._key === travellerKey
          ? {
              ...t,
              samePlanAsTraveller1: checked,
              ...(checked && t1
                ? {
                    planId: t1.planId,
                    premiumAmount: t1.premiumAmount,
                  }
                : {}),
            }
          : t,
      ),
    );
  }

  async function handleSave() {
    if (!tripValues.partnerId && !isPartnerUser) {
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
        partnerId: tripValues.partnerId,
        issueDate: today(),
        startDate: tripValues.startDate,
        endDate: tripValues.endDate,
        insurerName: "Bajaj Allianz",
        travelRegion: tripValues.travelRegion || undefined,
        destination:
          tripValues.destination.length > 0
            ? tripValues.destination.join(", ")
            : undefined,
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

  const goNext = handleTripSubmit(
    // step 1 valid: advance
    () => {
      if (step === 1) {
        setStep(2);
        return;
      }
    },
    // step 1 invalid: RHF shows inline errors, do nothing
    () => {},
  );

  function goNextStep2() {
    const errors = validateTravellers(travellers);
    if (Object.keys(errors).length > 0) {
      setTravellerErrors(errors);
      // Scroll to first error
      const firstBadKey = Object.keys(errors)[0];
      document
        .querySelector(`[data-traveller-key="${firstBadKey}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setTravellerErrors({});
    setStep(3);
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
              <span className="workflow-step__index !flex">
                {status === "done" ? (
                  <svg
                    style={{ display: "block" }}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  num
                )}
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
            <label className={tripErrors.travelRegion ? "has-error" : ""}>
              <span>Travel Region</span>
              <select
                {...registerTrip("travelRegion")}
                className={tripErrors.travelRegion ? "input-invalid" : ""}
                onChange={(e) => {
                  setTripValue("travelRegion", e.target.value, {
                    shouldValidate: true,
                  });
                  setTripValue("destination", [], { shouldValidate: true });
                }}
              >
                <option value="">Select Travel Region</option>
                {TRAVEL_REGIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              {tripErrors.travelRegion && (
                <p className="field-error">{tripErrors.travelRegion.message}</p>
              )}
            </label>
            <label className={tripErrors.destination ? "has-error" : ""}>
              <span>
                Destination
                {tripValues.destination.length > 0
                  ? ` (${tripValues.destination.length})`
                  : ""}
              </span>
              <MultiSelect
                options={availableCountries}
                selected={tripValues.destination}
                onChange={(selected) =>
                  setTripValue("destination", selected, {
                    shouldValidate: true,
                  })
                }
                placeholder="Select countries"
                disabled={!tripValues.travelRegion}
                disabledMessage="Select a region first"
              />
              {tripErrors.destination && (
                <p className="field-error">{tripErrors.destination.message}</p>
              )}
            </label>
            {!isPartnerUser && (
              <label className={tripErrors.partnerId ? "has-error" : ""}>
                <span>Partner *</span>
                <select
                  {...registerTrip("partnerId")}
                  className={tripErrors.partnerId ? "input-invalid" : ""}
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
                {tripErrors.partnerId && (
                  <p className="field-error">{tripErrors.partnerId.message}</p>
                )}
              </label>
            )}
            <label className={tripErrors.startDate ? "has-error" : ""}>
              <span>Travel Start *</span>
              <input
                type="date"
                {...registerTrip("startDate")}
                className={tripErrors.startDate ? "input-invalid" : ""}
              />
              {tripErrors.startDate && (
                <p className="field-error">{tripErrors.startDate.message}</p>
              )}
            </label>
            <label className={tripErrors.endDate ? "has-error" : ""}>
              <span>Travel End *</span>
              <input
                type="date"
                {...registerTrip("endDate")}
                className={tripErrors.endDate ? "input-invalid" : ""}
              />
              {tripErrors.endDate && (
                <p className="field-error">{tripErrors.endDate.message}</p>
              )}
            </label>
            <label>
              <span>Trip Days</span>
              <input
                type="number"
                min="1"
                value={tripDays > 0 ? tripDays : ""}
                placeholder="—"
                onChange={(e) => {
                  const days = parseInt(e.target.value, 10);
                  if (days > 0) updateTripDays(days);
                }}
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
          </div>

          <div className="traveller-stack">
            {travellers.map((t, index) => (
              <TravellerCard
                key={t._key}
                traveller={t}
                index={index}
                plans={applicablePlans}
                canRemove={travellers.length > 1}
                fieldErrors={travellerErrors[t._key] ?? {}}
                traveller1={index > 0 ? (travellers[0] ?? null) : null}
                onUpdate={(field, value) =>
                  updateTraveller(t._key, field, value)
                }
                onSelectPlan={(planId) => selectPlan(t._key, planId)}
                onRemove={() => removeTraveller(t._key)}
                onPassportBlur={() =>
                  doPassportLookup(t._key, t.passportNumber)
                }
                onPincodeBlur={() => handlePincodeLookup(t._key, t.pincode)}
                onSameAddress={(checked) => handleSameAddress(t._key, checked)}
                onSamePlan={(checked) => handleSamePlan(t._key, checked)}
              />
            ))}
          </div>

          <div className="action-row">
            <button className="ghost-button" type="button" onClick={goBack}>
              ← Back
            </button>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="ghost-button"
                type="button"
                onClick={addTraveller}
              >
                + Add Traveller
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={goNextStep2}
              >
                Next → Review & Confirm
              </button>
            </div>
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
                  <strong>{tripValues.travelRegion || "—"}</strong>
                </div>
                <div>
                  <span>Destination</span>
                  <strong>
                    {tripValues.destination.length > 0
                      ? tripValues.destination.join(", ")
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Start date</span>
                  <strong>
                    {tripValues.startDate
                      ? tripValues.startDate.split("-").reverse().join("-")
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>End date</span>
                  <strong>
                    {tripValues.endDate
                      ? tripValues.endDate.split("-").reverse().join("-")
                      : "—"}
                  </strong>
                </div>
                <div>
                  <span>Trip days</span>
                  <strong>{tripDays ?? "—"}</strong>
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
                          <td>
                            {t.dateOfBirth
                              ? t.dateOfBirth.split("-").reverse().join("-")
                              : "—"}
                          </td>
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
