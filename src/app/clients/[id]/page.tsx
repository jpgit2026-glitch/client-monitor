"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskRow, { TaskLike } from "../../task-row";

type Summary = { total: number; completed: number; inProgress: number; pending: number; overdue: number };

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<{ name: string; status: string } | null>(null);
  const [overallProgress, setOverallProgress] = useState(0);
  const [accounting, setAccounting] = useState<Summary | null>(null);
  const [liaison, setLiaison] = useState<Summary | null>(null);
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <p className="text-sm text-muted py-12 text-center">Loading...</p>;
  if (!client) return <p className="text-sm text-muted py-12 text-center">Client not found.</p>;

  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-ink transition-colors mb-3">
          &larr; Back
        </button>
        <h1 className="text-xl font-semibold">{client.name}</h1>
        <p className="text-sm text-muted mt-0.5">Overall progress</p>
        <div className="mt-2 flex items-center gap-3 max-w-md">
          <div className="progress-bar flex-1 h-2">
            <div className="progress-bar-fill h-2" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-sm font-medium text-muted">{overallProgress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard title="Accounting" summary={accounting} />
        <SummaryCard title="Liaison" summary={liaison} />
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="section-title">Active work</h2>
          <span className="text-xs text-muted bg-ink/5 rounded-full px-2 py-0.5">{active.length}</span>
        </div>
        <div className="card divide-y divide-rule/50">
          {active.length === 0 && <p className="p-5 text-sm text-muted">No active work for this client.</p>}
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
    <div className="card p-5">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      <dl className="grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-muted">Tasks</dt>
        <dd className="text-right font-medium">{summary.total}</dd>
        <dt className="text-muted">Completed</dt>
        <dd className="text-right font-medium">{summary.completed}</dd>
        <dt className="text-muted">In progress</dt>
        <dd className="text-right font-medium">{summary.inProgress}</dd>
        <dt className="text-muted">Pending</dt>
        <dd className="text-right font-medium">{summary.pending}</dd>
        <dt className="text-muted">Overdue</dt>
        <dd className={`text-right font-medium ${summary.overdue > 0 ? "text-rust" : ""}`}>{summary.overdue}</dd>
      </dl>
    </div>
  );
}
