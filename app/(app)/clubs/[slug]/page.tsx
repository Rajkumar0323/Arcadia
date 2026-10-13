"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Gamepad2, LogOut, Map, Plus, Trophy, Users } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { ClubDetail, GameType, Leaderboard, Me, SeasonLite } from "@/lib/types";
import { GAME_META, GAME_TYPES } from "@/lib/game-meta";
import { cn, formatNumber, hexToRgba, ordinal } from "@/lib/utils";
import { Button, ConfirmModal, EmptyState, Select, Skeleton, Tabs } from "@/components/ui";
import { Countdown } from "@/components/widgets";
import { GameCard } from "@/components/game-card";
import { QuestCard } from "@/components/quest-card";
import { LeaderboardView } from "@/components/leaderboard";

type Tab = "arcade" | "quests" | "leaderboard";

export default function ClubPage() {
  const { slug } = useParams<{ slug: string }>();
  const api = useApi();
  const { data: club, isLoading, error, mutate } = useApiQuery<ClubDetail>(`/api/clubs/${slug}`);
  const { data: me } = useApiQuery<Me>("/api/me");
  const [tab, setTab] = useState<Tab>("arcade");
  const [typeFilter, setTypeFilter] = useState<GameType | "ALL">("ALL");
  const [season, setSeason] = useState("current");
  const [busy, setBusy] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { data: seasons } = useApiQuery<SeasonLite[]>(tab === "leaderboard" ? `/api/clubs/${slug}/seasons` : null);
  const { data: board, isLoading: boardLoading, isValidating: boardRefreshing } = useApiQuery<Leaderboard>(
    tab === "leaderboard" ? `/api/clubs/${slug}/leaderboard?season=${season}` : null,
  );

  const games = useMemo(() => (club?.games ?? []).filter((g) => typeFilter === "ALL" || g.type === typeFilter), [club, typeFilter]);
  const presentTypes = useMemo(() => GAME_TYPES.filter((t) => club?.games.some((g) => g.type === t)), [club]);

  async function join() {
    setBusy(true);
    try {
      await api.post(`/api/clubs/${slug}/join`);
      toast.success(`You joined ${club?.name}!`);
      // Unlock the arcade immediately; the full refresh (rank, counts) lands in the background.
      void mutate(club && { ...club, isMember: true, memberCount: club.memberCount + 1 }, { revalidate: true });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function leave() {
    setBusy(true);
    try {
      await api.del(`/api/clubs/${slug}/leave`);
      toast.success("You left the club");
      setConfirmLeave(false);
      void mutate(club && { ...club, isMember: false, memberCount: Math.max(0, club.memberCount - 1) }, { revalidate: true });
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState icon="🔍" title="Club not found" description={errorMessage(error)} />;
  if (isLoading || !club) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 rounded-3xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/clubs" className="inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All clubs
      </Link>

      {/* Banner */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          borderColor: hexToRgba(club.color, 0.35),
          background: club.coverImage
            ? `linear-gradient(90deg, rgba(6,5,13,.92), rgba(6,5,13,.55)), center/cover url(${club.coverImage})`
            : `linear-gradient(135deg, ${hexToRgba(club.color, 0.45)}, ${hexToRgba(club.color, 0.08)} 70%)`,
        }}
      >
        <div className="grid-bg absolute inset-0 opacity-30" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl animate-pulse-glow" style={{ background: hexToRgba(club.color, 0.5) }} />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ y: [0, -8, 0], rotate: [0, 4, -4, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-white/20 bg-black/30 text-5xl backdrop-blur sm:h-24 sm:w-24"
            >
              {club.icon}
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold sm:text-4xl">{club.name}</h1>
              <p className="mt-1 max-w-xl text-sm text-zinc-300">{club.description}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-300">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> {formatNumber(club.memberCount)} members
                </span>
                <span className="inline-flex items-center gap-1">
                  <Gamepad2 className="h-3.5 w-3.5" /> {club.gameCount} games
                </span>
                {club.activeSeason && <Countdown to={club.activeSeason.endsAt} prefix={`${club.activeSeason.name} ends in`} />}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {club.isMember && club.myStanding && (
              <div className="rounded-2xl border border-white/15 bg-black/30 px-4 py-3 text-center backdrop-blur">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Season rank</div>
                <div className="text-2xl font-black" style={{ color: club.color }}>
                  {club.myStanding.rank ? ordinal(club.myStanding.rank) : "—"}
                </div>
                <div className="text-xs text-zinc-400">{formatNumber(club.myStanding.points)} pts</div>
              </div>
            )}
            {club.isMember ? (
              <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
                <LogOut className="h-4 w-4" /> Leave
              </Button>
            ) : (
              <Button size="lg" onClick={join} loading={busy}>
                <Plus className="h-5 w-5" /> Join club
              </Button>
            )}
          </div>
        </div>
      </motion.section>

      {!club.isMember && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Join this club to play its games, complete quests and appear on the leaderboard.
        </div>
      )}

      <Tabs
        id="club-tabs"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "arcade", label: <><Gamepad2 className="h-4 w-4" /> Arcade</> },
          { value: "quests", label: <><Map className="h-4 w-4" /> Quests {club.quests.length > 0 && <span className="rounded-full bg-white/15 px-1.5 text-xs">{club.quests.length}</span>}</> },
          { value: "leaderboard", label: <><Trophy className="h-4 w-4" /> Leaderboard</> },
        ]}
      />

      {tab === "arcade" && (
        <div className="space-y-5">
          {presentTypes.length > 1 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              {(["ALL", ...presentTypes] as const).map((t) => {
                const active = typeFilter === t;
                const meta = t === "ALL" ? null : GAME_META[t];
                return (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition",
                      active ? "border-transparent bg-white text-ink-950" : "border-white/10 text-zinc-400 hover:text-white",
                    )}
                  >
                    {meta && <meta.icon className="h-3.5 w-3.5" />}
                    {meta ? meta.label : "All games"}
                  </button>
                );
              })}
            </div>
          )}
          {games.length === 0 ? (
            <EmptyState icon="🕹️" title="No games yet" description="New games are coming soon. Check back later!" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} locked={!club.isMember} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "quests" &&
        (club.quests.length === 0 ? (
          <EmptyState icon="🗺️" title="No active quests" description="Quests bundle games together for bonus points." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {club.quests.map((q, i) => (
              <QuestCard key={q.id} quest={q} index={i} />
            ))}
          </div>
        ))}

      {tab === "leaderboard" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-zinc-400">
              {board?.scope === "all" ? "All-time standings" : board?.season ? `${board.season.name} · ${board.total} players` : ""}
            </div>
            <Select value={season} onChange={(e) => setSeason(e.target.value)} className="sm:w-60">
              <option value="current">Current season</option>
              {seasons?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
              <option value="all">All time</option>
            </Select>
          </div>
          {boardLoading && !board ? (
            <Skeleton className="h-80 rounded-3xl" />
          ) : (
            board && (
              <div className={cn("transition-opacity", boardRefreshing && "pointer-events-none opacity-50")}>
                <LeaderboardView data={board} meId={me?.user.id} />
              </div>
            )
          )}
          <p className="text-center text-xs text-zinc-500">
            Only your best score per game counts each season. Top players win scratch cards & passes when the season ends.
          </p>
        </div>
      )}

      <ConfirmModal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={leave}
        loading={busy}
        danger
        title={`Leave ${club.name}?`}
        description="You won't be able to play its games until you rejoin. Your points are kept."
        confirmLabel="Leave club"
      />
    </div>
  );
}
