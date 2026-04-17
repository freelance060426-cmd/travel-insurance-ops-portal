"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiPartner } from "@/lib/api";
import { createPolicy } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import {
  planOptions,
  partners as fallbackPartners,
  passportLookupRecords,
} from "@/lib/mock-data";

type TravellerDraft = {
  id: string;
  passport: string;
  name: string;
  ageOrDob: string;
  email: string;
  mobile: string;
  planId: string;
  matched: boolean;
};

const initialTraveller = (): TravellerDraft => ({
  id: crypto.randomUUID(),
  passport: "",
  name: "",
  ageOrDob: "",
  email: "",
  mobile: "",
  planId: planOptions[0]?.id ?? "",
  matched: false,
});

export function CreatePolicyForm({
  initialPartners,
}: {
  initialPartners: ApiPartner[];
}) {
  const router = useRouter();
  const { token } = useAuth();
  const partnerOptions =
    initialPartners.length > 0 ? initialPartners : fallbackPartners;
  const [policyNumber, setPolicyNumber] = useState("IC260001");
  const [partnerId, setPartnerId] = useState(partnerOptions[0]?.id ?? "");
  const [issueDate, setIssueDate] = useState("2026-04-15");
  const [startDate, setStartDate] = useState("2026-04-20");
  const [endDate, setEndDate] = useState("2026-05-20");
  const [travellers, setTravellers] = useState<TravellerDraft[]>([
    initialTraveller(),
  ]);
  const [lastLookupMessage, setLastLookupMessage] = useState(
    "Enter a passport number to reuse previous traveller details when available.",
  );
  const [submitState, setSubmitState] = useState<{
    status: "idle" | "saving" | "success" | "error";
    message: string;
  }>({
    status: "idle",
    message: "",
  });

  const totalPremium = useMemo(() => {
    return travellers.reduce((sum, traveller) => {
      const matchedPlan = planOptions.find(
        (plan) => plan.id === traveller.planId,
      );
      return sum + (matchedPlan?.premium ?? 0);
    }, 0);
  }, [travellers]);

  const selectedPartner = partnerOptions.find(
    (partner) => partner.id === partnerId,
  );

  function updateTraveller(
    id: string,
    field: keyof TravellerDraft,
    value: string | boolean,
  ) {
    setTravellers((current) =>
      current.map((traveller) =>
        traveller.id === id ? { ...traveller, [field]: value } : traveller,
      ),
    );
  }

  function addTraveller() {
    setTravellers((current) => [...current, initialTraveller()]);
  }

  function removeTraveller(id: string) {
    setTravellers((current) =>
      current.length === 1 ? current : current.filter((item) => item.id !== id),
    );
  }

  function lookupPassport(id: string, passport: string) {
    const normalized = passport.trim().toUpperCase();
    if (!normalized) {
      setLastLookupMessage(
        "Passport lookup skipped because the field is empty.",
      );
      return;
    }

    const match =
      passportLookupRecords[normalized as keyof typeof passportLookupRecords];
    if (!match) {
      updateTraveller(id, "matched", false);
      setLastLookupMessage(
        `No existing traveller found for passport ${normalized}. Manual entry continues.`,
      );
      return;
    }

    setTravellers((current) =>
      current.map((traveller) =>
        traveller.id === id
          ? {
              ...traveller,
              passport: normalized,
              name: match.name,
              ageOrDob: match.ageOrDob,
              email: match.email,
              mobile: match.mobile,
              matched: true,
            }
          : traveller,
      ),
    );

    setLastLookupMessage(
      `Autofill applied for ${match.name}. User can still edit any field manually.`,
    );
  }

  async function handleSaveDraft() {
    if (!partnerId) {
      setSubmitState({
        status: "error",
        message: "Select a partner before saving the policy.",
      });
      return;
    }

    setSubmitState({
      status: "saving",
      message: "Saving draft policy...",
    });

    try {
      const payload = {
        policyNumber,
        partnerId,
        issueDate,
        startDate,
        endDate,
        insurerName: "Bajaj Allianz",
        primaryTravellerName: travellers[0]?.name || "Primary traveller",
        customerEmail: travellers[0]?.email || "",
        customerMobile: travellers[0]?.mobile || "",
        premiumAmount: totalPremium,
        travellers: travellers.map((traveller) => ({
          travellerName: traveller.name || "Unnamed traveller",
          passportNumber: traveller.passport || "UNKNOWN",
          ageOrDob: traveller.ageOrDob,
          email: traveller.email,
          mobile: traveller.mobile,
        })),
      };

      const created = await createPolicy(payload, token ?? undefined);
      setSubmitState({
        status: "success",
        message: `Policy ${created.policyNumber} saved successfully.`,
      });
      router.push(`/policies/${created.id}`);
    } catch (error) {
      setSubmitState({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save draft policy.",
      });
    }
  }

  return (
    <div className="page-stack">
      <section className="content-card">
        <p className="portal-eyebrow">CREATE POLICY</p>
        <h1 className="page-title">Manual-first policy creation flow</h1>
        <p className="page-subtitle">
          This form demonstrates the phase 1 workflow: flexible policy number,
          partner selection, travel dates, multi-traveller entry, and
          passport-based autofill without forcing email or mobile as mandatory.
        </p>
        {submitState.status !== "idle" ? (
          <div className={`submit-banner submit-${submitState.status}`}>
            {submitState.message}
          </div>
        ) : null}
      </section>

      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">POLICY HEADER</p>
              <h3>Issue details</h3>
            </div>
          </div>

          <div className="form-grid form-grid--policy-header">
            <label>
              <span>Policy Number</span>
              <input
                value={policyNumber}
                onChange={(event) => setPolicyNumber(event.target.value)}
              />
            </label>
            <label>
              <span>Partner</span>
              <select
                value={partnerId}
                onChange={(event) => setPartnerId(event.target.value)}
              >
                {partnerOptions.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Issue Date</span>
              <input
                type="date"
                value={issueDate}
                onChange={(event) => setIssueDate(event.target.value)}
              />
            </label>
            <label>
              <span>Travel Start</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              <span>Travel End</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>
        </section>

        <aside className="content-card summary-card">
          <p className="portal-eyebrow">LIVE SUMMARY</p>
          <h3>Policy snapshot</h3>
          <div className="summary-pairs">
            <div>
              <span>Partner</span>
              <strong>{selectedPartner?.name ?? "Not selected"}</strong>
            </div>
            <div>
              <span>Travel window</span>
              <strong>
                {startDate} to {endDate}
              </strong>
            </div>
            <div>
              <span>Travellers</span>
              <strong>{travellers.length}</strong>
            </div>
            <div>
              <span>Total premium</span>
              <strong>₹ {totalPremium.toLocaleString("en-IN")}</strong>
            </div>
          </div>
          <div className="lookup-banner">{lastLookupMessage}</div>
        </aside>
      </div>

      {travellers.map((traveller, index) => {
        const selectedPlan = planOptions.find(
          (plan) => plan.id === traveller.planId,
        );

        return (
          <section key={traveller.id} className="content-card">
            <div className="section-heading">
              <div>
                <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
                <h3>{traveller.name || "New traveller"}</h3>
              </div>

              {travellers.length > 1 ? (
                <button
                  className="ghost-button"
                  type="button"
                  onClick={() => removeTraveller(traveller.id)}
                >
                  Remove traveller
                </button>
              ) : null}
            </div>

            <div className="traveller-card-grid">
              <label>
                <span>Passport Number</span>
                <div className="passport-row">
                  <input
                    value={traveller.passport}
                    placeholder="Enter passport number"
                    onChange={(event) =>
                      updateTraveller(
                        traveller.id,
                        "passport",
                        event.target.value.toUpperCase(),
                      )
                    }
                    onBlur={(event) =>
                      lookupPassport(traveller.id, event.target.value)
                    }
                  />
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() =>
                      lookupPassport(traveller.id, traveller.passport)
                    }
                  >
                    Autofill
                  </button>
                </div>
              </label>

              <label>
                <span>Traveller Name</span>
                <input
                  value={traveller.name}
                  onChange={(event) =>
                    updateTraveller(traveller.id, "name", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Date of birth / age</span>
                <input
                  value={traveller.ageOrDob}
                  onChange={(event) =>
                    updateTraveller(
                      traveller.id,
                      "ageOrDob",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                <span>Email (optional)</span>
                <input
                  value={traveller.email}
                  onChange={(event) =>
                    updateTraveller(traveller.id, "email", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Mobile (optional)</span>
                <input
                  value={traveller.mobile}
                  onChange={(event) =>
                    updateTraveller(traveller.id, "mobile", event.target.value)
                  }
                />
              </label>

              <label>
                <span>Plan</span>
                <select
                  value={traveller.planId}
                  onChange={(event) =>
                    updateTraveller(traveller.id, "planId", event.target.value)
                  }
                >
                  {planOptions.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹ {plan.premium.toLocaleString("en-IN")}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="traveller-footer">
              <span
                className={`status-pill ${traveller.matched ? "status-active" : "status-draft"}`}
              >
                {traveller.matched
                  ? "Autofilled from passport history"
                  : "Manual entry"}
              </span>
              <strong>
                {selectedPlan?.name ?? "Plan"} · ₹{" "}
                {selectedPlan?.premium.toLocaleString("en-IN") ?? "0"}
              </strong>
            </div>
          </section>
        );
      })}

      <div className="action-row">
        <button className="ghost-button" type="button" onClick={addTraveller}>
          Add traveller
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={handleSaveDraft}
        >
          {submitState.status === "saving" ? "Saving..." : "Save draft policy"}
        </button>
      </div>
    </div>
  );
}
