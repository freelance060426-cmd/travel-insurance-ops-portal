export type CreateInvoiceDto = {
  invoiceNumber: string;
  policyIds?: string[];
  partnerId: string;
  invoiceDate: string;
  amount: number;
  status: "DRAFT" | "ISSUED" | "READY" | "SENT";
  note?: string;
};
