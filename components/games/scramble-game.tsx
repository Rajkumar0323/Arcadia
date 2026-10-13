"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Delete, Lightbulb, RotateCcw, Shuffle } from "lucide-react";
import type { GameProps, ScramblePayload } from "@/lib/types";
import { Button } from "../ui";
import { cn } from "@/lib/utils";

type A = (string | null)[];

function shuffleIds(n: number) {
  const a = Array.from({ length: n }, (_, i) => i);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ScrambleGame({ payload, onChange, onFinish }: GameProps<ScramblePayload, A>) {
  const total = payload.words.length;
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<A>(() => payload.words.map(() => null));
  const [picked, setPicked] = useState<number[]>([]);
  const [poolOrder, setPoolOrder] = useState<number[]>(() => payload.words[0].scrambled.split("").map((_, i) => i));
  const [showHint, setShowHint] = useState(false);
  const [locking, setLocking] = useState(false);

  const word = payload.words[index];
  const letters = useMemo(() => word.scrambled.split(""), [word]);
  const current = picked.map((i) => letters[i]).join("");

  useEffect(() => onChange(answers), []); // eslint-disable-line react-hooks/exhaustive-deps

  function pick(id: number) {
    if (locking || picked.includes(id) || picked.length >= word.length) return;
    setPicked([...picked, id]);
  }
  function unpick(id: number) {
    if (locking) return;
    setPicked(picked.filter((p) => p !== id));
  }

  function lockIn(skip = false) {
    if (locking) return;
    const next = [...answers];
    next[index] = skip ? null : current;
    setAnswers(next);
    onChange(next);
    setLocking(true);
    setTimeout(() => {
      setLocking(false);
      setShowHint(false);
      setPicked([]);
      if (index + 1 < total) {
        setIndex(index + 1);
        setPoolOrder(payload.words[index + 1].scrambled.split("").map((_, i) => i));
      } else onFinish(next);
    }, skip ? 150 : 700);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Backspace") setPicked((p) => p.slice(0, -1));
      else if (e.key === "Enter" && picked.length === word.length) lockIn();
      else if (/^[a-z0-9]$/i.test(e.key)) {
        const id = poolOrder.find((i) => !picked.includes(i) && letters[i].toLowerCase() === e.key.toLowerCase());
        if (id !== undefined) pick(id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const tileBase = "grid h-12 w-12 place-items-center rounded-xl text-xl font-black shadow-lg sm:h-14 sm:w-14 sm:text-2xl";

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-300">
        Word {index + 1} of {total}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <div className="mb-6 min-h-[28px]">
            {word.hint &&
              (showHint ? (
                <motion.p initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-zinc-300">
                  💡 {word.hint}
                </motion.p>
              ) : (
                <button onClick={() => setShowHint(true)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-amber-300">
                  <Lightbulb className="h-4 w-4" /> Show hint
                </button>
              ))}
          </div>

          <LayoutGroup id={`scramble-${index}`}>
            {/* answer slots */}
            <motion.div
              className="mb-8 flex flex-wrap justify-center gap-2"
              animate={locking ? { scale: [1, 1.08, 1] } : {}}
              transition={{ duration: 0.5 }}
            >
              {Array.from({ length: word.length }).map((_, slot) => {
                const id = picked[slot];
                return (
                  <div key={slot} className="grid h-12 w-12 place-items-center rounded-xl border-2 border-dashed border-white/15 sm:h-14 sm:w-14">
                    {id !== undefined && (
                      <motion.button
                        layoutId={`tile-${id}`}
                        onClick={() => unpick(id)}
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className={cn(tileBase, locking ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-ink-950" : "bg-gradient-to-br from-amber-400 to-orange-500 text-ink-950")}
                      >
                        {letters[id]}
                      </motion.button>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* pool */}
            <div className="mb-8 flex min-h-[3.5rem] flex-wrap justify-center gap-2">
              {poolOrder.map((id) =>
                picked.includes(id) ? (
                  <div key={id} className="h-12 w-12 rounded-xl bg-white/[0.03] sm:h-14 sm:w-14" />
                ) : (
                  <motion.button
                    key={id}
                    layoutId={`tile-${id}`}
                    onClick={() => pick(id)}
                    whileHover={{ y: -4, rotate: -4 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className={cn(tileBase, "border border-white/15 bg-white/10 text-white hover:bg-white/20")}
                  >
                    {letters[id]}
                  </motion.button>
                ),
              )}
            </div>
          </LayoutGroup>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button variant="secondary" size="icon" onClick={() => setPoolOrder(shuffleIds(letters.length))} title="Shuffle">
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => setPicked((p) => p.slice(0, -1))} title="Backspace">
          <Delete className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => setPicked([])} title="Clear">
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button onClick={() => lockIn()} disabled={picked.length !== word.length || locking} className="min-w-[120px]">
          Lock in
        </Button>
        <Button variant="ghost" onClick={() => lockIn(true)} disabled={locking}>
          Skip
        </Button>
      </div>
    </div>
  );
}
