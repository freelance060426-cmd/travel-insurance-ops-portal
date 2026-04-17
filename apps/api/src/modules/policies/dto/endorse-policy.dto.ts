export type EndorsePolicyTravellerDto = {
  travellerName: string;
  passportNumber: string;
  ageOrDob?: string;
  email?: string;
  mobile?: string;
  planName?: string;
  premiumAmount?: number;
};

export type EndorsePolicyDto = {
  startDate: string;
  endDate: string;
  reason: string;
  preferredPlan?: string;
  travellers: EndorsePolicyTravellerDto[];
};
