"use client";

import { motion } from "framer-motion";
import { Crown, Medal } from "lucide-react";
import type { Leaderboard as LB, LeaderboardEntry } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { Avatar, EmptyState } from "./ui";

const PODIUM = [
  { place: 2, height: "h-24", color: "from-zinc-300 to-zinc-500", ring: "ring-zinc-300", delay: 0.15 },
  { place: 1, height: "h-32", color: "from-amber-300 to-yellow-500", ring: "ring-amber-300", delay: 0 },
  { place: 3, height: "h-20", color: "from-orange-400 to-amber-700", ring: "ring-orange-400", delay: 0.3 },
];

function Podium({ entries, meId }: { entries: LeaderboardEntry[]; meId?: string }) {
  return (
    <div className="flex items-end justify-center gap-2 sm:gap-4">
      {PODIUM.map((p) => {
        const e = entries[p.place - 1];
        if (!e) return <div key={p.place} className="w-24 sm:w-32" />;
        return (
          <motion.div
            key={p.place}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: p.delay, type: "spring", stiffness: 120, damping: 14 }}
            className="flex w-24 flex-col items-center sm:w-32"
          >
            {p.place === 1 && (
              <motion.div animate={{ y: [0, -6, 0], rotate: [0, -6, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Crown className="mb-1 h-7 w-7 fill-amber-300 text-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.7)]" />
              </motion.div>
            )}
            <Avatar src={e.user.imageUrl} name={e.user.name} size={p.place === 1 ? 64 : 52} className={cn("ring-4", p.ring)} />
            <div className={cn("mt-2 max-w-full truncate text-center text-sm font-semibold", e.user.id === meId && "text-violet-300")}>{e.user.name}</div>
            <div className="text-xs font-bold text-zinc-400">{formatNumber(e.points)} pts</div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              transition={{ delay: p.delay + 0.2, duration: 0.5 }}
              className={cn("mt-2 grid w-full place-items-center rounded-t-2xl bg-gradient-to-b text-3xl font-black text-ink-950/80", p.color, p.height)}
            >
              {p.place}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
}

function Row({ e, me, index }: { e: LeaderboardEntry; me?: boolean; index: number }) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index, 15) * 0.03 }}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5",
        me ? "border border-violet-400/40 bg-violet-500/15" : "hover:bg-white/[0.04]",
      )}
    >
      <span className="w-8 text-center text-sm font-bold tabular-nums text-zinc-400">
        {e.rank <= 3 ? <Medal className={cn("mx-auto h-5 w-5", ["text-amber-300", "text-zinc-300", "text-orange-400"][e.rank - 1])} /> : e.rank}
      </span>
      <Avatar src={e.user.imageUrl} name={e.user.name} size={34} />
      <span className="flex-1 truncate text-sm font-semibold">
        {e.user.name} {me && <span className="ml-1 text-xs text-violet-300">(you)</span>}
      </span>
      <span className="text-sm font-bold tabular-nums">{formatNumber(e.points)}</span>
    </motion.li>
  );
}

export function LeaderboardView({ data, meId }: { data: LB; meId?: string }) {
  if (!data.entries.length) {
    return <EmptyState icon="🏁" title="No scores yet" description="Be the first to play a game and claim the #1 spot!" />;
  }
  const meInTop = data.me && data.entries.some((e) => e.user.id === data.me!.user.id);
  return (
    <div className="space-y-6">
      <div className="card overflow-hidden px-2 pt-6">
        <Podium entries={data.entries} meId={meId} />
      </div>
      <ul className="card space-y-1 p-2">
        {data.entries.slice(3).map((e, i) => (
          <Row key={e.user.id} e={e} me={e.user.id === meId} index={i} />
        ))}
        {data.entries.length <= 3 && <li className="px-3 py-4 text-center text-sm text-zinc-500">Only {data.entries.length} player(s) so far.</li>}
      </ul>
      {data.me && !meInTop && (
        <div className="pb-safe sticky bottom-20 md:bottom-4">
          <ul className="rounded-2xl border border-white/10 bg-ink-900/95 p-2 backdrop-blur-xl">
            <Row e={data.me} me index={0} />
          </ul>
        </div>
      )}
    </div>
  );
}
