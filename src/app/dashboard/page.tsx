"use client";

import { useEffect, useState } from "react";
import TaskRow, { TaskLike } from "../task-row";

type Employee = { id: string; name: string; role: string };
type Client = { id: string; name: string };

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [connected, setConnected] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dueDate");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tasks?sort=${sort}`);
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setConnected(d.connectedTasks ?? []);
    setLoading(false);
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

  useEffect(() => { load(); }, [sort]);

  function handleOpenAssignForm() {
    if (employees.length === 0) loadFormData();
    setShowAssignForm(true);
  }

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading your work...</p>;

  const overdue = tasks.filter((t) => t.isOverdue);
  const open = tasks.filter((t) => !t.isOverdue && t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">My Work</h1>
          <p className="text-sm text-muted mt-1">{tasks.length} tasks assigned to you</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="input text-xs py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="dueDate">Sort by deadline</option>
            <option value="priority">Sort by priority</option>
            <option value="created">Sort by newest</option>
            <option value="progress">Sort by progress</option>
          </select>
          <button onClick={handleOpenAssignForm} className="btn btn-primary text-xs">
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

      {overdue.length > 0 && (
        <Section title="Overdue" count={overdue.length} accent="text-rust">
          {overdue.map((t) => <TaskRow key={t.id} task={t} onChange={load} />)}
        </Section>
      )}

      <Section title="Open work" count={open.length}>
        {open.length === 0 && <p className="text-sm text-muted p-6">All clear — no open tasks.</p>}
        {open.map((t) => <TaskRow key={t.id} task={t} onChange={load} />)}
      </Section>

      {connected.length > 0 && (
        <Section title="Connected work" count={connected.length}>
          {connected.map((t) => <TaskRow key={t.id} task={t} onChange={load} readOnly />)}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Completed" count={done.length}>
          {done.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onChange={load} readOnly />)}
        </Section>
      )}
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
  const [assignedToId, setAssignedToId] = useState("");
  const [workRole, setWorkRole] = useState<"ACCOUNTING" | "LIAISON">("ACCOUNTING");
  const [priority, setPriority] = useState("NORMAL");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
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
        title: title.trim(), clientId, assignedToId: assignedToId || null,
        workRole, priority, dueDate: dueDate || null, notes: notes.trim() || null,
      }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to create task."); setSaving(false); return; }
    setSaving(false);
    onCreated();
  }

  return (
    <div className="card-elevated p-7">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-ink">Assign a new task</h2>
        <button onClick={onClose} className="btn btn-ghost text-xs px-2 py-1">Close</button>
      </div>
      {error && (
        <div className="rounded-lg bg-rust/8 border border-rust/15 px-4 py-3 mb-5">
          <p className="text-sm text-rust font-medium">{error}</p>
        </div>
      )}
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-2">Task title</label>
          <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. File BIR Form 2307" />
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Client</label>
          <select className="input w-full" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Assign to</label>
          <select className="input w-full" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink mb-2">Work role</label>
          <select className="input w-full" value={workRole} onChange={(e) => setWorkRole(e.target.value as any)}>
            <option value="ACCOUNTING">Accounting</option>
            <option value="LIAISON">Liaison</option>
          </select>
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
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-ink mb-2">Notes for the assignee</label>
          <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instructions or context..." />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn btn-primary text-sm px-6">
            {saving ? "Creating..." : "Create & assign"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, count, accent, children }: { title: string; count: number; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className={`section-title ${accent ?? ""}`}>{title}</h2>
        <span className="text-2xs text-muted bg-green-100/60 rounded-full px-2.5 py-0.5 font-semibold">{count}</span>
      </div>
      <div className="card divide-y divide-rule/40">{children}</div>
    </div>
  );
}
