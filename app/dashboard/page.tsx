"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  CheckCircle2,
  ClipboardList,
  Search,
  ShieldAlert,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import CaseCard from "@/components/CaseCard";
import { PriorityBadge } from "@/components/StatusBadge";
import { demoCases } from "@/lib/demoCases";
import { isExceptionOverdue } from "@/lib/readinessEngine";
import {
  CaseException,
  ExceptionCategory,
  ExceptionStatus,
  OwnerRole,
  PriorAuthCase,
  ReadinessStatus,
} from "@/lib/types";
import { getCurrentUserId, getSupabaseCases } from "@/lib/supabaseCases";

const statusOptions: ("All" | ReadinessStatus)[] = [
  "All",
  "Ready",
  "Ready with warning",
  "Insurance Query",
  "Authorization Query",
  "Referral Query",
  "Missing Documentation",
  "Manual Review Required",
  "Blocked",
];

const categoryOptions: ("All" | ExceptionCategory)[] = [
  "All",
  "Demographics",
  "Eligibility",
  "COB",
  "Network",
  "Coverage",
  "Patient Responsibility",
  "Visit Limits",
  "Authorization",
  "Referral",
  "Documentation",
  "Coding / Diagnosis",
  "Workflow",
];

const exceptionStatusOptions: ("All" | ExceptionStatus)[] = [
  "All",
  "Open",
  "In progress",
  "Waiting on payer",
  "Waiting on practice",
  "Waiting on provider",
  "Resolved",
  "Dismissed",
];

type QueueItem = CaseException & {
  caseId: string;
  caseIdentifier: string;
  patientLabel: string;
  appointmentAt: string;
  payer: string;
  specialty: string;
};

