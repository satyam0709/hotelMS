"use client";

import { motion } from "motion/react";
import { containerVariants, itemVariants } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

export function MotionSection({ children, className }) {
  return (
    <motion.section
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
    >
      {children}
    </motion.section>
  );
}

export function MotionBlock({ children, className }) {
  return (
    <motion.div className={cn(className)} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
