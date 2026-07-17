import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileWarning,
  SearchCheck,
  ShieldCheck,
  Workflow,
} from "lucide-react";

const workflow = [
  {
    icon: SearchCheck,
    title: "Verify the case",
    description:
      "Review date-of-service eligibility, COB, network, CPT-level benefits, patient responsibility, authorization, referral, diagnosis, and documents.",
  },
  {
    icon: FileWarning,
    title: "Create the exception",
    description:
      "When a check fails or evidence is missing, PriorAuthIQ explains what is unresolved, whether it blocks the service, and why it matters.",
  },
  {
    icon: Workflow,
    title: "Own the next action",
    description:
      "Assign an owner, deadline, priority, follow-up status, payer response, and resolution notes so the case cannot quietly disappear.",
  },
  {
    icon: FileCheck2,
    title: "Preserve the proof",
    description:
      "Keep payer source, verification date, reference number, authorization letter, eligibility record, and human confirmation with the case.",
  },
];

const principles = [
  "Readiness over generic risk scoring",
  "Evidence over unsupported AI claims",
  "CPT-specific results over plan-level summaries",
  "Human review over autonomous decisions",
  "Every issue gets an owner and deadline",
  "Missing information stays missing",
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#07101f] text-white">
      <section className="relative border-b border-slate-800/80">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(59,130,246,.16),transparent_32%),radial-gradient(circle_at_85%_25%,rgba(14,165,233,.10),transparent_28%),radial-gradient(circle_at_50%_100%,rgba(16,185,129,.08),transparent_35%)]" />
        <div className="relative mx-auto max-w-7xl px-6 py-7">
          <nav className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-200">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="font-bold tracking-tight">PriorAuthIQ</div>
                <div className="text-xs text-slate-500">Pre-visit readiness workspace</div>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link href="/dashboard" className="hidden text-sm text-slate-400 transition hover:text-white sm:block">
                Exception queue
              </Link>
              <Link href="/feedback" className="hidden text-sm text-slate-400 transition hover:text-white md:block">
                Feedback
              </Link>
              <Link href="/new-case" className="primary-button">
                Open fake-data demo
              </Link>
            </div>
          </nav>

          <div className="grid items-center gap-14 py-20 lg:grid-cols-[1.05fr_.95fr] lg:py-28">
            <div>
              <div className="eyebrow">Fake-data V2 · Human review required</div>
              <h1 className="mt-6 max-w-4xl text-5xl font-bold tracking-[-0.045em] md:text-7xl">
                Verify the case. Resolve the exception. Protect the claim.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
                PriorAuthIQ helps billing and RCM teams determine whether a case is ready before the service, identify unresolved benefits and authorization issues, preserve payer evidence, and keep every exception visible until it is resolved.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/new-case" className="primary-button h-12 px-6">
                  Review a fictional case <ArrowRight size={17} />
                </Link>
                <Link href="/dashboard" className="secondary-button h-12 px-6">
                  View exception queue
                </Link>
              </div>

              <div className="mt-8 notice notice-amber max-w-2xl">
                <strong>Demo boundary:</strong> use only fake/sample information. Do not enter real patient names, dates of birth, member IDs, insurance cards, clinical records, or PHI.
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-800 bg-slate-900/65 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur">
              <div className="rounded-[1.6rem] border border-slate-800 bg-[#091426] p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">PAIQ-PT-001</div>
                    <h2 className="mt-2 text-lg font-semibold">Jordan Miller · PT readiness review</h2>
                    <p className="mt-1 text-sm text-slate-500">Northstar Choice PPO · Appointment tomorrow</p>
                  </div>
                  <span className="rounded-full border border-rose-400/30 bg-rose-400/10 px-3 py-1 text-xs font-medium text-rose-100">Blocked</span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <PreviewMetric label="Eligibility" value="Active" state="good" />
                  <PreviewMetric label="CPT 97110" value="Coverage unknown" state="warn" />
                  <PreviewMetric label="COB" value="Unresolved" state="bad" />
                </div>

                <div className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-rose-100">
                    <FileWarning size={16} /> Required referral is missing
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Blocks service · Owner: Front Desk · Due before appointment · Evidence: not verified
                  </p>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">CPT-specific verification</div>
                    <span className="text-xs text-blue-200">2 service lines</span>
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <PreviewRow code="97161" coverage="Covered" auth="Not required" source="Payer portal" />
                    <PreviewRow code="97110" coverage="Unknown" auth="Unknown" source="Not verified" />
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-blue-200/70">Next action</div>
                    <div className="mt-1 text-sm text-blue-100">Verify CPT 97110, obtain referral, attach payer proof.</div>
                  </div>
                  <Clock3 className="text-blue-300" size={20} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="max-w-3xl">
          <div className="eyebrow">Built from billing and RCM feedback</div>
          <h2 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Not another denial score. A closed-loop workflow.
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-400">
            The strongest feedback was that teams care less about a broad high/medium/low score and more about what failed, what evidence supports the answer, whether it blocks the service, who owns it, and whether it was resolved.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="panel p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-400/10 text-blue-200">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-semibold text-white">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-800/80 bg-slate-950/25">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-2">
          <div>
            <div className="eyebrow">What V2 checks</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">One readiness record for the full pre-visit handoff.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              The demo begins with eligibility and benefits, then connects CPT coverage, authorization, referral, ICD-10 support, required documents, evidence, exceptions, and follow-up.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              "Date-of-service eligibility",
              "Coordination of Benefits",
              "Network and carve-out status",
              "CPT-level coverage",
              "Copay, deductible, and coinsurance",
              "Visit and unit limits",
              "Authorization dates, CPTs, and units",
              "Referral status and document",
              "ICD-10 support and linked CPTs",
              "Required document checklist",
              "Payer source and reference number",
              "Owner, deadline, and resolution",
            ].map((item) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-900/55 p-4 text-sm leading-6 text-slate-300">
                <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-300" size={17} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr]">
          <div>
            <div className="eyebrow">Product principles</div>
            <h2 className="mt-4 text-4xl font-bold tracking-tight">Trust starts with saying what the system does not know.</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {principles.map((item) => (
              <div key={item} className="panel flex items-center gap-3 p-4 text-sm text-slate-300">
                <ClipboardCheck className="shrink-0 text-blue-300" size={18} />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 rounded-[2rem] border border-blue-500/25 bg-[linear-gradient(135deg,rgba(59,130,246,.13),rgba(14,165,233,.05))] p-7 md:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="eyebrow">Current validation milestone</div>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">Test the workflow against expert manual reviews.</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
                The goal is to measure correct blockers, missed issues, false flags, time to resolution, and the percentage of exceptions resolved before the service deadline—not to claim guaranteed denial reduction.
              </p>
            </div>
            <Link href="/new-case" className="primary-button h-12 shrink-0 px-6">
              Open the V2 demo <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <div>PriorAuthIQ · Working-name fake-data demo</div>
          <div>Human review required · No real PHI</div>
        </div>
      </footer>
    </main>
  );
}

function PreviewMetric({ label, value, state }: { label: string; value: string; state: "good" | "warn" | "bad" }) {
  const dot = state === "good" ? "bg-emerald-300" : state === "bad" ? "bg-rose-300" : "bg-amber-300";
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
      <div className="flex items-center gap-2 text-xs text-slate-500"><span className={`h-2 w-2 rounded-full ${dot}`} /> {label}</div>
      <div className="mt-2 text-sm font-medium text-slate-200">{value}</div>
    </div>
  );
}

function PreviewRow({ code, coverage, auth, source }: { code: string; coverage: string; auth: string; source: string }) {
  return (
    <div className="grid grid-cols-[.5fr_1fr_1fr_1fr] gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400">
      <span className="font-semibold text-white">{code}</span><span>{coverage}</span><span>{auth}</span><span>{source}</span>
    </div>
  );
}
