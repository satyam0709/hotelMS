import AnimatedEmptyState from "@/components/ui/AnimatedEmptyState";

export default function EmptyState({
  title = "Nothing to show yet",
  description = "We could not load this section right now.",
  className,
  action,
}) {
  return (
    <AnimatedEmptyState
      title={title}
      description={description}
      className={className}
      action={action}
    />
  );
}
