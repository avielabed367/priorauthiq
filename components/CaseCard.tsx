import Link from "next/link";
import { CalendarClock, ChevronRight, FileWarning, ShieldCheck } from "lucide-react";
import { PriorAuthCase } from "@/lib/types";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";

function formatAppointment(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Appointment not recorded";
  return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function CaseCard({ item }: { item: PriorAuthCase }) {
  const openExceptions = item.exceptions.filter(
    (exception) => !["Resolved", "Dismissed"].includes(exception.status)
  );
  const blockers = openExceptions.filter((exception) => exception.blocking);

  return (
    <Link href={`/cases/${item.id}`} className="group block">
      <article className="h-full rounded-3xl border border-slate-800 bg-slate-900/75 p-5 transition duration-200 hover:-translate-y-0.5 hover:border-blue-500/40 hover:bg-slate-900">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {item.caseIdentifier}
            </div>
            <h2 className="mt-2 text-lg font-semibold text-white">{item.patientLabel}</h2>
            <p className="mt-1 text-sm text-slate-400">{item.practiceName}</p>
          </div>
          <ChevronRight className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-blue-300" size={20} />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusBadge status={item.status} />
          <PriorityBadge priority={item.priority} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <CalendarClock size={14} /> Appointment
            </div>
            <p className="mt-2 text-sm text-slate-200">{formatAppointment(item.appointmentAt)}</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
              <ShieldCheck size={14} /> Payer / specialty
            </div>
            <p className="mt-2 text-sm text-slate-200">{item.insurance.payer}</p>
            <p className="mt-1 text-xs text-slate-500">{item.specialty}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <FileWarning size={16} className="text-amber-300" />
              {openExceptions.length} open exception{openExceptions.length === 1 ? "" : "s"}
            </div>
            {blockers.length > 0 && (
              <span className="text-xs font-medium text-rose-200">
                {blockers.length} blocker{blockers.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">{item.readinessSummary}</p>
        </div>
      </article>
    </Link>
  );
}
