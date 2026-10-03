"use client";

import { useState, useRef, useEffect } from "react";

type Employee = { id: string; name: string; role: string };

export default function EmployeeMultiSelect({
  employees,
  selected,
  onChange,
}: {
  employees: Employee[];
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filtered = employees.filter(
    (emp) =>
      !selected.has(emp.id) &&
      (emp.name.toLowerCase().includes(query.toLowerCase()) ||
        emp.role.toLowerCase().includes(query.toLowerCase()))
  );

  function add(id: string) {
    const next = new Set(selected);
    next.add(id);
    onChange(next);
    setQuery("");
  }

  function remove(id: string) {
    const next = new Set(selected);
    next.delete(id);
    onChange(next);
  }

  const selectedEmps = employees.filter((e) => selected.has(e.id));

  return (
    <div ref={ref} className="relative">
      <div
        className="input w-full min-h-[42px] flex flex-wrap items-center gap-1.5 py-1.5 px-2.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        {selectedEmps.map((emp) => (
          <span
            key={emp.id}
            className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium pl-2 pr-1 py-0.5 rounded-md border border-brand-200"
          >
            {emp.name}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); remove(emp.id); }}
              className="w-4 h-4 inline-flex items-center justify-center rounded hover:bg-brand-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={selectedEmps.length === 0 ? "Search employees..." : ""}
          className="flex-1 min-w-[80px] outline-none bg-transparent text-sm text-ink placeholder:text-slate-400"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filtered.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => add(emp.id)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-slate-50 transition-colors"
            >
              <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {emp.name.charAt(0)}
              </span>
              <span className="text-sm text-ink">{emp.name}</span>
              <span className="text-xs text-muted ml-auto">{emp.role}</span>
            </button>
          ))}
        </div>
      )}

      {open && filtered.length === 0 && query && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-3">
          <p className="text-sm text-muted text-center">No matching employees</p>
        </div>
      )}
    </div>
  );
}
