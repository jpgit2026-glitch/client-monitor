"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskRow, { TaskLike } from "../../task-row";

type Summary = { total: number; completed: number; inProgress: number; pending: number; overdue: number };
type Handler = { id: string; name: string; role: string };

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<{ name: string; status: string; handlers: Handler[] } | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [accounting, setAccounting] = useState<Summary | null>(null);
  const [liaison, setLiaison] = useState<Summary | null>(null);
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Handler[]>([]);
  const [showAddHandler, setShowAddHandler] = useState(false);
  const [session, setSession] = useState<{ role: string } | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/clients/${params.id}`);
    const d = await res.json();
    setClient(d.client ?? null);
    setOverallProgress(d.overallProgress ?? 0);
    setAccounting(d.accounting ?? null);
    setLiaison(d.liaison ?? null);
    setTasks(d.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    fetch("/api/auth/me").then((r) => r.json()).then((d) => setSession(d)).catch(() => {});
  }, [params.id]);

  async function loadEmployees() {
    const res = await fetch("/api/employees?all=1");
    const d = await res.json();
    setEmployees(d.employees ?? []);
  }

  async function addHandler(employeeId: string) {
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ addHandler: employeeId }),
    });
    load();
    setShowAddHandler(false);
  }

  async function removeHandler(employeeId: string) {
    await fetch(`/api/clients/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removeHandler: employeeId }),
    });
    load();
  }

  function handleShowAdd() {
    if (!showAddHandler) loadEmployees();
    setShowAddHandler((v) => !v);
  }

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;
  if (!client) return <p className="text-sm text-muted py-16 text-center">Client not found.</p>;

  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const isManager = session && ["DIRECTOR", "ADMIN"].includes(session.role);
  const handlerIds = new Set(client.handlers.map((h) => h.id));
  const availableEmployees = employees.filter((e) => !handlerIds.has(e.id));

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-brand-700 transition-colors mb-4">
          &larr; Back
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-ink">{client.name}</h1>
        <p className="text-sm text-muted mt-1">Overall progress</p>
        <div className="mt-3 flex items-center gap-3 max-w-md">
          <div className="progress-bar flex-1 h-2.5">
            <div className="progress-bar-fill h-2.5" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-sm font-semibold text-brand-600">{overallProgress}%</span>
        </div>
      </div>

      {/* Handled by */}
      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <h2 className="section-title">Handled by</h2>
          <span className="text-2xs text-muted bg-slate-100 rounded-full px-2.5 py-0.5 font-semibold">{client.handlers.length}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {client.handlers.length === 0 && (
            <span className="text-sm text-muted">No handlers assigned yet.</span>
          )}
          {client.handlers.map((h) => (
            <span key={h.id} className="inline-flex items-center gap-1.5 bg-brand-50 text-brand-700 rounded-full px-3 py-1.5 text-xs font-medium">
              <span className="w-5 h-5 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[10px] font-bold shrink-0">
                {h.name.charAt(0)}
              </span>
              {h.name}
              <span className="text-brand-400 text-[10px]">({h.role.charAt(0) + h.role.slice(1).toLowerCase()})</span>
              {isManager && (
                <button
                  onClick={() => removeHandler(h.id)}
                  className="ml-0.5 text-brand-400 hover:text-red-500 transition-colors"
                  title="Remove handler"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </span>
          ))}
          {isManager && (
            <button
              onClick={handleShowAdd}
              className="inline-flex items-center gap-1 text-xs text-muted hover:text-brand-600 border border-dashed border-slate-300 hover:border-brand-400 rounded-full px-3 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              Add
            </button>
          )}
        </div>

        {showAddHandler && (
          <div className="mt-3 card-elevated p-4 max-w-sm">
            <p className="text-sm font-medium text-ink mb-2">Select employee</p>
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-muted">All employees are already assigned.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {availableEmployees.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => addHandler(e.id)}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {e.name.charAt(0)}
                    </span>
                    <span className="text-sm text-ink">{e.name}</span>
                    <span className="text-2xs text-muted ml-auto">{e.role.charAt(0) + e.role.slice(1).toLowerCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
        <SummaryCard title="Accounting" summary={accounting} />
        <SummaryCard title="Liaison" summary={liaison} />
      </div>

      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <h2 className="section-title">Active work</h2>
          <span className="text-2xs text-muted bg-slate-100 rounded-full px-2.5 py-0.5 font-semibold">{active.length}</span>
        </div>
        <div className="space-y-3">
          {active.length === 0 && <p className="p-6 text-sm text-muted">No active work for this client.</p>}
          {active.map((t) => (
            <TaskRow key={t.id} task={t} onChange={load} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, summary }: { title: string; summary: Summary | null }) {
  if (!summary) return null;
  return (
    <div className="card-elevated p-4 sm:p-6">
      <h3 className="font-bold text-ink mb-3 sm:mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatBlock value={summary.total} label="Total" />
        <StatBlock value={summary.completed} label="Done" />
        <StatBlock value={summary.inProgress} label="In progress" />
        <StatBlock value={summary.pending} label="Pending" />
      </div>
      {summary.overdue > 0 && (
        <div className="mt-3 sm:mt-4 pt-3 border-t border-rule/40 flex items-center justify-between">
          <span className="text-sm text-muted">Overdue</span>
          <span className="text-sm font-bold text-rust">{summary.overdue}</span>
        </div>
      )}
    </div>
  );
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
