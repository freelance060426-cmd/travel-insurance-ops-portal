export type CreatePartnerDto = {
  partnerCode: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAddress?: string;
  bankAccountType?: string;
  bankAccountNumber?: string;
  bankSwiftCode?: string;
  ifscCode?: string;
  micrCode?: string;
  companyNameForInvoice?: string;
  chequeImageUrl?: string;
};
