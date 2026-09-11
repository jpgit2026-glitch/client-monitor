"use client";

import { useEffect, useState } from "react";
import TaskRow, { TaskLike } from "../../../task-row";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const [employee, setEmployee] = useState<{ name: string; role: string } | null>(null);
  const [tasks, setTasks] = useState<TaskLike[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/employees/${params.id}`);
    const d = await res.json();
    setEmployee(d.employee ?? null);
    setTasks(d.tasks ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  if (loading) return <p className="text-sm text-ink/50">Loading…</p>;
  if (!employee) return <p className="text-sm text-ink/50">Employee not found.</p>;

  const groups: Record<string, TaskLike[]> = {
    Overdue: tasks.filter((t) => t.isOverdue),
    "In progress": tasks.filter((t) => t.status === "IN_PROGRESS" && !t.isOverdue),
    Pending: tasks.filter((t) => t.status === "PENDING" && !t.isOverdue),
    "Waiting / for review": tasks.filter((t) =>
      ["WAITING_FOR_CLIENT", "FOR_REVIEW"].includes(t.status) && !t.isOverdue
    ),
    Completed: tasks.filter((t) => t.status === "COMPLETED"),
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-medium">{employee.name}</h1>
        <p className="text-sm text-ink/60 font-mono">{employee.role}</p>
      </div>

      {Object.entries(groups).map(
        ([label, list]) =>
          list.length > 0 && (
            <div key={label}>
              <h2 className="text-sm font-medium mb-2">
                {label} ({list.length})
              </h2>
              <div className="card divide-y divide-rule">
                {list.map((t) => (
                  <TaskRow key={t.id} task={t} onChange={load} readOnly />
                ))}
              </div>
            </div>
          )
      )}
    </div>
  );
}
