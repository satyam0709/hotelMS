/** Lightweight markdown helpers for blog/journal content (no HTML input). */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Inline: **bold**, *italic*, [label](https://url) */
export function formatInlineMarkdown(text) {
  const escaped = escapeHtml(text);
  return escaped
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-accent underline underline-offset-2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
}

/**
 * Parse markdown-ish content into typed blocks.
 * Supports: # / ## / ### headings, paragraphs, - lists, > quotes.
 */
export function parseMarkdownBlocks(content) {
  const raw = String(content || "").replace(/\r\n/g, "\n").trim();
  if (!raw) return [];

  const chunks = raw.split(/\n{2,}/);
  const blocks = [];

  for (const chunk of chunks) {
    const lines = chunk.split("\n").map((line) => line.trimEnd());
    const first = lines[0]?.trim() || "";

    if (/^#{1,3}\s+/.test(first) && lines.length === 1) {
      const match = first.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        blocks.push({ type: "heading", level: match[1].length, text: match[2].trim() });
        continue;
      }
    }

    if (lines.every((line) => /^>\s?/.test(line.trim()) || line.trim() === "")) {
      const text = lines
        .map((line) => line.replace(/^>\s?/, "").trim())
        .filter(Boolean)
        .join(" ");
      if (text) {
        blocks.push({ type: "quote", text });
        continue;
      }
    }

    if (lines.every((line) => !line.trim() || /^[-*]\s+/.test(line.trim()))) {
      const items = lines
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => line.replace(/^[-*]\s+/, "").trim())
        .filter(Boolean);
      if (items.length) {
        blocks.push({ type: "list", items });
        continue;
      }
    }

    blocks.push({
      type: "paragraph",
      text: lines.map((line) => line.trim()).filter(Boolean).join(" "),
    });
  }

  return blocks.filter((block) => {
    if (block.type === "list") return block.items.length > 0;
    return Boolean(block.text);
  });
}

export function insertMarkdownSnippet(value, selectionStart, selectionEnd, before, after = "", placeholder = "") {
  const start = selectionStart ?? value.length;
  const end = selectionEnd ?? value.length;
  const selected = value.slice(start, end) || placeholder;
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  const cursor = start + before.length + selected.length + after.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}
