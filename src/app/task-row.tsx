"use client";

import { useState } from "react";
import Link from "next/link";

export type TaskLike = {
  id: string;
  title: string;
  status: string;
  progressPct: number;
  priority?: string;
  dueDate?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  result?: string | null;
  isOverdue?: boolean;
  workRole: string;
  client?: { name: string };
  assignedTo?: { name: string } | null;
  createdBy?: { name: string } | null;
  dependsOn?: { title: string; status: string } | null;
  _count?: { comments: number };
};

const STATUS_OPTIONS = ["PENDING", "IN_PROGRESS", "WAITING_FOR_CLIENT", "FOR_REVIEW", "COMPLETED", "CANCELLED"];

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-ink/5 text-ink/50",
  IN_PROGRESS: "bg-green-100 text-green-700",
  WAITING_FOR_CLIENT: "bg-amber/10 text-amber",
  FOR_REVIEW: "bg-green-50 text-green-500",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-ink/5 text-ink/30",
};

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: "bg-rust/10 text-rust",
  HIGH: "bg-amber/10 text-amber",
  NORMAL: "",
  LOW: "bg-ink/5 text-ink/35",
};

const PRIORITY_LABEL: Record<string, string> = {
  URGENT: "Urgent",
  HIGH: "High",
  NORMAL: "Normal",
  LOW: "Low",
};

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const formatted = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return formatted;
}

export default function TaskRow({
  task,
  onChange,
  readOnly = false,
  showNotes = false,
}: {
  task: TaskLike;
  onChange?: () => void;
  readOnly?: boolean;
  showNotes?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progressPct);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, progressPct: progress, notes, dueDate: dueDate || null }),
    });
    setSaving(false);
    setOpen(false);
    onChange?.();
  }

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";
  const commentCount = task._count?.comments ?? 0;
  const showPriority = task.priority && task.priority !== "NORMAL";
  const hasNotes = showNotes && task.notes && task.notes.trim();

  return (
    <div className="px-5 py-4 group">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {showPriority && (
              <span className={`tag ${PRIORITY_STYLE[task.priority!]}`}>
                {PRIORITY_LABEL[task.priority!]}
              </span>
            )}
            <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-ink hover:text-green-700 transition-colors truncate">
              {task.title}
            </Link>
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted">
            {task.client && <span>{task.client.name}</span>}
            {task.assignedTo && <><span className="text-rule">&middot;</span><span>{task.assignedTo.name}</span></>}
            {task.createdBy && <><span className="text-rule">&middot;</span><span className="text-muted/60">from {task.createdBy.name}</span></>}
            {task.dueDate && (
              <>
                <span className="text-rule">&middot;</span>
                <span className={task.isOverdue ? "text-rust font-semibold" : ""}>{formatDate(task.dueDate)}</span>
              </>
            )}
            {commentCount > 0 && (
              <>
                <span className="text-rule">&middot;</span>
                <Link href={`/tasks/${task.id}`} className="hover:text-green-600 transition-colors">
                  {commentCount} {commentCount === 1 ? "note" : "notes"}
                </Link>
              </>
            )}
          </div>
          {hasNotes && (
            <div className="mt-2 flex items-start gap-2 text-xs text-ink/55 bg-green-50/60 rounded-md px-3 py-2">
              <span className="text-green-600 font-semibold shrink-0">Note:</span>
              <span className="leading-relaxed">{task.notes}</span>
            </div>
          )}
          {blocked && (
            <p className="text-xs text-amber mt-2 flex items-center gap-1.5">
              <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-amber/12 text-[9px] font-bold">!</span>
              Blocked by: {task.dependsOn!.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {task.isOverdue && <span className="tag bg-rust/8 text-rust">Overdue</span>}
          <span className={`tag ${STATUS_STYLE[task.status] ?? "bg-ink/5 text-ink/50"}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
          <div className="w-20 flex items-center gap-2">
            <div className="progress-bar flex-1">
              <div className="progress-bar-fill" style={{ width: `${task.progressPct}%` }} />
            </div>
            <span className="text-2xs text-muted font-medium w-7 text-right">{task.progressPct}%</span>
          </div>
          {!readOnly && (
            <button className="btn text-xs px-3 py-1.5" onClick={() => setOpen((v) => !v)}>
              {open ? "Close" : "Update"}
            </button>
          )}
        </div>
      </div>

      {open && !readOnly && (
        <div className="mt-4 pt-4 border-t border-rule/40 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-2xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Status</label>
            <select className="input w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-2xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Progress</label>
            <input
              type="number" min={0} max={100}
              className="input w-full text-sm"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Deadline</label>
            <input type="date" className="input w-full text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-2xs font-semibold text-muted mb-1.5 uppercase tracking-wider">Status note</label>
            <input className="input w-full text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Why is this pending?" />
          </div>
          <div className="col-span-2 sm:col-span-4 flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs px-5">
              {saving ? "Saving..." : "Save"}
            </button>
            <Link href={`/tasks/${task.id}`} className="btn btn-ghost text-xs">
              Full details
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
