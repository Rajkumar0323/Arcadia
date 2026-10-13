"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, Sparkles, Trophy } from "lucide-react";
import type { QuestView } from "@/lib/types";
import { GAME_META } from "@/lib/game-meta";
import { cn } from "@/lib/utils";
import { ProgressBar } from "./ui";
import { Countdown } from "./widgets";

export function QuestCard({ quest, index = 0, showClub }: { quest: QuestView; index?: number; showClub?: boolean }) {
  const done = quest.games.filter((g) => g.passed).length;
  const total = quest.games.length || 1;
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5",
        quest.completed ? "border-emerald-400/30 bg-emerald-500/10" : "border-white/10 bg-ink-900/80",
      )}
    >
      {quest.completed && <div className="shimmer absolute inset-0 opacity-30" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          {showClub && quest.club && (
            <Link href={`/clubs/${quest.club.slug}`} className="mb-1 inline-flex items-center gap-1 text-xs font-semibold" style={{ color: quest.club.color }}>
              {quest.club.icon} {quest.club.name}
            </Link>
          )}
          <h3 className="flex items-center gap-2 font-bold">
            {quest.completed ? <Trophy className="h-4 w-4 text-emerald-300" /> : <Sparkles className="h-4 w-4 text-fuchsia-300" />}
            {quest.title}
          </h3>
          {quest.description && <p className="mt-1 text-sm text-zinc-400">{quest.description}</p>}
        </div>
        <div className="shrink-0 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 px-3 py-1.5 text-center text-ink-950 shadow-lg shadow-orange-900/30">
          <div className="text-sm font-black leading-none">+{quest.bonusPoints}</div>
          <div className="text-[9px] font-bold uppercase">bonus</div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center gap-3">
        <ProgressBar value={done / total} color={quest.completed ? "#10b981" : undefined} />
        <span className="shrink-0 text-xs font-semibold text-zinc-400">
          {done}/{quest.games.length}
        </span>
      </div>

      <ul className="relative mt-4 space-y-1.5">
        {quest.games.map((g) => {
          const Icon = GAME_META[g.type].icon;
          return (
            <li key={g.id}>
              <Link href={`/play/${g.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition hover:bg-white/5">
                {g.passed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" /> : <Circle className="h-4 w-4 shrink-0 text-zinc-600" />}
                <Icon className="h-4 w-4 shrink-0 text-zinc-500" />
                <span className={cn("truncate", g.passed && "text-zinc-500 line-through")}>{g.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      {quest.endsAt && !quest.completed && <Countdown to={quest.endsAt} className="relative mt-3 text-xs text-zinc-500" />}
    </motion.div>
  );
}
