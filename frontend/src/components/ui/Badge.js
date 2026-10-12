import { cn } from "@/lib/utils";

export default function Badge({ children, className, tone = "soft" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        tone === "soft" && "bg-accent-soft text-accent",
        tone === "sand" && "bg-sand-soft text-ink",
        tone === "line" && "border border-line bg-elevated text-muted",
        className
      )}
    >
      {children}
    </span>
  );
}
