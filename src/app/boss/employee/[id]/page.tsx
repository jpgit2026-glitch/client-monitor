"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskRow, { TaskLike } from "../../../task-row";

export default function EmployeeDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
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

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <p className="text-sm text-muted py-12 text-center">Loading...</p>;
  if (!employee) return <p className="text-sm text-muted py-12 text-center">Employee not found.</p>;

  const groups: { title: string; list: TaskLike[]; accent?: string }[] = [
    { title: "Overdue", list: tasks.filter((t) => t.isOverdue), accent: "text-rust" },
    { title: "In progress", list: tasks.filter((t) => t.status === "IN_PROGRESS" && !t.isOverdue) },
    { title: "Pending", list: tasks.filter((t) => t.status === "PENDING" && !t.isOverdue) },
    { title: "Waiting / for review", list: tasks.filter((t) => ["WAITING_FOR_CLIENT", "FOR_REVIEW"].includes(t.status) && !t.isOverdue) },
    { title: "Completed", list: tasks.filter((t) => t.status === "COMPLETED") },
  ];

  return (
    <div className="space-y-8">
      <div>
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-ink transition-colors mb-3">
          &larr; Back
        </button>
        <h1 className="text-xl font-semibold">{employee.name}</h1>
        <p className="text-sm text-muted mt-0.5">
          <span className="tag bg-ink/5 text-ink/60 text-[10px]">{employee.role.charAt(0) + employee.role.slice(1).toLowerCase()}</span>
          <span className="ml-2">{tasks.length} tasks total</span>
        </p>
      </div>

      {groups.map((g) =>
        g.list.length > 0 ? (
          <div key={g.title}>
            <div className="flex items-center gap-2 mb-2">
              <h2 className={`section-title ${g.accent ?? ""}`}>{g.title}</h2>
              <span className="text-xs text-muted bg-ink/5 rounded-full px-2 py-0.5">{g.list.length}</span>
            </div>
            <div className="card divide-y divide-rule/50">
              {g.list.map((t) => (
                <TaskRow key={t.id} task={t} onChange={load} readOnly />
              ))}
            </div>
          </div>
        ) : null
      )}

      {tasks.length === 0 && <p className="text-sm text-muted">No tasks assigned yet.</p>}
    </div>
  );
}
