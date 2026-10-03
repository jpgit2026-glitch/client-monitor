"use client";

import { useEffect, useState, useMemo } from "react";
import TaskRow, { TaskLike } from "../task-row";
import TaskTable from "../task-table";
import ViewToggle, { ViewMode } from "../view-toggle";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review", FOR_BILLING: "For billing", FOR_FILING: "For filing", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export default function LiaisonPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [connected, setConnected] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dueDate");
  const [search, setSearch] = useState("");
  const [groupByClient, setGroupByClient] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("COMPLETED");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") return (localStorage.getItem("taskView") as ViewMode) ?? "cards";
    return "cards";
  });

  function handleViewChange(v: ViewMode) {
    setView(v);
    try { localStorage.setItem("taskView", v); } catch {}
  }

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tasks?sort=${sort}`);
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setConnected(d.connectedTasks ?? []);
    setLoading(false);
    setSelected(new Set());
  }

  useEffect(() => { load(); }, [sort]);

  function handleSelect(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  }

  async function handleBulkUpdate() {
    if (selected.size === 0) return;
    setBulkSaving(true);
    await fetch("/api/tasks/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    setBulkSaving(false);
    load();
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return tasks;
    const q = search.toLowerCase();
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.client?.name.toLowerCase().includes(q)
    );
  }, [tasks, search]);

  const clientGroups = useMemo(() => {
    const map = new Map<string, { name: string; tasks: TaskLike[] }>();
    for (const t of filtered) {
      const name = t.client?.name ?? "No client";
      if (!map.has(name)) map.set(name, { name, tasks: [] });
      map.get(name)!.tasks.push(t);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;

  const today = new Date().toDateString();
  const isToday = (t: TaskLike) => t.dueDate && new Date(t.dueDate).toDateString() === today;
  const active = (t: TaskLike) => t.status !== "COMPLETED" && t.status !== "CANCELLED";

  const cancelled = [...filtered, ...connected].filter((t) => t.status === "CANCELLED");
  const activeConnected = connected.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  const statusGroups: { title: string; list: TaskLike[]; accent?: string }[] = [
    { title: "Overdue", list: filtered.filter((t) => t.isOverdue), accent: "text-rust" },
    { title: "Due today", list: filtered.filter((t) => active(t) && !t.isOverdue && isToday(t)) },
    { title: "Upcoming", list: filtered.filter((t) => active(t) && !t.isOverdue && !isToday(t) && t.dueDate) },
    { title: "Waiting for documents", list: filtered.filter((t) => active(t) && t.status === "FOR_REVIEW") },
    { title: "Waiting for client", list: filtered.filter((t) => active(t) && t.status === "WAITING_FOR_CLIENT") },
    { title: "No due date yet", list: filtered.filter((t) => active(t) && !t.dueDate) },
    { title: "Completed", list: filtered.filter((t) => t.status === "COMPLETED").slice(0, 8) },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-ink">Liaison Board</h1>
        <select className="input text-xs py-1.5 w-full sm:w-auto" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="dueDate">Sort by deadline</option>
          <option value="priority">Sort by priority</option>
          <option value="created">Sort by newest</option>
          <option value="progress">Sort by progress</option>
        </select>
      </div>

      {/* Search & group toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            className="input w-full pl-9 py-1.5"
            placeholder="Search by task or client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setGroupByClient((v) => !v)}
          className={`btn text-xs whitespace-nowrap py-1.5 ${groupByClient ? "bg-brand-600 text-white border-brand-600 hover:bg-brand-700" : ""}`}
        >
          {groupByClient ? "Grouped by client" : "Group by client"}
        </button>
        <ViewToggle view={view} onChange={handleViewChange} />
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-16 z-40 bg-brand-600 text-white rounded-xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">{selected.size} task{selected.size > 1 ? "s" : ""} selected</span>
            <button onClick={() => setSelected(new Set())} className="text-xs text-white/70 hover:text-white underline">Clear</button>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg bg-white/20 border border-white/30 text-white text-xs px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-white/50"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k} className="text-slate-800">{v}</option>
              ))}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkSaving}
              className="bg-white text-brand-700 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-white/90 transition-colors"
            >
              {bulkSaving ? "Updating..." : "Update all"}
            </button>
          </div>
        </div>
      )}

      {groupByClient ? (
        <div className="space-y-6">
          {clientGroups.map((g) => (
            <div key={g.name}>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  <h2 className="section-title">{g.name}</h2>
                </div>
                <span className="text-2xs text-muted bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{g.tasks.length}</span>
              </div>
              {view === "table" ? (
                <TaskTable tasks={g.tasks} onChange={load} selectable selected={selected} onSelect={handleSelect} />
              ) : (
                <div className="space-y-3">
                  {g.tasks.map((t) => (
                    <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />
                  ))}
                </div>
              )}
            </div>
          ))}
          {clientGroups.length === 0 && <p className="text-sm text-muted text-center py-10">No tasks match your search.</p>}
        </div>
      ) : view === "table" ? (
        <>
          {statusGroups.map((g) =>
            g.list.length > 0 ? (
              <Section key={g.title} title={g.title} count={g.list.length} accent={g.accent}>
                <TaskTable tasks={g.list} onChange={load} selectable selected={selected} onSelect={handleSelect} />
              </Section>
            ) : null
          )}
          {activeConnected.length > 0 && !groupByClient && (
            <Section title="Related accounting work" count={activeConnected.length}>
              <TaskTable tasks={activeConnected} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {cancelled.length > 0 && (
            <Section title="Cancelled" count={cancelled.length} defaultOpen={false}>
              <TaskTable tasks={cancelled} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {search && filtered.length === 0 && <p className="text-sm text-muted text-center py-10">No tasks match &ldquo;{search}&rdquo;</p>}
        </>
      ) : (
        <>
          {statusGroups.map((g) =>
            g.list.length > 0 ? (
              <Section key={g.title} title={g.title} count={g.list.length} accent={g.accent}>
                {g.list.map((t) => (
                  <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />
                ))}
              </Section>
            ) : null
          )}
          {activeConnected.length > 0 && !groupByClient && (
            <Section title="Related accounting work" count={activeConnected.length}>
              {activeConnected.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}
          {cancelled.length > 0 && (
            <Section title="Cancelled" count={cancelled.length} defaultOpen={false}>
              {cancelled.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}
          {search && filtered.length === 0 && <p className="text-sm text-muted text-center py-10">No tasks match &ldquo;{search}&rdquo;</p>}
        </>
      )}
    </div>
  );
}

function Section({ title, count, accent, defaultOpen = true, children }: { title: string; count: number; accent?: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="cursor-pointer select-none flex items-center gap-2 mb-1.5 hover:opacity-80 transition-opacity">
        <svg className="w-3 h-3 text-slate-400 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        <h2 className={`section-title ${accent ?? ""}`}>{title}</h2>
        <span className="text-2xs text-muted bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{count}</span>
      </summary>
      <div className="space-y-2">{children}</div>
    </details>
  );
}
