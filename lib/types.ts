export type ReadinessStatus =
  | "Ready"
  | "Ready with warning"
  | "Insurance Query"
  | "Authorization Query"
  | "Referral Query"
  | "Missing Documentation"
  | "Manual Review Required"
  | "Blocked";

export type Priority =
  | "Routine"
  | "Soon"
  | "Urgent"
  | "Appointment within 24 hours"
  | "Overdue";

export type VerificationSource =
  | "Verified from payer"
  | "Verified from EHR"
  | "Verified by payer phone call"
  | "Uploaded payer document"
  | "Manually entered"
  | "Conflicting sources"
  | "Not verified"
  | "Insufficient information";

export type YesNoUnknown = "Yes" | "No" | "Unknown";
export type RequirementState = "Required" | "Not required" | "Unknown";
export type ReviewState = "Verified" | "Query" | "Blocked" | "Not reviewed";

export type ExceptionCategory =
  | "Demographics"
  | "Eligibility"
  | "COB"
  | "Network"
  | "Coverage"
  | "Patient Responsibility"
  | "Visit Limits"
  | "Authorization"
  | "Referral"
  | "Documentation"
  | "Coding / Diagnosis"
  | "Workflow";

export type ExceptionStatus =
  | "Open"
  | "In progress"
  | "Waiting on payer"
  | "Waiting on practice"
  | "Waiting on provider"
  | "Resolved"
  | "Dismissed";

export type OwnerRole =
  | "Scheduling"
  | "Eligibility Team"
  | "Prior Auth Team"
  | "Front Desk"
  | "Provider"
  | "Coder"
  | "Biller"
  | "Practice Manager"
  | "Payer Follow-Up"
  | "Human Reviewer";

export type EligibilityStatus =
  | "Active"
  | "Inactive"
  | "Not verified"
  | "Conflicting";

export type NetworkStatus =
  | "In network"
  | "Out of network with OON benefit"
  | "Out of network without OON benefit"
  | "Unknown";

export type CobStatus =
  | "No secondary coverage reported"
  | "Primary payer confirmed"
  | "Primary and secondary confirmed"
  | "COB information missing"
  | "COB conflict"
  | "Patient confirmation required"
  | "Payer confirmation required"
  | "Manual review required";

export type AuthorizationStatus =
  | "Not reviewed"
  | "Not required"
  | "Required - not submitted"
  | "Pending"
  | "Approved"
  | "Denied"
  | "Expired"
  | "Unclear";

export type ReferralStatus =
  | "Not reviewed"
  | "Not required"
  | "Valid"
  | "Missing"
  | "Expired"
  | "Mismatched"
  | "Unclear";

export type DocumentStatus =
  | "Present"
  | "Missing"
  | "Needs review"
  | "Not applicable";

export type PatientResponsibility = {
  copay: string;
  deductible: string;
  deductibleMet: string;
  coinsurance: string;
  outOfPocketMax: string;
  outOfPocketMet: string;
  expectedPatientAmount: string;
  status: "Verified" | "Estimated" | "Not provided" | "Manual confirmation required";
};

export type InsuranceDetails = {
  payer: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  planType: string;
  primaryInsurance: string;
  secondaryInsurance: string;
  eligibilityStatus: EligibilityStatus;
  effectiveDate: string;
  terminationDate: string;
  networkStatus: NetworkStatus;
  cobStatus: CobStatus;
  cobLastVerifiedDate: string;
  behavioralHealthAdministrator: string;
  patientResponsibility: PatientResponsibility;
  source: VerificationSource;
  sourceDate: string;
  referenceNumber: string;
  verifiedBy: string;
};

export type ServiceLine = {
  id: string;
  cpt: string;
  description: string;
  covered: YesNoUnknown;
  coveragePercent: string;
  authorizationRequirement: RequirementState;
  referralRequirement: RequirementState;
  networkRequirement: string;
  requestedUnits: number;
  visitLimit: number | null;
  usedUnits: number | null;
  remainingUnits: number | null;
  copay: string;
  coinsurance: string;
  deductibleApplies: YesNoUnknown;
  source: VerificationSource;
  verifiedDate: string;
  referenceNumber: string;
  reviewState: ReviewState;
};

