"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import { Clock } from "lucide-react";
import { cn, timeLeft } from "@/lib/utils";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function Countdown({ to, className, prefix = "Ends in" }: { to: string; className?: string; prefix?: string }) {
  const now = useNow(1000);
  const t = timeLeft(to, now);
  return (
    <span className={cn("inline-flex items-center gap-1.5 tabular-nums", className)}>
      <Clock className="h-3.5 w-3.5" />
      {t.diff > 0 ? `${prefix} ${t.label}` : "Ended"}
    </span>
  );
}

export function CountUp({ value, duration = 1.2, className, format = (n: number) => String(Math.round(n)) }: { value: number; duration?: number; className?: string; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = format(v);
      },
    });
    return () => controls.stop();
  }, [inView, value, duration, format]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {format(0)}
    </span>
  );
}

export function Ring({
  value,
  size = 96,
  stroke = 8,
  children,
  colors = ["#8b5cf6", "#d946ef"],
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
  colors?: [string, string];
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const id = `ring-${colors.join("").replace(/#/g, "")}`;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, value))) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  gradient = "from-violet-500 to-fuchsia-500",
  delay = 0,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  gradient?: string;
  delay?: number;
  sub?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring", stiffness: 140, damping: 18 }}
      whileHover={{ y: -3 }}
      className="card relative overflow-hidden p-4 sm:p-5"
    >
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br opacity-20 blur-2xl", gradient)} />
      <div className={cn("mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg", gradient)}>{icon}</div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-xs font-medium text-zinc-400">{label}</div>
      {sub && <div className="mt-1 text-xs text-zinc-500">{sub}</div>}
    </motion.div>
  );
}
