"use client";

import { useState } from "react";

export type TaskLike = {
  id: string;
  title: string;
  status: string;
  progressPct: number;
  dueDate?: string | null;
  notes?: string | null;
  followUpDate?: string | null;
  result?: string | null;
  isOverdue?: boolean;
  workRole: string;
  client?: { name: string };
  assignedTo?: { name: string } | null;
  dependsOn?: { title: string; status: string } | null;
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

const STATUS_TAG: Record<string, string> = {
  PENDING: "border-ink/30 text-ink/60",
  IN_PROGRESS: "border-ledger-600 text-ledger-600",
  WAITING_FOR_CLIENT: "border-amber text-amber",
  FOR_REVIEW: "border-ledger-400 text-ledger-400",
  COMPLETED: "border-ledger-900 text-ledger-900 bg-ledger-50",
  CANCELLED: "border-ink/20 text-ink/30",
};

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

  async function save() {
    setSaving(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, progressPct: progress, notes }),
    });
    setSaving(false);
    setOpen(false);
    onChange?.();
  }

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{task.title}</p>
          <p className="text-xs text-ink/50 mt-0.5">
            {task.client?.name}
            {task.assignedTo && <> · {task.assignedTo.name}</>}
            {task.dueDate && <> · Due {new Date(task.dueDate).toLocaleDateString()}</>}
          </p>
          {blocked && (
            <p className="text-xs text-amber mt-1">🔒 Waiting on: {task.dependsOn!.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {task.isOverdue && <span className="tag border-rust text-rust">Overdue</span>}
          <span className={`tag ${STATUS_TAG[task.status] ?? ""}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
          <span className="font-mono text-xs text-ink/50 w-9 text-right">{task.progressPct}%</span>
          {!readOnly && (
            <button className="btn text-xs" onClick={() => setOpen((v) => !v)}>
              {open ? "Close" : "Update"}
            </button>
          )}
        </div>
      </div>

      {open && !readOnly && (
        <div className="mt-3 pt-3 border-t border-rule grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-ink/60 mb-1">Status</label>
            <select className="input w-full" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/60 mb-1">Progress %</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input w-full"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-xs text-ink/60 mb-1">Notes</label>
            <input className="input w-full" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <button onClick={save} disabled={saving} className="btn btn-primary text-xs">
              {saving ? "Saving…" : "Save update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
