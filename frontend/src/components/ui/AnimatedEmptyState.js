"use client";

import FadeIn from "@/components/motion/FadeIn";
import { cn } from "@/lib/utils";

export default function AnimatedEmptyState({
  title,
  description,
  className,
  action,
}) {
  return (
    <FadeIn direction="scale">
      <div
        className={cn(
          "rounded-3xl border border-dashed border-line bg-elevated/70 px-6 py-12 text-center",
          className
        )}
      >
        <h3 className="font-display text-2xl text-ink">{title}</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
        {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
      </div>
    </FadeIn>
  );
}
