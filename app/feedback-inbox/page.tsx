"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import {
  Inbox,
  LockKeyhole,
  Mail,
  MessageSquare,
  RefreshCcw,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ADMIN_EMAIL = "avielabed3@gmail.com";

type FeedbackEntry = {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  organization: string | null;
  usefulness: string;
  biggest_problem: string | null;
  missing_feature: string | null;
  would_use: string;
  extra_notes: string | null;
  created_at: string;
};

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

export default function FeedbackInboxPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isAdmin = userEmail === ADMIN_EMAIL;

  async function loadFeedback() {
    setLoading(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentEmail = userData.user?.email || null;

      setUserEmail(currentEmail);

      if (!userData.user) {
        setEntries([]);
        return;
      }

      if (currentEmail !== ADMIN_EMAIL) {
        setEntries([]);
        return;
      }

      const { data, error: feedbackError } = await supabase
        .from("feedback_entries")
        .select("*")
        .order("created_at", { ascending: false });

      if (feedbackError) {
        throw new Error(feedbackError.message);
      }

      setEntries((data || []) as FeedbackEntry[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load feedback."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFeedback();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function showMessage(text: string) {
    setMessage(text);

    setTimeout(() => {
      setMessage("");
    }, 2500);
  }

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
    showMessage("Copied.");
  }

  async function deleteFeedback(entry: FeedbackEntry) {
    const label = entry.name || entry.email || "this feedback entry";
    const confirmed = window.confirm(`Remove feedback from ${label}?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(entry.id);
    setError("");

    try {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        throw new Error("Log in with the admin account before deleting feedback.");
      }

      const response = await fetch(`/api/admin/feedback/${entry.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not delete feedback.");
      }

      setEntries((currentEntries) =>
        currentEntries.filter((currentEntry) => currentEntry.id !== entry.id)
      );

      showMessage("Feedback removed.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Something went wrong while deleting feedback."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const filteredEntries = useMemo(() => {
    const searchText = search.toLowerCase();

    return entries.filter((entry) => {
      const combined = [
        entry.name,
        entry.email,
        entry.role,
        entry.organization,
        entry.usefulness,
        entry.biggest_problem,
        entry.missing_feature,
        entry.would_use,
        entry.extra_notes,
      ]
        .join(" ")
        .toLowerCase();

      return combined.includes(searchText);
    });
  }, [entries, search]);

  const yesCount = entries.filter((entry) => entry.would_use === "Yes").length;
  const maybeCount = entries.filter(
    (entry) => entry.would_use === "Maybe"
  ).length;
  const veryUsefulCount = entries.filter(
    (entry) => entry.usefulness === "Very useful"
  ).length;
  const notUsefulCount = entries.filter(
    (entry) => entry.usefulness === "Not useful"
  ).length;

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
          Loading feedback inbox...
        </div>
      </AppShell>
    );
  }

  if (!userEmail) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <LockKeyhole className="mx-auto text-slate-500" size={36} />
          <h1 className="mt-4 text-2xl font-bold">Login required</h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            The feedback inbox is an admin page. Log in with the admin account
            to view submitted feedback.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
          >
            Log in
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <LockKeyhole className="mx-auto text-red-300" size={36} />
          <h1 className="mt-4 text-2xl font-bold">Access denied</h1>
          <p className="mx-auto mt-2 max-w-xl text-slate-400">
            This inbox is restricted to the PriorAuthIQ admin account.
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="mb-3 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
            Admin feedback review
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            Feedback Inbox
          </h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Review feedback about the pre-visit readiness workflow, sample
            case realism, missing features, trust concerns, and whether the tool
            would save time if accurate.
          </p>
        </div>

        <button
          onClick={loadFeedback}
          className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
        >
          <RefreshCcw className="mr-2" size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      {message && (
        <div className="mt-6 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
          {message}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-sm text-slate-400">Total Responses</div>
          <div className="mt-2 text-3xl font-bold">{entries.length}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-sm text-slate-400">Would Use: Yes</div>
          <div className="mt-2 text-3xl font-bold">{yesCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-sm text-slate-400">Would Use: Maybe</div>
          <div className="mt-2 text-3xl font-bold">{maybeCount}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="text-sm text-slate-400">Very Useful</div>
          <div className="mt-2 text-3xl font-bold">{veryUsefulCount}</div>
        </div>
      </div>

      {notUsefulCount > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
          {notUsefulCount} response{notUsefulCount === 1 ? "" : "s"} marked the
          workflow as not useful. Review those carefully — negative feedback may
          be the most useful signal.
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <label className="text-sm text-slate-400">Search feedback</label>

        <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3">
          <Search size={16} className="text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, role, problem, missing feature, trust concern..."
            className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
          />
        </div>

        <p className="mt-4 text-sm text-slate-500">
          Showing {filteredEntries.length} of {entries.length} responses.
        </p>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
          <Inbox className="mx-auto text-slate-500" size={34} />
          <h2 className="mt-4 text-xl font-semibold">No feedback found</h2>
          <p className="mt-2 text-slate-400">
            Submit test feedback from the public feedback page first, or change
            the search filter.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <UserRound className="text-blue-300" size={18} />
                    <h3 className="font-semibold">
                      {entry.name || "Anonymous"}
                    </h3>
                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    {entry.role || "No role"}{" "}
                    {entry.organization ? `• ${entry.organization}` : ""} •{" "}
                    {entry.created_at.slice(0, 10)}
                  </p>

                  {entry.email && (
                    <button
                      onClick={() => copyText(entry.email || "")}
                      className="mt-3 inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-800"
                    >
                      <Mail size={14} />
                      {entry.email}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                    {entry.usefulness}
                  </span>

                  <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs text-green-200">
                    Would use: {entry.would_use}
                  </span>

                  <button
                    onClick={() => deleteFeedback(entry)}
                    disabled={deletingId === entry.id}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs text-red-200 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={13} />
                    {deletingId === entry.id ? "Removing..." : "Remove"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
                    <MessageSquare size={14} />
                    Main Pre-Denial Problem
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {entry.biggest_problem || "Not answered"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    Needed Change / Trust Concern
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {entry.missing_feature || "Not answered"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">
                    Extra Notes
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {entry.extra_notes || "Not answered"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() =>
                    copyText(
                      `Name: ${entry.name || "Anonymous"}
Email: ${entry.email || "No email"}
Role: ${entry.role || "No role"}
Organization: ${entry.organization || "No organization"}
Usefulness: ${entry.usefulness}
Would use: ${entry.would_use}

Main pre-denial problem:
${entry.biggest_problem || "Not answered"}

Needed change / trust concern:
${entry.missing_feature || "Not answered"}

Extra notes:
${entry.extra_notes || "Not answered"}`
                    )
                  }
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-700 px-3 text-xs text-slate-200 transition hover:bg-slate-800"
                >
                  Copy Full Response
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}