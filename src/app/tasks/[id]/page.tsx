"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; role: string };
type Comment = { id: string; message: string; createdAt: string; employee: Employee };
type ActivityEntry = { id: string; action: string; createdAt: string; employee: { name: string } };

type TaskDetail = {
  id: string;
  title: string;
  status: string;
  priority: string;
  progressPct: number;
  workRole: string;
  dueDate: string | null;
  notes: string | null;
  followUpDate: string | null;
  result: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  client: { name: string };
  assignedTo: Employee | null;
  createdBy: Employee | null;
  dependsOn: { title: string; status: string } | null;
  comments: Comment[];
  activityLogs: ActivityEntry[];
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "COMPLETED", "CANCELLED"];
const PRIORITY_OPTIONS = ["URGENT", "HIGH", "NORMAL", "LOW"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-ink/5 text-ink/60", IN_PROGRESS: "bg-ledger-50 text-ledger-700",
  WAITING_FOR_CLIENT: "bg-amber/10 text-amber", FOR_REVIEW: "bg-ledger-50 text-ledger-400",
  COMPLETED: "bg-ledger-100 text-ledger-700", CANCELLED: "bg-ink/5 text-ink/30",
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  async function load() {
    setLoading(true);
    const [taskRes, empRes] = await Promise.all([
      fetch(`/api/tasks/${params.id}`),
      fetch("/api/employees?all=1"),
    ]);
    const { task: t } = await taskRes.json();
    const { employees: emps } = await empRes.json();
    if (t) {
      setTask(t);
      setStatus(t.status);
      setPriority(t.priority);
      setProgress(t.progressPct);
      setNotes(t.notes ?? "");
      setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : "");
      setAssignedToId(t.assignedTo?.id ?? "");
    }
    setEmployees(emps ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [params.id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, progressPct: progress, notes, dueDate: dueDate || null, assignedToId: assignedToId || null }),
    });
    await load();
    setSaving(false);
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    await fetch(`/api/tasks/${params.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newComment.trim() }),
    });
    setNewComment("");
    await load();
    setPostingComment(false);
  }

  if (loading) return <p className="text-sm text-muted py-12 text-center">Loading...</p>;
  if (!task) return <p className="text-sm text-muted py-12 text-center">Task not found.</p>;

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-ink transition-colors">
        &larr; Back
      </button>

      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-semibold">{task.title}</h1>
          <div className="flex gap-2 shrink-0 mt-1">
            {task.isOverdue && <span className="tag bg-rust/10 text-rust">Overdue</span>}
            <span className={`tag ${STATUS_STYLE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 text-sm text-muted">
          <span>{task.client.name}</span>
          <span className="text-ink/20">|</span>
          <span>{task.workRole.charAt(0) + task.workRole.slice(1).toLowerCase()}</span>
          {task.assignedTo && <><span className="text-ink/20">|</span><span>{task.assignedTo.name}</span></>}
          {task.createdBy && <><span className="text-ink/20">|</span><span>Assigned by {task.createdBy.name}</span></>}
        </div>
        {blocked && (
          <div className="mt-3 rounded-md bg-amber/10 border border-amber/20 px-3 py-2">
            <p className="text-sm text-amber">Blocked — waiting on: {task.dependsOn!.title} ({STATUS_LABEL[task.dependsOn!.status]})</p>
          </div>
        )}
        {/* Progress */}
        <div className="mt-4 flex items-center gap-3">
          <div className="progress-bar flex-1 h-2">
            <div className="progress-bar-fill h-2" style={{ width: `${task.progressPct}%` }} />
          </div>
          <span className="text-sm font-medium text-muted">{task.progressPct}%</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Update task</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Status</label>
            <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Priority</label>
            <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Progress %</label>
            <input type="number" min={0} max={100} className="input w-full" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Due date</label>
            <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink/70 mb-1">Assign to</label>
            <select className="input w-full" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              <option value="">Unassigned</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink/70 mb-1">Notes</label>
            <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Discussion */}
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Discussion <span className="text-muted font-normal">({task.comments.length})</span></h2>
        {task.comments.length === 0 && <p className="text-sm text-muted mb-4">No comments yet. Add a note for your team.</p>}
        <div className="space-y-4 mb-5">
          {task.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-ledger-100 text-ledger-700 flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5">
                {c.employee.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{c.employee.name}</span>
                  <span className="text-xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-ink/80 mt-0.5">{c.message}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Write a note..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postComment()}
          />
          <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="btn btn-primary text-sm">
            {postingComment ? "..." : "Post"}
          </button>
        </div>
      </div>

      {/* Activity */}
      {task.activityLogs.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold mb-4">Activity</h2>
          <div className="space-y-2.5">
            {task.activityLogs.map((a) => (
              <div key={a.id} className="flex items-baseline gap-3 text-sm">
                <span className="text-xs text-muted shrink-0 w-36">{new Date(a.createdAt).toLocaleString()}</span>
                <span className="text-ink/70"><span className="font-medium text-ink">{a.employee.name}</span> {a.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted flex items-center gap-3 pb-8">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        <span className="text-ink/15">|</span>
        <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
        {task.result && <><span className="text-ink/15">|</span><span>Result: {task.result}</span></>}
      </div>
    </div>
  );
}
