"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabaseClient";
import {
  Activity,
  BarChart3,
  Clock,
  LockKeyhole,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const ADMIN_EMAIL = "avielabed3@gmail.com";

type UsageLog = {
  id: string;
  user_id: string;
  user_email: string;
  created_at: string;
};

type UsageUser = {
  email: string;
  total: number;
  today: number;
  latest: string;
};

type UsageResponse = {
  totalCount: number;
  todayCount: number;
  dailyLimit: number;
  logs: UsageLog[];
  users: UsageUser[];
};

export default function UsagePage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin = userEmail === ADMIN_EMAIL;

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  async function loadUsage() {
    setLoading(true);
    setError("");

    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || null;

      setUserEmail(email);

      if (email !== ADMIN_EMAIL) {
        setUsage(null);
        return;
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        setUsage(null);
        return;
      }

      const response = await fetch("/api/admin/usage", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load usage.");
      }

      setUsage(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load usage."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadUsage();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recentLogs = useMemo(() => {
    return usage?.logs.slice(0, 20) || [];
  }, [usage]);

  const remainingToday = Math.max(
    (usage?.dailyLimit || 10) - (usage?.todayCount || 0),
    0
  );

  if (loading) {
    return (
      <AppShell>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">
          Loading AI usage...
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
            The AI usage page is an admin page. Log in with the admin account
            to view sample-case analysis usage.
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
            This page is restricted to the PriorAuthIQ admin account.
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
            Admin usage monitor
          </div>

          <h1 className="text-3xl font-bold tracking-tight">Readiness Review Usage</h1>

          <p className="mt-2 max-w-3xl text-slate-400">
            Monitor sample-case analysis usage and confirm the daily analysis
            limit is working for the PriorAuthIQ demo.
          </p>
        </div>

        <button
          onClick={loadUsage}
          className="inline-flex h-10 w-fit items-center justify-center rounded-md border border-slate-700 px-4 text-sm font-medium text-slate-200 transition hover:bg-slate-900"
        >
          <RefreshCcw className="mr-2" size={16} />
          Refresh
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-100">
        <div className="mb-1 flex items-center gap-2 font-semibold">
          <ShieldAlert size={16} />
          Demo safety reminder
        </div>
        Usage logs only track structured readiness-review activity for the fake/sample demo.
        The app should not be used with real patient information.
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-5">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Activity size={16} />
            Total Reviews
          </div>

          <div className="mt-2 text-3xl font-bold">
            {usage?.totalCount || 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Clock size={16} />
            Today
          </div>

          <div className="mt-2 text-3xl font-bold">
            {usage?.todayCount || 0}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={16} />
            Daily Limit
          </div>

          <div className="mt-2 text-3xl font-bold">
            {usage?.dailyLimit || 10}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <ShieldCheck size={16} />
            Remaining
          </div>

          <div className="mt-2 text-3xl font-bold">{remainingToday}</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <UserRound size={16} />
            Active Users
          </div>

          <div className="mt-2 text-3xl font-bold">
            {usage?.users.length || 0}
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-blue-300" size={20} />
            <h2 className="text-xl font-semibold">Usage by User</h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Shows who has run sample-case analysis and how often.
          </p>

          <div className="mt-5 space-y-3">
            {!usage || usage.users.length === 0 ? (
              <p className="text-sm text-slate-400">No usage yet.</p>
            ) : (
              usage.users.map((user) => (
                <div
                  key={user.email}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                    <div>
                      <div className="font-medium">{user.email}</div>

                      <div className="mt-1 text-xs text-slate-500">
                        Last review:{" "}
                        {new Date(user.latest).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
                        Today: {user.today}
                      </span>

                      <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                        Total: {user.total}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center gap-2">
            <Activity className="text-green-300" size={20} />
            <h2 className="text-xl font-semibold">Recent Analysis Logs</h2>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Recent case-readiness review events from the fake/sample demo.
          </p>

          <div className="mt-5 space-y-3">
            {recentLogs.length === 0 ? (
              <p className="text-sm text-slate-400">No recent logs.</p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4"
                >
                  <div className="font-medium">
                    {log.user_email || "Unknown user"}
                  </div>

                  <div className="mt-1 text-xs text-slate-500">
                    {new Date(log.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}