"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { GameProps, MemoryPayload } from "@/lib/types";
import { cn } from "@/lib/utils";

type A = { moves: number; matched: number };

export function MemoryGame({ payload, onChange, onFinish }: GameProps<MemoryPayload, A>) {
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [wrong, setWrong] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const busy = useRef(false);
  const finished = useRef(false);

  useEffect(() => onChange({ moves: 0, matched: 0 }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const cols = payload.cards.length <= 8 ? "grid-cols-4" : payload.cards.length <= 12 ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-4 sm:grid-cols-6";

  function flip(id: number) {
    if (busy.current || flipped.includes(id) || finished.current) return;
    const card = payload.cards.find((c) => c.id === id)!;
    if (matched.has(card.pairId)) return;
    const next = [...flipped, id];
    setFlipped(next);
    if (next.length < 2) return;

    busy.current = true;
    const m = moves + 1;
    setMoves(m);
    const [a, b] = next.map((cid) => payload.cards.find((c) => c.id === cid)!);
    if (a.pairId === b.pairId) {
      const nm = new Set(matched).add(a.pairId);
      setTimeout(() => {
        setMatched(nm);
        setFlipped([]);
        busy.current = false;
        onChange({ moves: m, matched: nm.size });
        if (nm.size === payload.pairCount) {
          finished.current = true;
          setTimeout(() => onFinish({ moves: m, matched: nm.size }), 700);
        }
      }, 380);
    } else {
      onChange({ moves: m, matched: matched.size });
      setTimeout(() => setWrong(next), 450);
      setTimeout(() => {
        setFlipped([]);
        setWrong([]);
        busy.current = false;
      }, 1000);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-5 flex items-center justify-between text-sm">
        <span className="rounded-full bg-white/5 px-3 py-1 font-semibold">
          Moves <span className="tabular-nums text-cyan-300">{moves}</span>
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1 font-semibold">
          Pairs <span className="tabular-nums text-emerald-300">{matched.size}</span>/{payload.pairCount}
        </span>
      </div>

      <div className={cn("grid gap-2.5 sm:gap-3", cols)}>
        {payload.cards.map((card, i) => {
          const isMatched = matched.has(card.pairId);
          const isUp = flipped.includes(card.id) || isMatched;
          const isWrong = wrong.includes(card.id);
          return (
            <motion.button
              key={card.id}
              initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: i * 0.03, type: "spring", stiffness: 260, damping: 18 }}
              onClick={() => flip(card.id)}
              className="perspective aspect-[3/4] w-full"
              aria-label={isUp ? card.text : "Hidden card"}
            >
              <motion.div
                className="preserve-3d relative h-full w-full"
                animate={{ rotateY: isUp ? 180 : 0, x: isWrong ? [0, -8, 8, -6, 6, 0] : 0, scale: isMatched ? [1, 1.08, 1] : 1 }}
                transition={{ rotateY: { duration: 0.45, ease: "easeInOut" }, x: { duration: 0.4 }, scale: { duration: 0.4 } }}
              >
                {/* back */}
                <div className="backface-hidden absolute inset-0 grid place-items-center overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-cyan-500/30 via-blue-600/30 to-violet-600/30 shadow-lg">
                  <div className="grid-bg absolute inset-0 opacity-60" />
                  <span className="relative text-2xl font-black text-white/70 sm:text-3xl">?</span>
                </div>
                {/* front */}
                <div
                  className={cn(
                    "backface-hidden absolute inset-0 grid place-items-center rounded-2xl border p-2 text-center text-sm font-bold [transform:rotateY(180deg)] sm:text-base",
                    isMatched
                      ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.45)]"
                      : isWrong
                        ? "border-rose-400/70 bg-rose-500/20"
                        : "border-white/20 bg-ink-700",
                  )}
                >
                  {isMatched && <Sparkles className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-emerald-300" />}
                  <span className="break-words">{card.text}</span>
                </div>
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
