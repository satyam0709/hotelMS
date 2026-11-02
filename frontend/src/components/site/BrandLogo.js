import Image from "next/image";
import { cn } from "@/lib/utils";

export default function BrandLogo({ className = "", priority = false, sizes = "180px" }) {
  return (
    <Image
      src="/assets/exostay-logo.png"
      alt="ExoStay Hotel & Resort"
      width={2172}
      height={724}
      priority={priority}
      sizes={sizes}
      className={cn("block h-10 w-auto max-w-[180px] object-contain", className)}
    />
  );
}
