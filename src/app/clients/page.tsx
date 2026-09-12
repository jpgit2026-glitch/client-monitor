"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ClientRow = {
  id: string;
  name: string;
  status: string;
  total: number;
  completed: number;
  overdue: number;
  progress: number;
};

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");

  async function load() {
    const res = await fetch(`/api/clients${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const d = await res.json();
    setRows(d.clients ?? []);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q]);

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setNewName("");
    setShowNew(false);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted mt-0.5">{rows.length} clients</p>
        </div>
        <button className="btn btn-primary text-xs" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "+ New client"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createClient} className="card p-5 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink/70 mb-1">Client name</label>
            <input className="input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="e.g. ABC Corporation" />
          </div>
          <button type="submit" className="btn btn-primary text-xs">Add</button>
        </form>
      )}

      <input
        className="input w-full max-w-sm"
        placeholder="Search clients..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th className="text-center">Tasks</th>
              <th className="text-center">Done</th>
              <th className="text-center">Overdue</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted text-center py-8">No clients found.</td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td className="text-center">{c.total}</td>
                <td className="text-center">{c.completed}</td>
                <td className={`text-center ${c.overdue > 0 ? "text-rust font-medium" : ""}`}>{c.overdue}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="progress-bar flex-1 w-16">
                      <div className="progress-bar-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted w-8 text-right">{c.progress}%</span>
                  </div>
                </td>
                <td>
                  <Link href={`/clients/${c.id}`} className="text-xs text-ledger-600 hover:text-ledger-700 transition-colors">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
