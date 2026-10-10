"use client";

import { useEffect, useState, useMemo } from "react";
import TaskRow, { TaskLike } from "../task-row";
import TaskTable from "../task-table";
import ViewToggle, { ViewMode } from "../view-toggle";
import EmployeeMultiSelect from "../employee-multi-select";

type Employee = { id: string; name: string; role: string };
type Client = { id: string; name: string };

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review", FOR_BILLING: "For billing", FOR_FILING: "For filing", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [connected, setConnected] = useState<TaskLike[]>([]);
  const [mentions, setMentions] = useState<{ commentId: string; message: string; createdAt: string; by: { id: string; name: string }; taskId: string; taskTitle: string; clientName?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dueDate");
  const [search, setSearch] = useState("");
  const [groupByClient, setGroupByClient] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
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

  const [me, setMe] = useState<{ id: string } | null>(null);

  async function load() {
    setLoading(true);
    const [res, meRes] = await Promise.all([
      fetch(`/api/tasks?sort=${sort}`),
      me ? Promise.resolve(null) : fetch("/api/auth/me"),
    ]);
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setConnected(d.connectedTasks ?? []);
    setMentions(d.unreadMentions ?? []);
    if (meRes) {
      const meData = await meRes.json();
      if (meData.sub) setMe({ id: meData.sub });
    }
    setLoading(false);
    setSelected(new Set());
  }

  async function loadFormData() {
    const [empRes, clientRes] = await Promise.all([
      fetch("/api/employees?all=1"),
      fetch("/api/clients"),
    ]);
    const { employees: emps } = await empRes.json();
    const { clients: cls } = await clientRes.json();
    setEmployees(emps ?? []);
    setClients(cls ?? []);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => { load(); }, 30000);
    return () => clearInterval(interval);
  }, [sort]);

  function handleOpenAssignForm() {
    if (employees.length === 0) loadFormData();
    setShowAssignForm(true);
  }

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

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading your work...</p>;

  const now = new Date();
  const todayStr = now.toDateString();
  const stats = {
    overdue: tasks.filter((t) => t.isOverdue).length,
    dueToday: tasks.filter((t) => t.dueDate && new Date(t.dueDate).toDateString() === todayStr && t.status !== "COMPLETED" && t.status !== "CANCELLED" && !t.isOverdue).length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  };

  const myTurnIds = new Set(
    [...filtered, ...connected]
      .filter((t) => me && t.currentHandler?.id === me.id && t.status !== "COMPLETED" && t.status !== "CANCELLED")
      .map((t) => t.id)
  );
  const overdue = filtered.filter((t) => t.isOverdue && !myTurnIds.has(t.id));
  const open = filtered.filter((t) => !t.isOverdue && t.status !== "COMPLETED" && t.status !== "CANCELLED" && !myTurnIds.has(t.id));
  const done = filtered.filter((t) => t.status === "COMPLETED");
  const cancelled = [...filtered, ...connected].filter((t) => t.status === "CANCELLED");
  const activeConnected = connected.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED" && !myTurnIds.has(t.id));

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg sm:text-xl font-bold text-ink">My Work</h1>
          <div className="flex items-center gap-3 text-xs text-muted">
            {stats.overdue > 0 && <span className="text-rust font-semibold">{stats.overdue} overdue</span>}
            {stats.dueToday > 0 && <span className="text-amber-600 font-semibold">{stats.dueToday} due today</span>}
            <span>{stats.inProgress} in progress</span>
            <span>{stats.completed} done</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select className="input text-xs py-1.5 flex-1 sm:flex-none" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="dueDate">Sort by deadline</option>
            <option value="priority">Sort by priority</option>
            <option value="created">Sort by newest</option>
            <option value="progress">Sort by progress</option>
          </select>
          <button onClick={handleOpenAssignForm} className="btn btn-primary text-xs whitespace-nowrap py-1.5">
            + Assign task
          </button>
        </div>
      </div>

      {showAssignForm && (
        <AssignTaskForm
          employees={employees}
          clients={clients}
          onClose={() => setShowAssignForm(false)}
          onCreated={() => { setShowAssignForm(false); load(); }}
        />
      )}

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

      {/* Your turn — tasks currently with you */}
      {(() => {
        const myTurn = [...filtered, ...connected].filter((t) => myTurnIds.has(t.id));
        if (myTurn.length === 0) return null;
        return view === "table" ? (
          <Section title="Your turn" count={myTurn.length} accent="text-brand-600">
            <TaskTable tasks={myTurn} onChange={load} selectable selected={selected} onSelect={handleSelect} />
          </Section>
        ) : (
          <Section title="Your turn" count={myTurn.length} accent="text-brand-600">
            {myTurn.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
          </Section>
        );
      })()}

      {/* Mentioned you */}
      {mentions.length > 0 && (
        <Section title="Mentioned you" count={mentions.length} accent="text-purple-600">
          <div className="divide-y divide-slate-100">
            {mentions.map((m) => (
              <div key={m.commentId} className="px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {m.by.name.charAt(0)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-ink">{m.by.name}</span>
                      <span>mentioned you in</span>
                      <span className="font-medium text-brand-600">{m.taskTitle}</span>
                      {m.clientName && <span className="text-slate-400">({m.clientName})</span>}
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 line-clamp-2">{m.message}</p>
                    <span className="text-[10px] text-muted mt-1 block">{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {groupByClient ? (
        <GroupedByClientView tasks={filtered} onChange={load} selectable selected={selected} onSelect={handleSelect} view={view} />
      ) : view === "table" ? (
        <>
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} accent="text-rust">
              <TaskTable tasks={overdue} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {open.length > 0 && (
            <Section title="Open work" count={open.length}>
              <TaskTable tasks={open} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {activeConnected.length > 0 && (
            <Section title="Connected work" count={activeConnected.length}>
              <TaskTable tasks={activeConnected} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {done.length > 0 && (
            <Section title="Completed" count={done.length}>
              <TaskTable tasks={done.slice(0, 5)} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
          {cancelled.length > 0 && (
            <Section title="Cancelled" count={cancelled.length} defaultOpen={false}>
              <TaskTable tasks={cancelled} onChange={load} selectable selected={selected} onSelect={handleSelect} />
            </Section>
          )}
        </>
      ) : (
        <>
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} accent="text-rust">
              {overdue.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}

          {open.length > 0 && (
            <Section title="Open work" count={open.length}>
              {open.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}

          {activeConnected.length > 0 && (
            <Section title="Connected work" count={activeConnected.length}>
              {activeConnected.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}

          {done.length > 0 && (
            <Section title="Completed" count={done.length}>
              {done.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}
          {cancelled.length > 0 && (
            <Section title="Cancelled" count={cancelled.length} defaultOpen={false}>
              {cancelled.map((t) => <TaskRow key={t.id} task={t} onChange={load} selectable selected={selected.has(t.id)} onSelect={handleSelect} />)}
            </Section>
          )}
        </>
      )}

      {search && filtered.length === 0 && (
        <p className="text-sm text-muted text-center py-10">No tasks match &ldquo;{search}&rdquo;</p>
      )}
    </div>
  );
}

function GroupedByClientView({ tasks, onChange, selectable, selected, onSelect, view = "cards" }: { tasks: TaskLike[]; onChange: () => void; selectable?: boolean; selected?: Set<string>; onSelect?: (id: string, checked: boolean) => void; view?: ViewMode }) {
  const groups = useMemo(() => {
    const map = new Map<string, { name: string; tasks: TaskLike[] }>();
    for (const t of tasks) {
      const name = t.client?.name ?? "No client";
      if (!map.has(name)) map.set(name, { name, tasks: [] });
      map.get(name)!.tasks.push(t);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  if (groups.length === 0) return null;

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <div key={g.name}>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              <h2 className="section-title">{g.name}</h2>
            </div>
            <span className="text-2xs text-muted bg-slate-100 rounded-full px-2 py-0.5 font-semibold">{g.tasks.length}</span>
          </div>
          {view === "table" ? (
            <TaskTable tasks={g.tasks} onChange={onChange} selectable={selectable} selected={selected} onSelect={onSelect} />
          ) : (
            <div className="space-y-3">
              {g.tasks.map((t) => (
                <TaskRow key={t.id} task={t} onChange={onChange} readOnly={t.status === "COMPLETED"} selectable={selectable} selected={selected?.has(t.id)} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AssignTaskForm({
  employees, clients, onClose, onCreated,
}: {
  employees: Employee[];
  clients: Client[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [filePath, setFilePath] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !clientId) { setError("Title and client are required."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(), clientId, assignedToIds: Array.from(selectedAssignees),
        priority, dueDate: dueDate || null, notes: notes.trim() || null,
        filePath: filePath.trim() || null,
      }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to create task."); setSaving(false); return; }
    setSaving(false);
    onCreated();
  }

  return (
    <div className="card-elevated p-5 sm:p-7">
      <div className="flex items-center justify-between mb-5 sm:mb-6">
        <h2 className="text-base sm:text-lg font-bold text-ink">Assign a new task</h2>
        <button onClick={onClose} className="btn btn-ghost text-xs px-2 py-1">Close</button>
      </div>
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-5">
          <p className="text-sm text-rust font-medium">{error}</p>
        </div>
      )}
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-2">Task title <span className="text-rust">*</span></label>
          <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. File BIR Form 2307" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Client <span className="text-rust">*</span></label>
          <select className="input w-full" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Assign to</label>
          <EmployeeMultiSelect employees={employees} selected={selectedAssignees} onChange={setSelectedAssignees} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Priority</label>
          <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Due date</label>
          <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">File location</label>
          <input className="input w-full" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="e.g. D:\Clients\ABC\BIR 2307.xlsx" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-2">Notes for the assignee</label>
          <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions or context..." />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn btn-primary text-sm px-6 w-full sm:w-auto">
            {saving ? "Creating..." : "Create & assign"}
          </button>
        </div>
      </form>
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
