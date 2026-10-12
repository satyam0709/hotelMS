"use client";

import { motion } from "motion/react";
import { fadeUpVariants, scaleInVariants, smoothSpring } from "@/lib/motion/presets";
import { cn } from "@/lib/utils";

const presets = {
  up: fadeUpVariants,
  down: {
    hidden: { opacity: 0, y: -18, filter: "blur(8px)" },
    show: { opacity: 1, y: 0, filter: "blur(0px)" },
  },
  left: {
    hidden: { opacity: 0, x: -24, filter: "blur(8px)" },
    show: { opacity: 1, x: 0, filter: "blur(0px)" },
  },
  scale: scaleInVariants,
};

export default function FadeIn({
  children,
  className,
  direction = "up",
  delay = 0,
  once = true,
}) {
  const variant = presets[direction] || presets.up;

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="show"
      viewport={{ once, amount: 0.25 }}
      variants={{
        hidden: variant.hidden,
        show: {
          ...variant.show,
          transition: {
            ...smoothSpring,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
