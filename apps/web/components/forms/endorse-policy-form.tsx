"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { endorsePolicy } from "@/lib/api";
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
  "Cousin",
  "Friend",
  "Others",
];

/* ─── types ─── */

type EndorseTravellerDraft = {
  id: string;
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
};

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
  const [destination, setDestination] = useState(policy.destination);
  const [reason, setReason] = useState(
    "Traveller correction and travel date update",
  );

  const [travellers, setTravellers] = useState<EndorseTravellerDraft[]>(
    policy.travellers.map((t, index) => ({
      id: `${policy.id}-${index}`,
      name: t.name,
      passport: t.passport,
      gender: t.gender,
      dateOfBirth: t.dateOfBirth,
      nominee: t.nominee,
      nomineeRelationship: t.nomineeRelationship,
      address: t.address,
      pincode: t.pincode,
      city: t.city,
      district: t.district,
      state: t.state,
      country: t.country,
      email: t.email,
      mobile: t.mobile,
      plan: t.plan,
      premium: t.premium,
      remarks: t.remarks,
      pastIllness: t.pastIllness,
      crReferenceNumber: t.crReferenceNumber,
      emergencyContactPerson: t.emergencyContactPerson,
      emergencyContactNumber: t.emergencyContactNumber,
      emergencyEmail: t.emergencyEmail,
      gstNumber: t.gstNumber,
      gstState: t.gstState,
    })),
  );

  const [pending, setPending] = useState(false);

  const tripDays = computeDays(startDate, endDate);

  const changeSummary = useMemo(() => {
    return [
      `Travel window: ${policy.startDate} → ${startDate}, ${policy.endDate} → ${endDate}`,
      `Traveller rows ready for endorsement save: ${travellers.length}`,
    ];
  }, [endDate, policy.endDate, policy.startDate, startDate, travellers.length]);

  function updateTraveller(
    id: string,
    field: keyof EndorseTravellerDraft,
    value: string,
  ) {
    setTravellers((current) =>
      current.map((t) => (t.id === id ? { ...t, [field]: value } : t)),
    );
  }

  async function handleSaveEndorsement() {
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
          destination: destination || undefined,
          travellers: travellers.map((t) => ({
            travellerName: t.name,
            passportNumber: t.passport,
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
            planName: t.plan || undefined,
            premiumAmount: Number(t.premium.replace(/[^\d.]/g, "")) || 0,
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
      <section className="hero-panel">
        <div>
          <p className="portal-eyebrow">ENDORSE POLICY</p>
          <h1>{policy.policyNumber}</h1>
          <p className="hero-panel__text">
            Edit travel dates, plan, and traveller details. Changes are tracked
            and saved as an endorsement record.
          </p>
        </div>

        <div className="hero-panel__meta">
          <span className="portal-chip">Current status: {policy.status}</span>
          <span className="portal-chip">Partner: {policy.partner}</span>
        </div>
      </section>

      {/* ─── Trip / Header ─── */}
      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">TRIP &amp; POLICY HEADER</p>
              <h3>Policy updates</h3>
            </div>
          </div>

          <div className="form-grid form-grid--policy-header">
            <label>
              <span>Travel Region</span>
              <select
                value={travelRegion}
                onChange={(e) => setTravelRegion(e.target.value)}
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
                value={destination}
                placeholder="Country name(s)"
                onChange={(e) => setDestination(e.target.value)}
              />
            </label>
            <label>
              <span>Issue Date</span>
              <input type="date" value={policy.issueDate} readOnly />
            </label>
            <label>
              <span>Travel Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </label>
            <label>
              <span>Travel End</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
            <label>
              <span>Endorsement reason</span>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          </div>
        </section>

        <aside className="content-card summary-card">
          <p className="portal-eyebrow">CHANGE SUMMARY</p>
          <h3>What will be saved</h3>
          <ul className="activity-list">
            {changeSummary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <div className="lookup-banner">
            A before/after change record will be saved when the endorsement is
            submitted.
          </div>
        </aside>
      </div>

      {/* ─── Traveller cards ─── */}
      {travellers.map((t, index) => {
        const age = computeAge(t.dateOfBirth);
        return (
          <article key={t.id} className="traveller-entry-card">
            <div className="traveller-entry-card__header">
              <div className="traveller-title-row">
                <span className="traveller-index-pill">{index + 1}</span>
                <div>
                  <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
                  <h4>{t.name || "Traveller"}</h4>
                </div>
              </div>
            </div>

            <div className="wizard-field-group">
              <h5 className="wizard-field-group__label">Identity</h5>
              <div className="traveller-card-grid">
                <label>
                  <span>Passport Number *</span>
                  <input
                    value={t.passport}
                    onChange={(e) =>
                      updateTraveller(
                        t.id,
                        "passport",
                        e.target.value.toUpperCase(),
                      )
                    }
                  />
                </label>
                <label>
                  <span>Name *</span>
                  <input
                    value={t.name}
                    onChange={(e) =>
                      updateTraveller(t.id, "name", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Gender *</span>
                  <select
                    value={t.gender}
                    onChange={(e) =>
                      updateTraveller(t.id, "gender", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateTraveller(t.id, "dateOfBirth", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateTraveller(t.id, "email", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Mobile *</span>
                  <input
                    value={t.mobile}
                    onChange={(e) =>
                      updateTraveller(t.id, "mobile", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateTraveller(t.id, "address", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Pincode *</span>
                  <input
                    value={t.pincode}
                    onChange={(e) =>
                      updateTraveller(t.id, "pincode", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>City *</span>
                  <input
                    value={t.city}
                    onChange={(e) =>
                      updateTraveller(t.id, "city", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>District *</span>
                  <input
                    value={t.district}
                    onChange={(e) =>
                      updateTraveller(t.id, "district", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>State *</span>
                  <input
                    value={t.state}
                    onChange={(e) =>
                      updateTraveller(t.id, "state", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Country *</span>
                  <input
                    value={t.country}
                    onChange={(e) =>
                      updateTraveller(t.id, "country", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateTraveller(t.id, "nominee", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Relationship *</span>
                  <select
                    value={t.nomineeRelationship}
                    onChange={(e) =>
                      updateTraveller(
                        t.id,
                        "nomineeRelationship",
                        e.target.value,
                      )
                    }
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
                      updateTraveller(
                        t.id,
                        "emergencyContactPerson",
                        e.target.value,
                      )
                    }
                  />
                </label>
                <label>
                  <span>Contact Number</span>
                  <input
                    value={t.emergencyContactNumber}
                    onChange={(e) =>
                      updateTraveller(
                        t.id,
                        "emergencyContactNumber",
                        e.target.value,
                      )
                    }
                  />
                </label>
                <label>
                  <span>Contact Email</span>
                  <input
                    type="email"
                    value={t.emergencyEmail}
                    onChange={(e) =>
                      updateTraveller(t.id, "emergencyEmail", e.target.value)
                    }
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
                    onChange={(e) =>
                      updateTraveller(t.id, "pastIllness", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Remarks</span>
                  <input
                    value={t.remarks}
                    onChange={(e) =>
                      updateTraveller(t.id, "remarks", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>CR Reference Number</span>
                  <input
                    value={t.crReferenceNumber}
                    onChange={(e) =>
                      updateTraveller(t.id, "crReferenceNumber", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>GST Number</span>
                  <input
                    value={t.gstNumber}
                    onChange={(e) =>
                      updateTraveller(t.id, "gstNumber", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>GST State</span>
                  <input
                    value={t.gstState}
                    onChange={(e) =>
                      updateTraveller(t.id, "gstState", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>

            <div className="wizard-field-group">
              <h5 className="wizard-field-group__label">Plan &amp; Premium</h5>
              <div className="traveller-card-grid">
                <label>
                  <span>Plan</span>
                  <input
                    value={t.plan}
                    onChange={(e) =>
                      updateTraveller(t.id, "plan", e.target.value)
                    }
                  />
                </label>
                <label>
                  <span>Premium</span>
                  <input
                    value={t.premium}
                    onChange={(e) =>
                      updateTraveller(t.id, "premium", e.target.value)
                    }
                  />
                </label>
              </div>
            </div>
          </article>
        );
      })}

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
    </div>
  );
}
