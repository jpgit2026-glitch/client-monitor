"use client";

export type ViewMode = "cards" | "table";

export default function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => onChange("cards")}
        className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "cards" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        title="Card view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      <button
        onClick={() => onChange("table")}
        className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${view === "table" ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-50"}`}
        title="Table view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18M3 6h18M3 18h18" />
        </svg>
      </button>
    </div>
  );
}
