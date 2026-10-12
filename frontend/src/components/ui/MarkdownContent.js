import { formatInlineMarkdown, parseMarkdownBlocks } from "@/lib/markdown";

export default function MarkdownContent({ content, className = "" }) {
  const blocks = parseMarkdownBlocks(content);

  if (!blocks.length) {
    return <p className="text-sm text-muted">No content yet.</p>;
  }

  return (
    <div className={`space-y-5 text-base leading-relaxed text-ink/90 ${className}`.trim()}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === "heading") {
          if (block.level === 1) {
            return <h2 key={key} className="font-display text-3xl text-ink">{block.text}</h2>;
          }
          if (block.level === 2) {
            return <h3 key={key} className="font-display text-2xl text-ink">{block.text}</h3>;
          }
          return <h4 key={key} className="font-display text-xl text-ink">{block.text}</h4>;
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={key}
              className="border-l-4 border-accent/40 pl-4 text-muted italic"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }}
            />
          );
        }
        if (block.type === "list") {
          return (
            <ul key={key} className="list-disc space-y-2 pl-5">
              {block.items.map((item, itemIndex) => (
                <li
                  key={`${key}-${itemIndex}`}
                  dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(item) }}
                />
              ))}
            </ul>
          );
        }
        return (
          <p
            key={key}
            dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(block.text) }}
          />
        );
      })}
    </div>
  );
}
