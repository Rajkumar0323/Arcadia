"use client";

import { motion } from "framer-motion";

const ITEMS = [
  { e: "🎮", x: "8%", y: "18%", d: 0, s: 1 },
  { e: "🏆", x: "78%", y: "12%", d: 0.6, s: 1.2 },
  { e: "🧠", x: "65%", y: "62%", d: 1.2, s: 0.9 },
  { e: "⚡", x: "18%", y: "70%", d: 0.3, s: 1.1 },
  { e: "🎟️", x: "42%", y: "38%", d: 0.9, s: 0.8 },
  { e: "⭐", x: "88%", y: "80%", d: 1.5, s: 0.9 },
];

export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl animate-pulse-glow" />
      <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-fuchsia-600/20 blur-3xl animate-pulse-glow [animation-delay:1s]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl animate-pulse-glow [animation-delay:2s]" />
      {ITEMS.map((it, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl drop-shadow-[0_0_18px_rgba(168,85,247,0.6)]"
          style={{ left: it.x, top: it.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.85, scale: it.s, y: [0, -18, 0], rotate: [0, 8, -6, 0] }}
          transition={{
            opacity: { delay: it.d, duration: 0.6 },
            scale: { delay: it.d, type: "spring" },
            y: { duration: 5 + i, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 7 + i, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {it.e}
        </motion.div>
      ))}
    </div>
  );
}
