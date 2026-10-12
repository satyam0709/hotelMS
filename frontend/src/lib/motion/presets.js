/**
 * Site-wide motion presets (aligned with REQ references: widget stagger/spring,
 * Animated Components blur+layout, Bento hover, carousel brightness, etc.).
 */

export const smoothSpring = {
  type: "spring",
  stiffness: 380,
  damping: 32,
  mass: 0.8,
};

export const softSpring = {
  type: "spring",
  stiffness: 160,
  damping: 24,
};

export const barSpring = {
  type: "spring",
  stiffness: 150,
  damping: 15,
};

export const easeOut = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

export const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: softSpring,
  },
};

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: smoothSpring,
  },
};

export const scaleInVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: smoothSpring },
};

export const cardHover = {
  y: -6,
  scale: 1.02,
  transition: smoothSpring,
};

export const cardTap = {
  scale: 0.98,
  transition: { duration: 0.12 },
};

export const hoverBright = {
  filter: "brightness(1.06) saturate(1.08)",
  transition: { duration: 0.22 },
};
