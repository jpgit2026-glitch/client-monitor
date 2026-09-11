"use client";

import { useEffect, useState } from "react";

type Row = { id: string; name: string; role: string; total: number; progress: number };

const ROLES = ["BOSS", "ADMIN", "ACCOUNTING", "LIAISON"];

export default function EmployeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState("ACCOUNTING");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/employees?all=1");
    const d = await res.json();
    setRows(d.employees ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmployee(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, pin }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not add employee.");
      return;
    }
    setName("");
    setPin("");
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium">Employees</h1>
        <p className="text-sm text-ink/60">
          Add a teammate and give them a PIN — they'll pick their name and enter it to sign in. No email or
          password setup needed.
        </p>
      </div>

      <form onSubmit={addEmployee} className="card p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs text-ink/60 mb-1">Name</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Role</label>
          <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">PIN (4+ digits)</label>
          <input
            className="input w-full"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            required
          />
        </div>
        <button disabled={saving} className="btn btn-primary text-xs">
          {saving ? "Adding…" : "Add employee"}
        </button>
        {error && <p className="text-sm text-rust sm:col-span-4">{error}</p>}
      </form>

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Tasks</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td className="font-mono text-xs text-ink/60">{r.role}</td>
                <td>{r.total}</td>
                <td className="font-mono">{r.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
