"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  name: string;
  role: "BOSS" | "ADMIN" | "ACCOUNTING" | "LIAISON";
};

export default function NavBar({ name, role }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const links: { href: string; label: string }[] = [{ href: "/dashboard", label: "My Work" }];
  if (role === "LIAISON") links.push({ href: "/liaison", label: "Liaison Board" });
  if (["BOSS", "ADMIN"].includes(role)) links.push({ href: "/boss", label: "Team Overview" });
  links.push({ href: "/clients", label: "Clients" });
  if (role === "BOSS") links.push({ href: "/employees", label: "Employees" });

  return (
    <header className="bg-white border-b border-rule/80 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="text-sm font-semibold text-ledger-700 tracking-tight">
            Client Monitor
          </Link>
          <nav className="flex items-center gap-1">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    active
                      ? "bg-ledger-50 text-ledger-700 font-medium"
                      : "text-muted hover:text-ink hover:bg-ink/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium leading-tight">{name}</p>
            <p className="text-[11px] text-muted leading-tight">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
          </div>
          <button onClick={logout} className="btn-ghost btn text-xs px-2.5 py-1.5">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
