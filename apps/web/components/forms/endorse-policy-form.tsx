"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endorsePolicy } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { TRAVEL_REGIONS, REGION_COUNTRIES } from "@/lib/travel-constants";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  TravellerCard,
  type TravellerDraft,
  type TravellerFieldErrors,
} from "@/components/forms/traveller-card";

type EndorsePolicyViewModel = {
  id: string;
  policyNumber: string;
  partner: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  travelRegion: string;
  destination: string;
  status: string;
  travellers: ReadonlyArray<{
    name: string;
    passport: string;
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
    plan: string;
    premium: string;
    remarks: string;
    pastIllness: string;
    crReferenceNumber: string;
    emergencyContactPerson: string;
    emergencyContactNumber: string;
    emergencyEmail: string;
    gstNumber: string;
    gstState: string;
  }>;
};

/* ─── helpers ─── */

type TravellerErrorMap = Record<string, TravellerFieldErrors>;

const ENDORSE_REQUIRED: Array<[keyof TravellerDraft, string]> = [
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

function validateEndorseTravellers(
  travellers: TravellerDraft[],
): TravellerErrorMap {
  const map: TravellerErrorMap = {};
  for (const t of travellers) {
    const fieldErrors: TravellerFieldErrors = {};
    for (const [field, msg] of ENDORSE_REQUIRED) {
      const val = t[field];
      if (typeof val === "string" && !val.trim()) fieldErrors[field] = msg;
    }
    if (Object.keys(fieldErrors).length > 0) map[t._key] = fieldErrors;
  }
  return map;
}

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

async function lookupPincode(pin: string) {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();
    if (data?.[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      const po = data[0].PostOffice[0];
      return {
        city: po.Block || po.Name || "",
        district: po.District || "",
        state: po.State || "",
        country: "India",
      };
    }
  } catch {
    // ignore network errors
  }
  return null;
}

/* ─── component ─── */

export function EndorsePolicyForm({
  policy,
}: {
  policy: EndorsePolicyViewModel;
}) {
  const router = useRouter();
  const { token } = useAuth();

  const [startDate, setStartDate] = useState(policy.startDate);
  const [endDate, setEndDate] = useState(policy.endDate);
  const [travelRegion, setTravelRegion] = useState(policy.travelRegion);
  const [destination, setDestination] = useState<string[]>(
    policy.destination ? policy.destination.split(", ").filter(Boolean) : [],
  );
  const availableCountries = travelRegion
    ? (REGION_COUNTRIES[travelRegion] ?? [])
    : [];
  const [reason, setReason] = useState(
    "Traveller correction and travel date update",
  );

  const [travellers, setTravellers] = useState<TravellerDraft[]>(
    policy.travellers.map((t, index) => ({
      _key: `${policy.id}-${index}`,
      travellerName: t.name,
      passportNumber: t.passport,
      gender: t.gender,
      dateOfBirth: t.dateOfBirth,
      nominee: t.nominee,
      nomineeRelationship: t.nomineeRelationship,
      address: t.address,
      pincode: t.pincode,
      city: t.city,
      district: t.district,
      state: t.state,
      country: t.country || "India",
      email: t.email,
      mobile: t.mobile,
      planId: t.plan,
      premiumAmount: Number(String(t.premium).replace(/[^\d.]/g, "")) || 0,
      remarks: t.remarks,
      pastIllness: t.pastIllness,
      crReferenceNumber: t.crReferenceNumber,
      emergencyContactPerson: t.emergencyContactPerson,
      emergencyContactNumber: t.emergencyContactNumber,
      emergencyEmail: t.emergencyEmail,
      gstNumber: t.gstNumber,
      gstState: t.gstState,
      lookupStatus: "idle" as const,
      pincodeStatus: "idle" as const,
      sameAddressAsTraveller1: false,
      samePlanAsTraveller1: false,
    })),
  );

  const [pending, setPending] = useState(false);
  const [travellerErrors, setTravellerErrors] = useState<TravellerErrorMap>({});
  const [tripErrors, setTripErrors] = useState<{
    travelRegion?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    reason?: string;
  }>({});

  const tripDays = computeDays(startDate, endDate);

  function updateTripDays(days: number) {
    if (!startDate || days <= 0) return;
    const start = new Date(startDate);
    start.setDate(start.getDate() + days);
    const newEnd = start.toISOString().slice(0, 10);
    setEndDate(newEnd);
    if (tripErrors.endDate)
      setTripErrors((p) => ({ ...p, endDate: undefined }));
  }

  function validateTrip() {
    const errs: typeof tripErrors = {};
    if (!travelRegion) errs.travelRegion = "Travel region is required";
    if (travelRegion && destination.length === 0)
      errs.destination = "At least one destination is required";
    if (!startDate) errs.startDate = "Start date is required";
    if (!endDate) {
      errs.endDate = "End date is required";
    } else if (startDate && endDate <= startDate) {
      errs.endDate = "End date must be after start date";
    }
    if (!reason.trim()) errs.reason = "Endorsement reason is required";
    setTripErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function updateTraveller(
    key: string,
    field: keyof TravellerDraft,
    value: string,
  ) {
    setTravellers((current) =>
      current.map((t) => (t._key === key ? { ...t, [field]: value } : t)),
    );
    setTravellerErrors((prev) => {
      if (!prev[key]?.[field]) return prev;
      const updated = { ...prev[key] };
      delete updated[field];
      return Object.keys(updated).length === 0
        ? Object.fromEntries(Object.entries(prev).filter(([k]) => k !== key))
        : { ...prev, [key]: updated };
    });
  }

  async function handlePincodeLookup(key: string, pin: string) {
    if (!pin || pin.length !== 6) return;
    setTravellers((curr) =>
      curr.map((t) =>
        t._key === key ? { ...t, pincodeStatus: "loading" as const } : t,
      ),
    );
    const result = await lookupPincode(pin);
    if (result) {
      setTravellers((curr) =>
        curr.map((t) =>
          t._key === key
            ? { ...t, ...result, pincodeStatus: "done" as const }
            : t,
        ),
      );
    } else {
      setTravellers((curr) =>
        curr.map((t) =>
          t._key === key ? { ...t, pincodeStatus: "not-found" as const } : t,
        ),
      );
    }
  }

  async function handleSaveEndorsement() {
    const tripOk = validateTrip();
    const travellerErrorMap = validateEndorseTravellers(travellers);
    const travellerOk = Object.keys(travellerErrorMap).length === 0;

    if (!tripOk || !travellerOk) {
      setTravellerErrors(travellerErrorMap);
      if (!tripOk && !travellerOk) {
        toast.error(
          "Please fix the trip details and required traveller fields.",
        );
      } else if (!tripOk) {
        toast.error("Please fix the trip details above.");
      } else {
        toast.error("Please fill in all required traveller fields.");
        document
          .querySelector(
            `[data-traveller-key="${Object.keys(travellerErrorMap)[0]}"]`,
          )
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    setPending(true);
    const toastId = toast.loading("Saving endorsement...");

    try {
      await endorsePolicy(
        policy.id,
        {
          startDate,
          endDate,
          reason,
          travelRegion: travelRegion || undefined,
          destination:
            destination.length > 0 ? destination.join(", ") : undefined,
          travellers: travellers.map((t) => ({
            travellerName: t.travellerName,
            passportNumber: t.passportNumber,
            gender: t.gender || undefined,
            dateOfBirth: t.dateOfBirth || undefined,
            age: computeAge(t.dateOfBirth) ?? undefined,
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
            planName: t.planId || undefined,
            premiumAmount: t.premiumAmount || 0,
            remarks: t.remarks || undefined,
            pastIllness: t.pastIllness || undefined,
            crReferenceNumber: t.crReferenceNumber || undefined,
            emergencyContactPerson: t.emergencyContactPerson || undefined,
            emergencyContactNumber: t.emergencyContactNumber || undefined,
            emergencyEmail: t.emergencyEmail || undefined,
            gstNumber: t.gstNumber || undefined,
            gstState: t.gstState || undefined,
          })),
        },
        token ?? undefined,
      );

      toast.success("Endorsement saved.", { id: toastId });
      router.push(`/policies/${policy.id}`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save endorsement.",
        { id: toastId },
      );
      setPending(false);
    }
  }

  return (
    <div className="page-stack">
      <section className="page-compact-header">
        <div>
          <p className="portal-eyebrow">ENDORSE POLICY</p>
          <h2>{policy.policyNumber}</h2>
          <span>{policy.partner}</span>
        </div>

        <div className="action-button-row">
          <span className={`status-pill status-${policy.status.toLowerCase()}`}>
            {policy.status}
          </span>
        </div>
      </section>

      {/* ─── Main content card ─── */}
      <section className="content-card">
        {/* Trip / Header */}
        <div className="section-heading">
          <div>
            <p className="portal-eyebrow">TRIP &amp; POLICY HEADER</p>
            <h3>Policy updates</h3>
          </div>
        </div>

        <div className="form-grid form-grid--policy-header">
          <label className={tripErrors.travelRegion ? "has-error" : ""}>
            <span>Travel Region *</span>
            <select
              value={travelRegion}
              className={tripErrors.travelRegion ? "input-invalid" : ""}
              onChange={(e) => {
                setTravelRegion(e.target.value);
                setDestination([]);
                if (tripErrors.travelRegion)
                  setTripErrors((p) => ({
                    ...p,
                    travelRegion: undefined,
                    destination: undefined,
                  }));
              }}
            >
              <option value="">Select region</option>
              {TRAVEL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            {tripErrors.travelRegion && (
              <p className="field-error">{tripErrors.travelRegion}</p>
            )}
          </label>
          <label className={tripErrors.destination ? "has-error" : ""}>
            <span>
              Destination *
              {destination.length > 0 ? ` (${destination.length})` : ""}
            </span>
            <MultiSelect
              options={availableCountries}
              selected={destination}
              onChange={(val) => {
                setDestination(val);
                if (tripErrors.destination)
                  setTripErrors((p) => ({ ...p, destination: undefined }));
              }}
              placeholder="Select countries"
              disabled={!travelRegion}
              disabledMessage="Select a region first"
            />
            {tripErrors.destination && (
              <p className="field-error">{tripErrors.destination}</p>
            )}
          </label>
          <label>
            <span>Issue Date</span>
            <input type="date" value={policy.issueDate} readOnly />
          </label>
          <label className={tripErrors.startDate ? "has-error" : ""}>
            <span>Travel Start *</span>
            <input
              type="date"
              value={startDate}
              className={tripErrors.startDate ? "input-invalid" : ""}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (tripErrors.startDate)
                  setTripErrors((p) => ({ ...p, startDate: undefined }));
              }}
            />
            {tripErrors.startDate && (
              <p className="field-error">{tripErrors.startDate}</p>
            )}
          </label>
          <label className={tripErrors.endDate ? "has-error" : ""}>
            <span>Travel End *</span>
            <input
              type="date"
              value={endDate}
              className={tripErrors.endDate ? "input-invalid" : ""}
              onChange={(e) => {
                setEndDate(e.target.value);
                if (tripErrors.endDate)
                  setTripErrors((p) => ({ ...p, endDate: undefined }));
              }}
            />
            {tripErrors.endDate && (
              <p className="field-error">{tripErrors.endDate}</p>
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
          <label className={tripErrors.reason ? "has-error" : ""}>
            <span>Endorsement reason *</span>
            <input
              value={reason}
              className={tripErrors.reason ? "input-invalid" : ""}
              onChange={(e) => {
                setReason(e.target.value);
                if (tripErrors.reason)
                  setTripErrors((p) => ({ ...p, reason: undefined }));
              }}
            />
            {tripErrors.reason && (
              <p className="field-error">{tripErrors.reason}</p>
            )}
          </label>
        </div>

        {/* Traveller cards */}
        <div className="traveller-stack">
          {travellers.map((t, index) => (
            <TravellerCard
              key={t._key}
              traveller={t}
              index={index}
              mode="endorse"
              fieldErrors={travellerErrors[t._key] ?? {}}
              onUpdate={(field, value) =>
                updateTraveller(t._key, field, String(value))
              }
              onPincodeBlur={() => handlePincodeLookup(t._key, t.pincode)}
            />
          ))}
        </div>

        <div className="action-row">
          <button
            className="ghost-button"
            type="button"
            onClick={() => router.push(`/policies/${policy.id}`)}
          >
            Back to detail
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleSaveEndorsement}
            disabled={pending}
          >
            {pending ? "Saving..." : "Save endorsement draft"}
          </button>
        </div>
      </section>
    </div>
  );
}
