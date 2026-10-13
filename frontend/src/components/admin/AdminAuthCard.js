import { ArrowLeft } from "lucide-react";
import Button from "@/components/ui/Button";

export default function AdminAuthCard({
  eyebrow = "ExoStay",
  title,
  description,
  children,
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--gradient-hero-dark)] px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgba(146,205,0,0.28), transparent 42%), radial-gradient(circle at 80% 70%, rgba(255,207,121,0.22), transparent 40%)",
        }}
      />
      <div className="relative w-full max-w-md">
        <div className="mb-4 flex justify-start">
          <Button href="/" variant="ghostLight" size="sm" className="rounded-xl">
            <ArrowLeft className="size-4" aria-hidden />
            Back to website
          </Button>
        </div>
        <div className="overflow-hidden rounded-[1.75rem] border border-white/15 bg-elevated/95 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
          <p className="text-xs font-semibold tracking-[0.22em] text-accent uppercase">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl text-ink">{title}</h1>
          {description ? <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p> : null}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
