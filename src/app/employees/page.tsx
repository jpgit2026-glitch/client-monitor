"use client";

import { useEffect, useState } from "react";

type Row = { id: string; username: string; name: string; role: string; total: number; progress: number };

const ROLES = ["BOSS", "ADMIN", "ACCOUNTING", "LIAISON"];

export default function EmployeesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("ACCOUNTING");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);

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
      body: JSON.stringify({ name, username, role, pin }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not add employee.");
      return;
    }
    setName("");
    setUsername("");
    setPin("");
    load();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Employees</h1>
        <p className="text-sm text-muted mt-1">
          Add a teammate and give them a username and PIN to sign in.
        </p>
      </div>

      <form onSubmit={addEmployee} className="card-elevated p-6 grid grid-cols-1 sm:grid-cols-5 gap-5 items-end">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Full Name</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Username</label>
          <input className="input w-full" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="juan" />
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
          <label className="block text-sm font-medium text-ink mb-2">PIN (4+)</label>
          <input
            className="input w-full"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            inputMode="numeric"
            required
            placeholder="1234"
          />
        </div>
        <button disabled={saving} className="btn btn-primary text-sm">
          {saving ? "Adding..." : "Add employee"}
        </button>
        {error && (
          <div className="sm:col-span-5 rounded-lg bg-rust/8 border border-rust/15 px-4 py-3">
            <p className="text-sm text-rust font-medium">{error}</p>
          </div>
        )}
      </form>

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Role</th>
              <th className="text-center">Tasks</th>
              <th>Progress</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted text-center py-10">No employees yet.</td>
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
                  <span className="text-sm text-muted font-mono">{r.username}</span>
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
                <td className="text-right">
                  <button className="btn text-xs px-3 py-1.5" onClick={() => setEditing(r)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <EditModal
          employee={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function EditModal({
  employee,
  onClose,
  onSaved,
}: {
  employee: Row;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(employee.name);
  const [username, setUsername] = useState(employee.username);
  const [role, setRole] = useState(employee.role);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    const body: Record<string, string> = { name, username, role };
    if (pin.trim()) body.pin = pin;

    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Could not update employee.");
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-rule/40">
          <h2 className="text-lg font-bold text-ink">Edit Employee</h2>
          <p className="text-sm text-muted mt-0.5">Update details for {employee.name}</p>
        </div>

        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
            <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
            <input className="input w-full" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Role</label>
            <select className="input w-full" value={role} onChange={(e) => setRole(e.target.value)}>
              {ROLES.map((r) => (
                <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">New PIN</label>
            <input
              className="input w-full"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              inputMode="numeric"
              placeholder="Leave blank to keep current"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-rust/8 border border-rust/15 px-4 py-3">
              <p className="text-sm text-rust font-medium">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" className="btn text-sm px-4 py-2" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary text-sm px-4 py-2">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
