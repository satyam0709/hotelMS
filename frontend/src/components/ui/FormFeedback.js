import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FormFeedback({ status, message, className }) {
  if (!message || (status !== "success" && status !== "error")) return null;

  const isError = status === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      className={cn(
        "mt-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm leading-relaxed",
        isError
          ? "border-red-200 bg-red-50 text-red-800"
          : "border-brand-green/25 bg-accent-soft text-brand-green",
        className
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden />
      )}
      <p>{message}</p>
    </div>
  );
}
