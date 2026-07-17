import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { PriorAuthCase, ReadinessStatus } from "@/lib/types";

const VALID_STATUSES: ReadinessStatus[] = [
  "Ready",
  "Ready with warning",
  "Insurance Query",
  "Authorization Query",
  "Referral Query",
  "Missing Documentation",
  "Manual Review Required",
  "Blocked",
];

type CaseRow = {
  id: string;
  user_id: string;
  patient_label: string;
  payer: string;
  service: string;
  denial_reason: string | null;
  status: string;
  urgency: string | null;
  missing_items: string[] | null;
  summary: string | null;
  appeal_draft: string | null;
  denial_text: string | null;
  notes_text: string | null;
  created_at: string;
  updated_at: string;
  schema_version?: number | null;
  case_identifier?: string | null;
  practice_name?: string | null;
  appointment_at?: string | null;
  date_of_service?: string | null;
  specialty?: string | null;
  provider_name?: string | null;
  facility_name?: string | null;
  readiness_status?: string | null;
  priority?: string | null;
  owner?: string | null;
  follow_up_due_at?: string | null;
  payer_reference_number?: string | null;
  verification_source?: string | null;
  human_confirmed?: boolean | null;
  human_confirmed_at?: string | null;
  case_data?: PriorAuthCase | null;
};

function legacyFallback(row: CaseRow): PriorAuthCase {
  const now = row.updated_at || row.created_at || new Date().toISOString();
  const status = VALID_STATUSES.includes(row.status as ReadinessStatus)
    ? (row.status as ReadinessStatus)
    : "Manual Review Required";

  return {
    id: row.id,
    caseIdentifier: row.case_identifier || `LEGACY-${row.id.slice(0, 8)}`,
    patientLabel: row.patient_label || "Legacy sample case",
    practiceName: row.practice_name || "Sample Practice",
    dateOfBirth: "Not migrated",
    appointmentAt: row.appointment_at || now,
    dateOfService: row.date_of_service || now.slice(0, 10),
    specialty: row.specialty || "Legacy workflow",
    providerName: row.provider_name || "Not migrated",
    facilityName: row.facility_name || "Not migrated",
    placeOfService: "Not migrated",
    telehealth: false,
    status,
    priority: "Soon",
    owner: "Human Reviewer",
    followUpDueAt: row.follow_up_due_at || now,
    createdAt: row.created_at,
    updatedAt: now,
    insurance: {
      payer: row.payer || "Unknown payer",
      planName: "Not migrated",
      memberId: "Not migrated",
      groupNumber: "",
      planType: "Not migrated",
      primaryInsurance: row.payer || "Unknown payer",
      secondaryInsurance: "",
      eligibilityStatus: "Not verified",
      effectiveDate: "",
      terminationDate: "",
      networkStatus: "Unknown",
      cobStatus: "Manual review required",
      cobLastVerifiedDate: "",
      behavioralHealthAdministrator: "",
      patientResponsibility: {
        copay: "",
        deductible: "",
        deductibleMet: "",
        coinsurance: "",
        outOfPocketMax: "",
        outOfPocketMet: "",
        expectedPatientAmount: "",
        status: "Not provided",
      },
      source: "Insufficient information",
      sourceDate: "",
      referenceNumber: row.payer_reference_number || "",
      verifiedBy: "",
    },
    services: [],
    diagnoses: [],
    authorization: {
      status: "Not reviewed",
      authorizationNumber: "",
      submittedDate: "",
      effectiveDate: "",
      expirationDate: "",
      approvedCpts: [],
      approvedUnits: null,
      usedUnits: null,
      supportingDocumentationAttached: "Unknown",
      letterPresent: false,
      source: "Insufficient information",
      referenceNumber: "",
      notes: "Legacy case: rerun through the V2 readiness workflow.",
    },
    referral: {
      status: "Not reviewed",
      referralNumber: "",
      referringProvider: "",
      effectiveDate: "",
      expirationDate: "",
      approvedCpts: [],
      documentPresent: false,
      source: "Insufficient information",
      notes: "Legacy case: rerun through the V2 readiness workflow.",
    },
    documents: [],
    evidence: [],
    exceptions: [
      {
        id: `legacy-exception-${row.id}`,
        category: "Workflow",
        failedCheck: "Legacy review needs V2 migration",
        explanation:
          "This saved case was created with the older risk-score model and does not contain the structured evidence required by V2.",
        blocking: false,
        evidenceState: "Insufficient information",
        recommendedAction:
          "Open a new V2 case, transfer only fake/sample information, and rerun the readiness review.",
        owner: "Human Reviewer",
        priority: "Soon",
        dueAt: row.follow_up_due_at || now,
        status: "Open",
        payerResponse: "",
        resolutionNotes: "",
        createdAt: row.created_at,
        updatedAt: now,
      },
    ],
    auditTrail: [
      {
        id: `legacy-audit-${row.id}`,
        eventType: "Case created",
        description: "Legacy case loaded through the V2 compatibility mapper.",
        actor: "PriorAuthIQ migration layer",
        createdAt: now,
      },
    ],
    readinessSummary:
      row.summary ||
      row.denial_reason ||
      "This legacy case requires manual migration into the V2 readiness workflow.",
    reviewerNotes: row.notes_text || "",
    followUpMessage:
      row.appeal_draft ||
      "Please migrate this fake/sample case into the V2 readiness workflow and complete human review.",
    humanReviewRequired: true,
    humanConfirmed: Boolean(row.human_confirmed),
    sourceCaseText: row.denial_text || "",
  };
}

