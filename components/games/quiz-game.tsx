"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SkipForward } from "lucide-react";
import type { GameProps, QuizPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

type A = (number | null)[];
const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function QuizGame({ payload, onChange, onFinish }: GameProps<QuizPayload, A>) {
  const total = payload.questions.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<A>(() => payload.questions.map(() => null));
  const [locked, setLocked] = useState<number | null>(null);
  const q = payload.questions[index];

  useEffect(() => onChange(answers), []); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i: number | null) {
    if (locked !== null) return;
    const next = [...answers];
    next[index] = i;
    setAnswers(next);
    onChange(next);
    setLocked(i ?? -1);
    setTimeout(() => {
      setLocked(null);
      if (index + 1 < total) setIndex(index + 1);
      else onFinish(next);
    }, i === null ? 200 : 650);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) choose(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex gap-1.5">
        {payload.questions.map((_, i) => (
          <motion.div
            key={i}
            className={cn("h-1.5 flex-1 rounded-full", i < index ? "bg-violet-400" : i === index ? "bg-white" : "bg-white/10")}
            animate={i === index ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
            transition={{ duration: 1.4, repeat: i === index ? Infinity : 0 }}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 60, rotateY: -12 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          exit={{ opacity: 0, x: -60, rotateY: 12 }}
          transition={{ type: "spring", stiffness: 200, damping: 24 }}
        >
          <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-300">
            Question {index + 1} of {total}
          </div>
          <h2 className="mb-6 text-xl font-bold leading-snug sm:text-2xl">{q.prompt}</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {q.options.map((opt, i) => {
              const selected = locked === i;
              return (
                <motion.button
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={selected ? { opacity: 1, y: 0, scale: [1, 1.05, 1] } : { opacity: locked !== null ? 0.45 : 1, y: 0 }}
                  transition={{ delay: locked === null ? i * 0.06 : 0 }}
                  whileHover={locked === null ? { scale: 1.02, y: -2 } : {}}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => choose(i)}
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-2xl border p-4 text-left font-medium transition-colors",
                    selected
                      ? "border-transparent bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-xl shadow-violet-900/50"
                      : "border-white/10 bg-white/[0.04] hover:border-violet-400/50 hover:bg-violet-500/10",
                  )}
                >
                  {selected && <span className="shimmer absolute inset-0" />}
                  <span
                    className={cn(
                      "relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold",
                      selected ? "bg-white/25" : "bg-white/10 text-zinc-300 group-hover:bg-violet-500/30",
                    )}
                  >
                    {LETTERS[i]}
                  </span>
                  <span className="relative">{opt}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex justify-center">
        <button onClick={() => choose(null)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300">
          <SkipForward className="h-4 w-4" /> Skip question
        </button>
      </div>
    </div>
  );
}
