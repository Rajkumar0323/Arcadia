"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronRight, RotateCcw, Sparkles, Timer, TrendingUp, XCircle, Zap } from "lucide-react";
import type { AttemptResult } from "@/lib/types";
import { cn, formatClock } from "@/lib/utils";
import { Button, buttonClasses } from "../ui";
import { CountUp, Ring } from "../widgets";

function verdict(acc: number) {
  if (acc >= 1) return { title: "Flawless!", emoji: "🏆" };
  if (acc >= 0.85) return { title: "Outstanding!", emoji: "🔥" };
  if (acc >= 0.6) return { title: "Nice work!", emoji: "⭐" };
  if (acc >= 0.3) return { title: "Getting there", emoji: "💪" };
  return { title: "Keep practicing", emoji: "🎯" };
}

export function GameResults({
  result,
  accent,
  gradient,
  clubSlug,
  onPlayAgain,
}: {
  result: AttemptResult;
  accent: string;
  gradient: string;
  clubSlug: string;
  onPlayAgain: () => void | Promise<void>;
}) {
  const v = verdict(result.accuracy);
  const stats = [
    { icon: Zap, label: "Points earned", value: <CountUp value={result.pointsEarned} />, color: "text-amber-300" },
    { icon: TrendingUp, label: "Leaderboard", value: <>+<CountUp value={result.leaderboardPoints} /></>, color: "text-violet-300" },
    { icon: Timer, label: "Time", value: formatClock(result.timeTaken), color: "text-cyan-300" },
    { icon: Sparkles, label: "Speed bonus", value: `+${result.speedBonus}`, color: "text-fuchsia-300" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full max-w-2xl">
      <div className="text-center">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 12 }} className="mb-2 text-6xl">
          {v.emoji}
        </motion.div>
        <h1 className="text-3xl font-bold">{v.title}</h1>
        {result.isNewBest && result.previousBest > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.6 }}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1 text-sm font-bold text-ink-950"
          >
            <Sparkles className="h-4 w-4" /> New personal best!
          </motion.div>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Ring value={result.accuracy} size={170} stroke={14} colors={[accent, "#22d3ee"]}>
          <div className="text-center">
            <div className="text-4xl font-black">
              <CountUp value={result.accuracy * 100} format={(n) => `${Math.round(n)}%`} />
            </div>
            <div className="text-xs text-zinc-400">
              {Math.round(result.score * 10) / 10} / {result.maxScore} correct
            </div>
          </div>
        </Ring>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }} className="card p-4 text-center">
            <s.icon className={cn("mx-auto mb-1 h-5 w-5", s.color)} />
            <div className="text-xl font-bold">{s.value}</div>
            <div className="text-[11px] text-zinc-500">{s.label}</div>
          </motion.div>
        ))}
      </div>
      {result.leaderboardPoints === 0 && result.previousBest > 0 && (
        <p className="mt-3 text-center text-xs text-zinc-500">Beat your best ({result.previousBest} pts) to gain leaderboard points.</p>
      )}

      {result.completedQuests.map((q) => (
        <motion.div
          key={q.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="relative mt-4 overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-4 text-center"
        >
          <div className="shimmer absolute inset-0" />
          <div className="relative font-bold text-emerald-200">🎉 Quest complete: {q.title}</div>
          <div className="relative text-sm text-emerald-300">+{q.bonusPoints} bonus points added</div>
        </motion.div>
      ))}

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button size="lg" onClick={onPlayAgain}>
          <RotateCcw className="h-4 w-4" /> Play again
        </Button>
        <Link href={`/clubs/${clubSlug}`} className={buttonClasses("secondary", "lg")}>
          Back to arcade <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="mb-3 text-lg font-bold">Review</h2>
        <ul className="space-y-2">
          {result.review.map((r, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + Math.min(i, 12) * 0.05 }}
              className={cn("rounded-2xl border p-4", r.correct ? "border-emerald-400/25 bg-emerald-500/[0.07]" : "border-rose-400/25 bg-rose-500/[0.07]")}
            >
              <div className="flex gap-3">
                {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />}
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-semibold">{r.label}</div>
                  {r.given !== null && (
                    <div className="mt-1 text-zinc-400">
                      Your answer: <span className={r.correct ? "text-emerald-300" : "text-rose-300"}>{r.given}</span>
                    </div>
                  )}
                  {!r.correct && (
                    <div className="mt-0.5 text-zinc-400">
                      Correct: <span className="text-emerald-300">{r.answer}</span>
                    </div>
                  )}
                  {r.explanation && <div className="mt-1.5 text-xs text-zinc-500">{r.explanation}</div>}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
      <div className={cn("pointer-events-none fixed inset-x-0 bottom-0 h-1 bg-gradient-to-r", gradient)} />
    </motion.div>
  );
}
