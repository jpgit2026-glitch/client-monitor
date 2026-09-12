"use client";

import { useEffect, useState } from "react";

type Employee = { id: string; name: string; role: string };
type Comment = { id: string; message: string; createdAt: string; employee: Employee };

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
  activityLogs: { id: string; action: string; createdAt: string; employee: { name: string } }[];
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "COMPLETED", "CANCELLED"];
const PRIORITY_OPTIONS = ["URGENT", "HIGH", "NORMAL", "LOW"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500", IN_PROGRESS: "bg-brand-50 text-brand-700",
  WAITING_FOR_CLIENT: "bg-amber-50 text-amber-700", FOR_REVIEW: "bg-blue-50 text-blue-600",
  COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-slate-100 text-slate-400",
};
const PRIORITY_STYLE: Record<string, string> = {
  URGENT: "bg-red-50 text-red-600", HIGH: "bg-amber-50 text-amber-700", NORMAL: "", LOW: "bg-slate-100 text-slate-400",
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function TaskModal({
  taskId,
  onClose,
  onChange,
  initialMode = "view",
}: {
  taskId: string;
  onClose: () => void;
  onChange?: () => void;
  initialMode?: "view" | "edit";
}) {
  const [task, setTask] = useState<TaskDetail | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
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
      fetch(`/api/tasks/${taskId}`),
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

  useEffect(() => { load(); }, [taskId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, progressPct: progress, notes, dueDate: dueDate || null, assignedToId: assignedToId || null }),
    });
    await load();
    setSaving(false);
    setMode("view");
    onChange?.();
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newComment.trim() }),
    });
    setNewComment("");
    await load();
    setPostingComment(false);
  }

  const blocked = task?.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[5vh] pb-[5vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center text-sm text-muted">Loading task...</div>
        ) : !task ? (
          <div className="p-12 text-center text-sm text-muted">Task not found.</div>
        ) : mode === "view" ? (
          <>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-7 py-5 rounded-t-2xl z-10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-ink leading-snug">{task.title}</h2>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
                    <span>{task.client.name}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span>{task.workRole.charAt(0) + task.workRole.slice(1).toLowerCase()}</span>
                    {task.createdBy && <><span className="text-slate-300">&middot;</span><span>from {task.createdBy.name}</span></>}
                  </div>
                </div>
                <button onClick={onClose} className="text-slate-400 hover:text-ink transition-colors p-1 -mr-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-7 py-6 space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`tag ${STATUS_STYLE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                {task.priority !== "NORMAL" && (
                  <span className={`tag ${PRIORITY_STYLE[task.priority]}`}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span>
                )}
                {task.isOverdue && <span className="tag bg-red-50 text-red-600">Overdue</span>}
                {task.assignedTo && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{task.assignedTo.name.charAt(0)}</span>
                    {task.assignedTo.name}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted uppercase tracking-wider">Progress</span>
                  <span className="text-sm font-bold text-brand-600">{task.progressPct}%</span>
                </div>
                <div className="progress-bar h-2.5">
                  <div className="progress-bar-fill h-2.5" style={{ width: `${task.progressPct}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {task.dueDate && (
                  <div className="bg-slate-50 rounded-lg px-4 py-3">
                    <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1">Due date</div>
                    <div className={`text-sm font-semibold ${task.isOverdue ? "text-rust" : "text-ink"}`}>{formatDate(task.dueDate)}</div>
                  </div>
                )}
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1">Created</div>
                  <div className="text-sm font-semibold text-ink">{formatDate(task.createdAt)}</div>
                </div>
                {task.followUpDate && (
                  <div className="bg-slate-50 rounded-lg px-4 py-3">
                    <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1">Follow-up</div>
                    <div className="text-sm font-semibold text-ink">{formatDate(task.followUpDate)}</div>
                  </div>
                )}
                {task.result && (
                  <div className="bg-slate-50 rounded-lg px-4 py-3">
                    <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1">Result</div>
                    <div className="text-sm font-semibold text-ink">{task.result}</div>
                  </div>
                )}
              </div>

              {blocked && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-700 font-medium">Blocked — waiting on: {task.dependsOn!.title} ({STATUS_LABEL[task.dependsOn!.status]})</p>
                </div>
              )}

              {task.notes && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                  <div className="text-2xs text-brand-600 font-semibold uppercase tracking-wider mb-1.5">Notes</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{task.notes}</p>
                </div>
              )}

              <div>
                <div className="text-2xs text-muted font-semibold uppercase tracking-wider mb-3">
                  Discussion ({task.comments.length})
                </div>
                {task.comments.length === 0 && <p className="text-sm text-muted mb-3">No comments yet.</p>}
                <div className="space-y-4 mb-4">
                  {task.comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                        {c.employee.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-sm font-semibold text-ink">{c.employee.name}</span>
                          <span className="text-2xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Write a note..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && postComment()}
                  />
                  <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="btn btn-primary text-xs px-4">
                    {postingComment ? "..." : "Post"}
                  </button>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-7 py-4 rounded-b-2xl flex justify-end gap-2">
              <button onClick={onClose} className="btn text-sm px-5">Close</button>
              <button onClick={() => setMode("edit")} className="btn btn-primary text-sm px-5">Edit task</button>
            </div>
          </>
        ) : (
          <>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-7 py-5 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Edit: {task.title}</h2>
                <button onClick={onClose} className="text-slate-400 hover:text-ink transition-colors p-1 -mr-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-7 py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Status</label>
                  <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Priority</label>
                  <select className="input w-full" value={priority} onChange={(e) => setPriority(e.target.value)}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Progress %</label>
                  <input type="number" min={0} max={100} className="input w-full" value={progress} onChange={(e) => setProgress(Number(e.target.value))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Due date</label>
                  <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Assign to</label>
                  <select className="input w-full" value={assignedToId} onChange={(e) => setAssignedToId(e.target.value)}>
                    <option value="">Unassigned</option>
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>)}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-2">Notes</label>
                  <textarea className="input w-full" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context or instructions..." />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-7 py-4 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setMode("view")} className="btn text-sm px-5">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary text-sm px-5">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
