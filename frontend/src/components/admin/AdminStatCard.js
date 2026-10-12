import { cn } from "@/lib/utils";

export default function AdminStatCard({ label, value, hint, className }) {
  return (
    <div className={cn("rounded-2xl border border-line bg-elevated p-5 shadow-soft", className)}>
      <p className="text-xs font-semibold tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}
