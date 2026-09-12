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
    <div className="min-h-screen flex items-center justify-center bg-paper">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-ledger-600 text-white text-lg font-bold mb-4">
            CM
          </div>
          <h1 className="text-xl font-semibold text-ink">Client Monitor</h1>
          <p className="text-sm text-muted mt-1">Sign in to manage your work</p>
        </div>

        <form onSubmit={submit} className="card p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">Your name</label>
            <select
              className="input w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Choose your name...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1.5">PIN</label>
            <input
              type="password"
              inputMode="numeric"
              className="input w-full"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter your PIN"
              required
            />
          </div>

          {error && (
            <div className="rounded-md bg-rust/10 border border-rust/20 px-3 py-2">
              <p className="text-sm text-rust">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-2.5">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
