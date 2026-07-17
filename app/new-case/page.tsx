"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  FileSearch,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { sampleCaseRequests } from "@/lib/demoCases";
import { addSupabaseCase, getCurrentUserId } from "@/lib/supabaseCases";
import { supabase } from "@/lib/supabaseClient";
import {
  AnalyzeCaseRequest,
  AuthorizationStatus,
  CobStatus,
  DocumentItem,
  EligibilityStatus,
  NetworkStatus,
  PriorAuthCase,
  ReferralStatus,
  RequirementState,
  ReviewState,
  ServiceLine,
  VerificationSource,
  YesNoUnknown,
} from "@/lib/types";

const sourceOptions: VerificationSource[] = [
  "Verified from payer",
  "Verified from EHR",
  "Verified by payer phone call",
  "Uploaded payer document",
  "Manually entered",
  "Conflicting sources",
  "Not verified",
  "Insufficient information",
];

const eligibilityOptions: EligibilityStatus[] = [
  "Active",
  "Inactive",
  "Not verified",
  "Conflicting",
];

const networkOptions: NetworkStatus[] = [
  "In network",
  "Out of network with OON benefit",
  "Out of network without OON benefit",
  "Unknown",
];

const cobOptions: CobStatus[] = [
  "No secondary coverage reported",
  "Primary payer confirmed",
  "Primary and secondary confirmed",
  "COB information missing",
  "COB conflict",
  "Patient confirmation required",
  "Payer confirmation required",
  "Manual review required",
];

const authorizationOptions: AuthorizationStatus[] = [
  "Not reviewed",
  "Not required",
  "Required - not submitted",
  "Pending",
  "Approved",
  "Denied",
  "Expired",
  "Unclear",
];

const referralOptions: ReferralStatus[] = [
  "Not reviewed",
  "Not required",
  "Valid",
  "Missing",
  "Expired",
  "Mismatched",
  "Unclear",
];

function cloneSample(index: number) {
  return structuredClone(sampleCaseRequests[index]);
}

function toLocalDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function localDateTimeToIso(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function makeService(): ServiceLine {
  return {
    id: crypto.randomUUID(),
    cpt: "",
    description: "",
    covered: "Unknown",
    coveragePercent: "",
    authorizationRequirement: "Unknown",
    referralRequirement: "Unknown",
    networkRequirement: "",
    requestedUnits: 1,
    visitLimit: null,
    usedUnits: null,
    remainingUnits: null,
    copay: "",
    coinsurance: "",
    deductibleApplies: "Unknown",
    source: "Not verified",
    verifiedDate: "",
    referenceNumber: "",
    reviewState: "Not reviewed",
  };
}

function makeDocument(): DocumentItem {
  return {
    id: crypto.randomUUID(),
    name: "New document",
    required: "Unknown",
    status: "Needs review",
    blocking: false,
    source: "Not verified",
    fileName: "",
    verifiedDate: "",
    notes: "",
  };
}

export default function NewCasePage() {
  const router = useRouter();
  const [draft, setDraft] = useState<AnalyzeCaseRequest>(() => cloneSample(0));
  const [selectedSample, setSelectedSample] = useState(0);
  const [result, setResult] = useState<PriorAuthCase | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getCurrentUserId().then(setUserId);
  }, []);

  const openExceptions = useMemo(
    () =>
      result?.exceptions.filter(
        (item) => !["Resolved", "Dismissed"].includes(item.status)
      ) || [],
    [result]
  );

  function updateDraft<K extends keyof AnalyzeCaseRequest>(
    key: K,
    value: AnalyzeCaseRequest[K]
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setResult(null);
  }

  function updateInsurance<K extends keyof AnalyzeCaseRequest["insurance"]>(
    key: K,
    value: AnalyzeCaseRequest["insurance"][K]
  ) {
    setDraft((current) => ({
      ...current,
      insurance: { ...current.insurance, [key]: value },
    }));
    setResult(null);
  }

  function updateResponsibility<
    K extends keyof AnalyzeCaseRequest["insurance"]["patientResponsibility"]
  >(
    key: K,
    value: AnalyzeCaseRequest["insurance"]["patientResponsibility"][K]
  ) {
    setDraft((current) => ({
      ...current,
      insurance: {
        ...current.insurance,
        patientResponsibility: {
          ...current.insurance.patientResponsibility,
          [key]: value,
        },
      },
    }));
    setResult(null);
  }

  function updateService<K extends keyof ServiceLine>(
    id: string,
    key: K,
    value: ServiceLine[K]
  ) {
    setDraft((current) => ({
      ...current,
      services: current.services.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
    setResult(null);
  }

  function updateDiagnosis(
    id: string,
    key: keyof AnalyzeCaseRequest["diagnoses"][number],
    value: string | string[] | boolean
  ) {
    setDraft((current) => ({
      ...current,
      diagnoses: current.diagnoses.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
    setResult(null);
  }

  function updateAuthorization<K extends keyof AnalyzeCaseRequest["authorization"]>(
    key: K,
    value: AnalyzeCaseRequest["authorization"][K]
  ) {
    setDraft((current) => ({
      ...current,
      authorization: { ...current.authorization, [key]: value },
    }));
    setResult(null);
  }

  function updateReferral<K extends keyof AnalyzeCaseRequest["referral"]>(
    key: K,
    value: AnalyzeCaseRequest["referral"][K]
  ) {
    setDraft((current) => ({
      ...current,
      referral: { ...current.referral, [key]: value },
    }));
    setResult(null);
  }

  function updateDocument<K extends keyof DocumentItem>(
    id: string,
    key: K,
    value: DocumentItem[K]
  ) {
    setDraft((current) => ({
      ...current,
      documents: current.documents.map((item) =>
        item.id === id ? { ...item, [key]: value } : item
      ),
    }));
    setResult(null);
  }

  function loadSample(index: number) {
    setSelectedSample(index);
    setDraft(cloneSample(index));
    setResult(null);
    setError("");
    setMessage("Sample scenario loaded.");
  }

  async function analyzeCase() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { data } = await supabase.auth.getSession();
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.session?.access_token
            ? { Authorization: `Bearer ${data.session.access_token}` }
            : {}),
        },
        body: JSON.stringify({ ...draft, demoAcknowledged: true }),
      });

      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Analysis failed.");
      setResult(payload as PriorAuthCase);
      setMessage("Evidence-first readiness review completed.");
    } catch (analysisError) {
      setError(
        analysisError instanceof Error
          ? analysisError.message
          : "Could not complete the readiness review."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveResult() {
    if (!result) return;
    if (!userId) {
      setError("Log in before saving a fake/sample case.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const saved = await addSupabaseCase({ ...result, id: "" });
      router.push(`/cases/${saved.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save case.");
    } finally {
      setSaving(false);
    }
  }

  async function copyFollowUp() {
    if (!result) return;
    await navigator.clipboard.writeText(result.followUpMessage);
    setMessage("Follow-up message copied.");
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Guided fake-case review</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Build a case-readiness review
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
            Start with a realistic fictional scenario, adjust the structured facts, and run an evidence-first review that never invents payer requirements.
          </p>
        </div>
        <Button onClick={analyzeCase} disabled={loading} className="h-11 bg-white px-5 text-slate-950 hover:bg-slate-200">
          <Sparkles size={16} /> {loading ? "Reviewing case..." : "Run readiness review"}
        </Button>
      </div>

      <div className="mt-6 notice notice-amber">
        <strong>Fake/sample data only.</strong> Do not paste real names, dates of birth, member IDs, insurance cards, clinical records, or any PHI. Every output requires human review.
      </div>

      <section className="panel mt-6 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="field-label">Start from a fictional workflow</label>
            <select
              value={selectedSample}
              onChange={(event) => loadSample(Number(event.target.value))}
              className="field-input mt-2"
            >
              <option value={0}>Physical therapy — unresolved COB, CPT coverage, referral, and documents</option>
              <option value={1}>Behavioral health — carve-out verified, recurring authorization pending</option>
              <option value={2}>Pain management — payer evidence and authorization complete</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => loadSample(selectedSample)}>
            <RotateCcw size={15} /> Reset sample
          </Button>
        </div>
      </section>

      <div className="mt-6 space-y-5">
        <FormSection title="1. Case and appointment" subtitle="Only fictional identifiers belong in this demo." defaultOpen>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Case ID" value={draft.caseIdentifier} onChange={(value) => updateDraft("caseIdentifier", value)} />
            <TextField label="Sample patient label" value={draft.patientLabel} onChange={(value) => updateDraft("patientLabel", value)} />
            <TextField label="Practice" value={draft.practiceName} onChange={(value) => updateDraft("practiceName", value)} />
            <TextField label="Fictional date of birth" type="date" value={draft.dateOfBirth} onChange={(value) => updateDraft("dateOfBirth", value)} />
            <TextField label="Appointment" type="datetime-local" value={toLocalDateTime(draft.appointmentAt)} onChange={(value) => updateDraft("appointmentAt", localDateTimeToIso(value))} />
            <TextField label="Date of service" type="date" value={draft.dateOfService} onChange={(value) => updateDraft("dateOfService", value)} />
            <TextField label="Specialty" value={draft.specialty} onChange={(value) => updateDraft("specialty", value)} />
            <TextField label="Provider" value={draft.providerName} onChange={(value) => updateDraft("providerName", value)} />
            <TextField label="Facility" value={draft.facilityName} onChange={(value) => updateDraft("facilityName", value)} />
            <TextField label="Place of service" value={draft.placeOfService} onChange={(value) => updateDraft("placeOfService", value)} />
            <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
              <input type="checkbox" checked={draft.telehealth} onChange={(event) => updateDraft("telehealth", event.target.checked)} />
              Telehealth service
            </label>
          </div>
        </FormSection>

        <FormSection title="2. Eligibility, benefits, network, and COB" subtitle="The workflow begins with date-of-service eligibility and the payer evidence behind it." defaultOpen>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Payer" value={draft.insurance.payer} onChange={(value) => updateInsurance("payer", value)} />
            <TextField label="Plan" value={draft.insurance.planName} onChange={(value) => updateInsurance("planName", value)} />
            <TextField label="Fictional member ID" value={draft.insurance.memberId} onChange={(value) => updateInsurance("memberId", value)} />
            <TextField label="Group number" value={draft.insurance.groupNumber} onChange={(value) => updateInsurance("groupNumber", value)} />
            <TextField label="Plan type" value={draft.insurance.planType} onChange={(value) => updateInsurance("planType", value)} />
            <SelectField label="Eligibility status" value={draft.insurance.eligibilityStatus} options={eligibilityOptions} onChange={(value) => updateInsurance("eligibilityStatus", value as EligibilityStatus)} />
            <TextField label="Effective date" type="date" value={draft.insurance.effectiveDate} onChange={(value) => updateInsurance("effectiveDate", value)} />
            <TextField label="Termination date" type="date" value={draft.insurance.terminationDate} onChange={(value) => updateInsurance("terminationDate", value)} />
            <SelectField label="Network status" value={draft.insurance.networkStatus} options={networkOptions} onChange={(value) => updateInsurance("networkStatus", value as NetworkStatus)} />
            <SelectField label="COB status" value={draft.insurance.cobStatus} options={cobOptions} onChange={(value) => updateInsurance("cobStatus", value as CobStatus)} />
            <TextField label="Primary insurance" value={draft.insurance.primaryInsurance} onChange={(value) => updateInsurance("primaryInsurance", value)} />
            <TextField label="Secondary insurance" value={draft.insurance.secondaryInsurance} onChange={(value) => updateInsurance("secondaryInsurance", value)} />
            <TextField label="BH administrator / carve-out" value={draft.insurance.behavioralHealthAdministrator} onChange={(value) => updateInsurance("behavioralHealthAdministrator", value)} />
            <SelectField label="Verification source" value={draft.insurance.source} options={sourceOptions} onChange={(value) => updateInsurance("source", value as VerificationSource)} />
            <TextField label="Source date" type="date" value={draft.insurance.sourceDate} onChange={(value) => updateInsurance("sourceDate", value)} />
            <TextField label="Payer reference" value={draft.insurance.referenceNumber} onChange={(value) => updateInsurance("referenceNumber", value)} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <TextField label="Copay" value={draft.insurance.patientResponsibility.copay} onChange={(value) => updateResponsibility("copay", value)} />
            <TextField label="Deductible" value={draft.insurance.patientResponsibility.deductible} onChange={(value) => updateResponsibility("deductible", value)} />
            <TextField label="Deductible met" value={draft.insurance.patientResponsibility.deductibleMet} onChange={(value) => updateResponsibility("deductibleMet", value)} />
            <TextField label="Coinsurance" value={draft.insurance.patientResponsibility.coinsurance} onChange={(value) => updateResponsibility("coinsurance", value)} />
            <TextField label="Out-of-pocket max" value={draft.insurance.patientResponsibility.outOfPocketMax} onChange={(value) => updateResponsibility("outOfPocketMax", value)} />
            <TextField label="Out-of-pocket met" value={draft.insurance.patientResponsibility.outOfPocketMet} onChange={(value) => updateResponsibility("outOfPocketMet", value)} />
            <SelectField
              label="Financial responsibility state"
              value={draft.insurance.patientResponsibility.status}
              options={["Verified", "Estimated", "Not provided", "Manual confirmation required"]}
              onChange={(value) => updateResponsibility("status", value as AnalyzeCaseRequest["insurance"]["patientResponsibility"]["status"])}
            />
          </div>
        </FormSection>

        <FormSection title="3. CPT-level benefits" subtitle="Every requested CPT gets its own coverage, authorization, referral, limit, source, and reviewer state." defaultOpen>
          <div className="space-y-4">
            {draft.services.map((service, index) => (
              <div key={service.id} className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">Service line {index + 1}</div>
                  {draft.services.length > 1 && (
                    <button
                      onClick={() => updateDraft("services", draft.services.filter((item) => item.id !== service.id))}
                      className="icon-button text-rose-200"
                      aria-label="Remove service line"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <TextField label="CPT" value={service.cpt} onChange={(value) => updateService(service.id, "cpt", value)} />
                  <TextField label="Description" value={service.description} onChange={(value) => updateService(service.id, "description", value)} />
                  <SelectField label="Covered?" value={service.covered} options={["Yes", "No", "Unknown"]} onChange={(value) => updateService(service.id, "covered", value as YesNoUnknown)} />
                  <TextField label="Coverage" value={service.coveragePercent} onChange={(value) => updateService(service.id, "coveragePercent", value)} />
                  <SelectField label="Auth requirement" value={service.authorizationRequirement} options={["Required", "Not required", "Unknown"]} onChange={(value) => updateService(service.id, "authorizationRequirement", value as RequirementState)} />
                  <SelectField label="Referral requirement" value={service.referralRequirement} options={["Required", "Not required", "Unknown"]} onChange={(value) => updateService(service.id, "referralRequirement", value as RequirementState)} />
                  <NumberField label="Requested units" value={service.requestedUnits} onChange={(value) => updateService(service.id, "requestedUnits", value)} />
                  <NullableNumberField label="Visit/unit limit" value={service.visitLimit} onChange={(value) => updateService(service.id, "visitLimit", value)} />
                  <NullableNumberField label="Used" value={service.usedUnits} onChange={(value) => updateService(service.id, "usedUnits", value)} />
                  <NullableNumberField label="Remaining" value={service.remainingUnits} onChange={(value) => updateService(service.id, "remainingUnits", value)} />
                  <TextField label="Copay" value={service.copay} onChange={(value) => updateService(service.id, "copay", value)} />
                  <TextField label="Coinsurance" value={service.coinsurance} onChange={(value) => updateService(service.id, "coinsurance", value)} />
                  <SelectField label="Source" value={service.source} options={sourceOptions} onChange={(value) => updateService(service.id, "source", value as VerificationSource)} />
                  <TextField label="Verified date" type="date" value={service.verifiedDate} onChange={(value) => updateService(service.id, "verifiedDate", value)} />
                  <TextField label="Reference number" value={service.referenceNumber} onChange={(value) => updateService(service.id, "referenceNumber", value)} />
                  <SelectField label="Reviewer state" value={service.reviewState} options={["Verified", "Query", "Blocked", "Not reviewed"]} onChange={(value) => updateService(service.id, "reviewState", value as ReviewState)} />
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={() => updateDraft("services", [...draft.services, makeService()])}>
              <Plus size={15} /> Add CPT
            </Button>
          </div>
        </FormSection>

        <FormSection title="4. ICD-10, authorization, and referral" subtitle="PriorAuthIQ flags missing support; qualified staff make coding and coverage decisions." defaultOpen>
          <div className="space-y-4">
            {draft.diagnoses.map((diagnosis, index) => (
              <div key={diagnosis.id} className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
                <div className="text-sm font-semibold text-white">Diagnosis {index + 1}</div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <TextField label="ICD-10" value={diagnosis.icd10} onChange={(value) => updateDiagnosis(diagnosis.id, "icd10", value)} />
                  <TextField label="Description" value={diagnosis.description} onChange={(value) => updateDiagnosis(diagnosis.id, "description", value)} />
                  <TextField label="Linked CPTs" value={diagnosis.linkedCpts.join(", ")} onChange={(value) => updateDiagnosis(diagnosis.id, "linkedCpts", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                  <SelectField label="Support state" value={diagnosis.supportStatus} options={["Supported", "Missing support", "Needs coding review", "Not reviewed"]} onChange={(value) => updateDiagnosis(diagnosis.id, "supportStatus", value)} />
                  <SelectField label="Source" value={diagnosis.source} options={sourceOptions} onChange={(value) => updateDiagnosis(diagnosis.id, "source", value)} />
                </div>
                <div className="mt-4">
                  <TextAreaField label="Supporting note" value={diagnosis.supportingNote} onChange={(value) => updateDiagnosis(diagnosis.id, "supportingNote", value)} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
              <h3 className="font-semibold text-white">Authorization</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <SelectField label="Status" value={draft.authorization.status} options={authorizationOptions} onChange={(value) => updateAuthorization("status", value as AuthorizationStatus)} />
                <TextField label="Authorization number" value={draft.authorization.authorizationNumber} onChange={(value) => updateAuthorization("authorizationNumber", value)} />
                <TextField label="Submitted date" type="date" value={draft.authorization.submittedDate} onChange={(value) => updateAuthorization("submittedDate", value)} />
                <TextField label="Effective date" type="date" value={draft.authorization.effectiveDate} onChange={(value) => updateAuthorization("effectiveDate", value)} />
                <TextField label="Expiration date" type="date" value={draft.authorization.expirationDate} onChange={(value) => updateAuthorization("expirationDate", value)} />
                <TextField label="Approved CPTs" value={draft.authorization.approvedCpts.join(", ")} onChange={(value) => updateAuthorization("approvedCpts", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                <SelectField label="Source" value={draft.authorization.source} options={sourceOptions} onChange={(value) => updateAuthorization("source", value as VerificationSource)} />
                <TextField label="Reference number" value={draft.authorization.referenceNumber} onChange={(value) => updateAuthorization("referenceNumber", value)} />
                <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#07101f] px-4 py-3 text-sm text-slate-300">
                  <input type="checkbox" checked={draft.authorization.letterPresent} onChange={(event) => updateAuthorization("letterPresent", event.target.checked)} />
                  Authorization letter present
                </label>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/55 p-4">
              <h3 className="font-semibold text-white">Referral</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <SelectField label="Status" value={draft.referral.status} options={referralOptions} onChange={(value) => updateReferral("status", value as ReferralStatus)} />
                <TextField label="Referral number" value={draft.referral.referralNumber} onChange={(value) => updateReferral("referralNumber", value)} />
                <TextField label="Referring provider" value={draft.referral.referringProvider} onChange={(value) => updateReferral("referringProvider", value)} />
                <TextField label="Effective date" type="date" value={draft.referral.effectiveDate} onChange={(value) => updateReferral("effectiveDate", value)} />
                <TextField label="Expiration date" type="date" value={draft.referral.expirationDate} onChange={(value) => updateReferral("expirationDate", value)} />
                <TextField label="Approved CPTs" value={draft.referral.approvedCpts.join(", ")} onChange={(value) => updateReferral("approvedCpts", value.split(",").map((item) => item.trim()).filter(Boolean))} />
                <SelectField label="Source" value={draft.referral.source} options={sourceOptions} onChange={(value) => updateReferral("source", value as VerificationSource)} />
                <label className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-[#07101f] px-4 py-3 text-sm text-slate-300">
                  <input type="checkbox" checked={draft.referral.documentPresent} onChange={(event) => updateReferral("documentPresent", event.target.checked)} />
                  Referral document present
                </label>
              </div>
            </div>
          </div>
        </FormSection>

        <FormSection title="5. Required documents and evidence" subtitle="The checklist is configurable; the demo never claims one universal document rule.">
          <div className="space-y-3">
            {draft.documents.map((document) => (
              <div key={document.id} className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-950/55 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_.7fr_1fr_auto]">
                <TextField label="Document" value={document.name} onChange={(value) => updateDocument(document.id, "name", value)} />
                <SelectField label="Required?" value={document.required} options={["Required", "Not required", "Unknown"]} onChange={(value) => updateDocument(document.id, "required", value as RequirementState)} />
                <SelectField label="Status" value={document.status} options={["Present", "Missing", "Needs review", "Not applicable"]} onChange={(value) => updateDocument(document.id, "status", value as DocumentItem["status"])} />
                <label className="flex items-center gap-2 pt-7 text-sm text-slate-300">
                  <input type="checkbox" checked={document.blocking} onChange={(event) => updateDocument(document.id, "blocking", event.target.checked)} /> Blocker
                </label>
                <TextField label="Fake file name" value={document.fileName} onChange={(value) => updateDocument(document.id, "fileName", value)} />
                <button
                  onClick={() => updateDraft("documents", draft.documents.filter((item) => item.id !== document.id))}
                  className="icon-button mt-7 text-rose-200"
                  aria-label="Remove document"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            <Button variant="outline" onClick={() => updateDraft("documents", [...draft.documents, makeDocument()])}>
              <Plus size={15} /> Add document
            </Button>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <TextAreaField label="Reviewer notes" value={draft.reviewerNotes} onChange={(value) => updateDraft("reviewerNotes", value)} />
            <TextAreaField label="Source case summary" value={draft.sourceCaseText} onChange={(value) => updateDraft("sourceCaseText", value)} />
          </div>
        </FormSection>
      </div>

      <section className="mt-7 rounded-3xl border border-blue-500/25 bg-blue-500/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 font-semibold text-blue-100">
              <FileSearch size={18} /> Evidence-first review
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100/80">
              The engine evaluates only the structured facts above. Missing information stays missing; it does not infer payer rules from a manual note.
            </p>
          </div>
          <Button onClick={analyzeCase} disabled={loading} className="h-11 bg-white px-5 text-slate-950 hover:bg-slate-200">
            <Sparkles size={16} /> {loading ? "Reviewing..." : "Run readiness review"}
          </Button>
        </div>
      </section>

      {error && <div className="mt-5 notice notice-rose">{error}</div>}
      {message && <div className="mt-5 notice notice-blue">{message}</div>}

      <section className="mt-7 panel p-5 md:p-6">
        {!result ? (
          <div className="py-12 text-center">
            <ClipboardCheck className="mx-auto text-slate-600" size={38} />
            <h2 className="mt-4 text-lg font-semibold text-white">Readiness result will appear here</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              The output will show operational status, blockers, unresolved queries, evidence state, owner, deadline, and a follow-up draft.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={result.status} />
                  <PriorityBadge priority={result.priority} />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-white">{result.caseIdentifier} readiness review</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{result.readinessSummary}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={copyFollowUp}><Copy size={15} /> Copy follow-up</Button>
                <Button onClick={saveResult} disabled={saving || !userId}><Save size={15} /> {saving ? "Saving..." : userId ? "Save case" : "Log in to save"}</Button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <ResultMetric label="Open exceptions" value={openExceptions.length} />
              <ResultMetric label="Blocking issues" value={openExceptions.filter((item) => item.blocking).length} />
              <ResultMetric label="Evidence items" value={result.evidence.length} />
            </div>

            <div className="mt-6 space-y-3">
              {openExceptions.map((exception) => (
                <div key={exception.id} className={`rounded-2xl border p-4 ${exception.blocking ? "border-rose-500/25 bg-rose-500/10" : "border-slate-800 bg-slate-950/60"}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                        {exception.blocking ? <AlertTriangle size={14} className="text-rose-300" /> : <CheckCircle2 size={14} className="text-amber-300" />}
                        {exception.category}
                      </div>
                      <h3 className="mt-2 font-semibold text-white">{exception.failedCheck}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{exception.explanation}</p>
                    </div>
                    <PriorityBadge priority={exception.priority} />
                  </div>
                  <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
                    <InfoBox label="Next action" value={exception.recommendedAction} />
                    <InfoBox label="Owner" value={exception.owner} />
                    <InfoBox label="Evidence state" value={exception.evidenceState} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/65 p-5">
              <h3 className="font-semibold text-white">Draft follow-up message</h3>
              <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-7 text-slate-300">{result.followUpMessage}</pre>
            </div>
          </div>
        )}
      </section>
    </AppShell>
  );
}

function FormSection({
  title,
  subtitle,
  children,
  defaultOpen = false,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  return (
    <details open={defaultOpen} className="panel group overflow-hidden">
      <summary className="cursor-pointer list-none p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold text-white">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          <span className="text-xl text-slate-600 transition group-open:rotate-45">+</span>
        </div>
      </summary>
      <div className="border-t border-slate-800 p-5 md:p-6">{children}</div>
    </details>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2" />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} className="field-input mt-2" />
    </label>
  );
}

function NullableNumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input type="number" min={0} value={value ?? ""} onChange={(event) => onChange(event.target.value === "" ? null : Number(event.target.value))} className="field-input mt-2" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2 min-h-32 resize-y" />
    </label>
  );
}

function ResultMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-2 text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#07101f] p-3">
      <div className="text-xs uppercase tracking-wide text-slate-600">{label}</div>
      <div className="mt-2 leading-6 text-slate-300">{value}</div>
    </div>
  );
}
