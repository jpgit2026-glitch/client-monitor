"use client";

import { useEffect, useState } from "react";
import TaskRow, { TaskLike } from "../task-row";

export default function DashboardPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [connected, setConnected] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setConnected(d.connectedTasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;

  const overdue = tasks.filter((t) => t.isOverdue);
  const dueSoon = tasks.filter((t) => !t.isOverdue && t.status !== "COMPLETED" && t.status !== "CANCELLED");
  const done = tasks.filter((t) => t.status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium mb-1">My Work</h1>
        <p className="text-sm text-ink/60">{tasks.length} tasks assigned to you.</p>
      </div>

      {overdue.length > 0 && (
        <Section title={`Overdue (${overdue.length})`} accent="text-rust">
          {overdue.map((t) => (
            <TaskRow key={t.id} task={t} onChange={load} />
          ))}
        </Section>
      )}

      <Section title={`Open work (${dueSoon.length})`}>
        {dueSoon.length === 0 && <p className="text-sm text-ink/40">Nothing open — nice.</p>}
        {dueSoon.map((t) => (
          <TaskRow key={t.id} task={t} onChange={load} />
        ))}
      </Section>

      {connected.length > 0 && (
        <Section title="Related liaison / connected work">
          {connected.map((t) => (
            <TaskRow key={t.id} task={t} onChange={load} readOnly />
          ))}
        </Section>
      )}

      <Section title={`Recently completed (${done.length})`}>
        {done.slice(0, 5).map((t) => (
          <TaskRow key={t.id} task={t} onChange={load} readOnly />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  accent,
  children,
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className={`text-sm font-medium mb-2 ${accent ?? ""}`}>{title}</h2>
      <div className="card divide-y divide-rule">{children}</div>
    </div>
  );
}
