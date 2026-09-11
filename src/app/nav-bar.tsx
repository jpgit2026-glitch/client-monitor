"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  name: string;
  role: "BOSS" | "ADMIN" | "ACCOUNTING" | "LIAISON";
};

export default function NavBar({ name, role }: Props) {
  const router = useRouter();

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
    <header className="border-b border-rule bg-white">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-mono text-sm font-medium tracking-tight">Client Work Monitor</span>
          <nav className="flex items-center gap-4">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="text-sm text-ink/70 hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-ink/60">
            {name} <span className="text-ink/40">· {role}</span>
          </span>
          <button onClick={logout} className="btn text-xs">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
