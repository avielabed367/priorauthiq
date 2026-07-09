export type CaseStatus =
  | "New"
  | "Needs Review"
  | "Waiting on Front Desk"
  | "Waiting on Provider"
  | "Follow-Up Drafted"
  | "Ready for Human Review"
  | "Resolved";

export type RiskLevel = "Low" | "Medium" | "High";

export type RiskCategory =
  | "Eligibility / Benefits"
  | "Prior Authorization"
  | "Documentation"
  | "Medical Necessity"
  | "Coding"
  | "Coverage / Network"
  | "Follow-Up / Workflow";

export type RiskOwner =
  | "Billing/Admin"
  | "Front Desk"
  | "Provider"
  | "Payer"
  | "Human Reviewer";

export type RiskIssue = {
  category: RiskCategory;
  title: string;
  riskLevel: RiskLevel;
  finding: string;
  whyItMatters: string;
  recommendedAction: string;
  owner: RiskOwner;
};

export type PriorAuthCase = {
  id: string;
  patientLabel: string;
  practiceName: string;
  payer: string;
  service: string;
  status: CaseStatus;
  createdAt: string;
  overallRiskLevel: RiskLevel;
  riskReason: string;
  issuesFound: RiskIssue[];
  missingItems: string[];
  recommendedNextSteps: string[];
  summary: string;
  followUpMessage: string;
  humanReviewRequired: boolean;
  sourceCaseText?: string;
  notesText?: string;
};