"use client";

import { useEffect, useState } from "react";
import TaskRow, { TaskLike } from "../task-row";

export default function LiaisonPage() {
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [connected, setConnected] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("dueDate");

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/tasks?sort=${sort}`);
    const d = await res.json();
    setTasks(d.tasks ?? []);
    setConnected(d.connectedTasks ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [sort]);

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;

  const today = new Date().toDateString();
  const isToday = (t: TaskLike) => t.dueDate && new Date(t.dueDate).toDateString() === today;
  const active = (t: TaskLike) => t.status !== "COMPLETED" && t.status !== "CANCELLED";

  const groups: { title: string; list: TaskLike[]; accent?: string }[] = [
    { title: "Overdue", list: tasks.filter((t) => t.isOverdue), accent: "text-rust" },
    { title: "Due today", list: tasks.filter((t) => active(t) && !t.isOverdue && isToday(t)) },
    { title: "Upcoming", list: tasks.filter((t) => active(t) && !t.isOverdue && !isToday(t) && t.dueDate) },
    { title: "Waiting for documents", list: tasks.filter((t) => active(t) && t.status === "FOR_REVIEW") },
    { title: "Waiting for client", list: tasks.filter((t) => active(t) && t.status === "WAITING_FOR_CLIENT") },
    { title: "No due date yet", list: tasks.filter((t) => active(t) && !t.dueDate) },
    { title: "Completed", list: tasks.filter((t) => t.status === "COMPLETED").slice(0, 8) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Liaison Board</h1>
          <p className="text-sm text-muted mt-1">Government filings and client errands</p>
        </div>
        <select className="input text-xs py-2" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="dueDate">Sort by deadline</option>
          <option value="priority">Sort by priority</option>
          <option value="created">Sort by newest</option>
          <option value="progress">Sort by progress</option>
        </select>
      </div>

      {groups.map((g) =>
        g.list.length > 0 ? (
          <div key={g.title}>
            <div className="flex items-center gap-2.5 mb-3">
              <h2 className={`section-title ${g.accent ?? ""}`}>{g.title}</h2>
              <span className="text-2xs text-muted bg-green-100/60 rounded-full px-2.5 py-0.5 font-semibold">{g.list.length}</span>
            </div>
            <div className="card divide-y divide-rule/40">
              {g.list.map((t) => (
                <TaskRow key={t.id} task={t} onChange={load} readOnly={t.status === "COMPLETED"} />
              ))}
            </div>
          </div>
        ) : null
      )}

      {connected.length > 0 && (
        <div>
          <div className="flex items-center gap-2.5 mb-3">
            <h2 className="section-title">Related accounting work</h2>
            <span className="text-2xs text-muted bg-green-100/60 rounded-full px-2.5 py-0.5 font-semibold">{connected.length}</span>
          </div>
          <div className="card divide-y divide-rule/40">
            {connected.map((t) => <TaskRow key={t.id} task={t} readOnly />)}
          </div>
        </div>
      )}
    </div>
  );
}
