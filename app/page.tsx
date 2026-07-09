import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  MessageSquare,
  ShieldAlert,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const workflowSteps = [
  {
    title: "Review the sample case",
    description:
      "Start with fake/sample case details that show common front-end workflow gaps like unclear benefits, authorization uncertainty, missing documents, and follow-up risk.",
    icon: FileText,
  },
  {
    title: "Catch front-end risk",
    description:
      "Flag eligibility, authorization, documentation, coding, coverage/network, and follow-up issues before they become downstream denials.",
    icon: ShieldAlert,
  },
  {
    title: "Generate next steps",
    description:
      "Get missing items, recommended actions, task ownership, and a follow-up message draft for human review.",
    icon: ClipboardCheck,
  },
];

const riskAreas = [
  "Eligibility and benefits not fully verified",
  "Prior authorization requirement unclear",
  "Visit limits or coverage rules missing",
  "Plan of care, referral, or documentation gaps",
  "Medical necessity support not specific enough",
  "Coverage, network, coding, or follow-up risk",
];

const valuePoints = [
  "Specific case review, not generic advice",
  "Missing-items checklist",
  "Follow-up message draft",
  "Human review required",
  "Fake/sample demo data only",
  "Designed to reduce manual review friction",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-10 top-40 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-10 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 py-8">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight">
              PriorAuthIQ
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="hidden text-sm text-slate-300 transition hover:text-white sm:block"
              >
                Reviews
              </Link>

              <Link
                href="/feedback"
                className="hidden text-sm text-slate-300 transition hover:text-white sm:block"
              >
                Feedback
              </Link>

              <Link
                href="/new-case"
                className="inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Analyze Sample Case
              </Link>
            </div>
          </nav>

          <div className="grid items-center gap-12 py-20 lg:grid-cols-2 lg:py-28">
            <div>
              <div className="mb-6 inline-flex w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
                Fake-data front-end denial-risk review demo
              </div>

              <h1 className="max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
                Catch denial-risk issues before they become denials.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                PriorAuthIQ helps billing/admin teams review sample cases for
                eligibility, authorization, documentation, coding, coverage, and
                follow-up risks — so issues can be caught earlier, not after
                revenue is already at risk.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/new-case"
                  className="inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
                >
                  Analyze Sample Case <ArrowRight className="ml-2" size={18} />
                </Link>

                <Link
                  href="/dashboard"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-slate-700 px-6 text-sm font-semibold text-white transition hover:bg-slate-900"
                >
                  View Demo Reviews
                </Link>

                <Link
                  href="/feedback"
                  className="inline-flex h-12 items-center justify-center rounded-md border border-blue-500/40 px-6 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/10"
                >
                  Leave Feedback
                </Link>
              </div>

              <div className="mt-8 flex gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                <ShieldAlert className="mt-0.5 shrink-0" size={18} />
                <p>
                  Demo environment only. Use fake, sample, or de-identified
                  examples. Do not enter real patient information, real
                  insurance IDs, medical record numbers, or private medical
                  records.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl shadow-blue-950/20">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="text-sm text-slate-500">
                      Sample Case Preview
                    </div>
                    <div className="mt-1 font-semibold">
                      Jordan Miller — Lakeside Physical Therapy
                    </div>
                  </div>

                  <div className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-200">
                    High Risk
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Front-End Risk
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      Benefits were not fully verified, PT visit limits are
                      unclear, and the authorization requirement for follow-up
                      visits has not been confirmed.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <div className="text-xs uppercase tracking-wide text-slate-500">
                      Missing Items
                    </div>
                    <ul className="mt-2 space-y-2 text-sm text-slate-300">
                      <li>• Full eligibility and benefits verification</li>
                      <li>• Prior authorization requirement confirmation</li>
                      <li>• Plan of care and stronger medical necessity notes</li>
                    </ul>
                  </div>

                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-200">
                      <Sparkles size={16} />
                      Follow-up draft prepared
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      The review generates specific next steps and a message the
                      billing/admin team can review before contacting the front
                      desk or provider.
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="text-sm font-medium text-amber-100">
                      Human review required
                    </div>
                    <p className="mt-2 text-sm leading-6 text-amber-100">
                      PriorAuthIQ does not make final billing, medical, legal,
                      or coverage decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 pb-14 md:grid-cols-3">
            {workflowSteps.map((step) => {
              const Icon = step.icon;

              return (
                <Card
                  key={step.title}
                  className="border-slate-800 bg-slate-900/70 text-white"
                >
                  <CardContent className="p-6">
                    <Icon className="mb-4 text-blue-300" />
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
              Built for billing/admin workflow review
            </div>

            <h2 className="text-4xl font-bold tracking-tight">
              A simple review tool, not another dashboard.
            </h2>

            <p className="mt-5 max-w-2xl leading-8 text-slate-300">
              PriorAuthIQ is designed to reduce friction in front-end review.
              The goal is not to replace experienced billers or add another
              system to manage. The goal is to quickly show what is risky, what
              is missing, why it matters, and what should happen next.
            </p>

            <div className="mt-8 flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-300">
              <LockKeyhole
                className="mt-0.5 shrink-0 text-slate-400"
                size={18}
              />
              <p>
                This demo is not configured for real patient information. Real
                clinic use would require proper privacy, security, compliance,
                workflow, and legal review before handling protected health
                information.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {riskAreas.map((riskArea) => (
              <div
                key={riskArea}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200"
              >
                <CheckCircle2 className="shrink-0 text-blue-300" size={18} />
                {riskArea}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/30">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="mb-4 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
                Review → Risk → Next steps
              </div>

              <h2 className="text-4xl font-bold tracking-tight">
                Clear output for real workflow gaps.
              </h2>

              <p className="mt-5 leading-8 text-slate-300">
                The demo is built around a realistic fake case where the front
                desk, provider, and billing/admin team need to resolve missing
                information before the case moves forward.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {valuePoints.map((point) => (
                <div
                  key={point}
                  className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                >
                  <div className="flex items-center gap-3">
                    <Workflow className="text-blue-300" size={18} />
                    <div className="font-medium text-white">{point}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 md:p-10">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-blue-200" size={22} />
              <h2 className="text-3xl font-bold tracking-tight">
                Review a sample case.
              </h2>
            </div>

            <p className="mt-4 text-slate-300">
              The built-in sample case shows unresolved benefits, unclear
              authorization rules, missing documentation, visit-limit questions,
              and follow-up tasks that need human review.
            </p>

            <Link
              href="/new-case"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Analyze Sample Case
            </Link>
          </div>

          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 p-8 md:p-10">
            <div className="flex items-center gap-3">
              <MessageSquare className="text-blue-200" size={22} />
              <h2 className="text-3xl font-bold tracking-tight">
                Share workflow feedback.
              </h2>
            </div>

            <p className="mt-4 text-slate-300">
              Feedback from billing, RCM, denial management, prior auth, and
              healthcare admin professionals helps evaluate whether the workflow
              feels realistic, useful, and specific enough.
            </p>

            <Link
              href="/feedback"
              className="mt-8 inline-flex h-12 items-center justify-center rounded-md border border-blue-400/50 px-6 text-sm font-semibold text-blue-100 transition hover:bg-blue-500/10"
            >
              Give Feedback
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}