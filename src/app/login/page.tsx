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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-paper">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-green-600 text-white text-xl font-bold mb-5 shadow-soft">
            CM
          </div>
          <h1 className="text-2xl font-bold text-ink">Client Monitor</h1>
          <p className="text-sm text-muted mt-1.5">Sign in to manage your work</p>
        </div>

        <form onSubmit={submit} className="card-elevated p-7 space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Your name</label>
            <select
              className="input w-full"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              required
            >
              <option value="">Choose your name...</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-2">PIN</label>
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
            <div className="rounded-lg bg-rust/8 border border-rust/15 px-4 py-3">
              <p className="text-sm text-rust font-medium">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full py-3 text-sm font-semibold">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
