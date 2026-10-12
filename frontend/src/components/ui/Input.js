import { cn } from "@/lib/utils";

export default function Input({
  label,
  id,
  className,
  inputClassName,
  error,
  ...props
}) {
  const inputId = id || props.name;
  return (
    <label className={cn("flex w-full flex-col gap-1.5", className)} htmlFor={inputId}>
      {label ? (
        <span className="text-xs font-medium tracking-[0.08em] text-muted uppercase">
          {label}
        </span>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border border-line bg-elevated px-4 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:shadow-[0_0_0_3px_var(--focus-ring)]",
          error && "border-danger",
          inputClassName
        )}
        {...props}
      />
      {error ? <span className="text-xs text-danger">{error}</span> : null}
    </label>
  );
}
