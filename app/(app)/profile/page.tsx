"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, CheckCircle2, Flame, Gamepad2, Gift, Sparkles, Users, XCircle } from "lucide-react";
import { useApiQuery } from "@/lib/api";
import type { GameType, Me } from "@/lib/types";
import { GAME_META, levelTitle } from "@/lib/game-meta";
import { cn, formatClock, formatDate, formatNumber, formatPercent, timeAgo } from "@/lib/utils";
import { Avatar, EmptyState, ProgressBar, Skeleton } from "@/components/ui";
import { CountUp, Ring, StatCard } from "@/components/widgets";

interface AttemptRow {
  id: string;
  gameId: string;
  gameTitle: string;
  gameType: GameType;
  club: { name: string; slug: string; icon: string; color: string };
  accuracy: number;
  pointsEarned: number;
  timeTaken: number;
  passed: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: me } = useApiQuery<Me>("/api/me");
  const { data: attempts, isLoading } = useApiQuery<AttemptRow[]>("/api/me/attempts");

  if (!me) return <Skeleton className="h-64 rounded-3xl" />;
  const lvl = me.stats.level;

  return (
    <div className="space-y-8">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-violet-600/25 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
          <Ring value={lvl.progress} size={132} stroke={8}>
            <Avatar src={me.user.imageUrl} name={me.user.name} size={104} />
          </Ring>
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">
              Level {lvl.level} · {levelTitle(lvl.level)}
            </div>
            <h1 className="mt-1 text-3xl font-bold">{me.user.name}</h1>
            <p className="text-sm text-zinc-400">{me.user.email}</p>
            <div className="mt-1 inline-flex items-center gap-1 text-xs text-zinc-500">
              <Calendar className="h-3.5 w-3.5" /> Joined {formatDate(me.user.createdAt)}
            </div>
            <div className="mt-4 max-w-md">
              <div className="mb-1 flex justify-between text-xs text-zinc-400">
                <span>
                  <CountUp value={lvl.xp} format={(n) => formatNumber(n)} /> XP
                </span>
                <span>{formatNumber(lvl.nextLevelXp)} XP</span>
              </div>
              <ProgressBar value={lvl.progress} />
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Gamepad2 className="h-5 w-5" />} label="Games played" value={me.stats.gamesPlayed} gradient="from-cyan-500 to-blue-500" />
        <StatCard icon={<Flame className="h-5 w-5" />} label="Quests completed" value={me.stats.questsCompleted} gradient="from-amber-500 to-orange-500" delay={0.05} />
        <StatCard icon={<Users className="h-5 w-5" />} label="Clubs joined" value={me.stats.clubsJoined} delay={0.1} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards" value={me.stats.rewardsAvailable + me.stats.unscratched} gradient="from-fuchsia-500 to-pink-500" delay={0.15} />
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Sparkles className="h-5 w-5 text-violet-300" /> Game history
        </h2>
        {isLoading && !attempts ? (
          <Skeleton className="h-64" />
        ) : !attempts?.length ? (
          <EmptyState icon="🎮" title="No games played yet" description="Join a club and play your first game!" />
        ) : (
          <div className="card divide-y divide-white/5 overflow-hidden">
            {attempts.map((a, i) => {
              const meta = GAME_META[a.gameType];
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 15) * 0.03 }}>
                  <Link href={`/play/${a.gameId}`} className="flex items-center gap-3 p-3.5 transition hover:bg-white/[0.03] sm:gap-4">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br", meta.gradient)}>
                      <meta.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.gameTitle}</div>
                      <div className="text-xs text-zinc-500">
                        <span style={{ color: a.club.color }}>
                          {a.club.icon} {a.club.name}
                        </span>{" "}
                        · {timeAgo(a.createdAt)} · {formatClock(a.timeTaken)}
                      </div>
                    </div>
                    <div className="hidden items-center gap-1 text-xs sm:flex">
                      {a.passed ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                      {formatPercent(a.accuracy)}
                    </div>
                    <div className="w-14 text-right text-sm font-bold text-amber-300">+{a.pointsEarned}</div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
