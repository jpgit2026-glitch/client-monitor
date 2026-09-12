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
    <header className="bg-white/80 backdrop-blur-md border-b border-green-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-green-600 text-white text-xs font-bold flex items-center justify-center">
              CM
            </span>
            <span className="text-sm font-semibold text-green-800 hidden sm:inline">Client Monitor</span>
          </Link>
          <nav className="flex items-center gap-0.5">
            {links.map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                    active
                      ? "bg-green-100 text-green-800 font-semibold"
                      : "text-muted hover:text-green-700 hover:bg-green-50"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
              {name.charAt(0)}
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium leading-tight">{name.split(" ")[0]}</p>
              <p className="text-2xs text-muted leading-tight">{role.charAt(0) + role.slice(1).toLowerCase()}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-ghost btn text-xs px-2.5 py-1.5">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
