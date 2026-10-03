"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Props = {
  name: string;
  role: "DIRECTOR" | "ADMIN" | "ACCOUNTING" | "LIAISON" | "IT" | "HR";
};

export default function NavBar({ name, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((d) => {
        const tasks = d.tasks ?? [];
        const now = new Date();
        const todayStr = now.toDateString();
        const count = tasks.filter((t: any) => {
          if (t.status === "COMPLETED" || t.status === "CANCELLED") return false;
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due < now || due.toDateString() === todayStr;
        }).length;
        setUrgentCount(count);
      })
      .catch(() => {});
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links: { href: string; label: string; badge?: number }[] = [
    { href: "/dashboard", label: "My Work", badge: urgentCount },
  ];
  if (role === "LIAISON") links.push({ href: "/liaison", label: "Liaison Board" });
  if (["DIRECTOR", "ADMIN"].includes(role)) links.push({ href: "/boss", label: "Team Overview" });
  links.push({ href: "/clients", label: "Clients" });
  if (["DIRECTOR", "ADMIN"].includes(role)) links.push({ href: "/employees", label: "Employees" });

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-brand-600 text-white text-xs font-bold flex items-center justify-center">
              JP
            </span>
            <span className="text-sm font-semibold text-slate-800 hidden sm:inline">JPG Monitoring</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`relative px-3 py-1.5 text-sm rounded-lg transition-all ${
                    active
                      ? "bg-brand-50 text-brand-700 font-semibold"
                      : "text-muted hover:text-slate-800 hover:bg-slate-100"
                  }`}
                >
                  {l.label}
                  {l.badge != null && l.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow-sm">
                      {l.badge > 99 ? "99+" : l.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
              {name.charAt(0)}
            </div>
            <p className="text-sm font-medium leading-tight hidden sm:block">{name.split(" ")[0]}</p>
          </div>
          <button onClick={logout} className="btn text-xs px-3 py-1.5">
            Sign out
          </button>
          <button onClick={() => setOpen(!open)} className="md:hidden btn text-xs px-2 py-1.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {open
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>
      {open && (
        <nav className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
          {links.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 text-sm rounded-lg transition-all ${
                  active
                    ? "bg-brand-50 text-brand-700 font-semibold"
                    : "text-muted hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {l.label}
                {l.badge != null && l.badge > 0 && (
                  <span className="min-w-[20px] h-[20px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1.5">
                    {l.badge > 99 ? "99+" : l.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
