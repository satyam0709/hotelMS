"use client";

import Button from "@/components/ui/Button";

export default function PrintButton({ label = "Print", className }) {
  return (
    <Button type="button" variant="secondary" className={className} onClick={() => window.print()}>
      {label}
    </Button>
  );
}
