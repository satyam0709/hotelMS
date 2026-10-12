import { cn } from "@/lib/utils";

export default function Container({ as: Tag = "div", className, children, ...props }) {
  return (
    <Tag className={cn("container-shell", className)} {...props}>
      {children}
    </Tag>
  );
}
