"use client";

import { useState, useEffect } from "react";
import TaskModal from "./task-modal";
import { TaskLike } from "./task-row";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", IN_PROGRESS: "In progress", WAITING_FOR_CLIENT: "Waiting",
  FOR_REVIEW: "For review", FOR_BILLING: "For billing", FOR_FILING: "For filing", COMPLETED: "Done", CANCELLED: "Cancelled",
};
const STATUS_DOT: Record<string, string> = {
  PENDING: "bg-slate-400", IN_PROGRESS: "bg-brand-500", WAITING_FOR_CLIENT: "bg-amber-500",
  FOR_REVIEW: "bg-blue-500", FOR_BILLING: "bg-indigo-500", FOR_FILING: "bg-violet-500", COMPLETED: "bg-emerald-500", CANCELLED: "bg-slate-300",
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
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isRecentlyUpdated(task: TaskLike): boolean {
  if (!task.updatedAt) return false;
  const updated = new Date(task.updatedAt).getTime();
  const now = Date.now();
  return now - updated < 2 * 60 * 60 * 1000; // 2 hours
}

export default function TaskTable({
  tasks,
  onChange,
  selectable = false,
  selected,
  onSelect,
  showAssignee = false,
}: {
  tasks: TaskLike[];
  onChange?: () => void;
  selectable?: boolean;
  selected?: Set<string>;
  onSelect?: (id: string, checked: boolean) => void;
  showAssignee?: boolean;
}) {
  const [modalTask, setModalTask] = useState<{ id: string; mode: "view" | "edit" } | null>(null);

  if (tasks.length === 0) return null;

  return (
    <>
      <div className="hidden md:block card overflow-x-auto">
        <table className="text-sm [&_td]:py-1.5 [&_th]:py-1.5">
          <thead>
            <tr>
              {selectable && <th className="w-8"></th>}
              <th className="w-4"></th>
              <th>Task</th>
              <th>Client</th>
              {showAssignee && <th>Assigned</th>}
              <th className="w-32 whitespace-nowrap">Currently with</th>
              <th className="w-32">Status</th>
              <th className="w-24">Due</th>
              <th className="w-8 text-center">
                <svg className="w-3.5 h-3.5 inline text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <CompactRow
                key={t.id}
                task={t}
                onOpen={(mode) => setModalTask({ id: t.id, mode })}
                selectable={selectable}
                selected={selected?.has(t.id) ?? false}
                onSelect={onSelect}
                showAssignee={showAssignee}
                onChange={onChange}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-0.5">
        {tasks.map((t) => (
          <MobileCompactRow
            key={t.id}
            task={t}
            onOpen={(mode) => setModalTask({ id: t.id, mode })}
            selectable={selectable}
            selected={selected?.has(t.id) ?? false}
            onSelect={onSelect}
            onChange={onChange}
          />
        ))}
      </div>

      {modalTask && (
        <TaskModal
          taskId={modalTask.id}
          initialMode={modalTask.mode}
          onClose={() => setModalTask(null)}
          onChange={onChange}
        />
      )}
    </>
  );
}

function CompactRow({
  task, onOpen, selectable, selected, onSelect, showAssignee, onChange,
}: {
  task: TaskLike;
  onOpen: (mode: "view" | "edit") => void;
  selectable: boolean;
  selected: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  showAssignee: boolean;
  onChange?: () => void;
}) {
  const [unread, setUnread] = useState(task.hasUnread ?? false);
  const [status, setStatus] = useState(task.status);
  useEffect(() => { setUnread(task.hasUnread ?? false); }, [task.hasUnread]);
  useEffect(() => { setStatus(task.status); }, [task.status]);

  const [currentHandlerId, setCurrentHandlerId] = useState(task.currentHandler?.id ?? "");
  useEffect(() => { setCurrentHandlerId(task.currentHandler?.id ?? ""); }, [task.currentHandler?.id]);

  const commentCount = task._count?.comments ?? 0;
  const recent = isRecentlyUpdated(task);
  const assigneeList = task.assignees?.length ? task.assignees : task.assignedTo ? [{ id: "", name: task.assignedTo.name }] : [];

  function handleClick() {
    setUnread(false);
    onOpen("view");
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onChange?.();
  }

  async function handleHandlerChange(id: string) {
    setCurrentHandlerId(id);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentHandlerId: id || null }),
    });
    onChange?.();
  }

  return (
    <tr
      className={`cursor-pointer hover:bg-slate-50 transition-colors ${selected ? "bg-brand-50" : recent ? "bg-yellow-50/60" : unread ? "bg-brand-50/40" : ""}`}
      onClick={handleClick}
    >
      {selectable && (
        <td className="w-8" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(task.id, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </td>
      )}
      <td className="w-4 px-0">
        {unread && <span className="inline-block w-2 h-2 bg-brand-500 rounded-full" />}
        {!unread && recent && <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full" />}
      </td>
      <td className="font-medium truncate max-w-[280px]">
        {task.title}
      </td>
      <td className="text-muted truncate max-w-[140px]">{task.client?.name ?? "—"}</td>
      {showAssignee && (
        <td className="text-muted truncate max-w-[100px]">
          {task.assignees?.length ? task.assignees.map((a: any) => a.name.split(" ")[0]).join(", ") : task.assignedTo?.name?.split(" ")[0] ?? "—"}
        </td>
      )}
      <td onClick={(e) => e.stopPropagation()}>
        <select
          value={currentHandlerId}
          onChange={(e) => handleHandlerChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
        >
          <option value="">—</option>
          {assigneeList.filter((a: any) => a.id).map((a: any) => (
            <option key={a.id} value={a.id}>{a.name.split(" ")[0]}</option>
          ))}
        </select>
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-xs border border-slate-200 rounded-md px-1.5 py-1 bg-white text-slate-700 cursor-pointer hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
        >
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </td>
      <td className={`text-xs ${dueDateColor(task.dueDate, task.isOverdue)}`}>
        {task.dueDate ? formatDate(task.dueDate) : "—"}
      </td>
      <td className="text-center">
        {commentCount > 0 && (
          <span className={`text-xs inline-flex items-center gap-1 ${unread ? "text-red-600 font-semibold" : "text-muted"}`}>
            <span className="relative">
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              {unread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </span>
            {commentCount}
          </span>
        )}
      </td>
    </tr>
  );
}

function MobileCompactRow({
  task, onOpen, selectable, selected, onSelect, onChange,
}: {
  task: TaskLike;
  onOpen: (mode: "view" | "edit") => void;
  selectable: boolean;
  selected: boolean;
  onSelect?: (id: string, checked: boolean) => void;
  onChange?: () => void;
}) {
  const [unread, setUnread] = useState(task.hasUnread ?? false);
  const [status, setStatus] = useState(task.status);
  useEffect(() => { setUnread(task.hasUnread ?? false); }, [task.hasUnread]);
  useEffect(() => { setStatus(task.status); }, [task.status]);

  const commentCount = task._count?.comments ?? 0;
  const recent = isRecentlyUpdated(task);

  function handleClick() {
    setUnread(false);
    onOpen("view");
  }

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    onChange?.();
  }

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors border ${selected ? "bg-brand-50 border-brand-300" : recent ? "bg-yellow-50/60 border-yellow-200" : unread ? "border-l-brand-500 border-l-[3px] border-slate-100" : "border-slate-100"}`}
    >
      {selectable && (
        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(task.id, e.target.checked)}
            className="w-3.5 h-3.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
          />
        </div>
      )}
      {unread && <span className="w-2 h-2 bg-brand-500 rounded-full shrink-0" />}
      {!unread && recent && <span className="w-2 h-2 bg-yellow-400 rounded-full shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink truncate">
          {task.title}
        </div>
        <div className="text-[11px] text-muted truncate mt-0.5">
          {task.client?.name}
          {task.currentHandler && <> · <span className="text-brand-600 font-medium">{task.currentHandler.name.split(" ")[0]}</span></>}
          {task.dueDate && <> · <span className={dueDateColor(task.dueDate, task.isOverdue)}>{formatDate(task.dueDate)}</span></>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="text-[10px] border border-slate-200 rounded px-1 py-0.5 bg-white text-slate-600 cursor-pointer"
        >
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {commentCount > 0 && (
          <span className={`text-[10px] inline-flex items-center gap-0.5 ${unread ? "text-red-600 font-semibold" : "text-muted"}`}>
            <span className="relative">
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
              {unread && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />}
            </span>
            {commentCount}
          </span>
        )}
        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
      </div>
    </div>
  );
}