function flattenExceptions(cases: PriorAuthCase[]): QueueItem[] {
  return cases.flatMap((item) =>
    item.exceptions.map((exception) => ({
      ...exception,
      caseId: item.id,
      caseIdentifier: item.caseIdentifier,
      patientLabel: item.patientLabel,
      appointmentAt: item.appointmentAt,
      payer: item.insurance.payer,
      specialty: item.specialty,
    }))
  );
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function DashboardPage() {
  const [cases, setCases] = useState<PriorAuthCase[]>(demoCases);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [caseStatus, setCaseStatus] = useState<"All" | ReadinessStatus>("All");
  const [category, setCategory] = useState<"All" | ExceptionCategory>("All");
  const [exceptionStatus, setExceptionStatus] = useState<"All" | ExceptionStatus>("All");
  const [owner, setOwner] = useState<"All" | OwnerRole>("All");

  useEffect(() => {
    async function loadCases() {
      setLoading(true);
      setError("");

      try {
        const currentUserId = await getCurrentUserId();
        setUserId(currentUserId);

        if (!currentUserId) {
          setCases(demoCases);
          return;
        }

        const savedCases = await getSupabaseCases();
        setCases([...savedCases, ...demoCases]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Could not load cases.");
        setCases(demoCases);
      } finally {
        setLoading(false);
      }
    }

    loadCases();
  }, []);

  const queue = useMemo(() => flattenExceptions(cases), [cases]);
  const owners = useMemo(
    () => Array.from(new Set(queue.map((item) => item.owner))).sort(),
    [queue]
  );

  const filteredQueue = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return queue
      .filter((item) => {
        const searchable = [
          item.caseIdentifier,
          item.patientLabel,
          item.payer,
          item.specialty,
          item.failedCheck,
          item.explanation,
          item.owner,
        ]
          .join(" ")
          .toLowerCase();

        return (
          (!normalizedSearch || searchable.includes(normalizedSearch)) &&
          (category === "All" || item.category === category) &&
          (exceptionStatus === "All" || item.status === exceptionStatus) &&
          (owner === "All" || item.owner === owner)
        );
      })
      .sort((a, b) => {
        const overdueDifference = Number(isExceptionOverdue(b)) - Number(isExceptionOverdue(a));
        if (overdueDifference !== 0) return overdueDifference;
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      });
  }, [queue, search, category, exceptionStatus, owner]);

  const filteredCases = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return cases.filter((item) => {
      const searchable = [
        item.caseIdentifier,
        item.patientLabel,
        item.practiceName,
        item.insurance.payer,
        item.specialty,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedSearch || searchable.includes(normalizedSearch)) &&
        (caseStatus === "All" || item.status === caseStatus)
      );
    });
  }, [cases, search, caseStatus]);

  const openExceptions = queue.filter(
    (item) => !["Resolved", "Dismissed"].includes(item.status)
  );
  const blockers = openExceptions.filter((item) => item.blocking);
  const overdue = openExceptions.filter((item) => isExceptionOverdue(item));
  const readyCases = cases.filter((item) => item.status === "Ready");

  return (
    <AppShell>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="eyebrow">Fake-data V2 workspace</div>
          <h1 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Case readiness and exception queue
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400 md:text-base">
            See what is verified, what blocks the service, who owns the next action, and which cases are approaching their deadline.
          </p>
        </div>

        <Link href="/new-case" className="primary-button">
          New readiness review
        </Link>
      </div>

      {!userId && (
        <div className="mt-6 notice notice-blue">
          You are viewing built-in fictional cases. Log in only when you want to save your own fake/sample reviews.
        </div>
      )}

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={ClipboardList} label="Cases in workspace" value={cases.length} helper="Saved + built-in samples" />
        <MetricCard icon={ShieldAlert} label="Open exceptions" value={openExceptions.length} helper="Unresolved workflow items" />
        <MetricCard icon={AlertOctagon} label="Blocking issues" value={blockers.length} helper="Do not treat as ready" tone="rose" />
        <MetricCard icon={CheckCircle2} label="Ready cases" value={readyCases.length} helper={`${overdue.length} overdue exception${overdue.length === 1 ? "" : "s"}`} tone="emerald" />
      </div>

      {error && <div className="mt-6 notice notice-rose">{error}</div>}

      <section className="panel mt-7 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label className="field-label">Search cases and exceptions</label>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Case ID, sample patient, payer, specialty, failed check..."
                className="field-input pl-10"
              />
            </div>
          </div>

          <FilterSelect label="Case status" value={caseStatus} onChange={(value) => setCaseStatus(value as "All" | ReadinessStatus)} options={statusOptions} />
          <FilterSelect label="Query category" value={category} onChange={(value) => setCategory(value as "All" | ExceptionCategory)} options={categoryOptions} />
          <FilterSelect label="Exception status" value={exceptionStatus} onChange={(value) => setExceptionStatus(value as "All" | ExceptionStatus)} options={exceptionStatusOptions} />
          <FilterSelect label="Owner" value={owner} onChange={(value) => setOwner(value as "All" | OwnerRole)} options={["All", ...owners]} />
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Exception queue</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredQueue.length} matching exception{filteredQueue.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/65">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading queue...</div>
          ) : filteredQueue.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No exceptions match these filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full text-left text-sm">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Case</th>
                    <th className="px-5 py-4">Failed check</th>
                    <th className="px-5 py-4">Owner</th>
                    <th className="px-5 py-4">Due</th>
                    <th className="px-5 py-4">Priority</th>
                    <th className="px-5 py-4">Exception status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredQueue.map((item) => (
                    <tr key={`${item.caseId}-${item.id}`} className="transition hover:bg-slate-900">
                      <td className="px-5 py-4 align-top">
                        <Link href={`/cases/${item.caseId}`} className="font-medium text-white hover:text-blue-200">
                          {item.caseIdentifier}
                        </Link>
                        <div className="mt-1 text-xs text-slate-500">{item.patientLabel}</div>
                        <div className="mt-1 text-xs text-slate-600">{item.payer}</div>
                      </td>
                      <td className="max-w-lg px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${item.blocking ? "bg-rose-400" : "bg-amber-300"}`} />
                          <span className="font-medium text-slate-100">{item.failedCheck}</span>
                        </div>
                        <div className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{item.explanation}</div>
                        <div className="mt-2 text-xs text-blue-200">{item.category}</div>
                      </td>
                      <td className="px-5 py-4 align-top text-slate-300">{item.owner}</td>
                      <td className={`px-5 py-4 align-top ${isExceptionOverdue(item) ? "text-rose-200" : "text-slate-300"}`}>
                        {dateLabel(item.dueAt)}
                        {isExceptionOverdue(item) && <div className="mt-1 text-xs font-medium">Overdue</div>}
                      </td>
                      <td className="px-5 py-4 align-top"><PriorityBadge priority={item.priority} /></td>
                      <td className="px-5 py-4 align-top">
                        <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">{item.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div>
          <h2 className="text-xl font-semibold text-white">Case workspace</h2>
          <p className="mt-1 text-sm text-slate-500">
            {filteredCases.length} matching case{filteredCases.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {filteredCases.map((item) => <CaseCard key={item.id} item={item} />)}
        </div>
      </section>

      <div className="mt-8 notice notice-amber">
        <strong>Human review required.</strong> PriorAuthIQ organizes fake/sample verification data and exceptions. It does not make final coverage, coding, medical, legal, or billing decisions.
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "blue",
}: {
  icon: typeof ClipboardList;
  label: string;
  value: number;
  helper: string;
  tone?: "blue" | "rose" | "emerald";
}) {
  const iconClass = tone === "rose" ? "text-rose-300" : tone === "emerald" ? "text-emerald-300" : "text-blue-300";

  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-slate-400">{label}</div>
        <Icon size={18} className={iconClass} />
      </div>
      <div className="mt-3 text-3xl font-bold text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-600">{helper}</div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="w-full xl:w-48">
      <label className="field-label">{label}</label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="field-input mt-2">
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}
