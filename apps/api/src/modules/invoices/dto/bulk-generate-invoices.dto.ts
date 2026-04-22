export class BulkGenerateInvoicesDto {
  policyIds!: string[];
  invoiceDate?: string;
  status?: "DRAFT" | "ISSUED" | "READY" | "SENT";
  note?: string;
}
