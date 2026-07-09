"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  FileWarning,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import CaseCard from "@/components/CaseCard";
import { demoCases } from "@/lib/demoCases";
import { CaseStatus, PriorAuthCase, RiskLevel } from "@/lib/types";
import { getCurrentUserId, getSupabaseCases } from "@/lib/supabaseCases";

const statusOptions: ("All" | CaseStatus)[] = [
  "All",
  "New",
  "Needs Review",
  "Waiting on Front Desk",
  "Waiting on Provider",
  "Follow-Up Drafted",
  "Ready for Human Review",
  "Resolved",
];

const riskOptions: ("All" | RiskLevel)[] = ["All", "Low", "Medium", "High"];

function getTotalMissingItems(cases: PriorAuthCase[]) {
  return cases.reduce((total, item) => total + item.missingItems.length, 0);
}

export default function DashboardPage() {
  const [cases, setCases] = useState<PriorAuthCase[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loadingCases, setLoadingCases] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CaseStatus>("All");
  const [riskFilter, setRiskFilter] = useState<"All" | RiskLevel>("All");

  useEffect(() => {
    async function loadCases() {
      setLoadingCases(true);
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
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load demo reviews."
        );
      } finally {
        setLoadingCases(false);
      }
    }

    loadCases();
  }, []);

  const filteredCases = useMemo(() => {
    return cases.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.patientLabel.toLowerCase().includes(searchText) ||
        item.practiceName.toLowerCase().includes(searchText) ||
        item.payer.toLowerCase().includes(searchText) ||
        item.service.toLowerCase().includes(searchText) ||
        item.riskReason.toLowerCase().includes(searchText) ||
        item.missingItems.join(" ").toLowerCase().includes(searchText);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const matchesRisk =
        riskFilter === "All" || item.overallRiskLevel === riskFilter;

      return matchesSearch && matchesStatus && matchesRisk;
    });
  }, [cases, search, statusFilter, riskFilter]);

  const needsFollowUpCount = cases.filter((item) =>
    ["Needs Review", "Waiting on Front Desk", "Waiting on Provider"].includes(
      item.status
    )
  ).length;

  const highRiskCount = cases.filter(
    (item) => item.overallRiskLevel === "High"
  ).length;

  const humanReviewCount = cases.filter(
    (item) => item.humanReviewRequired
  ).length;

  const totalMissingItems = getTotalMissingItems(cases);

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
            Fake/sample review workspace
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Denial-Risk Reviews
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Review fake/sample cases for eligibility, authorization,
            documentation, coding, coverage/network, and follow-up risk before
            denial happens.
          </p>
        </div>

        <Link
          href="/new-case"
          className="inline-flex h-10 w-fit items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
        >
          Analyze Sample Case
        </Link>
      </div>

      {!userId && (
        <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
          Viewing built-in fake sample cases. You can analyze a sample case
          without logging in. Log in only if you want to save demo reviews.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
        <span className="font-semibold">Human review required:</span>{" "}
        PriorAuthIQ supports workflow review only. It does not make final
        billing, medical, legal, or coverage decisions.
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-400">Total Reviews</div>
            <ClipboardList size={18} className="text-slate-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">{cases.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-400">Needs Follow-Up</div>
            <FileWarning size={18} className="text-slate-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">{needsFollowUpCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-400">High Risk</div>
            <AlertTriangle size={18} className="text-slate-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">{highRiskCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm text-slate-400">Missing Items</div>
            <ClipboardCheck size={18} className="text-slate-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">{totalMissingItems}</div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="text-sm text-slate-400">Search</label>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search patient label, payer, service, risk..."
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400">Status</label>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "All" | CaseStatus)
              }
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-400">Risk Level</label>
            <select
              value={riskFilter}
              onChange={(event) =>
                setRiskFilter(event.target.value as "All" | RiskLevel)
              }
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
            >
              {riskOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing {filteredCases.length} of {cases.length} fake/sample reviews.
          {humanReviewCount > 0
            ? ` ${humanReviewCount} review${
                humanReviewCount === 1 ? "" : "s"
              } require human review.`
            : ""}
        </p>
      </div>

      {loadingCases ? (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
          Loading reviews...
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <h2 className="text-xl font-semibold">No reviews found</h2>
          <p className="mt-2 text-slate-400">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {filteredCases.map((item) => (
            <CaseCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </AppShell>
  );
}