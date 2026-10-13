"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Search, Star, Timer } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub, AdminGameRow } from "@/lib/admin-types";
import type { GameType } from "@/lib/types";
import { DIFFICULTY_META, GAME_META, GAME_TYPES } from "@/lib/game-meta";
import { cn, formatNumber } from "@/lib/utils";
import { startNavProgress } from "@/components/nav-progress";
import { buttonClasses, EmptyState, Input, PageHeader, Select, Skeleton, Switch } from "@/components/ui";

export default function AdminGamesPage() {
  const router = useRouter();
  const api = useApi();
  const [clubId, setClubId] = useState("");
  const [type, setType] = useState<GameType | "">("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ ...(clubId && { clubId }), ...(type && { type }), ...(q && { q }) });
  const { data, isLoading, isValidating, mutate } = useApiQuery<AdminGameRow[]>(`/api/admin/games?${params}`);
  const { data: clubs } = useApiQuery<AdminClub[]>("/api/admin/clubs");

  async function toggle(g: AdminGameRow) {
    const flip = (rows?: AdminGameRow[]) => (rows ?? []).map((r) => (r.id === g.id ? { ...r, isActive: !g.isActive } : r));
    try {
      // Flip the switch instantly; roll back automatically if the request fails.
      await mutate(
        async (rows) => {
          await api.patch(`/api/admin/games/${g.id}`, { isActive: !g.isActive });
          return flip(rows);
        },
        { optimisticData: flip, rollbackOnError: true, revalidate: false },
      );
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Arcade"
        title="Games"
        subtitle="Create quizzes, swipe cards, memory games, scrambles, sequences and fill-in-the-blanks."
        actions={
          <Link href="/admin/games/new" className={buttonClasses("primary")}>
            <Plus className="h-4 w-4" /> New game
          </Link>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title…" className="pl-10" />
        </div>
        <Select value={clubId} onChange={(e) => setClubId(e.target.value)}>
          <option value="">All clubs</option>
          {clubs?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value as GameType | "")}>
          <option value="">All types</option>
          {GAME_TYPES.map((t) => (
            <option key={t} value={t}>
              {GAME_META[t].label}
            </option>
          ))}
        </Select>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-96" />
      ) : !data?.length ? (
        <EmptyState icon="🕹️" title="No games found" description="Create a game or adjust the filters." />
      ) : (
        <div className={cn("card overflow-x-auto transition-opacity", isValidating && "opacity-60")}>
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Game</th>
                <th className="px-4 py-3 font-semibold">Club</th>
                <th className="px-4 py-3 font-semibold">Difficulty</th>
                <th className="px-4 py-3 font-semibold">Reward</th>
                <th className="px-4 py-3 text-right font-semibold">Plays</th>
                <th className="px-4 py-3 text-right font-semibold">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((g, i) => {
                const m = GAME_META[g.type];
                return (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i, 20) * 0.02 }}
                    onClick={() => {
                      startNavProgress();
                      router.push(`/admin/games/${g.id}`);
                    }}
                    className="cursor-pointer transition hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br", m.gradient)}>
                          <m.icon className="h-4 w-4 text-white" />
                        </span>
                        <div>
                          <div className="font-semibold">{g.title}</div>
                          <div className="text-xs text-zinc-500">{m.label}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {g.club.icon} {g.club.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-bold", DIFFICULTY_META[g.difficulty].className)}>{DIFFICULTY_META[g.difficulty].label}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> {g.points}
                      </span>
                      {g.timeLimit && (
                        <span className="ml-3 inline-flex items-center gap-1 text-zinc-500">
                          <Timer className="h-3.5 w-3.5" /> {g.timeLimit}s
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatNumber(g._count.attempts)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Switch checked={g.isActive} onChange={() => toggle(g)} />
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
