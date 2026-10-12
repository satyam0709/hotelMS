import { cn } from "@/lib/utils";

const STEPS = [
  { id: "search", label: "Dates" },
  { id: "rooms", label: "Rooms" },
  { id: "guest", label: "Guest" },
  { id: "confirm", label: "Confirm" },
];

export default function BookingSteps({ current = "search" }) {
  const currentIndex = Math.max(0, STEPS.findIndex((step) => step.id === current));

  return (
    <ol className="flex flex-wrap items-center gap-2 md:gap-3">
      {STEPS.map((step, index) => {
        const active = index === currentIndex;
        const done = index < currentIndex;
        return (
          <li key={step.id} className="flex items-center gap-2 md:gap-3">
            <span
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium tracking-wide md:text-sm",
                active && "border-accent bg-accent text-white",
                done && "border-accent/30 bg-accent-soft text-accent",
                !active && !done && "border-line bg-elevated text-muted"
              )}
            >
              <span className="tabular-nums">{index + 1}</span>
              {step.label}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="hidden h-px w-6 bg-line sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
