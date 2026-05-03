export type ApiPartner = {
  id: string;
  partnerCode: string;
  name: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  bankName?: string | null;
  bankAddress?: string | null;
  bankAccountType?: string | null;
  bankAccountNumber?: string | null;
  bankSwiftCode?: string | null;
  ifscCode?: string | null;
  micrCode?: string | null;
  companyNameForInvoice?: string | null;
  chequeImageUrl?: string | null;
  status: string;
};

export type ApiPlan = {
  id: string;
  name: string;
  insurer: string;
  region?: string | null;
  minDays?: number | null;
  maxDays?: number | null;
  premiumAmount: string | number;
  isActive: boolean;
};

export type ApiPassportCheck = {
  exists: boolean;
  policyNumber?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  traveller?: {
    travellerName: string;
    passportNumber: string;
    gender?: string | null;
    dateOfBirth?: string | null;
    age?: number | null;
    nominee?: string | null;
    nomineeRelationship?: string | null;
    address?: string | null;
    pincode?: string | null;
    city?: string | null;
    district?: string | null;
    state?: string | null;
    country?: string | null;
    email?: string | null;
    mobile?: string | null;
    emergencyContactPerson?: string | null;
    emergencyContactNumber?: string | null;
    emergencyEmail?: string | null;
  };
};

