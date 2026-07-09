import { PriorAuthCase } from "./types";

export const demoCases: PriorAuthCase[] = [
  {
    id: "case-001",
    patientLabel: "Sample Patient: Jordan Miller",
    practiceName: "Lakeside Physical Therapy",
    payer: "Northstar Health Plan",
    service: "PT evaluation + 8 follow-up visits",
    status: "Needs Review",
    createdAt: "2026-07-06",
    overallRiskLevel: "High",
    riskReason:
      "This sample case has multiple unresolved front-end issues before billing can safely move forward: eligibility and benefits are not fully verified, visit limits are unclear, authorization requirements are unclear, and key documentation is missing.",
    issuesFound: [
      {
        category: "Eligibility / Benefits",
        title: "Benefits were not fully verified",
        riskLevel: "High",
        finding:
          "The case notes show that eligibility was checked, but benefits, patient responsibility, and PT-specific coverage rules were not fully confirmed.",
        whyItMatters:
          "If benefits or coverage rules are misunderstood, the clinic may continue visits that later become delayed, underpaid, denied, or shifted to patient responsibility.",
        recommendedAction:
          "Verify PT benefits with the payer, including deductible, copay/coinsurance, patient responsibility, active coverage dates, and PT-specific coverage rules.",
        owner: "Billing/Admin",
      },
      {
        category: "Prior Authorization",
        title: "Authorization requirement is unclear",
        riskLevel: "High",
        finding:
          "The sample case does not confirm whether prior authorization is required for the evaluation, the follow-up visits, or after a certain visit count.",
        whyItMatters:
          "If authorization is required and not obtained before visits continue, the claim may be denied or payment may be delayed.",
        recommendedAction:
          "Contact the payer or check the payer portal to confirm whether authorization is required before the requested follow-up visits continue.",
        owner: "Billing/Admin",
      },
      {
        category: "Documentation",
        title: "Plan of care is missing",
        riskLevel: "High",
        finding:
          "The referral is mentioned, but the plan of care is not attached or confirmed in the sample case.",
        whyItMatters:
          "A missing plan of care can weaken the support for medical necessity and may create follow-up work before claim submission or payer review.",
        recommendedAction:
          "Request the signed or pending plan of care from the provider/front desk before final billing review.",
        owner: "Provider",
      },
      {
        category: "Medical Necessity",
        title: "Functional limitations are not specific enough",
        riskLevel: "Medium",
        finding:
          "The notes mention knee pain after a sports injury, but they do not clearly document objective measures, functional limitations, treatment goals, or why 8 follow-up visits are needed.",
        whyItMatters:
          "If the documentation does not clearly support the requested care, the payer may request more information or deny the service as insufficiently supported.",
        recommendedAction:
          "Ask the provider to strengthen the documentation with objective findings, functional limitations, measurable goals, and the reason for the requested visit count.",
        owner: "Provider",
      },
      {
        category: "Coverage / Network",
        title: "Network and coverage rules need confirmation",
        riskLevel: "Medium",
        finding:
          "The sample case does not clearly confirm whether Lakeside Physical Therapy is in network for the patient’s plan or whether the requested PT services are covered under the current benefit.",
        whyItMatters:
          "Out-of-network status or uncovered services can create reimbursement delays, denials, or unexpected patient responsibility.",
        recommendedAction:
          "Confirm network status and PT coverage rules before visits continue beyond the initial evaluation.",
        owner: "Front Desk",
      },
      {
        category: "Follow-Up / Workflow",
        title: "Missing items are not assigned",
        riskLevel: "Medium",
        finding:
          "The case has several unresolved items, but the notes do not show who owns each follow-up task or when it should be completed.",
        whyItMatters:
          "Unassigned follow-up creates a workflow gap. The case can sit unresolved until it becomes a billing delay, A/R issue, or preventable denial.",
        recommendedAction:
          "Assign eligibility/auth review to billing/admin, documentation follow-up to the provider, and coverage confirmation to the front desk.",
        owner: "Human Reviewer",
      },
    ],
    missingItems: [
      "Full eligibility and benefits verification",
      "PT visit limit confirmation",
      "Prior authorization requirement confirmation",
      "Signed or pending plan of care",
      "Referral details confirmation",
      "Objective measures and functional limitation documentation",
      "Network status confirmation",
      "Assigned owner for each follow-up item",
    ],
    recommendedNextSteps: [
      "Verify active eligibility and PT-specific benefits with Northstar Health Plan.",
      "Confirm visit limits, patient responsibility, and whether PT visits require authorization.",
      "Check whether authorization is needed before the evaluation, after the evaluation, or before follow-up visits continue.",
      "Request the missing plan of care from the provider or front desk.",
      "Confirm referral details and attach the referral to the sample case record.",
      "Ask the provider to strengthen medical necessity documentation with objective measures, functional limitations, treatment goals, and support for the requested visit count.",
      "Confirm whether Lakeside Physical Therapy is in network for the patient’s plan.",
      "Hold final billing review until the missing items are resolved or reviewed by a human.",
      "Document all follow-up attempts and payer/front desk/provider responses.",
    ],
    summary:
      "This fake sample case should be reviewed before claim submission or continued visits. The highest-risk issues are unclear benefits, unclear authorization requirements, missing plan of care documentation, unclear visit limits, and weak medical necessity support. PriorAuthIQ should support the review process, but a human billing/admin reviewer must verify the final decision.",
    followUpMessage:
      "Hi, before this sample case is finalized for billing review, can you please confirm the patient’s PT benefits, visit limits, and whether prior authorization is required for the evaluation or follow-up visits? The case is also missing the plan of care and needs stronger documentation around functional limitations, objective findings, treatment goals, and why 8 follow-up visits are being requested. Please update the case once reviewed so billing can move forward with human review.",
    humanReviewRequired: true,
    sourceCaseText:
      "FAKE / SAMPLE CASE ONLY — Do not enter real patient information.\n\nPatient: Jordan Miller\nPractice: Lakeside Physical Therapy\nPayer: Northstar Health Plan\nService: PT evaluation + 8 follow-up visits\nSituation: Patient is scheduled for a PT evaluation and 8 follow-up visits after a knee injury during sports activity. Eligibility was checked briefly, but full benefits were not verified. Visit limits are unclear. Prior authorization requirement is unclear. Referral is mentioned, but plan of care is missing. Provider notes mention knee pain but do not clearly include functional limitations, objective measures, treatment goals, or support for the requested number of visits. Front desk/provider follow-up is needed before final billing review.",
    notesText:
      "Sample notes: Eligibility checked at scheduling, but no full benefits breakdown documented. No visit limit confirmation. Auth requirement not confirmed. Referral mentioned but not attached. Plan of care missing. Provider note says knee pain after sports activity, but lacks objective measures, functional limitations, treatment goals, and clear support for 8 follow-up visits.",
  },
  {
    id: "case-002",
    patientLabel: "Sample Patient: Avery Thompson",
    practiceName: "Clearview Behavioral Health",
    payer: "ExampleCare Plus",
    service: "Initial intake + recurring therapy visits",
    status: "Waiting on Front Desk",
    createdAt: "2026-07-05",
    overallRiskLevel: "Medium",
    riskReason:
      "This sample case has front-end coverage and follow-up gaps. Benefits need confirmation, session limits are unclear, and the payer rules for ongoing visits have not been documented.",
    issuesFound: [
      {
        category: "Eligibility / Benefits",
        title: "Behavioral health benefits need confirmation",
        riskLevel: "Medium",
        finding:
          "The sample case shows active coverage, but it does not include a behavioral health benefit breakdown.",
        whyItMatters:
          "Behavioral health benefits may have separate coverage rules, patient responsibility, visit limits, or authorization requirements.",
        recommendedAction:
          "Verify behavioral health benefits separately and document patient responsibility, visit limits, and coverage rules.",
        owner: "Front Desk",
      },
      {
        category: "Prior Authorization",
        title: "Ongoing visit authorization rules are unclear",
        riskLevel: "Medium",
        finding:
          "The intake may be covered, but the sample case does not confirm whether recurring visits require authorization after a certain point.",
        whyItMatters:
          "If ongoing visits require authorization and the team does not catch it early, payment may be delayed or denied later.",
        recommendedAction:
          "Confirm whether authorization is required for ongoing visits and document any threshold where authorization becomes necessary.",
        owner: "Billing/Admin",
      },
      {
        category: "Follow-Up / Workflow",
        title: "No follow-up owner is assigned",
        riskLevel: "Medium",
        finding:
          "The sample case does not show who is responsible for confirming benefits and payer rules.",
        whyItMatters:
          "When follow-up ownership is unclear, the case may move forward without the information billing needs.",
        recommendedAction:
          "Assign front desk to verify benefits and billing/admin to confirm authorization rules.",
        owner: "Human Reviewer",
      },
    ],
    missingItems: [
      "Behavioral health benefit breakdown",
      "Patient responsibility confirmation",
      "Session or visit limit confirmation",
      "Authorization rules for recurring visits",
      "Assigned follow-up owner",
    ],
    recommendedNextSteps: [
      "Verify behavioral health benefits separately from general medical benefits.",
      "Confirm patient responsibility and session limits.",
      "Check whether authorization is required for recurring therapy visits.",
      "Assign follow-up ownership before the case moves forward.",
      "Document payer response and review with a human billing/admin reviewer.",
    ],
    summary:
      "This fake sample case has moderate denial-risk because the team has not confirmed behavioral health-specific benefits, visit limits, or ongoing authorization rules. It should be reviewed before recurring visits continue.",
    followUpMessage:
      "Hi, can you please confirm the behavioral health benefit details for this sample case, including patient responsibility, session limits, and whether authorization is required for recurring visits? Please document the payer response so billing can review before visits continue.",
    humanReviewRequired: true,
    sourceCaseText:
      "FAKE / SAMPLE CASE ONLY — Do not enter real patient information.\n\nPatient: Avery Thompson\nPractice: Clearview Behavioral Health\nPayer: ExampleCare Plus\nService: Initial intake + recurring therapy visits\nSituation: Coverage appears active, but behavioral health benefits were not fully verified. Visit/session limits are unclear. Authorization rules for recurring visits are not documented. No follow-up owner is assigned.",
    notesText:
      "Sample notes: Active coverage confirmed. No behavioral health benefit breakdown documented. No session limit confirmation. No authorization rule confirmation for recurring visits.",
  },
  {
    id: "case-003",
    patientLabel: "Sample Patient: Morgan Lee",
    practiceName: "Riverbend Specialty Clinic",
    payer: "MetroHealth Advantage",
    service: "Specialty consultation + follow-up procedure review",
    status: "Ready for Human Review",
    createdAt: "2026-07-04",
    overallRiskLevel: "Low",
    riskReason:
      "Most front-end checks are documented in this sample case, but final human review is still required before the team relies on the information.",
    issuesFound: [
      {
        category: "Coverage / Network",
        title: "Network status appears documented but needs final review",
        riskLevel: "Low",
        finding:
          "The sample case includes a note that the clinic appears in network, but the final payer confirmation should still be reviewed.",
        whyItMatters:
          "Even low-risk cases need human review because payer rules and network status can vary by plan.",
        recommendedAction:
          "Have a billing/admin reviewer confirm the network note and payer response before finalizing the case.",
        owner: "Human Reviewer",
      },
      {
        category: "Documentation",
        title: "Documentation appears complete",
        riskLevel: "Low",
        finding:
          "The sample case includes referral details, visit reason, and basic documentation needed for review.",
        whyItMatters:
          "Complete documentation reduces follow-up friction, but it does not remove the need for human review.",
        recommendedAction:
          "Complete final review and document the reviewer’s decision.",
        owner: "Human Reviewer",
      },
    ],
    missingItems: ["Final human review note"],
    recommendedNextSteps: [
      "Review the documented eligibility, coverage, and network notes.",
      "Confirm that the referral and supporting documentation are attached.",
      "Add a final human review note before moving the case forward.",
    ],
    summary:
      "This fake sample case appears lower risk because most front-end review items are documented. It still requires human review before any billing, coverage, or workflow decision is made.",
    followUpMessage:
      "Hi, this sample case appears mostly complete. Can you please do a final human review of the eligibility, network, referral, and documentation notes before the case is moved forward?",
    humanReviewRequired: true,
    sourceCaseText:
      "FAKE / SAMPLE CASE ONLY — Do not enter real patient information.\n\nPatient: Morgan Lee\nPractice: Riverbend Specialty Clinic\nPayer: MetroHealth Advantage\nService: Specialty consultation + follow-up procedure review\nSituation: Eligibility, network status, referral details, and supporting documentation appear to be documented. Final human review is still required.",
    notesText:
      "Sample notes: Eligibility documented. Network status appears confirmed. Referral attached. Supporting documentation attached. Needs final human review note.",
  },
];