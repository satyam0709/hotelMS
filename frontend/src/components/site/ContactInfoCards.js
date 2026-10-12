"use client";

import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { motion } from "motion/react";
import { containerVariants, itemVariants } from "@/lib/motion/presets";
import { demoContactSettings } from "@/lib/demo-content";
import { cn } from "@/lib/utils";

const cardStyles = {
  primary: "bg-brand-green text-white border-transparent shadow-[inset_0_2px_4px_rgba(255,255,255,0.25)]",
  warm: "bg-brand-warm text-ink border-transparent",
  muted: "bg-elevated text-ink border border-line",
};

function ContactCard({ icon, title, description, href, variant = "muted" }) {
  const body = (
    <motion.div
      variants={itemVariants}
      className={cn(
        "motion-interactive-card flex h-full flex-col gap-3 rounded-2xl p-6 transition-shadow hover:shadow-soft",
        cardStyles[variant]
      )}
    >
      <div className={cn("flex size-10 items-center justify-center rounded-full", variant === "primary" ? "bg-white/15" : "bg-brand-cream")}>
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className={cn("mt-1 text-sm leading-relaxed", variant === "primary" ? "text-white/85" : "text-muted")}>
          {description}
        </p>
      </div>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
        {body}
      </Link>
    );
  }

  return body;
}

export default function ContactInfoCards({ settings = {} }) {
  const merged = { ...demoContactSettings, ...settings };
  const phone = merged.phone;
  const email = merged.email;
  const address = merged.address;
  const receptionHours = merged.receptionHours;

  const cards = [
    phone
      ? {
          key: "phone",
          title: "Call reception",
          description: phone,
          href: `tel:${phone}`,
          variant: "primary",
          icon: <Phone className="size-5 text-white" />,
        }
      : null,
    email
      ? {
          key: "email",
          title: "Email the team",
          description: email,
          href: `mailto:${email}`,
          variant: "warm",
          icon: <Mail className="size-5 text-brand-green" />,
        }
      : null,
    address
      ? {
          key: "address",
          title: "Visit us",
          description: address,
          href: merged.mapUrl || undefined,
          variant: "muted",
          icon: <MapPin className="size-5 text-brand-green" />,
        }
      : null,
    receptionHours
      ? {
          key: "hours",
          title: "Reception hours",
          description: receptionHours,
          variant: "muted",
          icon: <Clock className="size-5 text-brand-green" />,
        }
      : null,
  ].filter(Boolean);

  if (!cards.length) return null;

  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {cards.map((card) => (
        <ContactCard key={card.key} {...card} />
      ))}
    </motion.div>
  );
}
