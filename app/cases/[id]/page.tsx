"use client";

import AppShell from "@/components/AppShell";
import { demoCases } from "@/lib/demoCases";
import {
  addSupabaseCase,
  deleteSupabaseCase,
  getCurrentUserId,
  getSupabaseCaseById,
  updateSupabaseCase,
} from "@/lib/supabaseCases";
import { CaseStatus, PriorAuthCase, RiskLevel } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

const statusOptions: CaseStatus[] = [
  "New",
  "Needs Review",
  "Waiting on Front Desk",
  "Waiting on Provider",
  "Follow-Up Drafted",
  "Ready for Human Review",
  "Resolved",
];

function getRiskBadgeVariant(riskLevel: RiskLevel) {
  if (riskLevel === "High") {
    return "destructive";
  }

  if (riskLevel === "Medium") {
    return "secondary";
  }

  return "outline";
}

function downloadTextFile(fileName: string, text: string) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function makeSafeFileName(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function createRiskReviewPacketText(item: PriorAuthCase, followUpMessage: string) {
  return `PriorAuthIQ Front-End Risk Review Packet

IMPORTANT:
This is a fake/sample demo review. Do not use real patient information in this demo.
PriorAuthIQ supports workflow review only. It does not make final billing, medical, legal, or coverage decisions.
Human review is required.

Patient Label:
${item.patientLabel}

Practice:
${item.practiceName}

Payer:
${item.payer}

Service:
${item.service}

Status:
${item.status}

Overall Risk Level:
${item.overallRiskLevel}

Created:
${item.createdAt}

Risk Reason:
${item.riskReason}

Summary:
${item.summary}

Issues Found:
${item.issuesFound
  .map(
    (issue, index) => `${index + 1}. ${issue.title}
Category: ${issue.category}
Risk Level: ${issue.riskLevel}
Finding: ${issue.finding}
Why It Matters: ${issue.whyItMatters}
Recommended Action: ${issue.recommendedAction}
Owner: ${issue.owner}`
  )
  .join("\n\n")}

Missing Items:
${item.missingItems
  .map((missingItem, index) => `${index + 1}. ${missingItem}`)
  .join("\n")}

Recommended Next Steps:
${item.recommendedNextSteps
  .map((step, index) => `${index + 1}. ${step}`)
  .join("\n")}

Draft Follow-Up Message:
${followUpMessage}

Source Case Text:
${item.sourceCaseText || "No source case text saved."}

Source Notes:
${item.notesText || "No source notes saved."}`;
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [item, setItem] = useState<PriorAuthCase | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [caseIsSaved, setCaseIsSaved] = useState(false);

  const [followUpMessage, setFollowUpMessage] = useState("");
  const [status, setStatus] = useState<CaseStatus>("New");

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCase() {
      setLoaded(false);
      setError("");

      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);

      if (currentUserId) {
        const savedCase = await getSupabaseCaseById(id);

        if (savedCase) {
          setItem(savedCase);
          setFollowUpMessage(savedCase.followUpMessage);
          setStatus(savedCase.status);
          setCaseIsSaved(true);
          setLoaded(true);
          return;
        }
      }

      const exampleCase = demoCases.find((caseItem) => caseItem.id === id);

      if (exampleCase) {
        setItem(exampleCase);
        setFollowUpMessage(exampleCase.followUpMessage);
        setStatus(exampleCase.status);
        setCaseIsSaved(false);
        setLoaded(true);
        return;
      }

      setItem(null);
      setLoaded(true);
    }

    loadCase();
  }, [id]);

  function showActionMessage(message: string) {
    setActionMessage(message);

    setTimeout(() => {
      setActionMessage("");
    }, 2000);
  }

  function showSavedMessage(message: string) {
    setSavedMessage(message);

    setTimeout(() => {
      setSavedMessage("");
    }, 2500);
  }

  async function handleSaveChanges() {
    if (!item) {
      return;
    }

    if (!userId) {
      setError("Log in first before saving changes.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const updatedCase: PriorAuthCase = {
        ...item,
        status,
        followUpMessage,
        humanReviewRequired: true,
      };

      if (caseIsSaved) {
        const savedCase = await updateSupabaseCase(updatedCase);
        setItem(savedCase);
        setStatus(savedCase.status);
        setFollowUpMessage(savedCase.followUpMessage);
        showSavedMessage("Changes saved.");
      } else {
        const savedCase = await addSupabaseCase({
          ...updatedCase,
          id: "",
        });

        showSavedMessage("Example review saved.");
        router.push(`/cases/${savedCase.id}`);
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCase() {
    if (!item) {
      return;
    }

    if (!caseIsSaved) {
      setError("Example cases cannot be deleted.");
      return;
    }

    const confirmed = window.confirm("Delete this saved demo review?");

    if (!confirmed) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      await deleteSupabaseCase(item.id);
      router.push("/dashboard");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong while deleting."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handleCopyFollowUpMessage() {
    await navigator.clipboard.writeText(followUpMessage);
    showActionMessage("Follow-up message copied.");
  }

  async function handleCopyMissingItems() {
    if (!item) {
      return;
    }

    const checklistText = item.missingItems
      .map((missingItem, index) => `${index + 1}. ${missingItem}`)
      .join("\n");

    await navigator.clipboard.writeText(checklistText);
    showActionMessage("Missing items copied.");
  }

  async function handleCopyNextSteps() {
    if (!item) {
      return;
    }

    const nextStepsText = item.recommendedNextSteps
      .map((step, index) => `${index + 1}. ${step}`)
      .join("\n");

    await navigator.clipboard.writeText(nextStepsText);
    showActionMessage("Next steps copied.");
  }

  async function handleCopyCaseSummary() {
    if (!item) {
      return;
    }

    const summaryText = `Patient Label: ${item.patientLabel}
Practice: ${item.practiceName}
Payer: ${item.payer}
Service: ${item.service}
Status: ${status}
Overall Risk Level: ${item.overallRiskLevel}

Risk Reason:
${item.riskReason}

Summary:
${item.summary}

Human Review Required:
Yes. PriorAuthIQ does not make final billing, medical, legal, or coverage decisions.`;

    await navigator.clipboard.writeText(summaryText);
    showActionMessage("Review summary copied.");
  }

  function handleDownloadFollowUpMessage() {
    if (!item) {
      return;
    }

    const fileName = `${makeSafeFileName(item.patientLabel)}-follow-up-message.txt`;
    downloadTextFile(fileName, followUpMessage);
    showActionMessage("Follow-up message downloaded.");
  }

  function handleDownloadRiskReviewPacket() {
    if (!item) {
      return;
    }

    const updatedCase: PriorAuthCase = {
      ...item,
      status,
      followUpMessage,
      humanReviewRequired: true,
    };

    const packetText = createRiskReviewPacketText(
      updatedCase,
      followUpMessage
    );
    const fileName = `${makeSafeFileName(
      item.patientLabel
    )}-risk-review-packet.txt`;

    downloadTextFile(fileName, packetText);
    showActionMessage("Risk review packet downloaded.");
  }

  if (!loaded) {
    return (
      <AppShell>
        <p className="text-slate-400">Loading review...</p>
      </AppShell>
    );
  }

  if (!item) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8">
          <h1 className="text-2xl font-bold">Review not found</h1>
          <p className="mt-2 text-slate-400">
            This review may not exist, or you may need to log in to view it.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          >
            Back to Reviews
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
            Fake/sample front-end risk review
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {item.patientLabel}
          </h1>

          <p className="mt-2 text-slate-400">{item.service}</p>
          <p className="mt-1 text-sm text-slate-500">{item.practiceName}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant={getRiskBadgeVariant(item.overallRiskLevel)}>
            {item.overallRiskLevel} Risk
          </Badge>
          <Badge variant="secondary">{status}</Badge>
          {item.humanReviewRequired && (
            <Badge variant="destructive">Human review required</Badge>
          )}
        </div>
      </div>

      {!caseIsSaved && (
        <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm leading-6 text-blue-100">
          This is a built-in fake sample review. Log in and save it to create an
          editable demo copy.
        </div>
      )}

      {!userId && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          You can view, copy, and download this fake sample review. Log in to
          save changes.
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="border-slate-800 bg-slate-900/70 text-slate-100 lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5 text-sm text-slate-300">
            <p className="leading-7">{item.summary}</p>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Risk Reason
              </div>
              <p className="mt-2 leading-7">{item.riskReason}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-slate-500">Payer</div>
                <div>{item.payer}</div>
              </div>

              <div>
                <div className="text-slate-500">Created</div>
                <div>{item.createdAt}</div>
              </div>

              <div>
                <div className="text-slate-500">Case Type</div>
                <div>{caseIsSaved ? "Saved demo review" : "Example review"}</div>
              </div>

              <div>
                <div className="text-slate-500">Human Review</div>
                <div>Required</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/10 text-blue-100">
          <CardHeader>
            <CardTitle>Human Review Required</CardTitle>
          </CardHeader>

          <CardContent className="text-sm leading-7">
            PriorAuthIQ is a workflow assistant for fake/sample review. It does
            not make final billing, medical, legal, or coverage decisions. A
            human reviewer must verify payer requirements, documentation,
            coverage, coding, and next steps.
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-slate-800 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <CardTitle>Issues Found</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {item.issuesFound.map((issue, index) => (
            <div
              key={`${issue.category}-${issue.title}-${index}`}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-500">
                    {issue.category}
                  </div>
                  <h2 className="mt-1 font-semibold text-white">
                    {issue.title}
                  </h2>
                </div>

                <Badge variant={getRiskBadgeVariant(issue.riskLevel)}>
                  {issue.riskLevel}
                </Badge>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Finding
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {issue.finding}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Why it matters
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {issue.whyItMatters}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Recommended action
                  </div>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {issue.recommendedAction}
                  </p>

                  <div className="mt-3 text-xs text-slate-500">
                    Owner:{" "}
                    <span className="text-slate-300">{issue.owner}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
          <CardHeader>
            <CardTitle>Missing Items</CardTitle>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 text-sm text-slate-300">
              {item.missingItems.map((thing) => (
                <li
                  key={thing}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  {thing}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
          <CardHeader>
            <CardTitle>Recommended Next Steps</CardTitle>
          </CardHeader>

          <CardContent>
            <ol className="space-y-3 text-sm text-slate-300">
              {item.recommendedNextSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-3 leading-6"
                >
                  <span className="mr-2 text-slate-500">{index + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-slate-800 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <CardTitle>Source Case Information</CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="text-sm text-slate-500">Source Case Text</div>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-300">
              {item.sourceCaseText || "No source case text saved."}
            </pre>
          </div>

          <div>
            <div className="text-sm text-slate-500">Source Notes</div>
            <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-300">
              {item.notesText || "No source notes saved."}
            </pre>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 border-slate-800 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <CardTitle>Review Controls</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-slate-400">Status</label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as CaseStatus)}
              className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSaveChanges}
              disabled={saving}
              className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving
                ? "Saving..."
                : caseIsSaved
                ? "Save Changes"
                : "Save Demo Copy"}
            </button>

            <button
              onClick={handleCopyCaseSummary}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Copy Summary
            </button>

            <button
              onClick={handleCopyMissingItems}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Copy Missing Items
            </button>

            <button
              onClick={handleCopyNextSteps}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Copy Next Steps
            </button>

            <button
              onClick={handleCopyFollowUpMessage}
              className="inline-flex h-10 items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
            >
              Copy Follow-Up Message
            </button>

            <button
              onClick={handleDownloadFollowUpMessage}
              className="inline-flex h-10 items-center justify-center rounded-md border border-blue-500/40 px-4 text-sm font-medium text-blue-200 transition hover:bg-blue-500/10"
            >
              Download Follow-Up
            </button>

            <button
              onClick={handleDownloadRiskReviewPacket}
              className="inline-flex h-10 items-center justify-center rounded-md border border-green-500/40 px-4 text-sm font-medium text-green-200 transition hover:bg-green-500/10"
            >
              Download Risk Review Packet
            </button>

            {caseIsSaved && (
              <button
                onClick={handleDeleteCase}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center rounded-md border border-red-500/40 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {deleting ? "Deleting..." : "Delete Saved Review"}
              </button>
            )}
          </div>

          {savedMessage && (
            <p className="text-sm text-green-300">{savedMessage}</p>
          )}

          {actionMessage && (
            <p className="text-sm text-blue-300">{actionMessage}</p>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6 border-slate-800 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <CardTitle>Editable Follow-Up Message Draft</CardTitle>
        </CardHeader>

        <CardContent>
          <Textarea
            value={followUpMessage}
            onChange={(event) => setFollowUpMessage(event.target.value)}
            className="min-h-72 border-slate-800 bg-slate-950 text-sm leading-7 text-slate-100"
          />

          <p className="mt-3 text-sm leading-6 text-slate-500">
            This message is only a draft for human review. A qualified reviewer
            should verify all payer requirements, documentation, coverage, and
            next steps before using it.
          </p>
        </CardContent>
      </Card>
    </AppShell>
  );
}