export type ApiPolicyTraveller = {
  id: string;
  travellerName: string;
  passportNumber: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  ageOrDob?: string | null;
  nominee?: string | null;
  nomineeRelationship?: string | null;
  address?: string | null;
  pincode?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  country?: string | null;
  email?: string | null;
  mobile?: string | null;
  remarks?: string | null;
  crReferenceNumber?: string | null;
  pastIllness?: string | null;
  emergencyContactPerson?: string | null;
  emergencyContactNumber?: string | null;
  emergencyEmail?: string | null;
  gstNumber?: string | null;
  gstState?: string | null;
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

export type ApiEmailLog = {
  id: string;
  recipientEmail: string;
  subject: string;
  status: string;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
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
  emailLogs?: ApiEmailLog[];
  invoiceLinks?: ApiInvoicePolicyLink[];
};

export type ApiInvoicePolicyLink = {
  id: string;
  invoiceId: string;
  policyId: string;
  premiumAmount?: string | number | null;
  policy: Pick<
    ApiPolicy,
    "id" | "policyNumber" | "primaryTravellerName" | "customerEmail"
  >;
};

export type ApiInvoice = {
  id: string;
  invoiceNumber: string;
  partnerId: string;
  invoiceDate: string;
  amount: string | number;
  status: string;
  pdfUrl?: string | null;
  note?: string | null;
  emailLogs?: ApiEmailLog[];
  partner: ApiPartner;
  policies: ApiInvoicePolicyLink[];
};

export type ApiDashboardReport = {
  metrics: {
    totalPolicies: number;
    todayPolicies: number;
    monthlyPolicies: number;
    totalInvoices: number;
    readyInvoices: number;
    sentInvoices: number;
    pendingPdfPolicies: number;
    emailSendsToday: number;
  };
  topPartner: {
    id: string;
    name: string;
    policyCount: number;
  } | null;
  recentPolicies: ApiPolicy[];
  recentActions: Array<{
    id: string;
    actionType: string;
    actionSummary: string;
    doneAt: string;
    policy: {
      policyNumber: string;
      primaryTravellerName: string;
    };
  }>;
};

export type ApiPolicyReport = {
  total: number;
  rows: ApiPolicy[];
};

export type ApiPartnerReportRow = {
  id: string;
  partnerCode: string;
  name: string;
  status: string;
  policyCount: number;
  invoiceCount: number;
  totalPremium: number;
};

export type ApiEligibleInvoicePolicy = {
  id: string;
  policyNumber: string;
  primaryTravellerName: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  premiumAmount?: string | number | null;
  customerEmail?: string | null;
  partner: ApiPartner;
  travellers: ApiPolicyTraveller[];
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

export function buildApiAssetUrl(path?: string | null) {
  if (!path) {
    return null;
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${API_BASE}${path}`;
}

function buildQuery(params?: Record<string, string | undefined>) {
  if (!params) {
    return "";
  }

  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      query.set(key, value);
    }
  }

  const text = query.toString();
  return text ? `?${text}` : "";
}

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
    let message = `Request failed (${response.status})`;
    try {
      const body = await response.clone().json();
      const raw = (body as { message?: unknown })?.message;
      if (Array.isArray(raw)) {
        message = raw.filter(Boolean).join(", ") || message;
      } else if (typeof raw === "string" && raw.trim()) {
        message = raw;
      }
    } catch {
      try {
        const text = await response.text();
        if (text.trim()) message = text;
      } catch {
        // ignore body parse errors
      }
    }
    throw new Error(message);
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

export async function fetchPlans(
  token?: string,
  params?: Record<string, string | undefined>,
) {
  return fetchJson<ApiPlan[]>(
    `/api/plans${buildQuery(params)}`,
    undefined,
    token,
  );
}

export async function checkPassport(
  passport: string,
  token?: string,
) {
  return fetchJson<ApiPassportCheck>(
    `/api/policies/check-passport?passport=${encodeURIComponent(passport)}`,
    undefined,
    token,
  );
}

export async function fetchPolicies(
  token?: string,
  params?: Record<string, string | undefined>,
) {
  return fetchJson<ApiPolicy[]>(
    `/api/policies${buildQuery(params)}`,
    undefined,
    token,
  );
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

export async function fetchEligibleInvoicePolicies(token?: string) {
  return fetchJson<ApiEligibleInvoicePolicy[]>(
    "/api/invoices/eligible-policies",
    undefined,
    token,
  );
}

export async function fetchDashboardReport(token?: string) {
  return fetchJson<ApiDashboardReport>(
    "/api/reports/dashboard",
    undefined,
    token,
  );
}

export async function fetchPolicyReport(
  token?: string,
  params?: Record<string, string | undefined>,
) {
  return fetchJson<ApiPolicyReport>(
    `/api/reports/policies${buildQuery(params)}`,
    undefined,
    token,
  );
}

export async function fetchPartnerReport(
  token?: string,
  params?: Record<string, string | undefined>,
) {
  return fetchJson<ApiPartnerReportRow[]>(
    `/api/reports/partners${buildQuery(params)}`,
    undefined,
    token,
  );
}

export function buildPolicyExportUrl(
  params?: Record<string, string | undefined>,
) {
  return `${API_BASE}/api/reports/policies/export${buildQuery(params)}`;
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

export async function bulkGenerateInvoices(
  payload: {
    policyIds: string[];
    invoiceDate?: string;
    status?: string;
    note?: string;
  },
  token?: string,
) {
  return fetchJson<ApiInvoice[]>(
    "/api/invoices/bulk-generate",
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function uploadPolicyDocument(
  policyId: string,
  file: File,
  token?: string,
) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/api/policies/${policyId}/documents`,
    {
      method: "POST",
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    },
  );

  if (!response.ok) {
    throw new Error(
      `API request failed for /api/policies/${policyId}/documents: ${response.status}`,
    );
  }

  return response.json();
}

export async function getPolicyPdf(policyId: string, token?: string) {
  return fetchJson<{ fileUrl: string; fileName: string }>(
    `/api/policies/${policyId}/pdf`,
    undefined,
    token,
  );
}

export async function regeneratePolicyPdf(policyId: string, token?: string) {
  return fetchJson<{ fileUrl: string; fileName: string }>(
    `/api/policies/${policyId}/pdf/regenerate`,
    { method: "POST" },
    token,
  );
}

export async function getInvoicePdf(invoiceId: string, token?: string) {
  return fetchJson<{ fileUrl: string; fileName: string }>(
    `/api/invoices/${invoiceId}/pdf`,
    undefined,
    token,
  );
}

export async function regenerateInvoicePdf(invoiceId: string, token?: string) {
  return fetchJson<{ fileUrl: string; fileName: string }>(
    `/api/invoices/${invoiceId}/pdf/regenerate`,
    { method: "POST" },
    token,
  );
}

export async function sendInvoiceEmail(
  invoiceId: string,
  payload: {
    recipientEmail: string;
    subject?: string;
    message?: string;
  },
  token?: string,
) {
  return fetchJson<{ ok: true; log: ApiEmailLog }>(
    `/api/invoices/${invoiceId}/email`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}

export async function sendPolicyEmail(
  policyId: string,
  payload: {
    recipientEmail: string;
    subject?: string;
    message?: string;
  },
  token?: string,
) {
  return fetchJson<{ ok: true; log: ApiEmailLog }>(
    `/api/policies/${policyId}/email`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
    token,
  );
}
