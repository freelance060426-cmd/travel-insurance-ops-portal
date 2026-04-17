export type CreateInvoiceDto = {
  invoiceNumber: string;
  policyId?: string;
  partnerId: string;
  invoiceDate: string;
  amount: number;
  status: "DRAFT" | "ISSUED" | "READY" | "SENT";
  note?: string;
};
