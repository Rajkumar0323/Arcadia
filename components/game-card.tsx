"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Play, Star, Timer } from "lucide-react";
import type { GameSummary } from "@/lib/types";
import { DIFFICULTY_META, GAME_META } from "@/lib/game-meta";
import { cn, formatPercent } from "@/lib/utils";

export function GameCard({ game, locked, index = 0 }: { game: GameSummary; locked?: boolean; index?: number }) {
  const meta = GAME_META[game.type];
  const diff = DIFFICULTY_META[game.difficulty];
  const Inner = (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 150, damping: 18 }}
      whileHover={locked ? {} : { y: -6 }}
      whileTap={locked ? {} : { scale: 0.98 }}
      className={cn("group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 p-4", locked && "opacity-60")}
    >
      <div className={cn("absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br opacity-25 blur-2xl transition-opacity group-hover:opacity-50", meta.gradient)} />
      <div className="relative flex items-start justify-between">
        <motion.div
          whileHover={{ rotate: 12, scale: 1.1 }}
          className={cn("grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br shadow-lg", meta.gradient)}
        >
          <meta.icon className="h-6 w-6 text-white" />
        </motion.div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide", diff.className)}>{diff.label}</span>
      </div>
      <div className="relative mt-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{meta.label}</div>
        <h3 className="mt-0.5 line-clamp-1 font-bold">{game.title}</h3>
        <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-400">{game.description}</p>
      </div>
      <div className="relative mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-zinc-400">
          <span className="inline-flex items-center gap-1 font-semibold text-amber-300">
            <Star className="h-3.5 w-3.5 fill-amber-300" /> {game.points}
          </span>
          {game.timeLimit && (
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3.5 w-3.5" /> {game.timeLimit}s
            </span>
          )}
          {game.myBest && <span className="text-emerald-300">Best {formatPercent(game.myBest.accuracy)}</span>}
        </div>
        <span className={cn("grid h-9 w-9 place-items-center rounded-full bg-white/10 transition group-hover:bg-white group-hover:text-ink-950")}>
          {locked ? <Lock className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
        </span>
      </div>
    </motion.div>
  );
  return locked ? <div>{Inner}</div> : <Link href={`/play/${game.id}`}>{Inner}</Link>;
}
