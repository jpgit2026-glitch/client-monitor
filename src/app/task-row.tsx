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
    <div className="px-5 py-5 group hover:bg-green-50/30 transition-colors rounded-xl border border-rule/50 bg-white shadow-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            {showPriority && (
              <span className={`tag ${PRIORITY_STYLE[task.priority!]}`}>
                {PRIORITY_LABEL[task.priority!]}
              </span>
            )}
            <Link href={`/tasks/${task.id}`} className="text-sm font-semibold text-ink hover:text-green-700 transition-colors truncate">
              {task.title}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted">
            {task.client && (
              <span className="inline-flex items-center gap-1">
                <svg className="w-3 h-3 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                {task.client.name}
              </span>
            )}
            {task.assignedTo && (
              <>
                <span className="text-rule">&middot;</span>
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {task.assignedTo.name}
                </span>
              </>
            )}
            {task.createdBy && <><span className="text-rule">&middot;</span><span className="text-muted/60">from {task.createdBy.name}</span></>}
            {task.dueDate && (
              <>
                <span className="text-rule">&middot;</span>
                <span className={`inline-flex items-center gap-1 ${task.isOverdue ? "text-rust font-semibold" : ""}`}>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {formatDate(task.dueDate)}
                </span>
              </>
            )}
            {commentCount > 0 && (
              <>
                <span className="text-rule">&middot;</span>
                <Link href={`/tasks/${task.id}`} className="hover:text-green-600 transition-colors inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  {commentCount} {commentCount === 1 ? "note" : "notes"}
                </Link>
              </>
            )}
          </div>

          {/* Progress bar inline on mobile, visible always */}
          <div className="mt-3 flex items-center gap-3">
            <span className={`tag ${STATUS_STYLE[task.status] ?? "bg-ink/5 text-ink/50"}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
            {task.isOverdue && <span className="tag bg-rust/8 text-rust">Overdue</span>}
            <div className="flex items-center gap-2 flex-1 max-w-[200px]">
              <div className="progress-bar flex-1 h-2">
                <div className="progress-bar-fill h-2" style={{ width: `${task.progressPct}%` }} />
              </div>
              <span className="text-2xs text-muted font-semibold w-8 text-right">{task.progressPct}%</span>
            </div>
          </div>

          {hasNotes && (
            <div className="mt-3 flex items-start gap-2 text-xs text-ink/55 bg-green-50/60 rounded-lg px-3.5 py-2.5 border border-green-100/60">
              <span className="text-green-600 font-semibold shrink-0">Note:</span>
              <span className="leading-relaxed">{task.notes}</span>
            </div>
          )}
          {blocked && (
            <p className="text-xs text-amber mt-3 flex items-center gap-1.5">
              <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-amber/12 text-[9px] font-bold">!</span>
              Blocked by: {task.dependsOn!.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <Link href={`/tasks/${task.id}`} className="btn text-xs px-3 py-1.5">
            View
          </Link>
          {!readOnly && (
            <button className="btn btn-primary text-xs px-3 py-1.5" onClick={() => setOpen((v) => !v)}>
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
