"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; role: string };

export default function LoginPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees ?? []));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, pin }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not sign in.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={submit} className="card w-full max-w-sm p-8">
        <h1 className="font-mono text-lg mb-1">Client Work Monitor</h1>
        <p className="text-sm text-ink/60 mb-6">Pick your name and enter your PIN.</p>

        <label className="block text-xs text-ink/60 mb-1">Your name</label>
        <select
          className="input w-full mb-4"
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
          required
        >
          <option value="">Select…</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name}
            </option>
          ))}
        </select>

        <label className="block text-xs text-ink/60 mb-1">PIN</label>
        <input
          type="password"
          inputMode="numeric"
          className="input w-full mb-4"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
          required
        />

        {error && <p className="text-sm text-rust mb-4">{error}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center">
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
