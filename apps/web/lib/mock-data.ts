export const dashboardMetrics = [
  {
    label: "Total Policies",
    value: "1,248",
    delta: "+42 this week",
    tone: "teal",
  },
  {
    label: "Created Today",
    value: "19",
    delta: "6 waiting for PDF",
    tone: "amber",
  },
  {
    label: "Monthly Policies",
    value: "286",
    delta: "14% above projection",
    tone: "blue",
  },
  {
    label: "Invoices Raised",
    value: "178",
    delta: "23 pending dispatch",
    tone: "rose",
  },
];

export const recentActivities = [
  "IC-258490 created for Tourist Muse with 3 travellers",
  "Invoice INV-10401537 generated and marked ready for download",
  "Policy IC-259140 PDF emailed manually to customer",
  "Passport lookup reused traveller profile for Aaliyah Chhabra",
];

export const partners = [
  { id: "p1", code: "TM001", name: "Tourist Muse" },
  { id: "p2", code: "WIC014", name: "WIC KB 14" },
  { id: "p3", code: "URB021", name: "Urbane Travel LLP" },
];

export const planOptions = [
  { id: "prime", name: "Prime", insurer: "Bajaj Allianz", premium: 1097 },
  { id: "ace", name: "Ace", insurer: "Bajaj Allianz", premium: 1193 },
  { id: "elite", name: "Elite", insurer: "Bajaj Allianz", premium: 1765 },
];

export const passportLookupRecords = {
  Z6582194: {
    name: "Raju Hathi Ramani",
    ageOrDob: "1988-02-14",
    email: "raju@example.com",
    mobile: "9876501111",
  },
  R8802145: {
    name: "Bajrang Lal Barasiwal",
    ageOrDob: "1979-08-02",
    email: "",
    mobile: "",
  },
  N2209158: {
    name: "Alisher Ansari",
    ageOrDob: "1991-11-20",
    email: "alisher@example.com",
    mobile: "9811223344",
  },
  T7712209: {
    name: "R P Yadav",
    ageOrDob: "1985-06-19",
    email: "",
    mobile: "9988776655",
  },
} as const;

export const policyRows = [
  {
    id: "1",
    policyNumber: "IC259490",
    traveller: "Raju Hathi Ramani",
    passport: "Z6582194",
    partner: "Tourist Muse",
    issueDate: "2026-04-03",
    travelWindow: "04 Apr - 03 May",
    startDate: "2026-04-04",
    endDate: "2026-05-03",
    status: "Active",
    premium: "₹ 20,766",
  },
  {
    id: "2",
    policyNumber: "IC258648",
    traveller: "Bajrang Lal Barasiwal",
    passport: "R8802145",
    partner: "WIC KB 14",
    issueDate: "2026-04-03",
    travelWindow: "10 May - 13 Jun",
    startDate: "2026-05-10",
    endDate: "2026-06-13",
    status: "Active",
    premium: "₹ 1,097",
  },
  {
    id: "3",
    policyNumber: "IC258646",
    traveller: "Alisher Ansari",
    passport: "N2209158",
    partner: "WIC KB 14",
    issueDate: "2026-04-03",
    travelWindow: "10 May - 13 Jun",
    startDate: "2026-05-10",
    endDate: "2026-06-13",
    status: "Endorsed",
    premium: "₹ 1,097",
  },
  {
    id: "4",
    policyNumber: "IC258644",
    traveller: "Abubakar Mohd Ibrahim Shaikh",
    passport: "K9021183",
    partner: "WIC KB 14",
    issueDate: "2026-04-03",
    travelWindow: "10 May - 13 Jun",
    startDate: "2026-05-10",
    endDate: "2026-06-13",
    status: "Draft",
    premium: "₹ 1,097",
  },
  {
    id: "5",
    policyNumber: "IC258822",
    traveller: "R P Yadav",
    passport: "T7712209",
    partner: "Urbane Travel LLP",
    issueDate: "2026-04-01",
    travelWindow: "14 Apr - 12 Jun",
    startDate: "2026-04-14",
    endDate: "2026-06-12",
    status: "PDF Pending",
    premium: "₹ 1,193",
  },
  {
    id: "6",
    policyNumber: "IC258519",
    traveller: "K N Verma",
    passport: "V4118820",
    partner: "Urbane Travel LLP",
    issueDate: "2026-04-01",
    travelWindow: "14 Apr - 12 Jun",
    startDate: "2026-04-14",
    endDate: "2026-06-12",
    status: "Active",
    premium: "₹ 1,193",
  },
];