export type DiagnosisLine = {
  id: string;
  icd10: string;
  description: string;
  position: "Primary" | "Secondary";
  linkedCpts: string[];
  supportingNote: string;
  supportStatus: "Supported" | "Missing support" | "Needs coding review" | "Not reviewed";
  source: VerificationSource;
  humanReviewed: boolean;
};

export type AuthorizationDetails = {
  status: AuthorizationStatus;
  authorizationNumber: string;
  submittedDate: string;
  effectiveDate: string;
  expirationDate: string;
  approvedCpts: string[];
  approvedUnits: number | null;
  usedUnits: number | null;
  supportingDocumentationAttached: YesNoUnknown;
  letterPresent: boolean;
  source: VerificationSource;
  referenceNumber: string;
  notes: string;
};

export type ReferralDetails = {
  status: ReferralStatus;
  referralNumber: string;
  referringProvider: string;
  effectiveDate: string;
  expirationDate: string;
  approvedCpts: string[];
  documentPresent: boolean;
  source: VerificationSource;
  notes: string;
};

export type DocumentItem = {
  id: string;
  name: string;
  required: RequirementState;
  status: DocumentStatus;
  blocking: boolean;
  source: VerificationSource;
  fileName: string;
  verifiedDate: string;
  notes: string;
};

export type EvidenceItem = {
  id: string;
  title: string;
  type:
    | "270/271 response"
    | "Payer portal"
    | "Payer phone verification"
    | "Authorization letter"
    | "Eligibility PDF"
    | "Referral document"
    | "Insurance card"
    | "Provider note"
    | "Manual staff note"
    | "Other";
  source: VerificationSource;
  capturedAt: string;
  applicableDate: string;
  referenceNumber: string;
  fileName: string;
  notes: string;
  humanConfirmed: boolean;
};

export type CaseException = {
  id: string;
  category: ExceptionCategory;
  failedCheck: string;
  explanation: string;
  blocking: boolean;
  evidenceState: VerificationSource;
  recommendedAction: string;
  owner: OwnerRole;
  priority: Priority;
  dueAt: string;
  status: ExceptionStatus;
  payerResponse: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
};

export type AuditEvent = {
  id: string;
  eventType:
    | "Case created"
    | "Analysis completed"
    | "Field changed"
    | "Evidence added"
    | "Exception created"
    | "Owner assigned"
    | "Deadline changed"
    | "Status changed"
    | "Human confirmation"
    | "Resolution recorded";
  description: string;
  actor: string;
  createdAt: string;
};

export type PriorAuthCase = {
  id: string;
  caseIdentifier: string;
  patientLabel: string;
  practiceName: string;
  dateOfBirth: string;
  appointmentAt: string;
  dateOfService: string;
  specialty: string;
  providerName: string;
  facilityName: string;
  placeOfService: string;
  telehealth: boolean;
  status: ReadinessStatus;
  priority: Priority;
  owner: OwnerRole;
  followUpDueAt: string;
  createdAt: string;
  updatedAt: string;
  insurance: InsuranceDetails;
  services: ServiceLine[];
  diagnoses: DiagnosisLine[];
  authorization: AuthorizationDetails;
  referral: ReferralDetails;
  documents: DocumentItem[];
  evidence: EvidenceItem[];
  exceptions: CaseException[];
  auditTrail: AuditEvent[];
  readinessSummary: string;
  reviewerNotes: string;
  followUpMessage: string;
  humanReviewRequired: boolean;
  humanConfirmed: boolean;
  sourceCaseText: string;
};

export type AnalyzeCaseRequest = Omit<
  PriorAuthCase,
  | "status"
  | "priority"
  | "exceptions"
  | "auditTrail"
  | "readinessSummary"
  | "followUpMessage"
  | "updatedAt"
> & {
  auditTrail?: AuditEvent[];
  demoAcknowledged: boolean;
};
