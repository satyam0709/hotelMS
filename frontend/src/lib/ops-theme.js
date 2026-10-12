/**
 * Central operations dashboard palette (Aura Haven–style).
 * Used by admin dashboard charts, KPI tiles, and status accents.
 */
export const ops = {
  blue: "#1d4ed8",
  blueSoft: "#dbeafe",
  teal: "#0f766e",
  tealBright: "#14b8a6",
  tealSoft: "#ccfbf1",
  green: "#15803d",
  greenSoft: "#dcfce7",
  bronze: "#9a6b2f",
  bronzeBright: "#b8860b",
  amber: "#d97706",
  amberSoft: "#ffedd5",
  rose: "#e11d48",
  roseSoft: "#ffe4e6",
  gold: "#ca8a04",
  track: "#e7e5e0",
  ink: "#1c1917",
  muted: "#78716c",
};

export const chart = {
  checkIn: ops.blue,
  checkOut: ops.tealBright,
  occupied: ops.teal,
  available: ops.green,
  blocked: ops.amber,
  revenue: ops.bronze,
  occupancyLine: ops.bronzeBright,
  sparkTotal: ops.gold,
  sparkAvailable: ops.green,
  sparkOccupied: ops.tealBright,
  sparkBlocked: ops.rose,
  track: ops.track,
};
