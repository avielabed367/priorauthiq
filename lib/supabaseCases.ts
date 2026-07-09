import { supabase } from "@/lib/supabaseClient";
import {
  CaseStatus,
  PriorAuthCase,
  RiskIssue,
  RiskLevel,
} from "@/lib/types";

type CaseRow = {
  id: string;
  user_id: string;
  patient_label: string;
  payer: string;
  service: string;
  denial_reason: string;
  status: string;
  urgency: string;
  missing_items: string[] | null;
  summary: string;
  appeal_draft: string;
  denial_text: string | null;
  notes_text: string | null;
  created_at: string;
  updated_at: string;
};

type StoredReviewPayload = {
  practiceName?: string;
  issuesFound?: RiskIssue[];
  recommendedNextSteps?: string[];
  notesText?: string;
  humanReviewRequired?: boolean;
};

const validStatuses: CaseStatus[] = [
  "New",
  "Needs Review",
  "Waiting on Front Desk",
  "Waiting on Provider",
  "Follow-Up Drafted",
  "Ready for Human Review",
  "Resolved",
];

const validRiskLevels: RiskLevel[] = ["Low", "Medium", "High"];

function normalizeStatus(status: string): CaseStatus {
  if (validStatuses.includes(status as CaseStatus)) {
    return status as CaseStatus;
  }

  if (status === "Waiting on Documents") {
    return "Waiting on Provider";
  }

  if (status === "Appeal Drafted") {
    return "Follow-Up Drafted";
  }

  if (status === "Submitted" || status === "Approved" || status === "Denied Again") {
    return "Ready for Human Review";
  }

  return "Needs Review";
}

function normalizeRiskLevel(riskLevel: string): RiskLevel {
  if (validRiskLevels.includes(riskLevel as RiskLevel)) {
    return riskLevel as RiskLevel;
  }

  return "Medium";
}

function parseStoredReviewPayload(rawNotesText: string | null): StoredReviewPayload {
  if (!rawNotesText) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawNotesText);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        notesText: rawNotesText,
      };
    }

    return parsed as StoredReviewPayload;
  } catch {
    return {
      notesText: rawNotesText,
    };
  }
}

function serializeStoredReviewPayload(caseData: PriorAuthCase) {
  const payload: StoredReviewPayload = {
    practiceName: caseData.practiceName,
    issuesFound: caseData.issuesFound,
    recommendedNextSteps: caseData.recommendedNextSteps,
    notesText: caseData.notesText || "",
    humanReviewRequired: caseData.humanReviewRequired,
  };

  return JSON.stringify(payload);
}

function buildFallbackIssues(caseData: {
  payer: string;
  service: string;
  riskLevel: RiskLevel;
  riskReason: string;
  missingItems: string[];
}): RiskIssue[] {
  const missingItemsText =
    caseData.missingItems.length > 0
      ? caseData.missingItems.join(", ")
      : "No missing items were listed.";

  return [
    {
      category: "Follow-Up / Workflow",
      title: "Saved case needs human review",
      riskLevel: caseData.riskLevel,
      finding: caseData.riskReason || "This saved case needs review before the team relies on it.",
      whyItMatters:
        "PriorAuthIQ supports review workflow, but it does not make final billing, medical, legal, or coverage decisions.",
      recommendedAction: `Review the saved case for ${caseData.service}, confirm payer requirements with ${caseData.payer}, and resolve missing items: ${missingItemsText}`,
      owner: "Human Reviewer",
    },
  ];
}

function mapRowToCase(row: CaseRow): PriorAuthCase {
  const payload = parseStoredReviewPayload(row.notes_text);
  const overallRiskLevel = normalizeRiskLevel(row.urgency);
  const missingItems = Array.isArray(row.missing_items) ? row.missing_items : [];
  const riskReason =
    row.denial_reason ||
    "This case needs front-end review for eligibility, authorization, documentation, coverage, coding, and follow-up risk.";

  const issuesFound =
    Array.isArray(payload.issuesFound) && payload.issuesFound.length > 0
      ? payload.issuesFound
      : buildFallbackIssues({
          payer: row.payer,
          service: row.service,
          riskLevel: overallRiskLevel,
          riskReason,
          missingItems,
        });

  return {
    id: row.id,
    patientLabel: row.patient_label,
    practiceName: payload.practiceName || "Sample Practice",
    payer: row.payer,
    service: row.service,
    status: normalizeStatus(row.status),
    createdAt: row.created_at.slice(0, 10),
    overallRiskLevel,
    riskReason,
    issuesFound,
    missingItems,
    recommendedNextSteps: Array.isArray(payload.recommendedNextSteps)
      ? payload.recommendedNextSteps
      : [
          "Review eligibility, authorization, documentation, coverage, coding, and follow-up risks.",
          "Confirm missing information with the payer, front desk, or provider.",
          "Document all follow-up attempts and require human review before moving forward.",
        ],
    summary:
      row.summary ||
      "This case needs human review before any billing, medical, legal, or coverage decision is made.",
    followUpMessage:
      row.appeal_draft ||
      "Hi, can you please review this case for missing eligibility, authorization, documentation, coverage, and follow-up items before billing moves forward?",
    humanReviewRequired:
      typeof payload.humanReviewRequired === "boolean"
        ? payload.humanReviewRequired
        : true,
    sourceCaseText: row.denial_text || "",
    notesText: payload.notesText || "",
  };
}

export async function getCurrentUserId() {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return null;
  }

  return data.user.id;
}

export async function getSupabaseCases(): Promise<PriorAuthCase[]> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data || []) as CaseRow[]).map(mapRowToCase);
}

export async function getSupabaseCaseById(
  caseId: string
): Promise<PriorAuthCase | null> {
  const userId = await getCurrentUserId();

  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from("cases")
    .select("*")
    .eq("id", caseId)
    .eq("user_id", userId)
    .single();

  if (error) {
    return null;
  }

  return mapRowToCase(data as CaseRow);
}

export async function addSupabaseCase(newCase: PriorAuthCase) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to save cases.");
  }

  const { data, error } = await supabase
    .from("cases")
    .insert({
      user_id: userId,
      patient_label: newCase.patientLabel,
      payer: newCase.payer,
      service: newCase.service,
      denial_reason: newCase.riskReason,
      status: newCase.status,
      urgency: newCase.overallRiskLevel,
      missing_items: newCase.missingItems,
      summary: newCase.summary,
      appeal_draft: newCase.followUpMessage,
      denial_text: newCase.sourceCaseText || "",
      notes_text: serializeStoredReviewPayload(newCase),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToCase(data as CaseRow);
}

export async function updateSupabaseCase(updatedCase: PriorAuthCase) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to update cases.");
  }

  const { data, error } = await supabase
    .from("cases")
    .update({
      patient_label: updatedCase.patientLabel,
      payer: updatedCase.payer,
      service: updatedCase.service,
      denial_reason: updatedCase.riskReason,
      status: updatedCase.status,
      urgency: updatedCase.overallRiskLevel,
      missing_items: updatedCase.missingItems,
      summary: updatedCase.summary,
      appeal_draft: updatedCase.followUpMessage,
      denial_text: updatedCase.sourceCaseText || "",
      notes_text: serializeStoredReviewPayload(updatedCase),
      updated_at: new Date().toISOString(),
    })
    .eq("id", updatedCase.id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToCase(data as CaseRow);
}

export async function deleteSupabaseCase(caseId: string) {
  const userId = await getCurrentUserId();

  if (!userId) {
    throw new Error("You must be logged in to delete cases.");
  }

  const { error } = await supabase
    .from("cases")
    .delete()
    .eq("id", caseId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}