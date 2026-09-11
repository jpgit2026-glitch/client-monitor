"use client";

import { useEffect, useState } from "react";
import TaskRow, { TaskLike } from "../../task-row";

type Summary = { total: number; completed: number; inProgress: number; pending: number; overdue: number };

export default function ClientDetailPage({ params }: { params: { id: string } }) {
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

  useEffect(() => {
    load();
  }, [params.id]);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (!client) return <p className="text-sm text-ink/50">Client not found.</p>;

  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium">{client.name}</h1>
        <p className="text-sm text-ink/60">
          Overall client work progress: <span className="font-mono">{overallProgress}%</span>
        </p>
        <div className="mt-2 h-1.5 bg-rule w-full max-w-md">
          <div className="h-1.5 bg-ledger-600" style={{ width: `${overallProgress}%` }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SummaryCard title="Accounting" summary={accounting} />
        <SummaryCard title="Liaison" summary={liaison} />
      </div>

      <div>
        <h2 className="text-sm font-medium mb-2">All active work ({active.length})</h2>
        <div className="card divide-y divide-rule">
          {active.length === 0 && <p className="p-4 text-sm text-ink/40">No active work for this client.</p>}
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
    <div className="card p-4">
      <h3 className="text-sm font-medium mb-3">{title}</h3>
      <dl className="grid grid-cols-2 gap-y-1 text-sm">
        <dt className="text-ink/50">Tasks</dt>
        <dd className="font-mono text-right">{summary.total}</dd>
        <dt className="text-ink/50">Completed</dt>
        <dd className="font-mono text-right">{summary.completed}</dd>
        <dt className="text-ink/50">In progress</dt>
        <dd className="font-mono text-right">{summary.inProgress}</dd>
        <dt className="text-ink/50">Pending</dt>
        <dd className="font-mono text-right">{summary.pending}</dd>
        <dt className="text-ink/50">Overdue</dt>
        <dd className={`font-mono text-right ${summary.overdue > 0 ? "text-rust" : ""}`}>{summary.overdue}</dd>
      </dl>
    </div>
  );
}
