"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Flame, Gamepad2, Gift, Sparkles, Trophy, Users } from "lucide-react";
import { useApiQuery } from "@/lib/api";
import type { Dashboard, Me } from "@/lib/types";
import { GAME_META, levelTitle } from "@/lib/game-meta";
import { cn, formatNumber, formatPercent, hexToRgba, ordinal, timeAgo } from "@/lib/utils";
import { buttonClasses, EmptyState, Skeleton } from "@/components/ui";
import { CountUp, Countdown, Ring, StatCard } from "@/components/widgets";
import { QuestCard } from "@/components/quest-card";

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default function DashboardPage() {
  const { data: me } = useApiQuery<Me>("/api/me");
  const { data, isLoading } = useApiQuery<Dashboard>("/api/me/dashboard");

  return (
    <div className="space-y-8">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/15 to-transparent p-6 sm:p-8"
      >
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-fuchsia-500/30 blur-3xl animate-pulse-glow" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-200">{greeting()} 👋</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">{me?.user.name ?? "Player"}</h1>
            <p className="mt-2 text-sm text-zinc-300">
              {me ? `${levelTitle(me.stats.level.level)} · ${formatNumber(me.stats.level.nextLevelXp - me.stats.level.xp)} XP to level ${me.stats.level.level + 1}` : "Loading your stats…"}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/clubs" className={buttonClasses("primary")}>
                <Gamepad2 className="h-4 w-4" /> Play now
              </Link>
              {(data?.unscratched ?? 0) > 0 && (
                <Link href="/rewards" className={buttonClasses("secondary")}>
                  <Gift className="h-4 w-4 text-fuchsia-300" /> {data!.unscratched} card{data!.unscratched > 1 ? "s" : ""} to scratch
                </Link>
              )}
            </div>
          </div>
          <Ring value={me?.stats.level.progress ?? 0} size={128} stroke={10}>
            <div className="text-center">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Level</div>
              <div className="text-4xl font-black">{me?.stats.level.level ?? "–"}</div>
            </div>
          </Ring>
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Sparkles className="h-5 w-5" />} label="Total XP" value={me ? <CountUp value={me.stats.level.xp} format={(n) => formatNumber(n)} /> : "–"} delay={0} />
        <StatCard icon={<Gamepad2 className="h-5 w-5" />} label="Games played" value={me?.stats.gamesPlayed ?? "–"} gradient="from-cyan-500 to-blue-500" delay={0.05} />
        <StatCard icon={<Flame className="h-5 w-5" />} label="Quests completed" value={me?.stats.questsCompleted ?? "–"} gradient="from-amber-500 to-orange-500" delay={0.1} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards ready" value={me ? me.stats.rewardsAvailable + me.stats.unscratched : "–"} gradient="from-fuchsia-500 to-pink-500" delay={0.15} />
      </section>

      {/* My clubs */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">My clubs</h2>
          <Link href="/clubs" className="inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200">
            Explore <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading && !data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36" />
            ))}
          </div>
        ) : !data?.clubs.length ? (
          <EmptyState
            icon={<Users className="h-7 w-7" />}
            title="You haven't joined a club yet"
            description="Clubs are where the arcades live. Join one to start playing and appear on its leaderboard."
            action={
              <Link href="/clubs" className={buttonClasses("primary")}>
                Browse clubs
              </Link>
            }
          />
        ) : (
          <div className="no-scrollbar -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
            {data.clubs.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ y: -4 }} className="min-w-[260px] snap-start">
                <Link
                  href={`/clubs/${c.slug}`}
                  className="relative block h-full overflow-hidden rounded-3xl border p-5"
                  style={{ borderColor: hexToRgba(c.color, 0.35), background: `linear-gradient(140deg, ${hexToRgba(c.color, 0.25)}, transparent 70%)` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.icon}</span>
                    <div className="min-w-0">
                      <div className="truncate font-bold">{c.name}</div>
                      {c.activeSeason ? (
                        <Countdown to={c.activeSeason.endsAt} className="text-xs text-zinc-400" prefix={`${c.activeSeason.name} ·`} />
                      ) : (
                        <div className="text-xs text-zinc-500">No active season</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-xs text-zinc-400">Your rank</div>
                      <div className="text-3xl font-black" style={{ color: c.color }}>
                        {c.myRank ? ordinal(c.myRank) : "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-zinc-400">Season points</div>
                      <div className="text-lg font-bold">{formatNumber(c.myPoints)}</div>
                      <div className="text-[11px] text-zinc-500">{c.totalPlayers} players</div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-5">
        {/* Quests */}
        <section className="lg:col-span-3">
          <h2 className="mb-4 text-xl font-bold">Active quests</h2>
          {!data?.quests.length ? (
            <EmptyState icon="🗺️" title="No active quests" description="Join a club to unlock its quests and bonus points." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {data.quests.map((q, i) => (
                <QuestCard key={q.id} quest={q} index={i} showClub />
              ))}
            </div>
          )}
        </section>

        {/* Recent */}
        <section className="lg:col-span-2">
          <h2 className="mb-4 text-xl font-bold">Recent activity</h2>
          <div className="card divide-y divide-white/5">
            {!data?.recent.length && <div className="p-6 text-center text-sm text-zinc-500">Your games will show up here.</div>}
            {data?.recent.map((a, i) => {
              const meta = GAME_META[a.gameType];
              return (
                <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <Link href={`/play/${a.gameId}`} className="flex items-center gap-3 p-3.5 transition hover:bg-white/[0.03]">
                    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br", meta.gradient)}>
                      <meta.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{a.gameTitle}</div>
                      <div className="text-xs text-zinc-500">
                        {a.clubName} · {timeAgo(a.createdAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-300">+{a.pointsEarned}</div>
                      <div className="text-xs text-zinc-500">{formatPercent(a.accuracy)}</div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <Link href="/profile" className={buttonClasses("ghost", "sm", "mt-3")}>
            <Trophy className="h-4 w-4" /> View full history
          </Link>
        </section>
      </div>
    </div>
  );
}
