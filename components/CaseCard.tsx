import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorAuthCase, RiskLevel } from "@/lib/types";

function getRiskClass(riskLevel: RiskLevel) {
  if (riskLevel === "High") {
    return "border-red-500/40 bg-red-500/10 text-red-200";
  }

  if (riskLevel === "Medium") {
    return "border-amber-500/40 bg-amber-500/10 text-amber-200";
  }

  return "border-emerald-500/40 bg-emerald-500/10 text-emerald-200";
}

function getTopMissingItems(item: PriorAuthCase) {
  return item.missingItems.slice(0, 3);
}

export default function CaseCard({ item }: { item: PriorAuthCase }) {
  const topMissingItems = getTopMissingItems(item);
  const hasMissingItems = item.missingItems.length > 0;

  return (
    <Link href={`/cases/${item.id}`} className="block h-full">
      <Card className="h-full border-slate-800 bg-slate-900/70 text-slate-100 transition hover:-translate-y-1 hover:border-blue-500/60 hover:bg-slate-900">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{item.patientLabel}</CardTitle>
              <p className="mt-1 text-sm text-slate-400">
                {item.practiceName}
              </p>
            </div>

            <Badge variant="secondary">{item.status}</Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4 text-sm text-slate-300">
            <div className="grid gap-2">
              <p>
                <span className="text-slate-500">Payer:</span> {item.payer}
              </p>

              <p>
                <span className="text-slate-500">Service:</span>{" "}
                {item.service}
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-300"
                />

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Risk reason
                  </div>
                  <p className="mt-2 line-clamp-3 leading-6 text-slate-300">
                    {item.riskReason}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                <ClipboardList size={14} />
                Missing items
              </div>

              {hasMissingItems ? (
                <ul className="mt-2 space-y-2">
                  {topMissingItems.map((missingItem) => (
                    <li
                      key={missingItem}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-300"
                    >
                      {missingItem}
                    </li>
                  ))}

                  {item.missingItems.length > topMissingItems.length && (
                    <li className="text-xs text-slate-500">
                      +{item.missingItems.length - topMissingItems.length} more
                      missing item
                      {item.missingItems.length - topMissingItems.length === 1
                        ? ""
                        : "s"}
                    </li>
                  )}
                </ul>
              ) : (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                  <CheckCircle2 size={14} />
                  No major missing items listed
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs ${getRiskClass(
                  item.overallRiskLevel
                )}`}
              >
                {item.overallRiskLevel} risk
              </span>

              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-300">
                {item.createdAt}
              </span>

              {item.humanReviewRequired && (
                <span className="rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                  Human review required
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}