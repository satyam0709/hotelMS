import { cn } from "@/lib/utils";

export default function LoadingState({ className, label = "Loading" }) {
  return (
    <div
      className={cn(
        "flex min-h-40 items-center justify-center rounded-3xl border border-line bg-elevated/80 px-6 py-10",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="size-4 animate-spin rounded-full border-2 border-accent/20 border-t-accent" />
        {label}
      </div>
    </div>
  );
}
