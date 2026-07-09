"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import {
  Activity,
  FileText,
  Inbox,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  ShieldAlert,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "avielabed3@gmail.com";

export default function AppShell({ children }: { children: ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email || null);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  const isAdmin = email === ADMIN_EMAIL;

  const navLinks = (
    <>
      <Link
        href="/dashboard"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
      >
        <LayoutDashboard size={18} />
        Reviews
      </Link>

      <Link
        href="/new-case"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
      >
        <PlusCircle size={18} />
        Analyze Sample Case
      </Link>

      <Link
        href="/feedback"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
      >
        <MessageSquare size={18} />
        Feedback
      </Link>

      {isAdmin && (
        <>
          <Link
            href="/feedback-inbox"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            <Inbox size={18} />
            Feedback Inbox
          </Link>

          <Link
            href="/usage"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
          >
            <Activity size={18} />
            AI Usage
          </Link>
        </>
      )}

      <Link
        href="/"
        onClick={() => setMobileMenuOpen(false)}
        className="flex items-center gap-3 rounded-xl px-3 py-2 text-slate-300 transition hover:bg-slate-900 hover:text-white"
      >
        <FileText size={18} />
        Home
      </Link>
    </>
  );

  const accountBox = (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      {email ? (
        <div>
          <div className="text-xs text-slate-500">Logged in as</div>
          <div className="mt-1 truncate text-sm text-slate-200">{email}</div>

          {isAdmin && (
            <div className="mt-2 rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
              Admin
            </div>
          )}

          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-800"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center justify-center gap-2 rounded-md bg-white px-3 py-2 text-xs font-medium text-slate-950 transition hover:bg-slate-200"
        >
          <LogIn size={14} />
          Log in to save reviews
        </Link>
      )}
    </div>
  );

  const safetyNotice = (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100">
      <div className="mb-2 flex items-center gap-2 font-medium">
        <ShieldAlert size={14} />
        Fake/sample demo only
      </div>
      Do not enter real patient information, real insurance IDs, medical record
      numbers, or private clinic data. Human review is required.
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block"
          >
            <div className="text-lg font-bold tracking-tight">PriorAuthIQ</div>
            <div className="text-xs text-slate-400">
              Front-End Risk Review
            </div>
          </Link>

          <button
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-800 text-slate-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-800 px-5 py-4">
            <nav className="space-y-2">{navLinks}</nav>

            <div className="mt-4">{safetyNotice}</div>
            <div className="mt-4">{accountBox}</div>
          </div>
        )}
      </header>

      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 p-6 md:block">
        <Link href="/" className="block">
          <div className="text-xl font-bold tracking-tight">PriorAuthIQ</div>
          <div className="mt-1 text-sm text-slate-400">
            Front-End Risk Review
          </div>
        </Link>

        <nav className="mt-10 space-y-2">{navLinks}</nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          {safetyNotice}
          {accountBox}
        </div>
      </aside>

      <main className="md:pl-64">
        <div className="mx-auto max-w-6xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}