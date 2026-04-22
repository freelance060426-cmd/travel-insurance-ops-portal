import { z } from "zod";

export const userRoleSchema = z.enum(["SUPER_ADMIN", "EMPLOYEE"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const recordStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);
export type RecordStatus = z.infer<typeof recordStatusSchema>;

export const policyStatusSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "ENDORSED",
  "EXPIRED",
]);
export type PolicyStatus = z.infer<typeof policyStatusSchema>;

export const invoiceStatusSchema = z.enum(["DRAFT", "ISSUED", "READY", "SENT"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;

export const policyCreateSchema = z.object({
  policyNumber: z.string().min(1),
  partnerId: z.string().min(1),
  issueDate: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  insurerName: z.string().min(1),
  productCode: z.string().optional(),
  primaryTravellerName: z.string().min(1),
  customerEmail: z.string().email().optional().or(z.literal("")),
  customerMobile: z.string().optional(),
  premiumAmount: z.number().nonnegative().optional(),
});

export type PolicyCreateInput = z.infer<typeof policyCreateSchema>;

export const travellerInputSchema = z.object({
  travellerName: z.string().min(1),
  passportNumber: z.string().min(1),
  ageOrDob: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  mobile: z.string().optional(),
  planName: z.string().optional(),
  premiumAmount: z.number().nonnegative().optional(),
});

export type TravellerInput = z.infer<typeof travellerInputSchema>;

export const createPolicyRequestSchema = policyCreateSchema.extend({
  travellers: z.array(travellerInputSchema).min(1),
});

export type CreatePolicyRequest = z.infer<typeof createPolicyRequestSchema>;

export const partnerCreateSchema = z.object({
  partnerCode: z.string().min(1),
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
});

export type PartnerCreateInput = z.infer<typeof partnerCreateSchema>;

export const endorsePolicyRequestSchema = z.object({
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  reason: z.string().min(1),
  preferredPlan: z.string().optional(),
  travellers: z.array(travellerInputSchema).min(1),
});

export type EndorsePolicyRequest = z.infer<typeof endorsePolicyRequestSchema>;

export const createInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  policyId: z.string().optional(),
  partnerId: z.string().min(1),
  invoiceDate: z.string().min(1),
  amount: z.number().nonnegative(),
  status: invoiceStatusSchema,
  note: z.string().optional(),
});

export type CreateInvoiceRequest = z.infer<typeof createInvoiceSchema>;

export const bulkGenerateInvoicesSchema = z.object({
  policyIds: z.array(z.string().min(1)).min(1),
  invoiceDate: z.string().min(1).optional(),
  status: invoiceStatusSchema.optional(),
  note: z.string().optional(),
});

export type BulkGenerateInvoicesRequest = z.infer<
  typeof bulkGenerateInvoicesSchema
>;

export const sendPolicyEmailSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1).max(160).optional(),
  message: z.string().max(2000).optional(),
});

export type SendPolicyEmailRequest = z.infer<typeof sendPolicyEmailSchema>;

export const sendInvoiceEmailSchema = z.object({
  recipientEmail: z.string().email(),
  subject: z.string().min(1).max(160).optional(),
  message: z.string().max(2000).optional(),
});

export type SendInvoiceEmailRequest = z.infer<typeof sendInvoiceEmailSchema>;
