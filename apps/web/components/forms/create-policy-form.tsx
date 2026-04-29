"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApiPartner } from "@/lib/api";
import { createPolicy } from "@/lib/api";
import { useAuth } from "@/components/providers/auth-provider";
import { planOptions, passportLookupRecords } from "@/lib/mock-data";

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
  const partnerOptions = initialPartners;
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
  const completedTravellerCount = travellers.filter(
    (traveller) => traveller.name.trim() || traveller.passport.trim(),
  ).length;

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

  async function handleSavePolicy() {
    if (!partnerId) {
      setSubmitState({
        status: "error",
        message: "Select a partner before saving the policy.",
      });
      return;
    }

    setSubmitState({
      status: "saving",
      message: "Saving policy...",
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
            : "Failed to save policy.",
      });
    }
  }

  return (
    <div className="page-stack">
      <section className="content-card policy-intro-card">
        <div className="policy-intro-card__copy">
          <p className="portal-eyebrow">CREATE POLICY</p>
          <h1 className="page-title">Issue a travel policy in four checkpoints</h1>
          <p className="page-subtitle">
            Capture policy details, traveller information, plan selection, and
            a final save review without blocking optional mobile or email fields.
          </p>
        </div>
        <div className="policy-intro-card__meta" aria-label="Policy draft summary">
          <div>
            <span>Partner</span>
            <strong>{selectedPartner?.partnerCode ?? "Not selected"}</strong>
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
        {submitState.status !== "idle" ? (
          <div className={`submit-banner submit-${submitState.status}`}>
            {submitState.message}
          </div>
        ) : null}
      </section>

      <section className="workflow-stepper" aria-label="Policy creation steps">
        {[
          {
            label: "Policy details",
            detail: "Partner, dates, policy number",
            status: partnerId ? "active" : "pending",
          },
          {
            label: "Traveller details",
            detail: `${travellers.length} traveller${travellers.length === 1 ? "" : "s"}`,
            status: travellers[0]?.name ? "active" : "pending",
          },
          {
            label: "Documents",
            detail: "Available after save",
            status: "locked",
          },
          {
            label: "Review & save",
            detail: `₹ ${totalPremium.toLocaleString("en-IN")} premium`,
            status: totalPremium > 0 ? "active" : "pending",
          },
        ].map((step, index) => (
          <div
            key={step.label}
            className={`workflow-step workflow-step--${step.status}`}
          >
            <span className="workflow-step__index">{index + 1}</span>
            <div>
              <strong>{step.label}</strong>
              <span>{step.detail}</span>
            </div>
          </div>
        ))}
      </section>

      <div className="policy-workflow-shell">
        <div className="policy-workflow-main">
          <section className="content-card policy-form-panel">
            <div className="section-heading">
              <div>
                <p className="portal-eyebrow">CHECKPOINT 1</p>
                <h3>Policy issue details</h3>
                <p className="section-note">
                  Start with the policy number, issuing partner, and travel
                  dates. Bajaj integration can later replace the manual plan and
                  premium source without changing this layout.
                </p>
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

          <section className="content-card policy-form-panel">
            <div className="section-heading">
              <div>
                <p className="portal-eyebrow">CHECKPOINT 2</p>
                <h3>Traveller and plan details</h3>
                <p className="section-note">
                  Add one or more travellers. Passport lookup helps reuse
                  existing traveller details, but every field remains editable.
                </p>
              </div>

              <button className="ghost-button" type="button" onClick={addTraveller}>
                Add traveller
              </button>
            </div>

            <div className="traveller-stack">
              {travellers.map((traveller, index) => {
                const selectedPlan = planOptions.find(
                  (plan) => plan.id === traveller.planId,
                );

                return (
                  <article key={traveller.id} className="traveller-entry-card">
                    <div className="traveller-entry-card__header">
                      <div className="traveller-title-row">
                        <span className="traveller-index-pill">{index + 1}</span>
                        <div>
                          <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
                          <h4>{traveller.name || "New traveller"}</h4>
                        </div>
                      </div>
                      <div className="traveller-meta-row">
                        <span
                          className={`status-pill ${traveller.matched ? "status-active" : "status-draft"}`}
                        >
                          {traveller.matched
                            ? "Autofilled"
                            : "Manual entry"}
                        </span>
                        {travellers.length > 1 ? (
                          <button
                            className="inline-action-button"
                            type="button"
                            onClick={() => removeTraveller(traveller.id)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
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
                            updateTraveller(
                              traveller.id,
                              "name",
                              event.target.value,
                            )
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
                            updateTraveller(
                              traveller.id,
                              "email",
                              event.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Mobile (optional)</span>
                        <input
                          value={traveller.mobile}
                          onChange={(event) =>
                            updateTraveller(
                              traveller.id,
                              "mobile",
                              event.target.value,
                            )
                          }
                        />
                      </label>

                      <label>
                        <span>Plan</span>
                        <select
                          value={traveller.planId}
                          onChange={(event) =>
                            updateTraveller(
                              traveller.id,
                              "planId",
                              event.target.value,
                            )
                          }
                        >
                          {planOptions.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name} - ₹{" "}
                              {plan.premium.toLocaleString("en-IN")}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="traveller-footer">
                      <span>
                        Plan premium is calculated from the selected manual plan.
                      </span>
                      <strong>
                        {selectedPlan?.name ?? "Plan"} · ₹{" "}
                        {selectedPlan?.premium.toLocaleString("en-IN") ?? "0"}
                      </strong>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="content-card summary-card policy-summary-card">
          <p className="portal-eyebrow">LIVE REVIEW</p>
          <h3>Policy snapshot</h3>
          <div className="summary-pairs">
            <div>
              <span>Policy number</span>
              <strong>{policyNumber || "Not entered"}</strong>
            </div>
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
              <span>Traveller progress</span>
              <strong>
                {completedTravellerCount}/{travellers.length} started
              </strong>
            </div>
            <div>
              <span>Total premium</span>
              <strong>₹ {totalPremium.toLocaleString("en-IN")}</strong>
            </div>
          </div>
          <div className="lookup-banner">{lastLookupMessage}</div>
          <div className="summary-next-step">
            <span>Next after save</span>
            <strong>Policy detail, PDF, documents, and email dispatch</strong>
          </div>
        </aside>
      </div>

      <div className="policy-final-action-bar">
        <div className="policy-final-action-bar__summary">
          <span>Ready to save</span>
          <strong>
            {selectedPartner?.name ?? "Select partner"} · {travellers.length}{" "}
            traveller{travellers.length === 1 ? "" : "s"} · ₹{" "}
            {totalPremium.toLocaleString("en-IN")}
          </strong>
        </div>
        <div className="action-button-row">
          <button className="ghost-button" type="button" onClick={addTraveller}>
            Add traveller
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={handleSavePolicy}
            disabled={submitState.status === "saving"}
          >
            {submitState.status === "saving" ? "Saving..." : "Save Policy"}
          </button>
        </div>
      </div>
    </div>
  );
}
