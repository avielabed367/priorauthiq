import { Priority, ReadinessStatus } from "@/lib/types";

export function statusClass(status: ReadinessStatus) {
  if (status === "Ready") return "border-emerald-400/30 bg-emerald-400/10 text-emerald-200";
  if (status === "Ready with warning") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  if (status === "Blocked") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (status === "Authorization Query") return "border-violet-400/30 bg-violet-400/10 text-violet-100";
  if (status === "Referral Query") return "border-cyan-400/30 bg-cyan-400/10 text-cyan-100";
  if (status === "Missing Documentation") return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  return "border-blue-400/30 bg-blue-400/10 text-blue-100";
}

export function priorityClass(priority: Priority) {
  if (priority === "Overdue") return "border-rose-400/30 bg-rose-400/10 text-rose-100";
  if (priority === "Appointment within 24 hours") return "border-orange-400/30 bg-orange-400/10 text-orange-100";
  if (priority === "Urgent") return "border-amber-400/30 bg-amber-400/10 text-amber-100";
  return "border-slate-700 bg-slate-900 text-slate-300";
}

export function StatusBadge({ status }: { status: ReadinessStatus }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass(status)}`}>{status}</span>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${priorityClass(priority)}`}>{priority}</span>;
}
