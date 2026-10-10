"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Employee = { id: string; name: string; role: string };
type Comment = { id: string; message: string; createdAt: string; employee: Employee; mentions?: { id: string; name: string }[] };
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
  filePath: string | null;
  followUpDate: string | null;
  result: string | null;
  isOverdue: boolean;
  createdAt: string;
  updatedAt: string;
  client: { name: string };
  assignees: Employee[];
  assignedTo: Employee | null;
  createdBy: Employee | null;
  dependsOn: { title: string; status: string } | null;
  comments: Comment[];
  activityLogs: ActivityEntry[];
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "FOR_BILLING", "FOR_FILING", "COMPLETED", "CANCELLED"];
const PRIORITY_OPTIONS = ["URGENT", "HIGH", "NORMAL", "LOW"];
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review", FOR_BILLING: "For billing", FOR_FILING: "For filing", COMPLETED: "Completed", CANCELLED: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500", IN_PROGRESS: "bg-brand-50 text-brand-700",
  WAITING_FOR_CLIENT: "bg-amber-50 text-amber-700", FOR_REVIEW: "bg-blue-50 text-blue-600", FOR_BILLING: "bg-indigo-50 text-indigo-600", FOR_FILING: "bg-violet-50 text-violet-600",
  COMPLETED: "bg-emerald-50 text-emerald-700", CANCELLED: "bg-slate-100 text-slate-400",
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
  const [filePath, setFilePath] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState("");
  const [mentionIds, setMentionIds] = useState<Set<string>>(new Set());
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
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
      setFilePath(t.filePath ?? "");
      setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : "");
      setSelectedAssignees(new Set(t.assignees?.map((a: Employee) => a.id) ?? (t.assignedTo ? [t.assignedTo.id] : [])));
    }
    setEmployees(emps ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(() => { load(); }, 30000);
    return () => clearInterval(interval);
  }, [params.id]);

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status, priority, progressPct: progress, notes,
        filePath: filePath.trim() || null,
        dueDate: dueDate || null, assignedToIds: Array.from(selectedAssignees),
      }),
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
      body: JSON.stringify({ message: newComment.trim(), mentionIds: Array.from(mentionIds) }),
    });
    setNewComment("");
    setMentionIds(new Set());
    setShowMentionMenu(false);
    await load();
    setPostingComment(false);
  }

  function handleCommentChange(value: string) {
    setNewComment(value);
    const lastAt = value.lastIndexOf("@");
    if (lastAt >= 0) {
      const after = value.slice(lastAt + 1);
      if (!after.includes(" ") && after.length <= 30) {
        setMentionQuery(after.toLowerCase());
        setShowMentionMenu(true);
        return;
      }
    }
    setShowMentionMenu(false);
  }

  function insertMention(emp: Employee) {
    const lastAt = newComment.lastIndexOf("@");
    const before = newComment.slice(0, lastAt);
    setNewComment(before + "@" + emp.name + " ");
    setMentionIds((prev) => { const next = new Set(prev); next.add(emp.id); return next; });
    setShowMentionMenu(false);
  }

  function renderMessage(message: string, commentMentions?: { id: string; name: string }[]) {
    if (!commentMentions?.length) return message;
    const names = commentMentions.map((m) => m.name);
    const regex = new RegExp(`@(${names.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
    const parts = message.split(regex);
    return parts.map((part, i) =>
      names.includes(part)
        ? <span key={i} className="text-brand-600 font-semibold">@{part}</span>
        : part
    );
  }

  if (loading) return <p className="text-sm text-muted py-16 text-center">Loading...</p>;
  if (!task) return <p className="text-sm text-muted py-16 text-center">Task not found.</p>;

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="space-y-5 sm:space-y-7 max-w-3xl">
      <button onClick={() => router.back()} className="text-sm text-muted hover:text-brand-700 transition-colors">
        &larr; Back
      </button>

      {/* Header */}
      <div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-ink">{task.title}</h1>
          <div className="flex gap-2 shrink-0">
            {task.isOverdue && <span className="tag bg-red-50 text-red-600">Overdue</span>}
            <span className={`tag ${STATUS_STYLE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-muted">
          <span>{task.client.name}</span>
          <span className="text-rule">&middot;</span>
          <span>{task.workRole.charAt(0) + task.workRole.slice(1).toLowerCase()}</span>
          {task.assignees?.length > 0 && <><span className="text-rule">&middot;</span><span>{task.assignees.map((a: Employee) => a.name).join(", ")}</span></>}
          {task.createdBy && <><span className="text-rule hidden sm:inline">&middot;</span><span className="hidden sm:inline">Assigned by {task.createdBy.name}</span></>}
        </div>
        {blocked && (
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm text-amber-700 font-medium">Blocked — waiting on: {task.dependsOn!.title} ({STATUS_LABEL[task.dependsOn!.status]})</p>
          </div>
        )}
        {task.filePath && (
          <div className="mt-3 bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
            <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1">File location</div>
            <p className="text-sm text-ink font-mono break-all">{task.filePath}</p>
          </div>
        )}
        <div className="mt-4 sm:mt-5 flex items-center gap-3">
          <div className="progress-bar flex-1 h-2.5">
            <div className="progress-bar-fill h-2.5" style={{ width: `${task.progressPct}%` }} />
          </div>
          <span className="text-sm font-semibold text-brand-600">{task.progressPct}%</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card-elevated p-5 sm:p-7">
        <h2 className="text-base sm:text-lg font-bold text-ink mb-4 sm:mb-5">Update task</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
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
            <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
              {employees.map((emp) => (
                <label key={emp.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedAssignees.has(emp.id)}
                    onChange={(e) => {
                      const next = new Set(selectedAssignees);
                      if (e.target.checked) next.add(emp.id); else next.delete(emp.id);
                      setSelectedAssignees(next);
                    }}
                    className="rounded border-slate-300"
                  />
                  <span>{emp.name}</span>
                  <span className="text-xs text-muted">({emp.role})</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-2">File location</label>
            <input className="input w-full" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="e.g. D:\Clients\ABC\file.xlsx" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink mb-2">Notes</label>
            <textarea className="input w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <button onClick={save} disabled={saving} className="btn btn-primary text-sm px-6 w-full sm:w-auto">
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      {/* Discussion */}
      <div className="card-elevated p-5 sm:p-7">
        <h2 className="text-base sm:text-lg font-bold text-ink mb-4 sm:mb-5">Discussion <span className="text-muted font-normal text-sm">({task.comments.length})</span></h2>
        {task.comments.length === 0 && <p className="text-sm text-muted mb-5">No comments yet. Add a note for your team.</p>}
        <div className="space-y-4 sm:space-y-5 mb-5 sm:mb-6">
          {task.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {c.employee.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-ink">{c.employee.name}</span>
                  <span className="text-2xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-ink/75 mt-1 leading-relaxed">{renderMessage(c.message, c.mentions)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative">
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Write a note... use @ to mention"
              value={newComment}
              onChange={(e) => handleCommentChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !showMentionMenu) postComment(); }}
            />
            <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="btn btn-primary text-sm px-4 sm:px-5">
              {postingComment ? "..." : "Post"}
            </button>
          </div>
          {showMentionMenu && (() => {
            const seen = new Set<string>();
            const mentionable: Employee[] = [];
            for (const emp of [...(task?.assignees ?? []), ...(task?.createdBy ? [task.createdBy] : [])]) {
              if (!seen.has(emp.id)) { seen.add(emp.id); mentionable.push(emp); }
            }
            const filtered = mentionable.filter((emp) => emp.name.toLowerCase().includes(mentionQuery));
            return (
              <div className="absolute bottom-full left-0 right-16 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                {filtered.map((emp) => (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => insertMention(emp)}
                    className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                      {emp.name.charAt(0)}
                    </span>
                    <span className="text-sm text-ink">{emp.name}</span>
                    <span className="text-xs text-muted ml-auto">{emp.role}</span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="px-3 py-2 text-sm text-muted">No matching employees</div>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Activity */}
      {task.activityLogs.length > 0 && (
        <div className="card p-5 sm:p-7">
          <h2 className="text-base sm:text-lg font-bold text-ink mb-4 sm:mb-5">Activity</h2>
          <div className="space-y-3">
            {task.activityLogs.map((a) => (
              <div key={a.id} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 text-sm">
                <span className="text-2xs text-muted shrink-0 sm:w-36 font-mono">{new Date(a.createdAt).toLocaleString()}</span>
                <span className="text-ink/65"><span className="font-medium text-ink">{a.employee.name}</span> {a.action}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="text-xs text-muted flex flex-wrap items-center gap-x-3 gap-y-1 pb-10">
        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
        <span className="text-rule">&middot;</span>
        <span>Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
        {task.result && <><span className="text-rule">&middot;</span><span>Result: {task.result}</span></>}
      </div>
    </div>
  );
}
