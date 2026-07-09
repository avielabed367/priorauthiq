"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Copy,
  FileText,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { demoCases } from "@/lib/demoCases";
import { PriorAuthCase, RiskIssue, RiskLevel } from "@/lib/types";
import { addSupabaseCase, getCurrentUserId } from "@/lib/supabaseCases";
import { supabase } from "@/lib/supabaseClient";

type AnalysisResult = {
  patientLabel: string;
  practiceName: string;
  payer: string;
  service: string;
  overallRiskLevel: RiskLevel;
  riskReason: string;
  issuesFound: RiskIssue[];
  missingItems: string[];
  recommendedNextSteps: string[];
  summary: string;
  followUpMessage: string;
  humanReviewRequired: boolean;
};

const MAX_CASE_CHARS = 15000;
const MAX_NOTES_CHARS = 10000;

const defaultSampleCase = demoCases[0];

function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(String(reader.result || ""));
    };

    reader.onerror = () => {
      reject(new Error("Could not read file."));
    };

    reader.readAsText(file);
  });
}

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

function getRiskBadgeVariant(riskLevel: RiskLevel) {
  if (riskLevel === "High") {
    return "destructive";
  }

  if (riskLevel === "Medium") {
    return "secondary";
  }

  return "outline";
}

export default function NewCasePage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [patientLabel, setPatientLabel] = useState(defaultSampleCase.patientLabel);
  const [practiceName, setPracticeName] = useState(defaultSampleCase.practiceName);
  const [payer, setPayer] = useState(defaultSampleCase.payer);
  const [service, setService] = useState(defaultSampleCase.service);
  const [sourceCaseText, setSourceCaseText] = useState(
    defaultSampleCase.sourceCaseText || ""
  );
  const [notesText, setNotesText] = useState(defaultSampleCase.notesText || "");
  const [demoAcknowledged, setDemoAcknowledged] = useState(true);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [fileMessage, setFileMessage] = useState(
    "Loaded sample case: Jordan Miller — front-end denial-risk review."
  );

  useEffect(() => {
    async function loadUser() {
      const currentUserId = await getCurrentUserId();
      setUserId(currentUserId);
    }

    loadUser();
  }, []);

  function setLimitedCaseText(value: string) {
    setSourceCaseText(value.slice(0, MAX_CASE_CHARS));
  }

  function setLimitedNotesText(value: string) {
    setNotesText(value.slice(0, MAX_NOTES_CHARS));
  }

  function loadSampleCase(index: number) {
    const selected = demoCases[index];

    setPatientLabel(selected.patientLabel);
    setPracticeName(selected.practiceName);
    setPayer(selected.payer);
    setService(selected.service);
    setLimitedCaseText(selected.sourceCaseText || "");
    setLimitedNotesText(selected.notesText || "");
    setResult(null);
    setError("");
    setCopyMessage("");
    setFileMessage(`Loaded sample case: ${selected.patientLabel}`);
  }

  async function handleCaseTextFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await readTextFile(file);
      setLimitedCaseText(text);

      if (text.length > MAX_CASE_CHARS) {
        setFileMessage(
          `Loaded first ${MAX_CASE_CHARS.toLocaleString()} characters from ${file.name}.`
        );
      } else {
        setFileMessage(`Loaded sample case text file: ${file.name}`);
      }
    } catch {
      setFileMessage("Could not read that sample case text file.");
    }
  }

  async function handleNotesFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text = await readTextFile(file);
      setLimitedNotesText(text);

      if (text.length > MAX_NOTES_CHARS) {
        setFileMessage(
          `Loaded first ${MAX_NOTES_CHARS.toLocaleString()} characters from ${file.name}.`
        );
      } else {
        setFileMessage(`Loaded notes file: ${file.name}`);
      }
    } catch {
      setFileMessage("Could not read that notes file.");
    }
  }

  async function handleCasePdfChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!demoAcknowledged) {
      setError("Confirm the fake/sample data notice before extracting PDF text.");
      return;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setError("Log in first before extracting PDF text.");
      return;
    }

    setExtractingPdf(true);
    setError("");
    setFileMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-demo-acknowledged": "true",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not extract PDF text.");
      }

      setLimitedCaseText(data.text || "");

      setFileMessage(
        data.wasTruncated
          ? `Extracted text from PDF: ${file.name}. Long PDF was shortened for demo limits.`
          : `Extracted text from PDF: ${file.name}`
      );
    } catch (pdfError) {
      setError(
        pdfError instanceof Error
          ? pdfError.message
          : "Something went wrong while reading the PDF."
      );
    } finally {
      setExtractingPdf(false);
    }
  }

  async function analyzeCase() {
    if (!demoAcknowledged) {
      setError("Confirm the fake/sample data notice before running analysis.");
      return;
    }

    if (!sourceCaseText.trim()) {
      setError("Add fake/sample case text before running analysis.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setCopyMessage("");

    try {
      const accessToken = await getAccessToken();

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`;
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers,
        body: JSON.stringify({
          patientLabel,
          practiceName,
          payer,
          service,
          sourceCaseText,
          notesText,
          demoAcknowledged: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to analyze case.");
      }

      setResult({
        ...data,
        humanReviewRequired: true,
      });
    } catch (analyzeError) {
      setError(
        analyzeError instanceof Error
          ? analyzeError.message
          : "Something went wrong. Check your API key, environment variables, and terminal error."
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveCase() {
    if (!result) {
      return;
    }

    if (!userId) {
      setError("Log in first before saving demo cases.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const newCase: PriorAuthCase = {
        id: "",
        patientLabel: result.patientLabel || patientLabel,
        practiceName: result.practiceName || practiceName,
        payer: result.payer || payer,
        service: result.service || service,
        status: "Ready for Human Review",
        createdAt: new Date().toISOString().slice(0, 10),
        overallRiskLevel: result.overallRiskLevel,
        riskReason: result.riskReason,
        issuesFound: result.issuesFound,
        missingItems: result.missingItems,
        recommendedNextSteps: result.recommendedNextSteps,
        summary: result.summary,
        followUpMessage: result.followUpMessage,
        humanReviewRequired: true,
        sourceCaseText,
        notesText,
      };

      const savedCase = await addSupabaseCase(newCase);
      router.push(`/cases/${savedCase.id}`);
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

  async function copyFollowUpMessage() {
    if (!result?.followUpMessage) {
      return;
    }

    try {
      await navigator.clipboard.writeText(result.followUpMessage);
      setCopyMessage("Follow-up message copied.");
    } catch {
      setCopyMessage("Could not copy message. You can still select and copy it manually.");
    }
  }

  const analysisDisabled =
    loading ||
    extractingPdf ||
    !sourceCaseText.trim() ||
    !demoAcknowledged ||
    sourceCaseText.length > MAX_CASE_CHARS ||
    notesText.length > MAX_NOTES_CHARS;

  return (
    <AppShell>
      <div className="space-y-3">
        <Badge variant="outline" className="border-blue-500/40 text-blue-200">
          Fake/sample demo only
        </Badge>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Front-End Risk Review
          </h1>
          <p className="mt-2 max-w-3xl text-slate-400">
            Review a fake/sample case, flag eligibility, authorization,
            documentation, coverage, coding, and follow-up risks, then generate
            next steps for human review.
          </p>
        </div>
      </div>

      {!userId && (
        <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
          You can analyze the built-in fake sample case without saving. Log in
          only if you want to save demo reviews or extract PDF text.
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 shrink-0 text-amber-200" size={20} />
          <div>
            <h2 className="font-semibold text-amber-100">
              Fake/sample data confirmation
            </h2>
            <p className="mt-2 text-sm leading-6 text-amber-100">
              This demo is not configured for real patient information. Do not
              enter real names, dates of birth, insurance IDs, medical record
              numbers, real clinic records, or private patient details.
            </p>

            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm text-amber-50">
              <input
                type="checkbox"
                checked={demoAcknowledged}
                onChange={(event) => setDemoAcknowledged(event.target.checked)}
                className="mt-1"
              />
              <span>
                I understand this is for fake, sample, or de-identified demo
                information only, and human review is required.
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[0.85fr_1.5fr]">
        <div className="space-y-6">
          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader>
              <CardTitle>Sample Cases</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {demoCases.map((sample, index) => (
                <button
                  key={sample.id}
                  onClick={() => loadSampleCase(index)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-sm transition hover:border-blue-500/60 hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white">
                        {sample.patientLabel}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {sample.practiceName}
                      </div>
                    </div>

                    <Badge variant={getRiskBadgeVariant(sample.overallRiskLevel)}>
                      {sample.overallRiskLevel}
                    </Badge>
                  </div>

                  <div className="mt-3 text-xs leading-5 text-slate-400">
                    {sample.service}
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
            <CardHeader>
              <CardTitle>What this checks</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm text-slate-300">
              <div className="flex gap-3">
                <ClipboardCheck size={16} className="mt-0.5 text-blue-300" />
                <span>Eligibility and benefits gaps</span>
              </div>
              <div className="flex gap-3">
                <ClipboardCheck size={16} className="mt-0.5 text-blue-300" />
                <span>Prior authorization uncertainty</span>
              </div>
              <div className="flex gap-3">
                <ClipboardCheck size={16} className="mt-0.5 text-blue-300" />
                <span>Missing plan of care, referral, or documentation</span>
              </div>
              <div className="flex gap-3">
                <ClipboardCheck size={16} className="mt-0.5 text-blue-300" />
                <span>Coverage, network, coding, and follow-up risk</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-800 bg-slate-900/70 text-slate-100">
          <CardHeader>
            <CardTitle>Review Case</CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Patient Label</Label>
                <Input
                  value={patientLabel}
                  onChange={(event) => setPatientLabel(event.target.value)}
                  placeholder="Sample Patient: Jordan Miller"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Practice</Label>
                <Input
                  value={practiceName}
                  onChange={(event) => setPracticeName(event.target.value)}
                  placeholder="Lakeside Physical Therapy"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Payer</Label>
                <Input
                  value={payer}
                  onChange={(event) => setPayer(event.target.value)}
                  placeholder="Northstar Health Plan"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label>Service</Label>
                <Input
                  value={service}
                  onChange={(event) => setService(event.target.value)}
                  placeholder="PT evaluation + 8 follow-up visits"
                  className="border-slate-800 bg-slate-950 text-white"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2">
                  <UploadCloud size={16} className="text-blue-300" />
                  <Label>Upload Sample Case PDF</Label>
                </div>

                <Input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleCasePdfChange}
                  disabled={extractingPdf || !userId || !demoAcknowledged}
                  className="border-slate-800 bg-slate-900 text-white"
                />

                <p className="text-xs text-slate-500">
                  Requires login and fake/sample confirmation.
                </p>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-slate-300" />
                  <Label>Upload Sample Case .txt</Label>
                </div>

                <Input
                  type="file"
                  accept=".txt"
                  onChange={handleCaseTextFileChange}
                  className="border-slate-800 bg-slate-900 text-white"
                />

                <p className="text-xs text-slate-500">
                  Use fake, sample, or de-identified case text only.
                </p>
              </div>
            </div>

            {extractingPdf && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-100">
                Extracting PDF text...
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Sample Case Text</Label>
                <span className="text-xs text-slate-500">
                  {sourceCaseText.length.toLocaleString()} /{" "}
                  {MAX_CASE_CHARS.toLocaleString()}
                </span>
              </div>

              <Textarea
                value={sourceCaseText}
                onChange={(event) => setLimitedCaseText(event.target.value)}
                placeholder="Paste fake/sample case details here. Do not enter real patient information."
                className="min-h-56 border-slate-800 bg-slate-950 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label>Upload Demo Notes Text File</Label>
              <Input
                type="file"
                accept=".txt"
                onChange={handleNotesFileChange}
                className="border-slate-800 bg-slate-950 text-white"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label>Additional Notes</Label>
                <span className="text-xs text-slate-500">
                  {notesText.length.toLocaleString()} /{" "}
                  {MAX_NOTES_CHARS.toLocaleString()}
                </span>
              </div>

              <Textarea
                value={notesText}
                onChange={(event) => setLimitedNotesText(event.target.value)}
                placeholder="Paste fake/sample notes here."
                className="min-h-40 border-slate-800 bg-slate-950 text-white"
              />
            </div>

            {fileMessage && (
              <p className="text-sm text-blue-300">{fileMessage}</p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={analyzeCase} disabled={analysisDisabled}>
                <Sparkles size={16} />
                {loading ? "Analyzing..." : "Analyze Sample Case"}
              </Button>

              {result && (
                <Button
                  onClick={saveCase}
                  disabled={saving}
                  variant="outline"
                >
                  {saving ? "Saving..." : "Save Demo Review"}
                </Button>
              )}
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border-slate-800 bg-slate-900/70 text-slate-100">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Front-End Risk Review</CardTitle>

            {result?.humanReviewRequired && (
              <Badge variant="destructive">Human review required</Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {!result ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center">
              <ClipboardList className="mx-auto text-slate-500" size={34} />
              <p className="mt-3 text-sm text-slate-400">
                The risk level, missing items, recommended next steps, and
                follow-up message will appear here after analysis.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="text-sm text-slate-500">Overall Risk</div>
                  <div className="mt-2">
                    <Badge variant={getRiskBadgeVariant(result.overallRiskLevel)}>
                      {result.overallRiskLevel}
                    </Badge>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="text-sm text-slate-500">Payer</div>
                  <div className="mt-2 font-medium">{result.payer}</div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                  <div className="text-sm text-slate-500">Service</div>
                  <div className="mt-2 font-medium">{result.service}</div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex gap-3">
                  <AlertTriangle
                    className="mt-0.5 shrink-0 text-amber-300"
                    size={18}
                  />
                  <div>
                    <div className="font-medium text-white">Risk Reason</div>
                    <p className="mt-2 text-sm leading-7 text-slate-300">
                      {result.riskReason}
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="font-semibold text-white">Issues Found</h2>
                <div className="mt-3 grid gap-4">
                  {result.issuesFound.map((issue, index) => (
                    <div
                      key={`${issue.category}-${issue.title}-${index}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="text-xs uppercase tracking-wide text-slate-500">
                            {issue.category}
                          </div>
                          <h3 className="mt-1 font-semibold text-white">
                            {issue.title}
                          </h3>
                        </div>

                        <Badge variant={getRiskBadgeVariant(issue.riskLevel)}>
                          {issue.riskLevel}
                        </Badge>
                      </div>

                      <div className="mt-4 grid gap-4 md:grid-cols-3">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Finding
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {issue.finding}
                          </p>
                        </div>

                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Why it matters
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {issue.whyItMatters}
                          </p>
                        </div>

                        <div>
                          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Recommended action
                          </div>
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {issue.recommendedAction}
                          </p>

                          <div className="mt-3 text-xs text-slate-500">
                            Owner:{" "}
                            <span className="text-slate-300">
                              {issue.owner}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div>
                  <h2 className="font-semibold text-white">Missing Items</h2>
                  <ul className="mt-3 space-y-2">
                    {result.missingItems.map((item) => (
                      <li
                        key={item}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-300"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    Recommended Next Steps
                  </h2>
                  <ol className="mt-3 space-y-2">
                    {result.recommendedNextSteps.map((step, index) => (
                      <li
                        key={step}
                        className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm leading-6 text-slate-300"
                      >
                        <span className="mr-2 text-slate-500">
                          {index + 1}.
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="font-semibold text-white">
                    Draft Follow-Up Message
                  </h2>

                  <Button
                    onClick={copyFollowUpMessage}
                    variant="outline"
                    size="sm"
                  >
                    <Copy size={14} />
                    Copy
                  </Button>
                </div>

                <p className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm leading-7 text-slate-300">
                  {result.followUpMessage}
                </p>

                {copyMessage && (
                  <p className="mt-3 text-sm text-blue-300">{copyMessage}</p>
                )}
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                <h2 className="font-semibold text-blue-100">
                  Human Review Required
                </h2>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  PriorAuthIQ is a workflow assistant for fake/sample case
                  review. It does not make final billing, medical, legal, or
                  coverage decisions. A human reviewer must verify all payer
                  requirements, documentation, coverage, and next steps.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}