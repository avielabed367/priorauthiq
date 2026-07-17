"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ClipboardCopy,
  FileCheck2,
  History,
  Printer,
  Save,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { demoCases } from "@/lib/demoCases";
import {
  addSupabaseCase,
  deleteSupabaseCase,
  getCurrentUserId,
  getSupabaseCaseById,
  updateSupabaseCase,
} from "@/lib/supabaseCases";
import {
  CaseException,
  ExceptionStatus,
  OwnerRole,
  PriorAuthCase,
  Priority,
  ReadinessStatus,
} from "@/lib/types";

const tabs = [
  "Readiness",
  "Eligibility & Benefits",
  "CPT & ICD-10",
  "Authorization & Referral",
  "Documents",
  "Exceptions",
  "Evidence",
  "Audit History",
] as const;

type Tab = (typeof tabs)[number];

const readinessStatuses: ReadinessStatus[] = [
  "Ready",
  "Ready with warning",
  "Insurance Query",
  "Authorization Query",
  "Referral Query",
  "Missing Documentation",
  "Manual Review Required",
  "Blocked",
];

const priorities: Priority[] = [
  "Routine",
  "Soon",
  "Urgent",
  "Appointment within 24 hours",
  "Overdue",
];

const owners: OwnerRole[] = [
  "Scheduling",
  "Eligibility Team",
  "Prior Auth Team",
  "Front Desk",
  "Provider",
  "Coder",
  "Biller",
  "Practice Manager",
  "Payer Follow-Up",
  "Human Reviewer",
];

const exceptionStatuses: ExceptionStatus[] = [
  "Open",
  "In progress",
  "Waiting on payer",
  "Waiting on practice",
  "Waiting on provider",
  "Resolved",
  "Dismissed",
];

function dateTimeLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function dateLabel(value: string) {
  if (!value) return "Not recorded";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { dateStyle: "medium" });
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

