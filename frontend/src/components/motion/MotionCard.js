"use client";

import { motion } from "motion/react";
import { cardHover, cardTap, hoverBright, smoothSpring } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

export default function MotionCard({ children, className }) {
  return (
    <motion.article
      className={cn("motion-interactive-card", className)}
      initial={false}
      whileHover={{
        y: cardHover.y,
        scale: cardHover.scale,
        filter: hoverBright.filter,
        transition: smoothSpring,
      }}
      whileTap={cardTap}
    >
      {children}
    </motion.article>
  );
}
