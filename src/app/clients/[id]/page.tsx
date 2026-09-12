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

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;
  if (!client) return <p className="text-sm text-muted py-16 text-center">Client not found.</p>;

  const active = tasks.filter((t) => t.status !== "COMPLETED" && t.status !== "CANCELLED");

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-green-700 transition-colors mb-4">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-ink">{client.name}</h1>
        <p className="text-sm text-muted mt-1">Overall progress</p>
        <div className="mt-3 flex items-center gap-3 max-w-md">
          <div className="progress-bar flex-1 h-2.5">
            <div className="progress-bar-fill h-2.5" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-sm font-semibold text-green-700">{overallProgress}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <SummaryCard title="Accounting" summary={accounting} />
        <SummaryCard title="Liaison" summary={liaison} />
      </div>

      <div>
        <div className="flex items-center gap-2.5 mb-3">
          <h2 className="section-title">Active work</h2>
          <span className="text-2xs text-muted bg-green-100/60 rounded-full px-2.5 py-0.5 font-semibold">{active.length}</span>
        </div>
        <div className="card divide-y divide-rule/40">
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
    <div className="card-elevated p-6">
      <h3 className="font-bold text-ink mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        <StatBlock value={summary.total} label="Total" />
        <StatBlock value={summary.completed} label="Done" />
        <StatBlock value={summary.inProgress} label="In progress" />
        <StatBlock value={summary.pending} label="Pending" />
      </div>
      {summary.overdue > 0 && (
        <div className="mt-4 pt-3 border-t border-rule/40 flex items-center justify-between">
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
