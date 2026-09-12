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

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;
  if (!employee) return <p className="text-sm text-muted py-16 text-center">Employee not found.</p>;

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "COMPLETED").length;
  const overdue = tasks.filter((t) => t.isOverdue).length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const avgProgress = total > 0 ? Math.round(tasks.reduce((s, t) => s + t.progressPct, 0) / total) : 0;

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
        <button onClick={() => router.back()} className="text-sm text-muted hover:text-brand-700 transition-colors mb-4">
          &larr; Back to team
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-lg font-bold">
            {employee.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink">{employee.name}</h1>
            <span className="tag bg-brand-50 text-brand-700 mt-0.5">{employee.role.charAt(0) + employee.role.slice(1).toLowerCase()}</span>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard value={total} label="Total tasks" />
        <StatCard value={done} label="Completed" />
        <StatCard value={inProgress} label="In progress" />
        <StatCard value={overdue} label="Overdue" highlight={overdue > 0} />
        <div className="card-elevated p-4 flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="progress-bar w-16 h-2">
              <div className="progress-bar-fill h-2" style={{ width: `${avgProgress}%` }} />
            </div>
            <span className="text-lg font-bold text-brand-600">{avgProgress}%</span>
          </div>
          <div className="stat-label mt-1">Avg progress</div>
        </div>
      </div>

      {/* Task groups — Boss can update inline */}
      {groups.map((g) =>
        g.list.length > 0 ? (
          <div key={g.title}>
            <div className="flex items-center gap-2.5 mb-3">
              <h2 className={`section-title ${g.accent ?? ""}`}>{g.title}</h2>
              <span className="text-2xs text-muted bg-slate-100 rounded-full px-2.5 py-0.5 font-semibold">{g.list.length}</span>
            </div>
            <div className="space-y-3">
              {g.list.map((t) => (
                <TaskRow key={t.id} task={t} onChange={load} showNotes />
              ))}
            </div>
          </div>
        ) : null
      )}

      {tasks.length === 0 && <p className="text-sm text-muted">No tasks assigned yet.</p>}
    </div>
  );
}

function StatCard({ value, label, highlight = false }: { value: number; label: string; highlight?: boolean }) {
  return (
    <div className="card-elevated p-4 text-center">
      <div className={`stat-value ${highlight ? "text-rust" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
