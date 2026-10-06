"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  name: string;
  role: string;
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  progress: number;
};

export default function BossPage() {
  const [filter, setFilter] = useState<"ALL" | "DIRECTOR" | "ADMIN" | "ACCOUNTING" | "LIAISON" | "IT" | "HR">("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter === "ALL" ? "?all=1" : `?role=${filter}`;
    fetch(`/api/employees${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.employees ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6 sm:space-y-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-ink">Team Overview</h1>
          <p className="text-sm text-muted mt-1">Pick an employee to see their full workload.</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/api/excel/export" className="btn text-xs">
            Export
          </a>
          <ImportButton />
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {(["ALL", "DIRECTOR", "ADMIN", "ACCOUNTING", "LIAISON", "IT", "HR"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn text-xs whitespace-nowrap ${filter === f ? "bg-brand-600 text-white border-brand-600 hover:bg-brand-700" : ""}`}
          >
            {f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card overflow-x-auto">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th className="text-center">Tasks</th>
              <th className="text-center">Done</th>
              <th className="text-center">Pending</th>
              <th className="text-center">Overdue</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="text-muted text-center py-10">Loading...</td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-muted text-center py-10">No employees yet — add them under Employees.</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                      {r.name.charAt(0)}
                    </div>
                    <span className="font-medium">{r.name}</span>
                  </div>
                </td>
                <td>
                  <span className="tag bg-brand-50 text-brand-700">
                    {r.role.charAt(0) + r.role.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="text-center font-medium">{r.total}</td>
                <td className="text-center">{r.completed}</td>
                <td className="text-center">{r.pending}</td>
                <td className={`text-center ${r.overdue > 0 ? "text-rust font-semibold" : ""}`}>{r.overdue}</td>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="progress-bar flex-1 w-20">
                      <div className="progress-bar-fill" style={{ width: `${r.progress}%` }} />
                    </div>
                    <span className="text-xs text-muted font-medium w-8 text-right">{r.progress}%</span>
                  </div>
                </td>
                <td>
                  <Link href={`/boss/employee/${r.id}`} className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors">
                    View &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && <p className="text-sm text-muted text-center py-10">Loading...</p>}
        {!loading && rows.length === 0 && <p className="text-sm text-muted text-center py-10">No employees yet.</p>}
        {rows.map((r) => (
          <Link key={r.id} href={`/boss/employee/${r.id}`} className="block card-elevated p-4 active:bg-slate-50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="font-medium text-sm text-ink">{r.name}</div>
                  <span className="tag bg-brand-50 text-brand-700 mt-0.5">{r.role.charAt(0) + r.role.slice(1).toLowerCase()}</span>
                </div>
              </div>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-sm font-semibold text-ink">{r.total}</div>
                <div className="text-2xs text-muted">Tasks</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{r.completed}</div>
                <div className="text-2xs text-muted">Done</div>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{r.pending}</div>
                <div className="text-2xs text-muted">Pending</div>
              </div>
              <div>
                <div className={`text-sm font-semibold ${r.overdue > 0 ? "text-rust" : "text-ink"}`}>{r.overdue}</div>
                <div className="text-2xs text-muted">Overdue</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5 mt-3">
              <div className="progress-bar flex-1 h-2">
                <div className="progress-bar-fill h-2" style={{ width: `${r.progress}%` }} />
              </div>
              <span className="text-xs text-muted font-semibold w-8 text-right">{r.progress}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ImportButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/excel/import", { method: "POST", body: form });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(d.error ?? "Import failed.");
      return;
    }
    setMsg(`Imported: ${d.created} new, ${d.updated} updated.`);
    e.target.value = "";
  }

  return (
    <label className="btn text-xs cursor-pointer">
      {busy ? "Importing..." : "Import"}
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
      {msg && <span className="ml-2 text-muted text-2xs">{msg}</span>}
    </label>
  );
}
