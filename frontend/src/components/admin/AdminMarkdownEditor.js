"use client";

import { useRef, useState } from "react";
import MarkdownContent from "@/components/ui/MarkdownContent";
import { insertMarkdownSnippet } from "@/lib/markdown";

const TOOLS = [
  { id: "h2", label: "H2", before: "## ", after: "", placeholder: "Section title" },
  { id: "h3", label: "H3", before: "### ", after: "", placeholder: "Subsection" },
  { id: "bold", label: "Bold", before: "**", after: "**", placeholder: "bold text" },
  { id: "italic", label: "Italic", before: "*", after: "*", placeholder: "italic text" },
  { id: "list", label: "List", before: "- ", after: "", placeholder: "List item" },
  { id: "quote", label: "Quote", before: "> ", after: "", placeholder: "Quote" },
  { id: "link", label: "Link", before: "[", after: "](https://)", placeholder: "label" },
  { id: "break", label: "¶", before: "\n\n", after: "", placeholder: "" },
];

export default function AdminMarkdownEditor({
  label = "Body",
  value,
  onChange,
  rows = 12,
  required = false,
}) {
  const ref = useRef(null);
  const [mode, setMode] = useState("write");

  function applyTool(tool) {
    const el = ref.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const result = insertMarkdownSnippet(value, start, end, tool.before, tool.after, tool.placeholder);
    onChange(result.value);
    requestAnimationFrame(() => {
      if (!ref.current) return;
      ref.current.focus();
      ref.current.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">{label}</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${mode === "write" ? "bg-accent text-white" : "border border-line text-ink"}`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${mode === "preview" ? "bg-accent text-white" : "border border-line text-ink"}`}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === "write" ? (
        <>
          <div className="flex flex-wrap gap-1">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => applyTool(tool)}
                className="rounded-lg border border-line bg-elevated px-2 py-1 text-[11px] font-medium text-ink hover:bg-accent-soft"
                title={tool.id}
              >
                {tool.label}
              </button>
            ))}
          </div>
          <textarea
            ref={ref}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={rows}
            required={required}
            placeholder={"Write with blank lines between paragraphs.\n\n## Heading\n\n**Bold** and *italic*\n\n- List item"}
            className="w-full rounded-xl border border-line bg-elevated px-3 py-2 font-mono text-sm text-ink"
          />
          <p className="text-[11px] text-muted">
            Markdown: headings, bold, italic, lists, quotes, links. Blank line = new paragraph.
          </p>
        </>
      ) : (
        <div className="min-h-48 rounded-xl border border-line bg-elevated p-4">
          <MarkdownContent content={value} />
        </div>
      )}
    </div>
  );
}
