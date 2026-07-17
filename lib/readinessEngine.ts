import {
  AnalyzeCaseRequest,
  AuditEvent,
  CaseException,
  ExceptionCategory,
  OwnerRole,
  PriorAuthCase,
  Priority,
  ReadinessStatus,
  VerificationSource,
} from "@/lib/types";

function makeId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function asDate(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTimePriority(appointmentAt: string, now = new Date()): Priority {
  const appointment = asDate(appointmentAt);

  if (!appointment) return "Soon";

  const difference = appointment.getTime() - now.getTime();
  const hours = difference / 3_600_000;

  if (hours < 0) return "Overdue";
  if (hours <= 24) return "Appointment within 24 hours";
  if (hours <= 72) return "Urgent";
  if (hours <= 168) return "Soon";
  return "Routine";
}

function isPayerEvidence(source: VerificationSource) {
  return [
    "Verified from payer",
    "Verified by payer phone call",
    "Uploaded payer document",
  ].includes(source);
}

function exceptionPriority(blocking: boolean, appointmentAt: string) {
  const timePriority = getTimePriority(appointmentAt);

  if (timePriority === "Overdue" || timePriority === "Appointment within 24 hours") {
    return timePriority;
  }

  if (blocking) return "Urgent";
  return timePriority === "Routine" ? "Soon" : timePriority;
}

function defaultDueAt(appointmentAt: string, blocking: boolean) {
  const appointment = asDate(appointmentAt);
  const now = new Date();

  if (!appointment) {
    const due = new Date(now);
    due.setDate(due.getDate() + (blocking ? 1 : 3));
    return due.toISOString();
  }

  const due = new Date(appointment);
  due.setHours(due.getHours() - (blocking ? 24 : 48));

  if (due.getTime() < now.getTime()) return now.toISOString();
  return due.toISOString();
}

function createException(args: {
  category: ExceptionCategory;
  failedCheck: string;
  explanation: string;
  blocking: boolean;
  evidenceState: VerificationSource;
  recommendedAction: string;
  owner: OwnerRole;
  appointmentAt: string;
}): CaseException {
  const now = new Date().toISOString();

  return {
    id: makeId("exception"),
    category: args.category,
    failedCheck: args.failedCheck,
    explanation: args.explanation,
    blocking: args.blocking,
    evidenceState: args.evidenceState,
    recommendedAction: args.recommendedAction,
    owner: args.owner,
    priority: exceptionPriority(args.blocking, args.appointmentAt),
    dueAt: defaultDueAt(args.appointmentAt, args.blocking),
    status: "Open",
    payerResponse: "",
    resolutionNotes: "",
    createdAt: now,
    updatedAt: now,
  };
}

function determineStatus(exceptions: CaseException[]): ReadinessStatus {
  const open = exceptions.filter(
    (item) => !["Resolved", "Dismissed"].includes(item.status)
  );

  if (open.some((item) => item.blocking)) return "Blocked";
  if (open.some((item) => item.category === "Authorization")) {
    return "Authorization Query";
  }
  if (open.some((item) => item.category === "Referral")) {
    return "Referral Query";
  }
  if (open.some((item) => item.category === "Documentation")) {
    return "Missing Documentation";
  }
  if (
    open.some((item) =>
      [
        "Demographics",
        "Eligibility",
        "COB",
        "Network",
        "Coverage",
        "Patient Responsibility",
        "Visit Limits",
      ].includes(item.category)
    )
  ) {
    return "Insurance Query";
  }
  if (open.length > 0) return "Manual Review Required";
  if (exceptions.some((item) => !item.blocking)) return "Ready with warning";
  return "Ready";
}

function buildSummary(status: ReadinessStatus, exceptions: CaseException[]) {
  const open = exceptions.filter(
    (item) => !["Resolved", "Dismissed"].includes(item.status)
  );
  const blockers = open.filter((item) => item.blocking);

  if (status === "Ready") {
    return "All required checks in this fake/sample case are marked verified. The case is ready for human confirmation, but payer requirements and supporting evidence must still be reviewed by qualified staff.";
  }

  if (status === "Ready with warning") {
    return "No confirmed blocker is present, but one or more noncritical verification or evidence items still need human attention before the service or claim is finalized.";
  }

  if (status === "Blocked") {
    return `This case has ${blockers.length} unresolved blocker${
      blockers.length === 1 ? "" : "s"
    }. The service should not be treated as ready until the blocking items are resolved and documented by a human reviewer.`;
  }

  return `This case has ${open.length} unresolved quer${
    open.length === 1 ? "y" : "ies"
  }. The case remains visible in the exception queue until an owner records evidence, completes the next action, and confirms the outcome.`;
}

function buildFollowUpMessage(caseData: AnalyzeCaseRequest, exceptions: CaseException[]) {
  const open = exceptions.filter(
    (item) => !["Resolved", "Dismissed"].includes(item.status)
  );

  if (open.length === 0) {
    return `Hi, the fake/sample case ${caseData.caseIdentifier} has completed the current readiness checks. Please perform final human review of the payer evidence, CPT-level benefits, authorization/referral details, and supporting documents before confirming the case is ready.`;
  }

  const actionLines = open
    .slice(0, 8)
    .map(
      (item, index) =>
        `${index + 1}. ${item.failedCheck}: ${item.recommendedAction} (Owner: ${item.owner}; due ${new Date(
          item.dueAt
        ).toLocaleString()})`
    )
    .join("\n");

  return `Hi, the fake/sample case ${caseData.caseIdentifier} for ${caseData.patientLabel} is not ready for final confirmation. Please review and update the following items:\n\n${actionLines}\n\nPlease attach or record the supporting payer response, reference number, or document for each resolved item. Human review is required before the case status is changed.`;
}

function addException(
  exceptions: CaseException[],
  caseData: AnalyzeCaseRequest,
  args: Omit<Parameters<typeof createException>[0], "appointmentAt">
) {
  exceptions.push(
    createException({
      ...args,
      appointmentAt: caseData.appointmentAt,
    })
  );
}

export function analyzeReadiness(caseData: AnalyzeCaseRequest): PriorAuthCase {
  const exceptions: CaseException[] = [];
  const { insurance, authorization, referral } = caseData;

  if (!caseData.patientLabel.trim() || !caseData.dateOfBirth.trim()) {
    addException(exceptions, caseData, {
      category: "Demographics",
      failedCheck: "Patient demographics are incomplete",
      explanation:
        "The fake/sample case does not contain both a patient label and a date of birth. Payer matching cannot be treated as complete.",
      blocking: true,
      evidenceState: "Insufficient information",
      recommendedAction:
        "Complete and verify the fictional demographic fields before relying on eligibility results.",
      owner: "Front Desk",
    });
  }

  if (!insurance.memberId.trim()) {
    addException(exceptions, caseData, {
      category: "Demographics",
      failedCheck: "Member ID is missing",
      explanation:
        "No fictional member ID is recorded, so payer eligibility and plan matching cannot be verified.",
      blocking: true,
      evidenceState: "Insufficient information",
      recommendedAction:
        "Add the fictional member ID and confirm it against the sample payer response.",
      owner: "Eligibility Team",
    });
  }

  if (insurance.eligibilityStatus === "Inactive") {
    addException(exceptions, caseData, {
      category: "Eligibility",
      failedCheck: "Coverage is inactive for the date of service",
      explanation:
        "The case is marked inactive. Proceeding without a corrected payer response could create noncoverage or patient-responsibility issues.",
      blocking: true,
      evidenceState: insurance.source,
      recommendedAction:
        "Confirm the date-of-service eligibility with the payer and document the final response before the appointment proceeds.",
      owner: "Eligibility Team",
    });
  } else if (
    insurance.eligibilityStatus === "Not verified" ||
    insurance.eligibilityStatus === "Conflicting"
  ) {
    addException(exceptions, caseData, {
      category: "Eligibility",
      failedCheck:
        insurance.eligibilityStatus === "Conflicting"
          ? "Eligibility sources conflict"
          : "Date-of-service eligibility is not verified",
      explanation:
        "The case does not contain a dependable payer-confirmed eligibility result for the applicable date of service.",
      blocking: insurance.eligibilityStatus === "Conflicting",
      evidenceState: insurance.source,
      recommendedAction:
        "Verify active coverage for the exact date of service and preserve the payer response, source date, and reference number.",
      owner: "Eligibility Team",
    });
  }

  if (
    insurance.cobStatus === "COB conflict" ||
    insurance.cobStatus === "COB information missing" ||
    insurance.cobStatus === "Patient confirmation required" ||
    insurance.cobStatus === "Payer confirmation required" ||
    insurance.cobStatus === "Manual review required"
  ) {
    addException(exceptions, caseData, {
      category: "COB",
      failedCheck: "Coordination of Benefits is unresolved",
      explanation: `The recorded COB state is “${insurance.cobStatus}.” The primary payer and reimbursement order cannot be treated as final.`,
      blocking: insurance.cobStatus === "COB conflict",
      evidenceState: insurance.source,
      recommendedAction:
        "Confirm primary and secondary coverage with the patient and payer, then document the verification date and source.",
      owner: "Eligibility Team",
    });
  }

  if (insurance.networkStatus === "Out of network without OON benefit") {
    addException(exceptions, caseData, {
      category: "Network",
      failedCheck: "Provider is out of network without an OON benefit",
      explanation:
        "The current case states that the provider is out of network and no out-of-network benefit is available.",
      blocking: true,
      evidenceState: insurance.source,
      recommendedAction:
        "Escalate for a documented patient/practice decision, alternative provider, or payer clarification before service.",
      owner: "Practice Manager",
    });
  } else if (insurance.networkStatus === "Unknown") {
    addException(exceptions, caseData, {
      category: "Network",
      failedCheck: "Network status is unknown",
      explanation:
        "The case does not confirm whether the rendering provider and facility participate in the patient’s plan.",
      blocking: false,
      evidenceState: insurance.source,
      recommendedAction:
        "Verify provider and facility network status for the plan and date of service.",
      owner: "Eligibility Team",
    });
  }

  if (
    insurance.patientResponsibility.status === "Not provided" ||
    insurance.patientResponsibility.status === "Manual confirmation required"
  ) {
    addException(exceptions, caseData, {
      category: "Patient Responsibility",
      failedCheck: "Patient financial responsibility is incomplete",
      explanation:
        "Copay, deductible, coinsurance, or out-of-pocket information is not fully supported by the recorded source.",
      blocking: false,
      evidenceState: insurance.source,
      recommendedAction:
        "Confirm the applicable copay, deductible, coinsurance, and out-of-pocket information without presenting an unsupported exact estimate.",
      owner: "Eligibility Team",
    });
  }

  if (!isPayerEvidence(insurance.source)) {
    addException(exceptions, caseData, {
      category: "Workflow",
      failedCheck: "Benefits are not supported by payer-sourced evidence",
      explanation:
        "The current benefits result is not tied to a direct payer response, payer phone reference, or uploaded payer document.",
      blocking: false,
      evidenceState: insurance.source,
      recommendedAction:
        "Preserve the payer response, applicable date of service, source date, and reference number before final confirmation.",
      owner: "Human Reviewer",
    });
  }

  if (!insurance.referenceNumber.trim()) {
    addException(exceptions, caseData, {
      category: "Workflow",
      failedCheck: "No payer reference number is recorded",
      explanation:
        "The verification result cannot be easily retraced because no payer reference or search number is attached.",
      blocking: false,
      evidenceState: insurance.source,
      recommendedAction:
        "Record the payer portal trace, phone-call reference, transaction identifier, or document reference.",
      owner: "Eligibility Team",
    });
  }

  if (caseData.services.length === 0) {
    addException(exceptions, caseData, {
      category: "Coverage",
      failedCheck: "No CPT service lines are recorded",
      explanation:
        "Plan-level eligibility alone does not establish coverage for the requested service.",
      blocking: true,
      evidenceState: "Insufficient information",
      recommendedAction:
        "Add each requested CPT and review coverage, authorization, referral, limits, and patient responsibility separately.",
      owner: "Biller",
    });
  }

  for (const service of caseData.services) {
    const label = service.cpt || "Unspecified CPT";

    if (!service.cpt.trim()) {
      addException(exceptions, caseData, {
        category: "Coverage",
        failedCheck: "A service line is missing its CPT",
        explanation:
          "A requested service cannot be checked at the code level because the CPT field is blank.",
        blocking: true,
        evidenceState: service.source,
        recommendedAction:
          "Add the fictional CPT and have a qualified reviewer confirm the code before benefits or authorization review.",
        owner: "Coder",
      });
    }

    if (service.covered === "No") {
      addException(exceptions, caseData, {
        category: "Coverage",
        failedCheck: `${label} is marked noncovered`,
        explanation:
          "The recorded payer result states that this CPT is not covered under the current plan.",
        blocking: true,
        evidenceState: service.source,
        recommendedAction:
          "Confirm the noncoverage result and document the practice/patient decision before the service proceeds.",
        owner: "Practice Manager",
      });
    } else if (service.covered === "Unknown") {
      addException(exceptions, caseData, {
        category: "Coverage",
        failedCheck: `${label} coverage is unknown`,
        explanation:
          "Active eligibility does not confirm that this specific CPT is payable.",
        blocking: false,
        evidenceState: service.source,
        recommendedAction:
          "Search the CPT benefit with the payer and preserve the response for the date of service.",
        owner: "Eligibility Team",
      });
    }

    if (service.authorizationRequirement === "Unknown") {
      addException(exceptions, caseData, {
        category: "Authorization",
        failedCheck: `${label} authorization requirement is unknown`,
        explanation:
          "The case does not establish whether authorization is required for this specific CPT.",
        blocking: false,
        evidenceState: service.source,
        recommendedAction:
          "Verify the CPT-specific authorization requirement with the payer and record the source.",
        owner: "Prior Auth Team",
      });
    }

    if (
      service.authorizationRequirement === "Required" &&
      authorization.status !== "Approved"
    ) {
      const blocking = [
        "Required - not submitted",
        "Denied",
        "Expired",
        "Unclear",
        "Not reviewed",
      ].includes(authorization.status);

      addException(exceptions, caseData, {
        category: "Authorization",
        failedCheck: `${label} does not have a confirmed active authorization`,
        explanation: `Authorization is required for this service, but the recorded authorization state is “${authorization.status}.”`,
        blocking,
        evidenceState: authorization.source,
        recommendedAction:
          "Confirm submission, approved CPTs, effective dates, units, and the authorization letter before service.",
        owner: "Prior Auth Team",
      });
    }

    if (
      service.authorizationRequirement === "Required" &&
      authorization.status === "Approved" &&
      !authorization.approvedCpts.includes(service.cpt)
    ) {
      addException(exceptions, caseData, {
        category: "Authorization",
        failedCheck: `${label} is not listed on the approved authorization`,
        explanation:
          "An authorization is recorded, but this CPT is not included in the approved CPT list.",
        blocking: true,
        evidenceState: authorization.source,
        recommendedAction:
          "Verify the approved service codes with the payer and obtain a corrected authorization if needed.",
        owner: "Prior Auth Team",
      });
    }

    if (service.referralRequirement === "Unknown") {
      addException(exceptions, caseData, {
        category: "Referral",
        failedCheck: `${label} referral requirement is unknown`,
        explanation:
          "The case does not establish whether a referral is required for this service and plan.",
        blocking: false,
        evidenceState: service.source,
        recommendedAction:
          "Verify the CPT-specific referral requirement and document the payer response.",
        owner: "Front Desk",
      });
    }

    if (
      service.referralRequirement === "Required" &&
      referral.status !== "Valid"
    ) {
      addException(exceptions, caseData, {
        category: "Referral",
        failedCheck: `${label} does not have a valid referral`,
        explanation: `A referral is required, but the recorded referral state is “${referral.status}.”`,
        blocking: ["Missing", "Expired", "Mismatched"].includes(referral.status),
        evidenceState: referral.source,
        recommendedAction:
          "Obtain or correct the referral and confirm its dates, provider, CPT coverage, and document before service.",
        owner: "Front Desk",
      });
    }

    if (service.remainingUnits === 0) {
      addException(exceptions, caseData, {
        category: "Visit Limits",
        failedCheck: `${label} benefits are exhausted`,
        explanation:
          "The recorded remaining visits/units are zero.",
        blocking: true,
        evidenceState: service.source,
        recommendedAction:
          "Confirm the exhausted benefit and document the next practice/patient decision before additional service.",
        owner: "Eligibility Team",
      });
    } else if (
      service.remainingUnits !== null &&
      service.remainingUnits <= Math.max(1, service.requestedUnits)
    ) {
      addException(exceptions, caseData, {
        category: "Visit Limits",
        failedCheck: `${label} is approaching its visit or unit limit`,
        explanation: `Only ${service.remainingUnits} visit/unit${
          service.remainingUnits === 1 ? " remains" : "s remain"
        } for a request of ${service.requestedUnits}.`,
        blocking: false,
        evidenceState: service.source,
        recommendedAction:
          "Confirm the remaining benefit and whether additional authorization or review is required.",
        owner: "Eligibility Team",
      });
    }

    if (!isPayerEvidence(service.source) || !service.referenceNumber.trim()) {
      addException(exceptions, caseData, {
        category: "Workflow",
        failedCheck: `${label} benefit evidence is incomplete`,
        explanation:
          "The CPT result is not fully tied to payer-sourced proof and a retraceable reference number.",
        blocking: false,
        evidenceState: service.source,
        recommendedAction:
          "Attach or record the CPT search response, source date, applicable date of service, and payer reference.",
        owner: "Human Reviewer",
      });
    }
  }

  if (caseData.diagnoses.length === 0 || !caseData.diagnoses.some((item) => item.icd10.trim())) {
    addException(exceptions, caseData, {
      category: "Coding / Diagnosis",
      failedCheck: "No ICD-10 diagnosis is recorded",
      explanation:
        "The authorization and documentation workflow lacks a diagnosis code to connect to the requested services.",
      blocking: true,
      evidenceState: "Insufficient information",
      recommendedAction:
        "Add the fictional ICD-10 information and require qualified coding/clinical review. PriorAuthIQ must not make the final coding decision.",
      owner: "Coder",
    });
  }

  for (const diagnosis of caseData.diagnoses) {
    if (diagnosis.icd10 && diagnosis.linkedCpts.length === 0) {
      addException(exceptions, caseData, {
        category: "Coding / Diagnosis",
        failedCheck: `${diagnosis.icd10} is not linked to a requested CPT`,
        explanation:
          "The case does not show which service line the diagnosis supports.",
        blocking: false,
        evidenceState: diagnosis.source,
        recommendedAction:
          "Have a qualified coder or clinician review the diagnosis-to-service linkage and supporting note.",
        owner: "Coder",
      });
    }

    if (
      diagnosis.supportStatus === "Missing support" ||
      diagnosis.supportStatus === "Needs coding review" ||
      diagnosis.supportStatus === "Not reviewed"
    ) {
      addException(exceptions, caseData, {
        category: "Coding / Diagnosis",
        failedCheck: `${diagnosis.icd10 || "Diagnosis"} needs supporting review`,
        explanation: `The diagnosis support state is “${diagnosis.supportStatus}.”`,
        blocking: diagnosis.supportStatus === "Missing support",
        evidenceState: diagnosis.source,
        recommendedAction:
          "Route the diagnosis and supporting clinical note to a qualified human reviewer.",
        owner: diagnosis.supportStatus === "Missing support" ? "Provider" : "Coder",
      });
    }
  }

  for (const document of caseData.documents) {
    if (document.required === "Required" && document.status === "Missing") {
      addException(exceptions, caseData, {
        category: "Documentation",
        failedCheck: `${document.name} is missing`,
        explanation:
          "The case marks this document as required, but no document is present.",
        blocking: document.blocking,
        evidenceState: document.source,
        recommendedAction: `Obtain and attach the ${document.name.toLowerCase()}, then record the source and review date.`,
        owner:
          document.name.toLowerCase().includes("provider") ||
          document.name.toLowerCase().includes("clinical")
            ? "Provider"
            : "Front Desk",
      });
    } else if (
      document.required === "Unknown" ||
      document.status === "Needs review"
    ) {
      addException(exceptions, caseData, {
        category: "Documentation",
        failedCheck: `${document.name} requirement needs review`,
        explanation:
          "The case does not confirm whether this document is required or sufficient for the requested service.",
        blocking: false,
        evidenceState: document.source,
        recommendedAction:
          "Verify the document requirement for the specialty, service, payer, and authorization workflow.",
        owner: "Human Reviewer",
      });
    }
  }

  if (
    authorization.status === "Approved" &&
    (!authorization.authorizationNumber.trim() ||
      !authorization.effectiveDate ||
      !authorization.expirationDate ||
      !authorization.letterPresent)
  ) {
    addException(exceptions, caseData, {
      category: "Authorization",
      failedCheck: "Approved authorization evidence is incomplete",
      explanation:
        "The case is marked approved, but the authorization number, effective dates, expiration date, or authorization letter is missing.",
      blocking: false,
      evidenceState: authorization.source,
      recommendedAction:
        "Complete the authorization details and preserve the authorization letter before final confirmation.",
      owner: "Prior Auth Team",
    });
  }

  const status = determineStatus(exceptions);
  const priority = getTimePriority(caseData.appointmentAt);
  const now = new Date().toISOString();
  const auditTrail: AuditEvent[] = [
    ...(caseData.auditTrail || []),
    {
      id: makeId("audit"),
      eventType: "Analysis completed",
      description: `Evidence-first readiness review completed with status “${status}” and ${exceptions.length} generated exception${
        exceptions.length === 1 ? "" : "s"
      }.`,
      actor: "PriorAuthIQ workflow engine",
      createdAt: now,
    },
  ];

  return {
    ...caseData,
    status,
    priority,
    exceptions,
    auditTrail,
    readinessSummary: buildSummary(status, exceptions),
    followUpMessage: buildFollowUpMessage(caseData, exceptions),
    updatedAt: now,
    humanReviewRequired: true,
    humanConfirmed: false,
  };
}

export function isExceptionOverdue(exception: CaseException, now = new Date()) {
  if (["Resolved", "Dismissed"].includes(exception.status)) return false;
  const due = asDate(exception.dueAt);
  return Boolean(due && due.getTime() < now.getTime());
}

export function isAppointmentWithinHours(
  appointmentAt: string,
  hours: number,
  now = new Date()
) {
  const appointment = asDate(appointmentAt);
  if (!appointment) return false;
  const difference = appointment.getTime() - now.getTime();
  return difference >= 0 && difference <= hours * 3_600_000;
}

export function formatDateOnly(value: string) {
  const date = asDate(value);
  if (!date) return "Not recorded";
  return startOfDay(date).toLocaleDateString();
}
