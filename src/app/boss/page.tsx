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
  const [filter, setFilter] = useState<"ALL" | "ACCOUNTING" | "LIAISON">("ALL");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const qs = filter === "ALL" ? "" : `?role=${filter}`;
    fetch(`/api/employees${qs}`)
      .then((r) => r.json())
      .then((d) => setRows(d.employees ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Team Overview</h1>
          <p className="text-sm text-ink/60">Pick an employee to see their full workload.</p>
        </div>
        <div className="flex items-center gap-4">
          <a href="/api/excel/export" className="btn text-xs">
            Export to Excel
          </a>
          <ImportButton />
        </div>
      </div>

      <div className="flex gap-2">
        {(["ALL", "ACCOUNTING", "LIAISON"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`btn text-xs ${filter === f ? "bg-ink text-paper" : ""}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Role</th>
              <th>Tasks</th>
              <th>Completed</th>
              <th>Pending</th>
              <th>Overdue</th>
              <th>Progress</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="text-ink/40">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={8} className="text-ink/40">
                  No employees yet — add them under Employees.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.name}</td>
                <td className="font-mono text-xs text-ink/60">{r.role}</td>
                <td>{r.total}</td>
                <td>{r.completed}</td>
                <td>{r.pending}</td>
                <td className={r.overdue > 0 ? "text-rust font-medium" : ""}>{r.overdue}</td>
                <td className="font-mono">{r.progress}%</td>
                <td>
                  <Link href={`/boss/employee/${r.id}`} className="text-xs text-ledger-600 hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
      {busy ? "Importing…" : "Import from Excel"}
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={onFile} />
      {msg && <span className="ml-2 text-ink/50 normal-case">{msg}</span>}
    </label>
  );
}
