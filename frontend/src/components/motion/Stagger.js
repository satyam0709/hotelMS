"use client";

import { motion } from "motion/react";
import { containerVariants, itemVariants, smoothSpring } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

export function Stagger({ children, className, delay = 0.06, stagger = 0.09 }) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18 }}
      variants={{
        hidden: containerVariants.hidden,
        show: {
          ...containerVariants.show,
          transition: { staggerChildren: stagger, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }) {
  return (
    <motion.div
      className={cn(className)}
      variants={itemVariants}
      whileHover={{ y: -4, transition: smoothSpring }}
    >
      {children}
    </motion.div>
  );
}
