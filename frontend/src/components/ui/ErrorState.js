import Button from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function ErrorState({
  title = "Unable to load content",
  description = "Please refresh the page or try again in a moment.",
  className,
  onRetry,
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-danger/20 bg-elevated px-6 py-10 text-center",
        className
      )}
      role="alert"
    >
      <h3 className="font-display text-2xl text-ink">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
        {description}
      </p>
      {onRetry ? (
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