function escapeHtml(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildVerificationHtml(item: PriorAuthCase) {
  const openExceptions = item.exceptions.filter(
    (exception) => !["Resolved", "Dismissed"].includes(exception.status)
  );

  const serviceRows = item.services
    .map(
      (service) => `<tr>
        <td>${escapeHtml(service.cpt)}</td>
        <td>${escapeHtml(service.description)}</td>
        <td>${escapeHtml(service.covered)}</td>
        <td>${escapeHtml(service.authorizationRequirement)}</td>
        <td>${escapeHtml(service.referralRequirement)}</td>
        <td>${escapeHtml(service.remainingUnits ?? "Not recorded")}</td>
        <td>${escapeHtml(service.source)}</td>
        <td>${escapeHtml(service.referenceNumber || "Not recorded")}</td>
      </tr>`
    )
    .join("");

  const exceptionRows = openExceptions
    .map(
      (exception) => `<tr>
        <td>${escapeHtml(exception.category)}</td>
        <td>${escapeHtml(exception.failedCheck)}</td>
        <td>${escapeHtml(exception.blocking ? "Yes" : "No")}</td>
        <td>${escapeHtml(exception.owner)}</td>
        <td>${escapeHtml(dateTimeLabel(exception.dueAt))}</td>
        <td>${escapeHtml(exception.status)}</td>
      </tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(item.caseIdentifier)} Benefits Verification Record</title>
<style>
  body { font-family: Arial, sans-serif; color: #172033; margin: 36px; line-height: 1.45; }
  h1 { margin: 0; font-size: 26px; }
  h2 { margin-top: 28px; font-size: 17px; border-bottom: 1px solid #d9e0eb; padding-bottom: 7px; }
  .warning { margin-top: 16px; border: 1px solid #e0a12f; background: #fff8e8; padding: 12px; font-size: 12px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 18px; }
  .cell { border: 1px solid #d9e0eb; border-radius: 8px; padding: 10px; }
  .label { font-size: 10px; text-transform: uppercase; color: #667085; letter-spacing: .06em; }
  .value { margin-top: 4px; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
  th, td { border: 1px solid #d9e0eb; padding: 7px; text-align: left; vertical-align: top; }
  th { background: #f3f6fa; }
  .footer { margin-top: 30px; font-size: 10px; color: #667085; }
  @media print { body { margin: 18px; } .no-print { display: none; } }
</style>
</head>
<body>
  <button class="no-print" onclick="window.print()">Print record</button>
  <h1>PriorAuthIQ Benefits Verification Record</h1>
  <div class="warning"><strong>FAKE / SAMPLE DATA ONLY.</strong> Human review required. This record does not make final coverage, coding, medical, legal, or billing decisions.</div>

  <div class="grid">
    <div class="cell"><div class="label">Case ID</div><div class="value">${escapeHtml(item.caseIdentifier)}</div></div>
    <div class="cell"><div class="label">Sample patient</div><div class="value">${escapeHtml(item.patientLabel)}</div></div>
    <div class="cell"><div class="label">Final status</div><div class="value">${escapeHtml(item.status)}</div></div>
    <div class="cell"><div class="label">Payer / plan</div><div class="value">${escapeHtml(item.insurance.payer)} — ${escapeHtml(item.insurance.planName)}</div></div>
    <div class="cell"><div class="label">Date of service</div><div class="value">${escapeHtml(dateLabel(item.dateOfService))}</div></div>
    <div class="cell"><div class="label">Verification source</div><div class="value">${escapeHtml(item.insurance.source)}</div></div>
    <div class="cell"><div class="label">COB status</div><div class="value">${escapeHtml(item.insurance.cobStatus)}</div></div>
    <div class="cell"><div class="label">Network status</div><div class="value">${escapeHtml(item.insurance.networkStatus)}</div></div>
    <div class="cell"><div class="label">Payer reference</div><div class="value">${escapeHtml(item.insurance.referenceNumber || "Not recorded")}</div></div>
  </div>

  <h2>Readiness summary</h2>
  <p>${escapeHtml(item.readinessSummary)}</p>

  <h2>CPT-level verification</h2>
  <table>
    <thead><tr><th>CPT</th><th>Description</th><th>Covered</th><th>Authorization</th><th>Referral</th><th>Remaining</th><th>Source</th><th>Reference</th></tr></thead>
    <tbody>${serviceRows || '<tr><td colspan="8">No CPT rows recorded.</td></tr>'}</tbody>
  </table>

  <h2>Authorization and referral</h2>
  <div class="grid">
    <div class="cell"><div class="label">Authorization status</div><div class="value">${escapeHtml(item.authorization.status)}</div></div>
    <div class="cell"><div class="label">Authorization number</div><div class="value">${escapeHtml(item.authorization.authorizationNumber || "Not recorded")}</div></div>
    <div class="cell"><div class="label">Authorization dates</div><div class="value">${escapeHtml(dateLabel(item.authorization.effectiveDate))} to ${escapeHtml(dateLabel(item.authorization.expirationDate))}</div></div>
    <div class="cell"><div class="label">Referral status</div><div class="value">${escapeHtml(item.referral.status)}</div></div>
    <div class="cell"><div class="label">Referral number</div><div class="value">${escapeHtml(item.referral.referralNumber || "Not recorded")}</div></div>
    <div class="cell"><div class="label">Human confirmed</div><div class="value">${item.humanConfirmed ? "Yes" : "No"}</div></div>
  </div>

  <h2>Unresolved exceptions</h2>
  <table>
    <thead><tr><th>Category</th><th>Failed check</th><th>Blocks?</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
    <tbody>${exceptionRows || '<tr><td colspan="6">No unresolved exceptions.</td></tr>'}</tbody>
  </table>

  <h2>Supporting evidence</h2>
  <ul>${item.evidence
    .map(
      (evidence) => `<li>${escapeHtml(evidence.title)} — ${escapeHtml(evidence.source)} — ref ${escapeHtml(evidence.referenceNumber || "not recorded")}</li>`
    )
    .join("") || "<li>No evidence recorded.</li>"}</ul>

  <div class="footer">Generated by the PriorAuthIQ fake-data demo. Verify every item with qualified staff and the applicable payer source.</div>
</body>
</html>`;
}

export default function CaseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = String(params.id);

  const [item, setItem] = useState<PriorAuthCase | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Readiness");
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedCase, setSavedCase] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadCase() {
      setLoaded(false);
      setError("");

      try {
        const currentUserId = await getCurrentUserId();
        setUserId(currentUserId);

        if (currentUserId) {
          const saved = await getSupabaseCaseById(id);
          if (saved) {
            setItem(saved);
            setSavedCase(true);
            return;
          }
        }

        const demo = demoCases.find((caseItem) => caseItem.id === id);
        if (demo) {
          setItem(structuredClone(demo));
          setSavedCase(false);
          return;
        }

        setItem(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load case.");
      } finally {
        setLoaded(true);
      }
    }

    loadCase();
  }, [id]);

  const openExceptions = useMemo(
    () =>
      item?.exceptions.filter(
        (exception) => !["Resolved", "Dismissed"].includes(exception.status)
      ) || [],
    [item]
  );

  function updateCase<K extends keyof PriorAuthCase>(key: K, value: PriorAuthCase[K]) {
    setItem((current) => (current ? { ...current, [key]: value } : current));
  }

  function updateException<K extends keyof CaseException>(
    exceptionId: string,
    key: K,
    value: CaseException[K]
  ) {
    setItem((current) => {
      if (!current) return current;

      const now = new Date().toISOString();
      const targetException = current.exceptions.find(
        (exception) => exception.id === exceptionId
      );
      const updatedExceptions = current.exceptions.map((exception) =>
        exception.id === exceptionId
          ? { ...exception, [key]: value, updatedAt: now }
          : exception
      );

      return {
        ...current,
        exceptions: updatedExceptions,
        auditTrail: [
          ...current.auditTrail,
          {
            id: crypto.randomUUID(),
            eventType:
              key === "owner"
                ? "Owner assigned"
                : key === "dueAt"
                ? "Deadline changed"
                : key === "status"
                ? "Status changed"
                : "Field changed",
            description: `${targetException?.failedCheck || "Exception"}: ${String(key)} updated to ${String(value)}.`,
            actor: "Human reviewer",
            createdAt: now,
          },
        ],
      };
    });
  }

  async function saveChanges() {
    if (!item) return;
    if (!userId) {
      setError("Log in before saving a fake/sample case.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const now = new Date().toISOString();
      const prepared: PriorAuthCase = {
        ...item,
        updatedAt: now,
        auditTrail: [
          ...item.auditTrail,
          {
            id: crypto.randomUUID(),
            eventType: "Status changed",
            description: `Case saved with status “${item.status}.”`,
            actor: "Human reviewer",
            createdAt: now,
          },
        ],
      };

      if (savedCase) {
        const saved = await updateSupabaseCase(prepared);
        setItem(saved);
        setMessage("Case changes saved.");
      } else {
        const saved = await addSupabaseCase({ ...prepared, id: "" });
        router.push(`/cases/${saved.id}`);
      }
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save case.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteCase() {
    if (!item || !savedCase) return;
    if (!window.confirm("Delete this saved fake/sample case?")) return;

    setDeleting(true);
    setError("");

    try {
      await deleteSupabaseCase(item.id);
      router.push("/dashboard");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Could not delete case.");
    } finally {
      setDeleting(false);
    }
  }

  async function copyFollowUp() {
    if (!item) return;
    await navigator.clipboard.writeText(item.followUpMessage);
    setMessage("Follow-up message copied.");
  }

  function printVerificationRecord() {
    if (!item) return;
    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      setError("Allow pop-ups to open the printable verification record.");
      return;
    }
    printWindow.document.open();
    printWindow.document.write(buildVerificationHtml(item));
    printWindow.document.close();
  }

  if (!loaded) {
    return <AppShell><div className="panel p-8 text-center text-slate-400">Loading case...</div></AppShell>;
  }

  if (!item) {
    return (
      <AppShell>
        <div className="panel p-8">
          <h1 className="text-2xl font-bold text-white">Case not found</h1>
          <p className="mt-2 text-slate-400">The case may not exist, or you may need to log in.</p>
          <Link href="/dashboard" className="primary-button mt-6">Back to queue</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ArrowLeft size={15} /> Back to exception queue
          </Link>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <StatusBadge status={item.status} />
            <PriorityBadge priority={item.priority} />
            {!savedCase && <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1 text-xs text-blue-100">Built-in sample</span>}
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{item.caseIdentifier}</div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">{item.patientLabel}</h1>
          <p className="mt-2 text-slate-400">{item.practiceName} · {item.specialty}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copyFollowUp}><ClipboardCopy size={15} /> Copy follow-up</Button>
          <Button variant="outline" onClick={printVerificationRecord}><Printer size={15} /> Print verification record</Button>
          <Button onClick={saveChanges} disabled={saving || !userId}><Save size={15} /> {saving ? "Saving..." : savedCase ? "Save changes" : userId ? "Save demo copy" : "Log in to save"}</Button>
          {savedCase && (
            <Button variant="outline" onClick={deleteCase} disabled={deleting} className="border-rose-500/30 text-rose-200 hover:bg-rose-500/10">
              <Trash2 size={15} /> {deleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>

      {error && <div className="mt-5 notice notice-rose">{error}</div>}
      {message && <div className="mt-5 notice notice-blue">{message}</div>}

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile icon={CalendarClock} label="Appointment" value={dateTimeLabel(item.appointmentAt)} />
        <SummaryTile icon={FileCheck2} label="Payer / plan" value={`${item.insurance.payer} · ${item.insurance.planName}`} />
        <SummaryTile icon={ShieldAlert} label="Open exceptions" value={`${openExceptions.length} open · ${openExceptions.filter((exception) => exception.blocking).length} blocking`} />
        <SummaryTile icon={Check} label="Human confirmation" value={item.humanConfirmed ? "Confirmed" : "Not confirmed"} />
      </div>

      <div className="mt-6 overflow-x-auto border-b border-slate-800">
        <div className="flex min-w-max gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm transition ${
                activeTab === tab
                  ? "border-blue-400 text-blue-100"
                  : "border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "Readiness" && (
          <ReadinessTab item={item} updateCase={updateCase} openExceptions={openExceptions} />
        )}
        {activeTab === "Eligibility & Benefits" && <EligibilityTab item={item} />}
        {activeTab === "CPT & ICD-10" && <CodeTab item={item} />}
        {activeTab === "Authorization & Referral" && <AuthorizationTab item={item} />}
        {activeTab === "Documents" && <DocumentsTab item={item} />}
        {activeTab === "Exceptions" && <ExceptionsTab item={item} updateException={updateException} />}
        {activeTab === "Evidence" && <EvidenceTab item={item} />}
        {activeTab === "Audit History" && <AuditTab item={item} />}
      </div>

      <div className="mt-6 notice notice-amber">
        <strong>Human review required.</strong> The status, payer facts, codes, documents, and next actions must be confirmed by qualified staff. Missing information must not be converted into a payer fact.
      </div>
    </AppShell>
  );
}

function ReadinessTab({
  item,
  updateCase,
  openExceptions,
}: {
  item: PriorAuthCase;
  updateCase: <K extends keyof PriorAuthCase>(key: K, value: PriorAuthCase[K]) => void;
  openExceptions: CaseException[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.35fr_.65fr]">
      <div className="space-y-6">
        <section className="panel p-5 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="eyebrow">Consolidated readiness summary</div>
              <h2 className="mt-3 text-2xl font-semibold text-white">{item.status}</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">{item.readinessSummary}</p>
            </div>
            <StatusBadge status={item.status} />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoTile label="Blocking exceptions" value={String(openExceptions.filter((exception) => exception.blocking).length)} />
            <InfoTile label="Open queries" value={String(openExceptions.length)} />
            <InfoTile label="Evidence records" value={String(item.evidence.length)} />
          </div>
        </section>

        <section className="panel p-5 md:p-6">
          <h2 className="text-lg font-semibold text-white">Unresolved items</h2>
          <div className="mt-4 space-y-3">
            {openExceptions.length === 0 ? (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                No unresolved exception is recorded. Final human confirmation is still required.
              </div>
            ) : (
              openExceptions.map((exception) => (
                <div key={exception.id} className={`rounded-2xl border p-4 ${exception.blocking ? "border-rose-500/25 bg-rose-500/10" : "border-slate-800 bg-slate-950/60"}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-500">{exception.category}</div>
                      <h3 className="mt-2 font-semibold text-white">{exception.failedCheck}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{exception.explanation}</p>
                    </div>
                    <PriorityBadge priority={exception.priority} />
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <InfoTile label="Owner" value={exception.owner} />
                    <InfoTile label="Due" value={dateTimeLabel(exception.dueAt)} />
                    <InfoTile label="Evidence" value={exception.evidenceState} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="panel p-5 md:p-6">
          <h2 className="text-lg font-semibold text-white">Follow-up draft</h2>
          <textarea
            value={item.followUpMessage}
            onChange={(event) => updateCase("followUpMessage", event.target.value)}
            className="field-input mt-4 min-h-64 resize-y leading-7"
          />
        </section>
      </div>

      <aside className="space-y-6">
        <section className="panel p-5">
          <h2 className="font-semibold text-white">Human review controls</h2>
          <div className="mt-4 space-y-4">
            <SelectControl label="Readiness status" value={item.status} options={readinessStatuses} onChange={(value) => updateCase("status", value as ReadinessStatus)} />
            <SelectControl label="Priority" value={item.priority} options={priorities} onChange={(value) => updateCase("priority", value as Priority)} />
            <SelectControl label="Case owner" value={item.owner} options={owners} onChange={(value) => updateCase("owner", value as OwnerRole)} />
            <label className="block">
              <span className="field-label">Next follow-up</span>
              <input type="datetime-local" value={toLocalDateTime(item.followUpDueAt)} onChange={(event) => updateCase("followUpDueAt", localDateTimeToIso(event.target.value))} className="field-input mt-2" />
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
              <input type="checkbox" checked={item.humanConfirmed} onChange={(event) => updateCase("humanConfirmed", event.target.checked)} className="mt-1" />
              <span><strong className="text-white">Human confirmation</strong><br />I reviewed the fake/sample evidence and understand this is not a final payer, coding, medical, legal, or billing decision.</span>
            </label>
          </div>
        </section>

        <section className="panel p-5">
          <h2 className="font-semibold text-white">Reviewer notes</h2>
          <textarea value={item.reviewerNotes} onChange={(event) => updateCase("reviewerNotes", event.target.value)} className="field-input mt-4 min-h-48 resize-y leading-7" />
        </section>
      </aside>
    </div>
  );
}

function EligibilityTab({ item }: { item: PriorAuthCase }) {
  const responsibility = item.insurance.patientResponsibility;

  return (
    <div className="space-y-6">
      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Eligibility and plan</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Payer" value={item.insurance.payer} />
          <InfoTile label="Plan" value={item.insurance.planName} />
          <InfoTile label="Plan type" value={item.insurance.planType} />
          <InfoTile label="Member ID" value={item.insurance.memberId} />
          <InfoTile label="Eligibility" value={item.insurance.eligibilityStatus} />
          <InfoTile label="Effective date" value={dateLabel(item.insurance.effectiveDate)} />
          <InfoTile label="Termination date" value={dateLabel(item.insurance.terminationDate)} />
          <InfoTile label="Network" value={item.insurance.networkStatus} />
          <InfoTile label="Primary insurance" value={item.insurance.primaryInsurance} />
          <InfoTile label="Secondary insurance" value={item.insurance.secondaryInsurance || "None recorded"} />
          <InfoTile label="COB status" value={item.insurance.cobStatus} />
          <InfoTile label="Behavioral-health administrator" value={item.insurance.behavioralHealthAdministrator || "Not recorded"} />
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Patient responsibility</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Copay" value={responsibility.copay || "Not recorded"} />
          <InfoTile label="Deductible" value={responsibility.deductible || "Not recorded"} />
          <InfoTile label="Deductible met" value={responsibility.deductibleMet || "Not recorded"} />
          <InfoTile label="Coinsurance" value={responsibility.coinsurance || "Not recorded"} />
          <InfoTile label="OOP maximum" value={responsibility.outOfPocketMax || "Not recorded"} />
          <InfoTile label="OOP met" value={responsibility.outOfPocketMet || "Not recorded"} />
          <InfoTile label="Expected patient amount" value={responsibility.expectedPatientAmount || "Not recorded"} />
          <InfoTile label="Responsibility state" value={responsibility.status} />
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Verification proof</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InfoTile label="Source" value={item.insurance.source} />
          <InfoTile label="Source date" value={dateLabel(item.insurance.sourceDate)} />
          <InfoTile label="Reference number" value={item.insurance.referenceNumber || "Not recorded"} />
          <InfoTile label="Verified by" value={item.insurance.verifiedBy || "Not recorded"} />
        </div>
      </section>
    </div>
  );
}

function CodeTab({ item }: { item: PriorAuthCase }) {
  return (
    <div className="space-y-6">
      <section className="panel overflow-hidden">
        <div className="p-5 md:p-6"><h2 className="text-lg font-semibold text-white">CPT-level benefits</h2></div>
        <div className="overflow-x-auto">
          <table className="min-w-[1150px] w-full text-left text-sm">
            <thead className="border-y border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-4">CPT</th><th className="px-5 py-4">Coverage</th><th className="px-5 py-4">Authorization</th><th className="px-5 py-4">Referral</th><th className="px-5 py-4">Limits</th><th className="px-5 py-4">Patient responsibility</th><th className="px-5 py-4">Evidence</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {item.services.map((service) => (
                <tr key={service.id}>
                  <td className="px-5 py-4 align-top"><div className="font-semibold text-white">{service.cpt}</div><div className="mt-1 text-xs text-slate-500">{service.description}</div></td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.covered}<div className="mt-1 text-xs text-slate-500">{service.coveragePercent || "No percentage recorded"}</div></td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.authorizationRequirement}</td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.referralRequirement}</td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.remainingUnits ?? "?"} remaining<div className="mt-1 text-xs text-slate-500">{service.usedUnits ?? "?"} used / {service.visitLimit ?? "?"} limit</div></td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.copay || "No copay"}<div className="mt-1 text-xs text-slate-500">{service.coinsurance || "No coinsurance recorded"}</div></td>
                  <td className="px-5 py-4 align-top text-slate-300">{service.source}<div className="mt-1 text-xs text-slate-500">{service.referenceNumber || "No reference"}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">ICD-10 and supporting review</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {item.diagnoses.map((diagnosis) => (
            <div key={diagnosis.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex items-start justify-between gap-3">
                <div><div className="text-xs uppercase tracking-wide text-slate-500">{diagnosis.position}</div><h3 className="mt-2 font-semibold text-white">{diagnosis.icd10} · {diagnosis.description}</h3></div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{diagnosis.supportStatus}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{diagnosis.supportingNote || "No supporting note recorded."}</p>
              <div className="mt-3 text-xs text-slate-500">Linked CPTs: {diagnosis.linkedCpts.join(", ") || "None"}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function AuthorizationTab({ item }: { item: PriorAuthCase }) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Authorization</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoTile label="Status" value={item.authorization.status} />
          <InfoTile label="Authorization number" value={item.authorization.authorizationNumber || "Not recorded"} />
          <InfoTile label="Submitted" value={dateLabel(item.authorization.submittedDate)} />
          <InfoTile label="Effective" value={dateLabel(item.authorization.effectiveDate)} />
          <InfoTile label="Expiration" value={dateLabel(item.authorization.expirationDate)} />
          <InfoTile label="Approved CPTs" value={item.authorization.approvedCpts.join(", ") || "None recorded"} />
          <InfoTile label="Approved / used units" value={`${item.authorization.approvedUnits ?? "?"} / ${item.authorization.usedUnits ?? "?"}`} />
          <InfoTile label="Authorization letter" value={item.authorization.letterPresent ? "Present" : "Missing"} />
          <InfoTile label="Source" value={item.authorization.source} />
          <InfoTile label="Reference" value={item.authorization.referenceNumber || "Not recorded"} />
        </div>
        <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-400">{item.authorization.notes || "No authorization notes."}</p>
      </section>

      <section className="panel p-5 md:p-6">
        <h2 className="text-lg font-semibold text-white">Referral</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <InfoTile label="Status" value={item.referral.status} />
          <InfoTile label="Referral number" value={item.referral.referralNumber || "Not recorded"} />
          <InfoTile label="Referring provider" value={item.referral.referringProvider || "Not recorded"} />
          <InfoTile label="Effective" value={dateLabel(item.referral.effectiveDate)} />
          <InfoTile label="Expiration" value={dateLabel(item.referral.expirationDate)} />
          <InfoTile label="Approved CPTs" value={item.referral.approvedCpts.join(", ") || "None recorded"} />
          <InfoTile label="Referral document" value={item.referral.documentPresent ? "Present" : "Missing"} />
          <InfoTile label="Source" value={item.referral.source} />
        </div>
        <p className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-7 text-slate-400">{item.referral.notes || "No referral notes."}</p>
      </section>
    </div>
  );
}

function DocumentsTab({ item }: { item: PriorAuthCase }) {
  return (
    <section className="panel p-5 md:p-6">
      <h2 className="text-lg font-semibold text-white">Document checklist</h2>
      <p className="mt-2 text-sm text-slate-500">Requirements remain specialty-, service-, and payer-dependent.</p>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {item.documents.map((document) => (
          <div key={document.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start justify-between gap-4">
              <div><div className="text-xs uppercase tracking-wide text-slate-500">{document.required}</div><h3 className="mt-2 font-semibold text-white">{document.name}</h3></div>
              <span className={`rounded-full border px-3 py-1 text-xs ${document.status === "Present" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100" : document.status === "Missing" ? "border-rose-500/25 bg-rose-500/10 text-rose-100" : "border-amber-500/25 bg-amber-500/10 text-amber-100"}`}>{document.status}</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoTile label="Blocks case" value={document.blocking ? "Yes" : "No"} />
              <InfoTile label="Source" value={document.source} />
              <InfoTile label="Fake file" value={document.fileName || "No file recorded"} />
              <InfoTile label="Verified" value={dateLabel(document.verifiedDate)} />
            </div>
            {document.notes && <p className="mt-3 text-sm leading-6 text-slate-500">{document.notes}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function ExceptionsTab({
  item,
  updateException,
}: {
  item: PriorAuthCase;
  updateException: <K extends keyof CaseException>(exceptionId: string, key: K, value: CaseException[K]) => void;
}) {
  return (
    <div className="space-y-4">
      {item.exceptions.map((exception) => (
        <section key={exception.id} className={`rounded-3xl border p-5 md:p-6 ${exception.blocking ? "border-rose-500/25 bg-rose-500/10" : "border-slate-800 bg-slate-900/65"}`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs uppercase tracking-wide text-slate-500">{exception.category} · {exception.blocking ? "Blocking" : "Nonblocking"}</div>
              <h2 className="mt-2 text-lg font-semibold text-white">{exception.failedCheck}</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">{exception.explanation}</p>
              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-sm leading-6 text-slate-300">
                <div className="text-xs uppercase tracking-wide text-slate-600">Recommended next action</div>
                <p className="mt-2">{exception.recommendedAction}</p>
              </div>
            </div>
            <PriorityBadge priority={exception.priority} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <SelectControl label="Owner" value={exception.owner} options={owners} onChange={(value) => updateException(exception.id, "owner", value as OwnerRole)} />
            <SelectControl label="Status" value={exception.status} options={exceptionStatuses} onChange={(value) => updateException(exception.id, "status", value as ExceptionStatus)} />
            <SelectControl label="Priority" value={exception.priority} options={priorities} onChange={(value) => updateException(exception.id, "priority", value as Priority)} />
            <label className="block"><span className="field-label">Due</span><input type="datetime-local" value={toLocalDateTime(exception.dueAt)} onChange={(event) => updateException(exception.id, "dueAt", localDateTimeToIso(event.target.value))} className="field-input mt-2" /></label>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="block"><span className="field-label">Payer / practice response</span><textarea value={exception.payerResponse} onChange={(event) => updateException(exception.id, "payerResponse", event.target.value)} className="field-input mt-2 min-h-28 resize-y" /></label>
            <label className="block"><span className="field-label">Resolution notes</span><textarea value={exception.resolutionNotes} onChange={(event) => updateException(exception.id, "resolutionNotes", event.target.value)} className="field-input mt-2 min-h-28 resize-y" /></label>
          </div>
        </section>
      ))}
    </div>
  );
}

function EvidenceTab({ item }: { item: PriorAuthCase }) {
  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-center gap-3"><FileCheck2 className="text-blue-300" size={20} /><h2 className="text-lg font-semibold text-white">Source and evidence record</h2></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {item.evidence.map((evidence) => (
          <div key={evidence.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-wide text-slate-500">{evidence.type}</div><h3 className="mt-2 font-semibold text-white">{evidence.title}</h3></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">{evidence.humanConfirmed ? "Human confirmed" : "Needs confirmation"}</span></div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <InfoTile label="Source" value={evidence.source} />
              <InfoTile label="Captured" value={dateTimeLabel(evidence.capturedAt)} />
              <InfoTile label="Applicable date" value={dateLabel(evidence.applicableDate)} />
              <InfoTile label="Reference" value={evidence.referenceNumber || "Not recorded"} />
              <InfoTile label="Fake file" value={evidence.fileName || "No file recorded"} />
            </div>
            {evidence.notes && <p className="mt-3 text-sm leading-6 text-slate-500">{evidence.notes}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function AuditTab({ item }: { item: PriorAuthCase }) {
  return (
    <section className="panel p-5 md:p-6">
      <div className="flex items-center gap-3"><History className="text-blue-300" size={20} /><h2 className="text-lg font-semibold text-white">Audit history</h2></div>
      <div className="mt-5 space-y-3">
        {[...item.auditTrail].reverse().map((event) => (
          <div key={event.id} className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-blue-300" />
            <div><div className="flex flex-wrap items-center gap-2"><span className="font-medium text-white">{event.eventType}</span><span className="text-xs text-slate-600">{dateTimeLabel(event.createdAt)}</span></div><p className="mt-2 text-sm leading-6 text-slate-400">{event.description}</p><div className="mt-2 text-xs text-slate-600">Actor: {event.actor}</div></div>
          </div>
        ))}
      </div>
    </section>
  );
}

function SummaryTile({ icon: Icon, label, value }: { icon: typeof CalendarClock; label: string; value: string }) {
  return <div className="panel p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500"><Icon size={14} /> {label}</div><div className="mt-2 text-sm font-medium leading-6 text-slate-200">{value}</div></div>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"><div className="text-xs uppercase tracking-wide text-slate-600">{label}</div><div className="mt-2 text-sm leading-6 text-slate-300">{value}</div></div>;
}

function SelectControl({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label className="block"><span className="field-label">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
