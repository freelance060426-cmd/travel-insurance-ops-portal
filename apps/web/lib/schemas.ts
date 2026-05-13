import { z } from "zod";

/* ─── invoice ─── */

export const invoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    invoiceDate: z.string().min(1, "Invoice date is required"),
    partnerId: z.string().min(1, "Partner is required"),
    status: z.string().min(1, "Status is required"),
    note: z.string(),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

/* ─── partner ─── */

export const partnerSchema = z.object({
    partnerCode: z.string().min(1, "Partner code is required"),
    name: z.string().min(1, "Partner name is required"),
    contactName: z.string(),
    email: z.string().email("Enter a valid email").or(z.literal("")),
    phone: z.string(),
    gstNumber: z.string(),
    panNumber: z.string(),
    bankName: z.string(),
    bankAddress: z.string(),
    bankAccountType: z.string(),
    bankAccountNumber: z.string(),
    bankSwiftCode: z.string(),
    ifscCode: z.string(),
    micrCode: z.string(),
    companyNameForInvoice: z.string(),
});

export type PartnerFormValues = z.infer<typeof partnerSchema>;

export const partnerLoginSchema = z.object({
    partnerId: z.string().min(1, "Select a partner"),
    name: z.string().min(1, "Display name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type PartnerLoginFormValues = z.infer<typeof partnerLoginSchema>;

/* ─── policy wizard ─── */

export const tripSchema = z.object({
    travelRegion: z.string().min(1, "Travel region is required"),
    destination: z.array(z.string()).min(1, "Select at least one destination country"),
    partnerId: z.string(),
    startDate: z.string().min(1, "Travel start date is required"),
    endDate: z.string().min(1, "Travel end date is required"),
});

export type TripFormValues = z.infer<typeof tripSchema>;

export const travellerSchema = z.object({
    _key: z.string(),
    passportNumber: z.string().min(1, "Passport number is required"),
    travellerName: z.string().min(1, "Name is required"),
    gender: z.string().min(1, "Gender is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    email: z.string(),
    mobile: z.string(),
    address: z.string().min(1, "Address is required"),
    pincode: z.string().min(1, "Pincode is required"),
    city: z.string().min(1, "City is required"),
    district: z.string().min(1, "District is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    nominee: z.string().min(1, "Nominee name is required"),
    nomineeRelationship: z.string().min(1, "Nominee relationship is required"),
    remarks: z.string(),
    crReferenceNumber: z.string(),
    pastIllness: z.string(),
    emergencyContactPerson: z.string(),
    emergencyContactNumber: z.string(),
    emergencyEmail: z.string(),
    gstNumber: z.string(),
    gstState: z.string(),
    planId: z.string(),
    premiumAmount: z.number(),
    lookupStatus: z.enum(["idle", "checking", "found", "not-found"]),
});

export type TravellerFormValues = z.infer<typeof travellerSchema>;

export const travellersStepSchema = z.object({
    travellers: z.array(travellerSchema),
});
