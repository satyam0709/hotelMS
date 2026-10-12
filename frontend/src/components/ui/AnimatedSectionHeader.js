"use client";

import { motion } from "motion/react";
import { containerVariants, itemVariants } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

export default function AnimatedSectionHeader({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  action,
}) {
  return (
    <motion.div
      className={cn(
        "mb-10 flex flex-col gap-4 md:mb-12",
        align === "center" && "items-center text-center",
        align === "left" && "md:flex-row md:items-end md:justify-between",
        className
      )}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      variants={containerVariants}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow ? (
          <motion.p
            variants={itemVariants}
            className="mb-3 text-xs font-semibold tracking-[0.22em] text-accent uppercase"
          >
            {eyebrow}
          </motion.p>
        ) : null}
        <motion.h2
          variants={itemVariants}
          className="font-display text-3xl leading-tight text-ink md:text-5xl"
        >
          {title}
        </motion.h2>
        {description ? (
          <motion.p
            variants={itemVariants}
            className="mt-4 max-w-xl text-base leading-relaxed text-muted md:text-lg"
          >
            {description}
          </motion.p>
        ) : null}
      </div>
      {action ? (
        <motion.div variants={itemVariants} className="shrink-0">
          {action}
        </motion.div>
      ) : null}
    </motion.div>
  );
}
