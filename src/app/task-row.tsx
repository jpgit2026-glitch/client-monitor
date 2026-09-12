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
  PENDING: "bg-ink/5 text-ink/60",
  IN_PROGRESS: "bg-ledger-50 text-ledger-700",
  WAITING_FOR_CLIENT: "bg-amber/10 text-amber",
  FOR_REVIEW: "bg-ledger-50 text-ledger-400",
  COMPLETED: "bg-ledger-100 text-ledger-700",
  CANCELLED: "bg-ink/5 text-ink/30",
};

const PRIORITY_STYLE: Record<string, string> = {
  URGENT: "bg-rust/15 text-rust font-semibold",
  HIGH: "bg-amber/10 text-amber",
  NORMAL: "",
  LOW: "bg-ink/5 text-ink/40",
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
}: {
  task: TaskLike;
  onChange?: () => void;
  readOnly?: boolean;
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

  return (
    <div className="px-4 py-3.5 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {showPriority && (
              <span className={`tag text-[10px] ${PRIORITY_STYLE[task.priority!]}`}>
                {PRIORITY_LABEL[task.priority!]}
              </span>
            )}
            <Link href={`/tasks/${task.id}`} className="text-sm font-medium text-ink hover:text-ledger-600 transition-colors truncate">
              {task.title}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
            {task.client && <span>{task.client.name}</span>}
            {task.assignedTo && <><span className="text-ink/20">|</span><span>{task.assignedTo.name}</span></>}
            {task.createdBy && <><span className="text-ink/20">|</span><span className="text-ink/30">from {task.createdBy.name}</span></>}
            {task.dueDate && (
              <>
                <span className="text-ink/20">|</span>
                <span className={task.isOverdue ? "text-rust font-medium" : ""}>{formatDate(task.dueDate)}</span>
              </>
            )}
            {commentCount > 0 && (
              <>
                <span className="text-ink/20">|</span>
                <Link href={`/tasks/${task.id}`} className="hover:text-ink transition-colors">
                  {commentCount} {commentCount === 1 ? "note" : "notes"}
                </Link>
              </>
            )}
          </div>
          {blocked && (
            <p className="text-xs text-amber mt-1.5 flex items-center gap-1">
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-full bg-amber/15 text-[9px]">!</span>
              Blocked by: {task.dependsOn!.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          {task.isOverdue && <span className="tag bg-rust/10 text-rust text-[10px]">Overdue</span>}
          <span className={`tag ${STATUS_STYLE[task.status] ?? "bg-ink/5 text-ink/60"}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
          <div className="w-16 flex items-center gap-1.5">
            <div className="progress-bar flex-1">
              <div className="progress-bar-fill" style={{ width: `${task.progressPct}%` }} />
            </div>
            <span className="text-[10px] text-muted w-7 text-right">{task.progressPct}%</span>
          </div>
          {!readOnly && (
            <button className="btn text-xs px-2.5 py-1" onClick={() => setOpen((v) => !v)}>
              {open ? "Close" : "Update"}
            </button>
          )}
        </div>
      </div>

      {open && !readOnly && (
        <div className="mt-3 pt-3 border-t border-rule/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Status</label>
            <select className="input w-full text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Progress</label>
            <input
              type="number" min={0} max={100}
              className="input w-full text-sm"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Deadline</label>
            <input type="date" className="input w-full text-sm" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Notes</label>
            <input className="input w-full text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="col-span-2 sm:col-span-4 flex gap-2 pt-1">
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs px-4">
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
