"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { Check, X } from "lucide-react";
import type { GameProps, TrueFalsePayload } from "@/lib/types";

type A = (boolean | null)[];

const swipeVariants = {
  enter: { scale: 0.92, y: 14, opacity: 0 },
  center: { scale: 1, y: 0, opacity: 1 },
  exit: (d: number) => ({ x: d * 520, rotate: d * 28, opacity: 0, transition: { duration: 0.35 } }),
};

function SwipeCard({ text, index, total, onAnswer }: { text: string; index: number; total: number; onAnswer: (v: boolean) => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 220], [-18, 18]);
  const trueOpacity = useTransform(x, [20, 120], [0, 1]);
  const falseOpacity = useTransform(x, [-120, -20], [1, 0]);
  const bg = useTransform(
    x,
    [-160, 0, 160],
    ["rgba(244,63,94,0.22)", "rgba(255,255,255,0.04)", "rgba(16,185,129,0.22)"],
  );

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110 || info.velocity.x > 600) onAnswer(true);
    else if (info.offset.x < -110 || info.velocity.x < -600) onAnswer(false);
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={onDragEnd}
      style={{ x, rotate, backgroundColor: bg }}
      whileDrag={{ scale: 1.03, cursor: "grabbing" }}
      className="absolute inset-0 flex cursor-grab touch-none select-none flex-col items-center justify-center rounded-[2rem] border border-white/15 p-8 text-center shadow-2xl shadow-black/50 backdrop-blur-xl"
    >
      <motion.div style={{ opacity: trueOpacity }} className="absolute left-6 top-6 -rotate-12 rounded-xl border-4 border-emerald-400 px-3 py-1 text-2xl font-black text-emerald-400">
        TRUE
      </motion.div>
      <motion.div style={{ opacity: falseOpacity }} className="absolute right-6 top-6 rotate-12 rounded-xl border-4 border-rose-400 px-3 py-1 text-2xl font-black text-rose-400">
        FALSE
      </motion.div>
      <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
        {index + 1} / {total}
      </div>
      <p className="text-xl font-bold leading-snug sm:text-2xl">{text}</p>
      <div className="mt-8 flex items-center gap-2 text-xs text-zinc-500">← swipe →</div>
    </motion.div>
  );
}

export function TrueFalseGame({ payload, onChange, onFinish }: GameProps<TrueFalsePayload, A>) {
  const total = payload.statements.length;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [answers, setAnswers] = useState<A>(() => payload.statements.map(() => null));

  useEffect(() => onChange(answers), []); // eslint-disable-line react-hooks/exhaustive-deps

  function answer(v: boolean) {
    if (index >= total) return;
    const next = [...answers];
    next[index] = v;
    setAnswers(next);
    onChange(next);
    setDir(v ? 1 : -1);
    setIndex(index + 1);
    if (index + 1 >= total) setTimeout(() => onFinish(next), 350);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") answer(true);
      if (e.key === "ArrowLeft") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center">
      <div className="relative h-[360px] w-full sm:h-[400px]">
        {/* stacked cards behind */}
        {[2, 1].map((offset) =>
          index + offset < total ? (
            <motion.div
              key={`ghost-${index + offset}`}
              initial={false}
              animate={{ scale: 1 - offset * 0.05, y: offset * 14, opacity: 1 - offset * 0.3 }}
              className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/[0.04]"
            />
          ) : null,
        )}
        <AnimatePresence custom={dir}>
          {index < total && (
            <motion.div
              key={index}
              className="absolute inset-0"
              custom={dir}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <SwipeCard text={payload.statements[index].text} index={index} total={total} onAnswer={answer} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex items-center gap-8">
        <motion.button
          whileHover={{ scale: 1.1, rotate: -8 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => answer(false)}
          className="grid h-16 w-16 place-items-center rounded-full border-2 border-rose-400/60 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-900/40"
          aria-label="False"
        >
          <X className="h-8 w-8" strokeWidth={3} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 8 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => answer(true)}
          className="grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-400/60 bg-emerald-500/15 text-emerald-300 shadow-lg shadow-emerald-900/40"
          aria-label="True"
        >
          <Check className="h-8 w-8" strokeWidth={3} />
        </motion.button>
      </div>
    </div>
  );
}
