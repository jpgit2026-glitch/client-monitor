"use client";

import { useState, useRef, useEffect, ReactNode } from "react";

type Employee = { id: string; name: string; role: string };

export default function MentionInput({
  value,
  onChange,
  onSubmit,
  disabled,
  employees,
  placeholder = "Write a note...",
  className = "input w-full text-sm",
}: {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  employees: Employee[];
  placeholder?: string;
  className?: string;
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStart, setMentionStart] = useState(-1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [mentionQuery]);

  function detectMention(val: string, cursorPos: number) {
    const textBeforeCursor = val.slice(0, cursorPos);
    const lastAt = textBeforeCursor.lastIndexOf("@");

    if (lastAt !== -1 && (lastAt === 0 || val[lastAt - 1] === " ")) {
      const query = textBeforeCursor.slice(lastAt + 1);
      setMentionStart(lastAt);
      setMentionQuery(query);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    const cursorPos = e.target.selectionStart ?? val.length;
    detectMention(val, cursorPos);
  }

  function selectEmployee(emp: Employee) {
    const cursorPos = inputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, mentionStart);
    const after = value.slice(cursorPos);
    const newVal = `${before}@${emp.name} ${after}`;
    onChange(newVal);
    setShowDropdown(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDropdown && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectEmployee(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    } else if (e.key === "Enter") {
      onSubmit();
    }
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      {showDropdown && filtered.length > 0 && (
        <div className="absolute bottom-full left-0 mb-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-40 overflow-y-auto">
          {filtered.map((emp, i) => (
            <button
              key={emp.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                i === selectedIndex ? "bg-slate-100" : "hover:bg-slate-50"
              }`}
              onMouseDown={(e) => {
                e.preventDefault();
                selectEmployee(emp);
              }}
            >
              <span className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {emp.name.charAt(0)}
              </span>
              <span className="font-medium text-ink">{emp.name}</span>
              <span className="text-xs text-muted ml-auto uppercase">{emp.role}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function renderMessageWithMentions(
  message: string,
  employees: { name: string }[]
): ReactNode {
  if (!employees.length) return message;

  const sorted = [...employees].map((e) => e.name).sort((a, b) => b.length - a.length);
  const escaped = sorted.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const pattern = new RegExp(`(@(?:${escaped.join("|")}))(?=\\s|$|[.,;!?])`, "g");

  const parts = message.split(pattern);
  if (parts.length === 1) return message;

  const nameSet = new Set(sorted.map((n) => `@${n}`));
  return parts.map((part, i) =>
    nameSet.has(part) ? (
      <span key={i} className="text-brand-700 font-semibold">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}
