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

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;

  const overdue = tasks.filter((t) => t.isOverdue);
  const open = tasks.filter((t) => !t.isOverdue && t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium mb-1">My Work</h1>
          <p className="text-sm text-ink/60">{tasks.length} tasks assigned to you.</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="dueDate">Sort: Deadline</option>
            <option value="priority">Sort: Priority</option>
            <option value="created">Sort: Newest</option>
            <option value="progress">Sort: Progress</option>
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
        <Section title={`Overdue (${overdue.length})`} accent="text-rust">
          {overdue.map((t) => <TaskRow key={t.id} task={t} onChange={load} />)}
        </Section>
      )}

      <Section title={`Open work (${open.length})`}>
        {open.length === 0 && <p className="text-sm text-ink/40 p-4">Nothing open — nice.</p>}
        {open.map((t) => <TaskRow key={t.id} task={t} onChange={load} />)}
      </Section>

      {connected.length > 0 && (
        <Section title={`Connected work (${connected.length})`}>
          {connected.map((t) => <TaskRow key={t.id} task={t} onChange={load} readOnly />)}
        </Section>
      )}

      <Section title={`Recently completed (${done.length})`}>
        {done.slice(0, 5).map((t) => <TaskRow key={t.id} task={t} onChange={load} readOnly />)}
      </Section>
    </div>
  );
}

function AssignTaskForm({
  employees,
  clients,
  onClose,
  onCreated,
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
    if (!title.trim() || !clientId) {
      setError("Title and client are required.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        clientId,
        assignedToId: assignedToId || null,
        workRole,
        priority,
        dueDate: dueDate || null,
        notes: notes.trim() || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Failed to create task.");
      setSaving(false);
      return;
    }
    setSaving(false);
    onCreated();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Assign a new task</h2>
        <button onClick={onClose} className="text-xs text-ink/40 hover:text-ink">&times; Close</button>
      </div>
      {error && <p className="text-xs text-rust mb-3">{error}</p>}
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink/60 mb-1">Task title</label>
          <input className="input w-full" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. File BIR Form 2307" />
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Client</label>
          <select className="input w-full" value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Select client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Assign to</label>
          <select className="input w-full" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
            <option value="">Unassigned</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Work role</label>
          <select className="input w-full" value={workRole} onChange={(e) => setWorkRole(e.target.value as any)}>
            <option value="ACCOUNTING">Accounting</option>
            <option value="LIAISON">Liaison</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Priority</label>
          <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink/60 mb-1">Due date</label>
          <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink/60 mb-1">Notes / instructions for the assignee</label>
          <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Explain what needs to be done and any context..." />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn btn-primary text-xs">
            {saving ? "Creating..." : "Create & assign task"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, accent, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className={`text-sm font-medium mb-2 ${accent ?? ""}`}>{title}</h2>
      <div className="card divide-y divide-rule">{children}</div>
    </div>
  );
}
