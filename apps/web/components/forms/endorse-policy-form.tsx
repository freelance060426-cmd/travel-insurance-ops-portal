"use client";

import { useMemo, useState } from "react";
import type { ReturnTypeGetPolicy } from "@/lib/mock-data";

type EndorseTravellerDraft = {
  id: string;
  name: string;
  passport: string;
  ageOrDob: string;
  plan: string;
  premium: string;
};

type PlanName = "Prime" | "Ace" | "Elite";

export function EndorsePolicyForm({ policy }: { policy: ReturnTypeGetPolicy }) {
  const [startDate, setStartDate] = useState(policy.startDate);
  const [endDate, setEndDate] = useState(policy.endDate);
  const initialPlan = (policy.travellers[0]?.plan ?? "Prime") as PlanName;
  const [planOverride, setPlanOverride] = useState<PlanName>(initialPlan);
  const [reason, setReason] = useState(
    "Traveller correction and travel date update",
  );
  const [travellers, setTravellers] = useState<EndorseTravellerDraft[]>(
    policy.travellers.map((traveller, index) => ({
      id: `${policy.id}-${index}`,
      name: traveller.name,
      passport: traveller.passport,
      ageOrDob: traveller.ageOrDob,
      plan: traveller.plan,
      premium: traveller.premium,
    })),
  );

  const changeSummary = useMemo(() => {
    return [
      `Travel window: ${policy.startDate} → ${startDate}, ${policy.endDate} → ${endDate}`,
      `Primary plan adjustment target: ${planOverride}`,
      `Traveller rows ready for endorsement save: ${travellers.length}`,
    ];
  }, [
    endDate,
    planOverride,
    policy.endDate,
    policy.startDate,
    startDate,
    travellers.length,
  ]);

  function updateTraveller(
    id: string,
    field: keyof EndorseTravellerDraft,
    value: string,
  ) {
    setTravellers((current) =>
      current.map((traveller) =>
        traveller.id === id ? { ...traveller, [field]: value } : traveller,
      ),
    );
  }

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="portal-eyebrow">ENDORSE POLICY</p>
          <h1>{policy.policyNumber}</h1>
          <p className="hero-panel__text">
            This screen represents the phase 1 endorsement flow: edit key
            details, keep a change summary, and save endorsement changes without
            mixing in full insurer-side lifecycle complexity yet.
          </p>
        </div>

        <div className="hero-panel__meta">
          <span className="portal-chip">Current status: {policy.status}</span>
          <span className="portal-chip">Partner: {policy.partner}</span>
        </div>
      </section>

      <div className="form-layout">
        <section className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">ENDORSEMENT HEADER</p>
              <h3>Policy updates</h3>
            </div>
          </div>

          <div className="form-grid form-grid--policy-header">
            <label>
              <span>Issue Date</span>
              <input type="date" value={policy.issueDate} readOnly />
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
            <label>
              <span>Preferred plan</span>
              <select
                value={planOverride}
                onChange={(event) =>
                  setPlanOverride(event.target.value as PlanName)
                }
              >
                <option>Prime</option>
                <option>Ace</option>
                <option>Elite</option>
              </select>
            </label>
            <label>
              <span>Endorsement reason</span>
              <input
                value={reason}
                onChange={(event) => setReason(event.target.value)}
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
            Phase 1 endorsement should preserve action history. This demo
            assumes the backend will save a before/after change record when the
            endorsement is submitted.
          </div>
        </aside>
      </div>

      {travellers.map((traveller, index) => (
        <section key={traveller.id} className="content-card">
          <div className="section-heading">
            <div>
              <p className="portal-eyebrow">TRAVELLER {index + 1}</p>
              <h3>{traveller.name}</h3>
            </div>
          </div>

          <div className="traveller-card-grid">
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
              <span>Passport Number</span>
              <input
                value={traveller.passport}
                onChange={(event) =>
                  updateTraveller(
                    traveller.id,
                    "passport",
                    event.target.value.toUpperCase(),
                  )
                }
              />
            </label>

            <label>
              <span>Date of birth / age</span>
              <input
                value={traveller.ageOrDob}
                onChange={(event) =>
                  updateTraveller(traveller.id, "ageOrDob", event.target.value)
                }
              />
            </label>

            <label>
              <span>Plan</span>
              <select
                value={traveller.plan}
                onChange={(event) =>
                  updateTraveller(traveller.id, "plan", event.target.value)
                }
              >
                <option>Prime</option>
                <option>Ace</option>
                <option>Elite</option>
              </select>
            </label>

            <label>
              <span>Premium</span>
              <input
                value={traveller.premium}
                onChange={(event) =>
                  updateTraveller(traveller.id, "premium", event.target.value)
                }
              />
            </label>
          </div>
        </section>
      ))}

      <div className="action-row">
        <button className="ghost-button" type="button">
          Back to detail
        </button>
        <button className="primary-button" type="button">
          Save endorsement draft
        </button>
      </div>
    </div>
  );
}
