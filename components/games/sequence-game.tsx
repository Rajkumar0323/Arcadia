"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, Reorder, useDragControls } from "framer-motion";
import { ChevronDown, ChevronUp, GripVertical, Lock } from "lucide-react";
import type { GameProps, SequencePayload } from "@/lib/types";
import { Button } from "../ui";
import { cn } from "@/lib/utils";

type Item = { id: number; text: string };
type A = number[][];

function SeqItem({ item, pos, total, move, locked }: { item: Item; pos: number; total: number; move: (dir: -1 | 1) => void; locked: boolean }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      whileDrag={{ scale: 1.04, boxShadow: "0 20px 40px rgba(0,0,0,.5)", zIndex: 10 }}
      className={cn(
        "relative flex items-center gap-3 rounded-2xl border bg-ink-800 p-3 transition-colors",
        locked ? "border-emerald-400/50 bg-emerald-500/10" : "border-white/10",
      )}
    >
      <motion.span
        layout
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-black text-ink-950"
      >
        {pos + 1}
      </motion.span>
      <span className="flex-1 font-medium">{item.text}</span>
      <div className="flex flex-col">
        <button onClick={() => move(-1)} disabled={pos === 0 || locked} className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-20" aria-label="Move up">
          <ChevronUp className="h-4 w-4" />
        </button>
        <button onClick={() => move(1)} disabled={pos === total - 1 || locked} className="rounded p-0.5 text-zinc-500 hover:text-white disabled:opacity-20" aria-label="Move down">
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <span
        onPointerDown={(e) => !locked && controls.start(e)}
        className="cursor-grab touch-none rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-5 w-5" />
      </span>
    </Reorder.Item>
  );
}

export function SequenceGame({ payload, onChange, onFinish }: GameProps<SequencePayload, A>) {
  const total = payload.rounds.length;
  const [round, setRound] = useState(0);
  const [order, setOrder] = useState<Item[]>(payload.rounds[0].items);
  const [answers, setAnswers] = useState<A>(() => payload.rounds.map((r) => r.items.map((i) => i.id)));
  const [locked, setLocked] = useState(false);

  useEffect(() => onChange(answers), []); // eslint-disable-line react-hooks/exhaustive-deps

  function update(next: Item[]) {
    setOrder(next);
    const a = [...answers];
    a[round] = next.map((i) => i.id);
    setAnswers(a);
    onChange(a);
  }

  function move(pos: number, dir: -1 | 1) {
    const next = [...order];
    const target = pos + dir;
    if (target < 0 || target >= next.length) return;
    [next[pos], next[target]] = [next[target], next[pos]];
    update(next);
  }

  function lockOrder() {
    setLocked(true);
    setTimeout(() => {
      setLocked(false);
      if (round + 1 < total) {
        setRound(round + 1);
        setOrder(payload.rounds[round + 1].items);
      } else onFinish(answers);
    }, 700);
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-emerald-300">
        Round {round + 1} of {total}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={round} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}>
          <h2 className="mb-1 text-xl font-bold sm:text-2xl">{payload.rounds[round].prompt}</h2>
          <p className="mb-5 text-sm text-zinc-400">Drag the handles (or use arrows) to put these in the right order.</p>
          <Reorder.Group axis="y" values={order} onReorder={update} className="space-y-2.5">
            {order.map((item, pos) => (
              <SeqItem key={item.id} item={item} pos={pos} total={order.length} move={(d) => move(pos, d)} locked={locked} />
            ))}
          </Reorder.Group>
        </motion.div>
      </AnimatePresence>
      <div className="mt-6 flex justify-center">
        <Button size="lg" onClick={lockOrder} disabled={locked}>
          <Lock className="h-4 w-4" /> Lock order
        </Button>
      </div>
    </div>
  );
}
