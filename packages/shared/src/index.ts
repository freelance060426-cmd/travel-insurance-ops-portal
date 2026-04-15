import { z } from "zod";

export const userRoleSchema = z.enum(["SUPER_ADMIN", "EMPLOYEE"]);
export type UserRole = z.infer<typeof userRoleSchema>;

export const policyStatusSchema = z.enum(["DRAFT", "ACTIVE", "ENDORSED", "EXPIRED"]);
export type PolicyStatus = z.infer<typeof policyStatusSchema>;

export const invoiceStatusSchema = z.enum(["DRAFT", "ISSUED"]);
export type InvoiceStatus = z.infer<typeof invoiceStatusSchema>;
