export type CreatePolicyTravellerDto = {
  travellerName: string;
  passportNumber: string;
  ageOrDob?: string;
  email?: string;
  mobile?: string;
  planName?: string;
  premiumAmount?: number;
};

export type CreatePolicyDto = {
  policyNumber: string;
  partnerId: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  insurerName: string;
  productCode?: string;
  primaryTravellerName: string;
  customerEmail?: string;
  customerMobile?: string;
  premiumAmount?: number;
  travellers: CreatePolicyTravellerDto[];
};
