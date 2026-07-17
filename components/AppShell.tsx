"use client";

import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
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
  ShieldCheck,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

const ADMIN_EMAIL = "avielabed3@gmail.com";

const primaryLinks = [
  { href: "/dashboard", label: "Exception Queue", icon: LayoutDashboard },
  { href: "/new-case", label: "New Readiness Review", icon: PlusCircle },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/", label: "Product Overview", icon: FileText },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
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

    return () => subscription.unsubscribe();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setEmail(null);
    setMobileMenuOpen(false);
    window.location.href = "/";
  }

  const isAdmin = email === ADMIN_EMAIL;

  function navItem(href: string, label: string, Icon: typeof LayoutDashboard) {
    const active = pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

    return (
      <Link
        key={href}
        href={href}
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
          active
            ? "bg-blue-500/10 text-blue-100 ring-1 ring-inset ring-blue-500/20"
            : "text-slate-400 hover:bg-slate-900 hover:text-white"
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  }

  const navLinks = (
    <>
      {primaryLinks.map((item) => navItem(item.href, item.label, item.icon))}
      {isAdmin && (
        <>
          <div className="my-3 border-t border-slate-800" />
          {navItem("/feedback-inbox", "Feedback Inbox", Inbox)}
          {navItem("/usage", "Review Usage", Activity)}
        </>
      )}
    </>
  );

  const accountBox = (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      {email ? (
        <div>
          <div className="text-xs text-slate-500">Signed in</div>
          <div className="mt-1 truncate text-sm text-slate-200">{email}</div>
          {isAdmin && (
            <div className="mt-2 inline-flex rounded-md border border-blue-500/30 bg-blue-500/10 px-2 py-1 text-xs text-blue-200">
              Demo admin
            </div>
          )}
          <button
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200 transition hover:bg-slate-800"
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          onClick={() => setMobileMenuOpen(false)}
          className="flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-slate-200"
        >
          <LogIn size={14} /> Log in to save cases
        </Link>
      )}
    </div>
  );

  const safetyNotice = (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-xs leading-5 text-amber-100">
      <div className="mb-2 flex items-center gap-2 font-semibold">
        <ShieldCheck size={14} /> Fake/sample data only
      </div>
      Never enter real PHI, member IDs, medical records, or insurance-card images. Human review is required.
    </div>
  );

  return (
    <div className="min-h-screen bg-[#07101f] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#07101f]/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" onClick={() => setMobileMenuOpen(false)}>
            <div className="text-lg font-bold tracking-tight">PriorAuthIQ</div>
            <div className="text-xs text-slate-500">Readiness + exception control</div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800 text-slate-200"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-slate-800 px-5 py-4">
            <nav className="space-y-1">{navLinks}</nav>
            <div className="mt-4 space-y-3">{safetyNotice}{accountBox}</div>
          </div>
        )}
      </header>

      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-slate-800/80 bg-[#07101f] p-6 md:block">
        <Link href="/" className="block">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/25 bg-blue-400/10 text-blue-200">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">PriorAuthIQ</div>
              <div className="mt-0.5 text-xs text-slate-500">Pre-visit readiness workspace</div>
            </div>
          </div>
        </Link>

        <nav className="mt-10 space-y-1">{navLinks}</nav>

        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          {safetyNotice}
          {accountBox}
        </div>
      </aside>

      <main className="md:pl-72">
        <div className="mx-auto max-w-[1440px] p-5 md:p-8 lg:p-10">{children}</div>
      </main>
    </div>
  );
}
