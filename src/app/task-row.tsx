"use client";

import { useState, useEffect } from "react";
import TaskModal from "./task-modal";

export type TaskLike = {
  id: string;
  title: string;
  status: string;
  progressPct: number;
  priority?: string;
  dueDate?: string | null;
  notes?: string | null;
  filePath?: string | null;
  followUpDate?: string | null;
  result?: string | null;
  isOverdue?: boolean;
  hasUnread?: boolean;
  workRole: string;
  updatedAt?: string;
  client?: { name: string };
  assignees?: { id: string; name: string }[];
  assignedTo?: { name: string } | null;
  currentHandler?: { id: string; name: string } | null;
  createdBy?: { name: string } | null;
  dependsOn?: { title: string; status: string } | null;
  _count?: { comments: number };
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In progress",
  WAITING_FOR_CLIENT: "Waiting for client",
  FOR_REVIEW: "For review",
  FOR_BILLING: "For billing",
  FOR_FILING: "For filing",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-slate-100 text-slate-500",
  IN_PROGRESS: "bg-brand-50 text-brand-700",
  WAITING_FOR_CLIENT: "bg-amber-50 text-amber-700",
  FOR_REVIEW: "bg-blue-50 text-blue-600",
  FOR_BILLING: "bg-indigo-50 text-indigo-600",
  FOR_FILING: "bg-violet-50 text-violet-600",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-slate-100 text-slate-400",
};

function dueDateColor(dueDate?: string | null, isOverdue?: boolean): string {
  if (!dueDate) return "text-muted";
  if (isOverdue) return "text-red-600 font-semibold";
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (days <= 3) return "text-red-500 font-semibold";
  if (days <= 7) return "text-orange-500 font-medium";
  if (days <= 14) return "text-amber-500";
  return "text-emerald-600";
}

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
  selectable = false,
  selected = false,
  onSelect,
}: {
  task: TaskLike;
  onChange?: () => void;
  readOnly?: boolean;
  showNotes?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, checked: boolean) => void;
}) {
  const [modal, setModal] = useState<"view" | "edit" | null>(null);
  const [unread, setUnread] = useState(task.hasUnread ?? false);

  useEffect(() => { setUnread(task.hasUnread ?? false); }, [task.hasUnread]);

  const blocked = task.dependsOn && task.dependsOn.status !== "COMPLETED";
  const commentCount = task._count?.comments ?? 0;
  const hasNotes = showNotes && task.notes && task.notes.trim();

  function openModal(mode: "view" | "edit") {
    setUnread(false);
    setModal(mode);
  }

  return (
    <div className={`px-4 py-4 sm:px-5 sm:py-5 group hover:bg-slate-50/60 transition-colors rounded-xl border bg-white shadow-card ${selected ? "border-brand-400 ring-1 ring-brand-200" : unread ? "border-l-brand-500 border-l-[3px] border-slate-200" : "border-slate-200"}`}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 flex gap-3">
          {selectable && (
            <div className="pt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => onSelect?.(task.id, e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => openModal("view")} className="text-sm font-semibold text-ink hover:text-brand-600 transition-colors truncate text-left">
                {task.title}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-xs text-muted">
              {task.client && (
                <span className="inline-flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  {task.client.name}
                </span>
              )}
              {(task.assignees?.length ?? 0) > 0 ? (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {task.assignees!.map((a) => a.name).join(", ")}
                  </span>
                </>
              ) : task.assignedTo ? (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    {task.assignedTo.name}
                  </span>
                </>
              ) : null}
              {task.createdBy && <><span className="text-slate-300 hidden sm:inline">&middot;</span><span className="text-slate-400 hidden sm:inline">from {task.createdBy.name}</span></>}
              {task.dueDate && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <span className={`inline-flex items-center gap-1 ${dueDateColor(task.dueDate, task.isOverdue)}`}>
                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {formatDate(task.dueDate)}
                  </span>
                </>
              )}
              {commentCount > 0 && (
                <>
                  <span className="text-slate-300">&middot;</span>
                  <button onClick={() => openModal("view")} className={`transition-colors inline-flex items-center gap-1 ${unread ? "text-brand-700 font-semibold" : "hover:text-brand-600"}`}>
                    <span className="relative">
                      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                      {unread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />}
                    </span>
                    {commentCount}
                  </button>
                </>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
              <span className={`tag ${STATUS_STYLE[task.status] ?? "bg-slate-100 text-slate-500"}`}>{STATUS_LABEL[task.status] ?? task.status}</span>
              {task.isOverdue && <span className="tag bg-red-50 text-red-600">Overdue</span>}
            </div>

            {task.filePath && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                <span className="font-mono text-2xs truncate">{task.filePath}</span>
              </div>
            )}

            {hasNotes && (
              <div className="mt-3 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 sm:px-3.5 sm:py-2.5 border border-slate-100">
                <span className="text-brand-600 font-semibold shrink-0">Note:</span>
                <span className="leading-relaxed">{task.notes}</span>
              </div>
            )}
            {blocked && (
              <p className="text-xs text-amber mt-3 flex items-center gap-1.5">
                <span className="w-4 h-4 inline-flex items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold">!</span>
                Blocked by: {task.dependsOn!.title}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn text-xs px-3 py-1.5 flex-1 sm:flex-none" onClick={() => openModal("view")}>
            View
          </button>
          {!readOnly && (
            <button className="btn btn-primary text-xs px-3 py-1.5 flex-1 sm:flex-none" onClick={() => openModal("edit")}>
              Update
            </button>
          )}
        </div>
      </div>

      {modal && (
        <TaskModal
          taskId={task.id}
          initialMode={modal}
          onClose={() => setModal(null)}
          onChange={onChange}
        />
      )}
    </div>
  );
}
