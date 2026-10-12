"use client";

import { motion } from "motion/react";
import { cardHover, cardTap, hoverBright, smoothSpring } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

/** Bento / large tile hover (REQ Bento + widget brightness). */
export function MotionSurface({ children, className }) {
  return (
    <motion.div
      className={cn("motion-interactive-card", className)}
      initial={false}
      whileHover={{
        y: cardHover.y,
        scale: 1.01,
        filter: hoverBright.filter,
        transition: smoothSpring,
      }}
      whileTap={cardTap}
    >
      {children}
    </motion.div>
  );
}
