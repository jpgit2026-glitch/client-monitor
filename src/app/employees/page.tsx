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
        <h1 className="text-2xl font-bold text-ink">Employees</h1>
        <p className="text-sm text-muted mt-1">
          Add a teammate and give them a PIN — they pick their name and enter it to sign in.
        </p>
      </div>

      <form onSubmit={addEmployee} className="card-elevated p-6 grid grid-cols-1 sm:grid-cols-4 gap-5 items-end">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Name</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Role</label>
          <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">PIN (4+ digits)</label>
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
          <div className="sm:col-span-4 rounded-lg bg-rust/8 border border-rust/15 px-4 py-3">
            <p className="text-sm text-rust font-medium">{error}</p>
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
                <td colSpan={4} className="text-muted text-center py-10">No employees yet.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td>
                  <span className="tag bg-green-50 text-green-700">
                    {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="text-center font-medium">{r.total}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="progress-bar flex-1 w-20">
                      <div className="progress-bar-fill" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted font-medium w-8 text-right">{r.progress}%</span>
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
