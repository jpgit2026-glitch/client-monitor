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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Clients</h1>
          <p className="text-sm text-ink/60">{rows.length} clients</p>
        </div>
        <button className="btn text-xs" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Cancel" : "+ New client"}
        </button>
      </div>

      {showNew && (
        <form onSubmit={createClient} className="card p-4 flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-ink/60 mb-1">Client name</label>
            <input className="input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
          </div>
          <button type="submit" className="btn btn-primary text-xs">
            Add
          </button>
        </form>
      )}

      <input
        className="input w-full max-w-sm"
        placeholder="Search clients…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Tasks</th>
              <th>Completed</th>
              <th>Overdue</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>{c.total}</td>
                <td>{c.completed}</td>
                <td className={c.overdue > 0 ? "text-rust font-medium" : ""}>{c.overdue}</td>
                <td className="font-mono">{c.progress}%</td>
                <td>
                  <Link href={`/clients/${c.id}`} className="text-xs text-ledger-600 hover:underline">
                    View →
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
