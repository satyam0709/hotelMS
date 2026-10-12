import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  navCta: "btn-nav-cta font-semibold !text-black hover:!text-white",
  primary:
    "btn-ops-primary bg-[linear-gradient(135deg,#2c6700_0%,#3d8608_55%,#92cd00_140%)] !text-[#f7f6ef] shadow-[0_10px_28px_rgba(44,103,0,0.28)] hover:brightness-105 hover:!text-white",
  secondary:
    "bg-white text-ink border border-line shadow-sm hover:border-[#9a6b2f]/55 hover:bg-[linear-gradient(135deg,rgba(255,207,121,0.22),rgba(146,205,0,0.12))] hover:shadow-[0_10px_28px_rgba(154,107,47,0.16)]",
  ghost:
    "bg-transparent text-ink hover:bg-brand-warm/25 hover:text-brand-green",
  ghostLight:
    "bg-white/10 text-white border border-white/25 backdrop-blur-sm hover:bg-white/18 hover:border-white/40 hover:!text-white",
  soft:
    "bg-accent-soft text-accent hover:bg-[linear-gradient(135deg,#92cd00,#2c6700)] hover:!text-white hover:shadow-accent",
  bronze:
    "bg-[linear-gradient(135deg,#9a6b2f_0%,#b8860b_100%)] !text-white shadow-[0_10px_28px_rgba(154,107,47,0.3)] hover:brightness-105",
  danger:
    "bg-rose-600 !text-white hover:bg-rose-700 shadow-[0_10px_24px_rgba(225,29,72,0.25)]",
};

const sizes = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-base",
};

export default function Button({
  href,
  children,
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}) {
  const isNavCta = variant === "navCta";

  const classes = cn(
    "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold tracking-wide disabled:pointer-events-none disabled:opacity-50",
    isNavCta ? variants.navCta : "ui-button-motion",
    !isNavCta && (variants[variant] || variants.primary),
    sizes[size] || sizes.md,
    className
  );

  const content = (
    <span className="relative z-[3] inline-flex items-center justify-center gap-2 text-inherit">
      {children}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {content}
    </button>
  );
}
