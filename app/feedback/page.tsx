"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Send,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [organization, setOrganization] = useState("");
  const [usefulness, setUsefulness] = useState("Not sure yet");
  const [biggestProblem, setBiggestProblem] = useState("");
  const [missingFeature, setMissingFeature] = useState("");
  const [wouldUse, setWouldUse] = useState("Maybe");
  const [extraNotes, setExtraNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase
        .from("feedback_entries")
        .insert({
          name,
          email,
          role,
          organization,
          usefulness,
          biggest_problem: biggestProblem,
          missing_feature: missingFeature,
          would_use: wouldUse,
          extra_notes: extraNotes,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      setSubmitted(true);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Something went wrong while submitting feedback."
      );
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to PriorAuthIQ
          </Link>

          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-2xl shadow-blue-950/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-300">
              <CheckCircle2 size={28} />
            </div>

            <h1 className="mt-6 text-3xl font-bold tracking-tight">
              Thank you for the feedback.
            </h1>

            <p className="mt-4 leading-7 text-slate-300">
              Your response was submitted. Honest workflow feedback helps
              sharpen PriorAuthIQ before it is used beyond fake/sample demo
              testing.
            </p>

            <Link
              href="/"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-md bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            PriorAuthIQ
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </nav>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <div className="inline-flex w-fit rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-200">
              Feedback request
            </div>

            <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
              Help validate the sharper PriorAuthIQ demo.
            </h1>

            <p className="mt-5 text-lg leading-8 text-slate-300">
              PriorAuthIQ is being rebuilt as a fake-data front-end
              denial-risk review tool for billing/admin teams. The goal is to
              help catch eligibility, authorization, documentation, coding,
              coverage/network, and follow-up risks earlier — before they turn
              into denials, delays, or unpaid claims.
            </p>

            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <ShieldAlert size={18} />
                Fake/sample feedback only
              </div>
              Please do not enter real patient information, real insurance IDs,
              real medical records, or private clinic data. This form is only
              for general workflow feedback.
            </div>

            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex items-center gap-3">
                <MessageSquare className="text-blue-300" size={20} />
                <h2 className="font-semibold">What feedback is useful?</h2>
              </div>

              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
                <p>
                  Is catching eligibility/auth/documentation risk before denial
                  more useful than only helping after a denial happens?
                </p>
                <p>
                  Does the fake sample case feel close to a real billing/admin
                  workflow?
                </p>
                <p>
                  What would make you trust or not trust the analysis if it were
                  accurate?
                </p>
                <p>
                  What would need to change before a billing team, RCM team, or
                  clinic would actually test it?
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-blue-950/20">
            <h2 className="text-2xl font-bold tracking-tight">
              Share feedback
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Specific criticism is more helpful than compliments. The goal is
              to learn whether this would save time if accurate.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-400">Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Your name"
                    className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm text-slate-400">Role</label>
                  <input
                    value={role}
                    onChange={(event) => setRole(event.target.value)}
                    placeholder="Biller, RCM, practice manager..."
                    className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-400">
                    Organization
                  </label>
                  <input
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder="Clinic, billing company, or team"
                    className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  How useful does this front-end risk review workflow seem?
                </label>
                <select
                  value={usefulness}
                  onChange={(event) => setUsefulness(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option>Very useful</option>
                  <option>Somewhat useful</option>
                  <option>Not sure yet</option>
                  <option>Not useful</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  In your workflow, what creates the most denial-risk before a
                  claim is even submitted?
                </label>
                <textarea
                  value={biggestProblem}
                  onChange={(event) => setBiggestProblem(event.target.value)}
                  placeholder="Example: benefits not verified, auth unclear, missing documentation, coding issues, provider follow-up, front desk handoff, visit limits..."
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  What would need to change before this would be useful or
                  trustworthy?
                </label>
                <textarea
                  value={missingFeature}
                  onChange={(event) => setMissingFeature(event.target.value)}
                  placeholder="Example: more realistic cases, payer-specific rules, clearer task ownership, better documentation checks, team handoff, audit trail..."
                  className="mt-2 min-h-28 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  Would you use, test, or react to something like this if the
                  analysis were accurate?
                </label>
                <select
                  value={wouldUse}
                  onChange={(event) => setWouldUse(event.target.value)}
                  className="mt-2 h-11 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-500"
                >
                  <option>Yes</option>
                  <option>Maybe</option>
                  <option>No</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-slate-400">
                  Anything else?
                </label>
                <textarea
                  value={extraNotes}
                  onChange={(event) => setExtraNotes(event.target.value)}
                  placeholder="Any extra thoughts, concerns, workflow details, or reasons this would/would not work..."
                  className="mt-2 min-h-24 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-600 focus:border-blue-500"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 w-full items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "Submitting..." : "Submit Feedback"}
                <Send className="ml-2" size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}