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

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;

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
    { title: "Recently completed", list: tasks.filter((t) => t.status === "COMPLETED").slice(0, 8) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">My Assigned Work</h1>
          <p className="text-sm text-ink/60">Government-office follow-ups and client errands.</p>
        </div>
        <select className="input text-xs" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="dueDate">Sort: Deadline</option>
          <option value="priority">Sort: Priority</option>
          <option value="created">Sort: Newest</option>
          <option value="progress">Sort: Progress</option>
        </select>
      </div>

      {groups.map(
        (g) =>
          g.list.length > 0 && (
            <div key={g.title}>
              <h2 className={`text-sm font-medium mb-2 ${g.accent ?? ""}`}>
                {g.title} ({g.list.length})
              </h2>
              <div className="card divide-y divide-rule">
                {g.list.map((t) => (
                  <TaskRow key={t.id} task={t} onChange={load} readOnly={t.status === "COMPLETED"} />
                ))}
              </div>
            </div>
          )
      )}

      {connected.length > 0 && (
        <div>
          <h2 className="text-sm font-medium mb-2">Related accounting work</h2>
          <div className="card divide-y divide-rule">
            {connected.map((t) => (
              <TaskRow key={t.id} task={t} readOnly />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
