export type ApiPartner = {
  id: string;
  partnerCode: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  status: string;
};

export type ApiPolicyTraveller = {
  id: string;
  travellerName: string;
  passportNumber: string;
  ageOrDob?: string | null;
  email?: string | null;
  mobile?: string | null;
  planName?: string | null;
  premiumAmount?: string | number | null;
};

export type ApiPolicyDocument = {
  id: string;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  sourceType?: string;
  uploadedAt?: string;
};

export type ApiPolicyAction = {
  id: string;
  actionType: string;
  actionSummary: string;
  doneAt: string;
};

export type ApiPolicy = {
  id: string;
  policyNumber: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  insurerName: string;
  status: string;
  primaryTravellerName: string;
  customerEmail?: string | null;
  customerMobile?: string | null;
  premiumAmount?: string | number | null;
  partner: ApiPartner;
  travellers: ApiPolicyTraveller[];
  documents?: ApiPolicyDocument[];
  actions?: ApiPolicyAction[];
  invoices?: unknown[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function fetchPartners() {
  return fetchJson<ApiPartner[]>("/api/partners");
}

export async function createPartner(payload: Record<string, unknown>) {
  return fetchJson<ApiPartner>("/api/partners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchPolicies() {
  return fetchJson<ApiPolicy[]>("/api/policies");
}

export async function fetchPolicyById(id: string) {
  return fetchJson<ApiPolicy>(`/api/policies/${id}`);
}

export async function createPolicy(payload: Record<string, unknown>) {
  return fetchJson<ApiPolicy>("/api/policies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function endorsePolicy(id: string, payload: Record<string, unknown>) {
  return fetchJson<ApiPolicy>(`/api/policies/${id}/endorse`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
