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
  const [deleting, setDeleting] = useState<Row | null>(null);

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

  async function handleDelete(emp: Row) {
    const res = await fetch(`/api/employees/${emp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: false }),
    });
    if (res.ok) {
      setDeleting(null);
      load();
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Employees</h1>
        <p className="text-sm text-muted mt-1">
          Manage your team. Add, edit, or remove employees.
        </p>
      </div>

      <form onSubmit={addEmployee} className="card-elevated p-6 grid grid-cols-1 sm:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
          <input className="input w-full" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Juan Dela Cruz" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Username</label>
          <input className="input w-full" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="juan" />
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
          <label className="block text-sm font-medium text-ink mb-1.5">PIN (4+)</label>
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
          <div className="sm:col-span-5 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-600 font-medium">{error}</p>
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
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td>
                  <span className="text-sm text-muted font-mono">{r.username}</span>
                </td>
                <td>
                  <span className="tag bg-brand-50 text-brand-700">
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
                  <div className="flex items-center justify-end gap-1.5">
                    <button className="btn text-xs px-3 py-1.5" onClick={() => setEditing(r)}>
                      Edit
                    </button>
                    <button className="btn btn-danger text-xs px-3 py-1.5" onClick={() => setDeleting(r)}>
                      Delete
                    </button>
                  </div>
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

      {deleting && (
        <DeleteConfirm
          employee={deleting}
          onClose={() => setDeleting(null)}
          onConfirm={() => handleDelete(deleting)}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-md mx-4 border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-200">
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
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
              <p className="text-sm text-red-600 font-medium">{error}</p>
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

function DeleteConfirm({
  employee,
  onClose,
  onConfirm,
}: {
  employee: Row;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  async function handleConfirm() {
    setConfirming(true);
    await onConfirm();
    setConfirming(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-elevated w-full max-w-sm mx-4 border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">Delete Employee</h3>
          <p className="text-sm text-muted">
            Are you sure you want to remove <strong>{employee.name}</strong>? They will no longer be able to sign in. This can be undone by re-adding them.
          </p>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button className="btn flex-1 text-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn flex-1 text-sm bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700 shadow-sm"
            onClick={handleConfirm}
            disabled={confirming}
          >
            {confirming ? "Deleting..." : "Yes, delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