function mapRowToCase(row: CaseRow): PriorAuthCase {
  if (row.case_data && typeof row.case_data === "object") {
    return {
      ...row.case_data,
      id: row.id,
      createdAt: row.created_at || row.case_data.createdAt,
      updatedAt: row.updated_at || row.case_data.updatedAt,
      humanConfirmed:
        typeof row.human_confirmed === "boolean"
          ? row.human_confirmed
          : row.case_data.humanConfirmed,
    };
  }

  return legacyFallback(row);
}

function toDatabasePayload(caseData: PriorAuthCase, userId: string) {
  const openExceptions = caseData.exceptions.filter(
    (item) => !["Resolved", "Dismissed"].includes(item.status)
  );

  return {
    user_id: userId,
    patient_label: caseData.patientLabel,
    payer: caseData.insurance.payer,
    service:
      caseData.services.map((item) => item.cpt).filter(Boolean).join(", ") ||
      caseData.specialty,
    denial_reason: caseData.readinessSummary,
    status: caseData.status,
    urgency: caseData.priority,
    missing_items: openExceptions.map((item) => item.failedCheck),
    summary: caseData.readinessSummary,
    appeal_draft: caseData.followUpMessage,
    denial_text: caseData.sourceCaseText,
    notes_text: caseData.reviewerNotes,
    schema_version: 2,
    case_identifier: caseData.caseIdentifier,
    practice_name: caseData.practiceName,
    appointment_at: caseData.appointmentAt,
    date_of_service: caseData.dateOfService,
    specialty: caseData.specialty,
    provider_name: caseData.providerName,
    facility_name: caseData.facilityName,
    readiness_status: caseData.status,
    priority: caseData.priority,
    owner: caseData.owner,
    follow_up_due_at: caseData.followUpDueAt,
    payer_reference_number: caseData.insurance.referenceNumber,
    verification_source: caseData.insurance.source,
    human_confirmed: caseData.humanConfirmed,
    human_confirmed_at: caseData.humanConfirmed
      ? new Date().toISOString()
      : null,
    case_data: caseData,
    updated_at: new Date().toISOString(),
  };
}

export async function getCurrentUserId() {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function getSupabaseCases(): Promise<PriorAuthCase[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .order("appointment_at", { ascending: true, nullsFirst: false });

  if (error) throw new Error(error.message);
  return ((data || []) as CaseRow[]).map(mapRowToCase);
}

export async function getSupabaseCaseById(caseId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", userId)
    .single();

  if (error) return null;
  return mapRowToCase(data as CaseRow);
}

export async function addSupabaseCase(newCase: PriorAuthCase) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Log in before saving a demo case.");

  const caseToSave: PriorAuthCase = {
    ...newCase,
    id: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("cases")
    .insert(toDatabasePayload(caseToSave, userId))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRowToCase(data as CaseRow);
}

export async function updateSupabaseCase(updatedCase: PriorAuthCase) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Log in before updating a demo case.");

  const caseToSave: PriorAuthCase = {
    ...updatedCase,
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("cases")
    .update(toDatabasePayload(caseToSave, userId))
    .eq("id", updatedCase.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRowToCase(data as CaseRow);
}

export async function deleteSupabaseCase(caseId: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Log in before deleting a demo case.");

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("id", caseId)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
