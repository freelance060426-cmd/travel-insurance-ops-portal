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

export type ApiInvoice = {
  id: string;
  invoiceNumber: string;
  policyId?: string | null;
  partnerId: string;
  invoiceDate: string;
  amount: string | number;
  status: string;
  pdfUrl?: string | null;
  note?: string | null;
  partner: ApiPartner;
  policy?: Pick<ApiPolicy, "id" | "policyNumber" | "primaryTravellerName"> | null;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  status?: string;
};

export type LoginResponse = {
  accessToken: string;
  user: AuthUser;
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchJson<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed for ${path}: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function login(payload: { email: string; password: string }) {
  return fetchJson<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function fetchCurrentUser(token: string) {
  return fetchJson<AuthUser>("/api/auth/me", undefined, token);
}

export async function fetchPartners(token?: string) {
  return fetchJson<ApiPartner[]>("/api/partners", undefined, token);
}

export async function createPartner(
  payload: Record<string, unknown>,
  token?: string,
) {
  return fetchJson<ApiPartner>(
    "/api/partners",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchPolicies(token?: string) {
  return fetchJson<ApiPolicy[]>("/api/policies", undefined, token);
}

export async function fetchPolicyById(id: string, token?: string) {
  return fetchJson<ApiPolicy>(`/api/policies/${id}`, undefined, token);
}

export async function createPolicy(
  payload: Record<string, unknown>,
  token?: string,
) {
  return fetchJson<ApiPolicy>(
    "/api/policies",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function endorsePolicy(
  id: string,
  payload: Record<string, unknown>,
  token?: string,
) {
  return fetchJson<ApiPolicy>(
    `/api/policies/${id}/endorse`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function fetchInvoices(token?: string) {
  return fetchJson<ApiInvoice[]>("/api/invoices", undefined, token);
}

export async function fetchInvoiceById(id: string, token?: string) {
  return fetchJson<ApiInvoice>(`/api/invoices/${id}`, undefined, token);
}

export async function createInvoice(
  payload: Record<string, unknown>,
  token?: string,
) {
  return fetchJson<ApiInvoice>(
    "/api/invoices",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
