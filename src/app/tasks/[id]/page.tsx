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

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [employees, setEmployees] = useState<{ id: string; name: string; role: string }[]>([]);
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

  if (loading) return <p className="text-sm text-ink/50">Loading...</p>;
  if (!task) return <p className="text-sm text-ink/50">Task not found.</p>;

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <button onClick={() => router.back()} className="text-xs text-ink/50 hover:text-ink mb-3 block">
          &larr; Back
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-medium">{task.title}</h1>
            <p className="text-sm text-ink/60 mt-1">
              {task.client.name} &middot; {task.workRole}
              {task.createdBy && <> &middot; Assigned by {task.createdBy.name}</>}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            {task.isOverdue && <span className="tag border-rust text-rust">Overdue</span>}
            <span className="tag border-ink/30 text-ink/60">{STATUS_LABEL[task.status]}</span>
          </div>
        </div>
        {blocked && (
          <p className="text-sm text-amber mt-2">Blocked — waiting on: {task.dependsOn!.title} ({STATUS_LABEL[task.dependsOn!.status]})</p>
        )}
      </div>

      {/* Edit form */}
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-4">Update task</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-ink/60 mb-1">Status</label>
            <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Priority</label>
            <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Progress %</label>
            <input type="number" min={0} max={100} className="input w-full" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Due date</label>
            <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Assign to</label>
            <select className="input w-full" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
              <option value="">Unassigned</option>
              {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-ink/60 mb-1">Notes</label>
            <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Comments / Discussion */}
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-4">Discussion ({task.comments.length})</h2>
        {task.comments.length === 0 && <p className="text-sm text-ink/40 mb-4">No comments yet. Add a note for your team.</p>}
        <div className="space-y-3 mb-4">
          {task.comments.map((c) => (
            <div key={c.id} className="border-l-2 border-rule pl-3">
              <p className="text-sm">{c.message}</p>
              <p className="text-xs text-ink/40 mt-1">
                {c.employee.name} ({c.employee.role}) &middot; {new Date(c.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Add a note or instruction..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && postComment()}
          />
          <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="btn btn-primary text-xs">
            {postingComment ? "Posting..." : "Post"}
          </button>
        </div>
      </div>

      {/* Activity log */}
      <div className="card p-5">
        <h2 className="text-sm font-medium mb-4">Activity</h2>
        {task.activityLogs.length === 0 && <p className="text-sm text-ink/40">No activity recorded.</p>}
        <div className="space-y-2">
          {task.activityLogs.map((a) => (
            <div key={a.id} className="flex items-baseline gap-2 text-xs">
              <span className="text-ink/40 shrink-0">{new Date(a.createdAt).toLocaleString()}</span>
              <span className="text-ink/70">{a.employee.name} — {a.action}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Metadata */}
      <div className="text-xs text-ink/40 space-y-1">
        <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
        <p>Last updated: {new Date(task.updatedAt).toLocaleString()}</p>
        {task.result && <p>Result: {task.result}</p>}
        {task.followUpDate && <p>Follow-up: {new Date(task.followUpDate).toLocaleDateString()}</p>}
      </div>
    </div>
  );
}
