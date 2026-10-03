"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Handler = { id: string; name: string; role: string };

type ClientRow = {
  id: string;
  name: string;
  status: string;
  archived: boolean;
  total: number;
  completed: number;
  overdue: number;
  progress: number;
  handlers: Handler[];
};

export default function ClientsPage() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (showArchived) params.set("archived", "1");
    const res = await fetch(`/api/clients?${params.toString()}`);
    const d = await res.json();
    setRows(d.clients ?? []);
  }

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, showArchived]);

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

  async function toggleArchive(id: string, archive: boolean) {
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: archive }),
    });
    load();
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Clients</h1>
          <p className="text-sm text-muted mt-1">{rows.length} {showArchived ? "archived" : ""} clients</p>
        </div>
        <div className="flex gap-2">
          <button
            className={`btn text-xs w-full sm:w-auto ${showArchived ? "btn-primary" : ""}`}
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Show active" : "Show archived"}
          </button>
          {!showArchived && (
            <button className="btn btn-primary text-xs w-full sm:w-auto" onClick={() => setShowNew((v) => !v)}>
              {showNew ? "Cancel" : "+ New client"}
            </button>
          )}
        </div>
      </div>

      {showNew && !showArchived && (
        <form onSubmit={createClient} className="card-elevated p-5 sm:p-6 flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-ink mb-2">Client name</label>
            <input className="input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="e.g. ABC Corporation" />
          </div>
          <button type="submit" className="btn btn-primary text-sm px-5 w-full sm:w-auto">Add</button>
        </form>
      )}

      <input
        className="input w-full sm:max-w-sm"
        placeholder={showArchived ? "Search archived clients..." : "Search clients..."}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Handled by</th>
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
                <td colSpan={7} className="text-muted text-center py-10">
                  {showArchived ? "No archived clients." : "No clients found."}
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {c.handlers.length === 0 && <span className="text-2xs text-muted">—</span>}
                    {c.handlers.map((h) => (
                      <span key={h.id} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 text-2xs font-medium">
                        <span className="w-4 h-4 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[9px] font-bold shrink-0">
                          {h.name.charAt(0)}
                        </span>
                        {h.name.split(" ")[0]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="text-center font-medium">{c.total}</td>
                <td className="text-center">{c.completed}</td>
                <td className={`text-center ${c.overdue > 0 ? "text-rust font-semibold" : ""}`}>{c.overdue}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="progress-bar flex-1 w-20">
                      <div className="progress-bar-fill" style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted font-medium w-8 text-right">{c.progress}%</span>
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <Link href={`/clients/${c.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
                      View
                    </Link>
                    <button
                      onClick={() => toggleArchive(c.id, !c.archived)}
                      className={`text-xs font-medium transition-colors ${c.archived ? "text-emerald-600 hover:text-emerald-800" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      {c.archived ? "Unarchive" : "Archive"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted text-center py-10">{showArchived ? "No archived clients." : "No clients found."}</p>}
        {rows.map((c) => (
          <div key={c.id} className="card-elevated p-4">
            <div className="flex items-center justify-between mb-2">
              <Link href={`/clients/${c.id}`} className="font-medium text-sm text-ink hover:text-brand-600 transition-colors flex-1">
                {c.name}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleArchive(c.id, !c.archived)}
                  className={`text-2xs font-medium px-2 py-1 rounded transition-colors ${c.archived ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-500 bg-slate-50 hover:bg-slate-100"}`}
                >
                  {c.archived ? "Unarchive" : "Archive"}
                </button>
                <Link href={`/clients/${c.id}`}>
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              </div>
            </div>
            {c.handlers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {c.handlers.map((h) => (
                  <span key={h.id} className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 rounded-full px-2 py-0.5 text-2xs font-medium">
                    <span className="w-4 h-4 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {h.name.charAt(0)}
                    </span>
                    {h.name.split(" ")[0]}
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-ink">{c.total}</div>
                <div className="text-2xs text-muted">Tasks</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{c.completed}</div>
                <div className="text-2xs text-muted">Done</div>
              </div>
              <div>
                <div className={`text-sm font-semibold ${c.overdue > 0 ? "text-rust" : "text-ink"}`}>{c.overdue}</div>
                <div className="text-2xs text-muted">Overdue</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="progress-bar flex-1 h-2">
                <div className="progress-bar-fill h-2" style={{ width: `${c.progress}%` }} />
              </div>
              <span className="text-xs text-muted font-semibold w-8 text-right">{c.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
