import { cn } from "@/lib/utils";

const TONES = {
  success: "bg-emerald-50 text-emerald-800 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  danger: "bg-red-50 text-red-800 border-red-200",
  neutral: "bg-slate-50 text-slate-700 border-slate-200",
  info: "bg-sky-50 text-sky-900 border-sky-200",
};

function toneForStatus(status) {
  const value = String(status || "").toUpperCase();
  if (["CONFIRMED", "PAID", "CONVERTED", "CLOSED", "ACTIVE"].includes(value)) return "success";
  if (["PENDING", "PENDING_PAYMENT", "NEW", "CONTACTED"].includes(value)) return "warning";
  if (["CANCELLED", "FAILED", "NO_SHOW", "REJECTED"].includes(value)) return "danger";
  if (["CHECKED_IN", "IN_PROGRESS"].includes(value)) return "info";
  return "neutral";
}

export default function StatusBadge({ status, className }) {
  const label = String(status || "—").replaceAll("_", " ");
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase",
        TONES[toneForStatus(status)],
        className
      )}
    >
      {label}
    </span>
  );
}
