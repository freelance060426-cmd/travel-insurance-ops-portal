import { resolve } from "node:path";

const repoRoot = resolve(__dirname, "../../../..");

export const repoEnvPath = resolve(repoRoot, ".env");
export const uploadsRoot = resolve(repoRoot, "uploads");
export const policyUploadsRoot = resolve(uploadsRoot, "policies");
export const policyPdfRoot = resolve(uploadsRoot, "pdfs/policies");
export const invoicePdfRoot = resolve(uploadsRoot, "pdfs/invoices");
