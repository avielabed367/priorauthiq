"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        setMessage(
          "Account created. Check your email if Supabase requires confirmation, then log in."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setMessage(error.message);
          return;
        }

        window.location.href = "/dashboard";
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <Link href="/" className="mb-8 block text-center">
          <div className="text-2xl font-bold tracking-tight">PriorAuthIQ</div>
          <div className="mt-1 text-sm text-slate-400">
            Pre-Visit Readiness & Exception Management
          </div>
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-blue-950/20">
          <div>
            <div className="mb-4 inline-flex rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-200">
              Save demo reviews
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              {mode === "login" ? "Log in" : "Create account"}
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              You can analyze the built-in fake sample case without logging in.
              Use an account only to save fictional case reviews, update exception
              ownership, and preserve readiness decisions.
            </p>
          </div>

          <form onSubmit={handleAuth} className="mt-6 space-y-5">
            <div>
              <label className="text-sm text-slate-400">Email</label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3">
                <Mail size={16} className="text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-slate-400">Password</label>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3">
                <LockKeyhole size={16} className="text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                  className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center rounded-md bg-white px-4 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading
                ? "Loading..."
                : mode === "login"
                ? "Log in"
                : "Create account"}
              <ArrowRight className="ml-2" size={16} />
            </button>

            {message && (
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm leading-6 text-blue-100">
                {message}
              </div>
            )}
          </form>

          <div className="mt-6 border-t border-slate-800 pt-5 text-center text-sm text-slate-400">
            {mode === "login" ? (
              <>
                Need an account?{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setMessage("");
                  }}
                  className="font-medium text-blue-300 hover:text-blue-200"
                >
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setMessage("");
                  }}
                  className="font-medium text-blue-300 hover:text-blue-200"
                >
                  Log in
                </button>
              </>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              <ShieldAlert size={14} />
              Fake/sample demo only
            </div>
            Do not enter real patient information, real insurance IDs, medical
            record numbers, or private clinic records. Human review is required.
          </div>
        </div>

        <div className="mt-5 text-center">
          <Link
            href="/new-case"
            className="text-sm text-blue-300 transition hover:text-blue-200"
          >
            Continue to sample case review without saving
          </Link>
        </div>
      </div>
    </main>
  );
}