export const invoiceRows = [
  {
    id: "inv-1",
    invoiceNumber: "INV-10401537",
    policyNumber: "IC259490",
    partner: "Tourist Muse",
    invoiceDate: "2026-04-03",
    amount: "₹ 20,766",
    status: "Ready",
    note: "Linked to active policy and PDF is ready for download.",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-10400601",
    policyNumber: "IC258648",
    partner: "WIC KB 14",
    invoiceDate: "2026-04-03",
    amount: "₹ 1,097",
    status: "Ready",
    note: "Invoice generated successfully and queued for customer share.",
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-10400600",
    policyNumber: "IC258646",
    partner: "WIC KB 14",
    invoiceDate: "2026-04-03",
    amount: "₹ 1,097",
    status: "Sent",
    note: "Invoice has already been shared and archived in the invoice list.",
  },
  {
    id: "inv-4",
    invoiceNumber: "INV-10400599",
    policyNumber: "IC258644",
    partner: "WIC KB 14",
    invoiceDate: "2026-04-03",
    amount: "₹ 1,097",
    status: "Draft",
    note: "Waiting for final endorsement confirmation before invoice issue.",
  },
];

export const policyDetailMap = {
  "1": {
    documents: [
      { label: "Policy PDF", status: "Available" },
      { label: "Traveller declaration", status: "Uploaded" },
      { label: "Invoice PDF", status: "Linked" },
    ],
    travellers: [
      {
        name: "Raju Hathi Ramani",
        passport: "Z6582194",
        ageOrDob: "1988-02-14",
        plan: "Elite",
        premium: "₹ 10,383",
      },
      {
        name: "Shuchi Chhabra",
        passport: "P1102913",
        ageOrDob: "1990-09-10",
        plan: "Elite",
        premium: "₹ 10,383",
      },
    ],
  },
  "2": {
    documents: [
      { label: "Policy PDF", status: "Available" },
      { label: "Invoice PDF", status: "Ready" },
    ],
    travellers: [
      {
        name: "Bajrang Lal Barasiwal",
        passport: "R8802145",
        ageOrDob: "1979-08-02",
        plan: "Prime",
        premium: "₹ 1,097",
      },
    ],
  },
  "3": {
    documents: [
      { label: "Policy PDF", status: "Available" },
      { label: "Endorsement copy", status: "Generated" },
    ],
    travellers: [
      {
        name: "Alisher Ansari",
        passport: "N2209158",
        ageOrDob: "1991-11-20",
        plan: "Prime",
        premium: "₹ 1,097",
      },
    ],
  },
} as const;

export function getPolicyById(id: string) {
  const policy = policyRows.find((row) => row.id === id);
  if (!policy) return null;

  return {
    ...policy,
    documents: policyDetailMap[id as keyof typeof policyDetailMap]
      ?.documents ?? [{ label: "Policy PDF", status: "Pending" }],
    travellers: policyDetailMap[id as keyof typeof policyDetailMap]
      ?.travellers ?? [
      {
        name: policy.traveller,
        passport: policy.passport,
        ageOrDob: "1989-01-01",
        plan: "Prime",
        premium: policy.premium,
      },
    ],
  };
}

export type ReturnTypeGetPolicy = NonNullable<ReturnType<typeof getPolicyById>>;

export function getInvoiceById(id: string) {
  return invoiceRows.find((invoice) => invoice.id === id) ?? null;
}
