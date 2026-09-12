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

  useEffect(() => { load(); }, []);

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
        <h1 className="text-xl font-semibold">Employees</h1>
        <p className="text-sm text-muted mt-0.5">
          Add a teammate and give them a PIN — they pick their name and enter it to sign in.
        </p>
      </div>

      <form onSubmit={addEmployee} className="card p-5 grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Name</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">Role</label>
          <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink/70 mb-1">PIN (4+ digits)</label>
          <input
            className="input w-full"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            required
            placeholder="e.g. 1234"
          />
        </div>
        <button disabled={saving} className="btn btn-primary text-sm">
          {saving ? "Adding..." : "Add employee"}
        </button>
        {error && (
          <div className="sm:col-span-4 rounded-md bg-rust/10 border border-rust/20 px-3 py-2">
            <p className="text-sm text-rust">{error}</p>
          </div>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th className="text-center">Tasks</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="text-muted text-center py-8">No employees yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td>
                  <span className="tag bg-ink/5 text-ink/60 text-[10px]">
                    {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="text-center">{r.total}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1 w-16">
                      <div className="progress-bar-fill" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{r.progress}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
