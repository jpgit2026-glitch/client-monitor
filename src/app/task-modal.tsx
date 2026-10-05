"use client";

import { useEffect, useState } from "react";
import EmployeeMultiSelect from "./employee-multi-select";

type Employee = { id: string; name: string; role: string };
type Comment = { id: string; message: string; createdAt: string; employee: Employee; mentions?: { id: string; name: string }[] };

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
  currentHandler: Employee | null;
  createdBy: Employee | null;
  dependsOn: { title: string; status: string } | null;
  comments: Comment[];
  activityLogs: { id: string; action: string; createdAt: string; employee: { name: string } }[];
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
  const [originalNotes, setOriginalNotes] = useState("");
  const [filePath, setFilePath] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<Set<string>>(new Set());
  const [currentHandlerId, setCurrentHandlerId] = useState("");
  const [newComment, setNewComment] = useState("");
  const [mentionIds, setMentionIds] = useState<Set<string>>(new Set());
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [dirty, setDirty] = useState(false);

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
      setOriginalNotes(t.notes ?? "");
      setFilePath(t.filePath ?? "");
      setDueDate(t.dueDate ? t.dueDate.slice(0, 10) : "");
      setSelectedAssignees(new Set(t.assignees?.map((a: Employee) => a.id) ?? (t.assignedTo ? [t.assignedTo.id] : [])));
      setCurrentHandlerId(t.currentHandler?.id ?? "");
    }
    setEmployees(emps ?? []);
    setLoading(false);
    fetch(`/api/tasks/${taskId}/read`, { method: "POST" }).catch(() => {});
  }

  useEffect(() => { load(); }, [taskId]);

  function handleClose() {
    if (dirty) onChange?.();
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") handleClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, dirty]);

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, priority, progressPct: progress, notes, filePath: filePath || null, dueDate: dueDate || null, assignedToIds: Array.from(selectedAssignees), currentHandlerId: currentHandlerId || null }),
    });
    if (notes.trim() !== originalNotes.trim()) {
      await fetch(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: `📝 Updated notes: ${notes.trim()}` }),
      });
    }
    await load();
    setSaving(false);
    setMode("view");
    setDirty(true);
  }

  async function postComment() {
    if (!newComment.trim()) return;
    setPostingComment(true);
    await fetch(`/api/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: newComment.trim(), mentionIds: Array.from(mentionIds) }),
    });
    setNewComment("");
    setMentionIds(new Set());
    setShowMentionMenu(false);
    await load();
    setPostingComment(false);
    setDirty(true);
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

  const blocked = task?.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[3vh] sm:pt-[5vh] pb-[3vh] sm:pb-[5vh]" onClick={handleClose}>
      <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-elevated w-full max-w-2xl max-h-[94vh] sm:max-h-[90vh] overflow-y-auto border border-slate-200 mx-3 sm:mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {loading ? (
          <div className="p-12 text-center text-sm text-muted">Loading task...</div>
        ) : !task ? (
          <div className="p-12 text-center text-sm text-muted">Task not found.</div>
        ) : mode === "view" ? (
          <>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5 rounded-t-2xl z-10">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-ink leading-snug">{task.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1.5 text-xs text-muted">
                    <span>{task.client.name}</span>
                    <span className="text-slate-300">&middot;</span>
                    <span>{task.workRole.charAt(0) + task.workRole.slice(1).toLowerCase()}</span>
                    {task.createdBy && <><span className="text-slate-300">&middot;</span><span>from {task.createdBy.name}</span></>}
                  </div>
                </div>
                <button onClick={handleClose} className="text-slate-400 hover:text-ink transition-colors p-1 -mr-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6 space-y-5 sm:space-y-6">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <span className={`tag ${STATUS_STYLE[task.status]}`}>{STATUS_LABEL[task.status]}</span>
                {task.priority !== "NORMAL" && (
                  <span className={`tag ${PRIORITY_STYLE[task.priority]}`}>{task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}</span>
                )}
                {task.isOverdue && <span className="tag bg-red-50 text-red-600">Overdue</span>}
                {(task.assignees?.length ? task.assignees : task.assignedTo ? [task.assignedTo] : []).map((a) => (
                  <span key={a.id} className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <span className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold">{a.name.charAt(0)}</span>
                    {a.name}
                  </span>
                ))}
              </div>

              {task.currentHandler && (
                <div className="bg-brand-50 rounded-lg px-4 py-3 border border-brand-100">
                  <div className="text-2xs text-brand-600 font-semibold uppercase tracking-wider mb-1">Currently with</div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-brand-200 text-brand-800 flex items-center justify-center text-[10px] font-bold">
                      {task.currentHandler.name.charAt(0)}
                    </span>
                    <span className="text-sm font-semibold text-ink">{task.currentHandler.name}</span>
                    <span className="text-xs text-muted">({task.currentHandler.role})</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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

              {task.filePath && (
                <div className="bg-slate-50 rounded-lg px-4 py-3 border border-slate-100">
                  <div className="text-2xs text-muted font-medium uppercase tracking-wider mb-1.5">File location</div>
                  <p className="text-sm text-ink font-mono break-all">{task.filePath}</p>
                </div>
              )}

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
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="text-sm font-semibold text-ink">{c.employee.name}</span>
                          <span className="text-2xs text-muted">{new Date(c.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-600 mt-0.5 leading-relaxed">{renderMessage(c.message, c.mentions)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-sm"
                      placeholder="Write a note... use @ to mention"
                      value={newComment}
                      onChange={(e) => handleCommentChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && !showMentionMenu) postComment(); }}
                    />
                    <button onClick={postComment} disabled={postingComment || !newComment.trim()} className="btn btn-primary text-xs px-4">
                      {postingComment ? "..." : "Post"}
                    </button>
                  </div>
                  {showMentionMenu && (() => {
                    const seen = new Set<string>();
                    const mentionable: Employee[] = [];
                    for (const emp of [...(task?.assignees ?? []), ...(task?.createdBy ? [task.createdBy] : []), ...employees]) {
                      if (!seen.has(emp.id)) { seen.add(emp.id); mentionable.push(emp); }
                    }
                    const filtered = mentionable.filter((emp) => emp.name.toLowerCase().includes(mentionQuery));
                    return (
                      <div className="absolute bottom-full left-0 right-12 mb-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
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
            </div>

            {/* Activity Log */}
            {task.activityLogs && task.activityLogs.length > 0 && (
              <div className="px-5 sm:px-7 pb-4">
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1 select-none">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    Activity Log ({task.activityLogs.length})
                  </summary>
                  <div className="mt-2 space-y-1.5 max-h-48 overflow-y-auto">
                    {task.activityLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-2 text-xs text-muted">
                        <span className="text-slate-400 shrink-0 w-28">{new Date(log.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                        <span><span className="font-medium text-ink">{log.employee.name}</span> {log.action}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-5 py-3 sm:px-7 sm:py-4 rounded-b-2xl flex justify-end gap-2">
              <button onClick={handleClose} className="btn text-sm px-4 sm:px-5">Close</button>
              <button onClick={() => setMode("edit")} className="btn btn-primary text-sm px-4 sm:px-5">Edit task</button>
            </div>
          </>
        ) : (
          <>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-5 py-4 sm:px-7 sm:py-5 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-bold text-ink truncate">Edit: {task.title}</h2>
                <button onClick={handleClose} className="text-slate-400 hover:text-ink transition-colors p-1 -mr-1 shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="px-5 py-5 sm:px-7 sm:py-6">
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
                  <label className="block text-sm font-medium text-ink mb-2">Due date</label>
                  <input type="date" className="input w-full" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Assign to</label>
                  <EmployeeMultiSelect employees={employees} selected={selectedAssignees} onChange={setSelectedAssignees} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Currently with</label>
                  <select className="input w-full" value={currentHandlerId} onChange={(e) => setCurrentHandlerId(e.target.value)}>
                    <option value="">— None —</option>
                    {(task?.assignees?.length ? task.assignees : employees).map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">File location</label>
                  <input className="input w-full" value={filePath} onChange={(e) => setFilePath(e.target.value)} placeholder="e.g. D:\Clients\ABC\file.xlsx" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-2">Notes</label>
                  <textarea className="input w-full" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context or instructions..." />
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-5 py-3 sm:px-7 sm:py-4 rounded-b-2xl flex justify-end gap-2">
              <button onClick={() => setMode("view")} className="btn text-sm px-4 sm:px-5">Cancel</button>
              <button onClick={save} disabled={saving} className="btn btn-primary text-sm px-4 sm:px-5">
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
