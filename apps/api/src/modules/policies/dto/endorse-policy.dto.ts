export type EndorsePolicyTravellerDto = {
  travellerName: string;
  passportNumber: string;
  gender?: string;
  dateOfBirth?: string;
  age?: number;
  ageOrDob?: string;
  nominee?: string;
  nomineeRelationship?: string;
  address?: string;
  pincode?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  email?: string;
  mobile?: string;
  remarks?: string;
  crReferenceNumber?: string;
  pastIllness?: string;
  emergencyContactPerson?: string;
  emergencyContactNumber?: string;
  emergencyEmail?: string;
  gstNumber?: string;
  gstState?: string;
  planName?: string;
  premiumAmount?: number;
};

export type EndorsePolicyDto = {
  startDate: string;
  endDate: string;
  reason: string;
  travelRegion?: string;
  destination?: string;
  preferredPlan?: string;
  travellers: EndorsePolicyTravellerDto[];
};
