"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Activity, Gamepad2, Gift, Plus, Trophy, UserPlus, Users, UsersRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useApiQuery } from "@/lib/api";
import type { AdminStats } from "@/lib/admin-types";
import { GAME_META } from "@/lib/game-meta";
import { formatNumber, formatPercent, timeAgo } from "@/lib/utils";
import { Avatar, buttonClasses, PageHeader, Skeleton } from "@/components/ui";
import { CountUp, StatCard } from "@/components/widgets";

const tooltipStyle = {
  contentStyle: { background: "#141128", border: "1px solid rgba(255,255,255,.1)", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#a1a1aa" },
  itemStyle: { color: "#f4f4f5" },
};

const REWARD_COLORS: Record<string, string> = {
  UNSCRATCHED: "#d946ef",
  AVAILABLE: "#10b981",
  REDEEMED: "#8b5cf6",
  EXPIRED: "#52525b",
  REVOKED: "#ef4444",
};

function Panel({ title, children, className, action }: { title: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`card p-5 ${className ?? ""}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

export default function AdminDashboard() {
  const { data, isLoading } = useApiQuery<AdminStats>("/api/admin/stats", { refreshInterval: 60_000 });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const t = data.totals;
  const activity = data.activity.map((d) => ({ ...d, label: new Date(d.day).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) }));
  const types = data.gameTypes.map((g) => ({ name: GAME_META[g.type].label, value: g.count, color: GAME_META[g.type].accent }));
  const redemptionRate = t.rewardsIssued ? t.rewardsRedeemed / t.rewardsIssued : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle="Live snapshot of players, games and rewards."
        actions={
          <>
            <Link href="/admin/games/new" className={buttonClasses("primary")}>
              <Plus className="h-4 w-4" /> New game
            </Link>
            <Link href="/admin/seasons" className={buttonClasses("secondary")}>
              Seasons
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={<Users className="h-5 w-5" />} label="Total players" value={<CountUp value={t.users} format={formatNumber} />} sub={`+${t.newUsersWeek} this week`} />
        <StatCard icon={<Activity className="h-5 w-5" />} label="Active this week" value={<CountUp value={t.activeUsersWeek} format={formatNumber} />} gradient="from-emerald-500 to-teal-500" delay={0.05} sub={`${t.users ? Math.round((t.activeUsersWeek / t.users) * 100) : 0}% of players`} />
        <StatCard icon={<Gamepad2 className="h-5 w-5" />} label="Games played" value={<CountUp value={t.attempts} format={formatNumber} />} gradient="from-cyan-500 to-blue-500" delay={0.1} sub={`${formatNumber(t.attemptsWeek)} this week`} />
        <StatCard icon={<Gift className="h-5 w-5" />} label="Rewards issued" value={<CountUp value={t.rewardsIssued} format={formatNumber} />} gradient="from-fuchsia-500 to-pink-500" delay={0.15} sub={`${formatPercent(redemptionRate)} redeemed`} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Activity · last 30 days" className="xl:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gAttempts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} />
                <Area type="monotone" dataKey="attempts" name="Games played" stroke="#22d3ee" strokeWidth={2} fill="url(#gAttempts)" />
                <Area type="monotone" dataKey="signups" name="New players" stroke="#a855f7" strokeWidth={2} fill="url(#gSignups)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Game mix">
          {types.length === 0 ? (
            <p className="py-16 text-center text-sm text-zinc-500">No games yet</p>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={types} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                      {types.map((e) => (
                        <Cell key={e.name} fill={e.color} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {types.map((e) => (
                  <li key={e.name} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: e.color }} />
                    <span className="flex-1 truncate text-zinc-400">{e.name}</span>
                    <span className="font-semibold">{e.value}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Top clubs" className="xl:col-span-2" action={<Link href="/admin/clubs" className="text-xs text-violet-300">Manage</Link>}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topClubs.map((c) => ({ ...c, label: `${c.icon} ${c.name}` }))} margin={{ left: -20, right: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,.05)" vertical={false} />
                <XAxis dataKey="label" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip {...tooltipStyle} cursor={{ fill: "rgba(255,255,255,.04)" }} />
                <Bar dataKey="attempts" name="Plays" radius={[8, 8, 0, 0]}>
                  {data.topClubs.map((c) => (
                    <Cell key={c.id} fill={c.color} />
                  ))}
                </Bar>
                <Bar dataKey="members" name="Members" radius={[8, 8, 0, 0]} fill="rgba(255,255,255,.18)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Rewards">
          <div className="space-y-3">
            {(["UNSCRATCHED", "AVAILABLE", "REDEEMED", "EXPIRED", "REVOKED"] as const).map((s) => {
              const count = data.rewardStatus.find((r) => r.status === s)?.count ?? 0;
              const pct = t.rewardsIssued ? count / t.rewardsIssued : 0;
              return (
                <div key={s}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="capitalize text-zinc-400">{s.toLowerCase()}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/5">
                    <motion.div className="h-full rounded-full" style={{ background: REWARD_COLORS[s] }} initial={{ width: 0 }} animate={{ width: `${pct * 100}%` }} transition={{ duration: 0.8 }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Clubs", value: t.clubs, icon: UsersRound },
              { label: "Seasons live", value: t.activeSeasons, icon: Trophy },
              { label: "Courses", value: t.courses, icon: UserPlus },
            ].map((x) => (
              <div key={x.label} className="rounded-xl bg-white/[0.03] p-2">
                <div className="text-lg font-bold">{x.value}</div>
                <div className="text-[10px] text-zinc-500">{x.label}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top players (all-time XP)" action={<Link href="/admin/users" className="text-xs text-violet-300">All users</Link>}>
          {data.topPlayers.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">No scores yet</p>
          ) : (
            <ol className="space-y-2">
              {data.topPlayers.map((p, i) => (
                <motion.li key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                  <span className="w-6 text-center text-sm font-bold text-zinc-500">{i + 1}</span>
                  <Avatar src={p.imageUrl} name={p.name} size={34} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{p.name}</div>
                    <div className="truncate text-xs text-zinc-500">{p.email}</div>
                  </div>
                  <span className="text-sm font-bold text-amber-300">{formatNumber(p.xp)} XP</span>
                </motion.li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Latest plays">
          {data.recentAttempts.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Nothing played yet</p>
          ) : (
            <ul className="space-y-2">
              {data.recentAttempts.map((a) => {
                const meta = GAME_META[a.game.type];
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/[0.03]">
                    <Avatar src={a.user.imageUrl} name={a.user.name} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">
                        <span className="font-semibold">{a.user.name}</span> <span className="text-zinc-500">played</span> {a.game.title}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500">
                        <meta.icon className="h-3 w-3" /> {a.club.icon} {a.club.name} · {timeAgo(a.createdAt)}
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-amber-300">+{a.pointsEarned}</div>
                      <div className="text-zinc-500">{formatPercent(a.accuracy)}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
