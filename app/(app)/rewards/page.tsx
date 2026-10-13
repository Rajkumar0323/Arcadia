"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CalendarClock, Copy, Crown, GraduationCap, Sparkles, Ticket } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { Course, Reward } from "@/lib/types";
import { cn, formatDate, formatINR } from "@/lib/utils";
import { Badge, Button, EmptyState, Modal, PageHeader, Skeleton, Tabs } from "@/components/ui";
import { ScratchCard } from "@/components/scratch-card";

type Filter = "active" | "used" | "all";

const STATUS: Record<Reward["status"], { label: string; color: string }> = {
  UNSCRATCHED: { label: "New", color: "#d946ef" },
  AVAILABLE: { label: "Ready", color: "#10b981" },
  REDEEMED: { label: "Redeemed", color: "#8b5cf6" },
  EXPIRED: { label: "Expired", color: "#71717a" },
  REVOKED: { label: "Revoked", color: "#ef4444" },
};

function RewardTicket({ reward, index, onRedeem, onReveal, onDone }: { reward: Reward; index: number; onRedeem: () => void; onReveal: (id: string) => Promise<Reward | null>; onDone: () => void }) {
  const isPass = reward.type === "PASS";
  const st = STATUS[reward.status];
  const usable = reward.status === "AVAILABLE";
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotate: index % 2 ? 1 : -1 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 140, damping: 16 }}
      whileHover={{ y: -4 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5",
        isPass ? "border-amber-400/40 bg-gradient-to-br from-amber-500/20 via-ink-900 to-fuchsia-600/20" : "border-white/10 bg-ink-900/80",
        !["UNSCRATCHED", "AVAILABLE"].includes(reward.status) && "opacity-60 grayscale-[40%]",
      )}
    >
      {isPass && <div className="shimmer absolute inset-0 opacity-50" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {isPass ? <Crown className="h-4 w-4 text-amber-300" /> : <Ticket className="h-4 w-4 text-fuchsia-300" />}
            {isPass ? "Season Pass" : "Scratch card"}
            {reward.rank && <span className="text-zinc-500">· Rank #{reward.rank}</span>}
          </div>
          <h3 className="mt-1 truncate font-bold">{reward.title}</h3>
          {reward.club && (
            <div className="text-xs" style={{ color: reward.club.color }}>
              {reward.club.icon} {reward.club.name}
              {reward.season && <span className="text-zinc-500"> · {reward.season.name}</span>}
            </div>
          )}
        </div>
        <Badge color={st.color}>{st.label}</Badge>
      </div>

      <div className="relative mt-4">
        {reward.status === "UNSCRATCHED" ? (
          <ScratchCard reward={reward} onReveal={onReveal} onDone={onDone} />
        ) : (
          <div className={cn("ticket-mask relative flex h-40 flex-col items-center justify-center rounded-2xl", isPass ? "bg-gradient-to-br from-amber-300 via-amber-400 to-orange-500 text-ink-950" : "bg-gradient-to-br from-fuchsia-500 via-violet-600 to-indigo-600")}>
            <div className="text-5xl font-black">{reward.discountPercent}% OFF</div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-80">any course</div>
            <div className="absolute inset-x-6 bottom-3 border-t border-dashed border-current opacity-30" />
          </div>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1 text-xs text-zinc-400">
          {reward.code && (
            <button
              onClick={() => {
                navigator.clipboard?.writeText(reward.code!);
                toast.success("Code copied");
              }}
              className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 font-mono text-[13px] font-semibold text-zinc-200 hover:bg-white/10"
            >
              {reward.code} <Copy className="h-3.5 w-3.5" />
            </button>
          )}
          {reward.status === "REDEEMED" && reward.course ? (
            <div className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" /> Used on {reward.course.title}
            </div>
          ) : (
            reward.expiresAt && (
              <div className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> Expires {formatDate(reward.expiresAt)}
              </div>
            )
          )}
        </div>
        {usable && (
          <Button size="sm" onClick={onRedeem}>
            <GraduationCap className="h-4 w-4" /> Redeem
          </Button>
        )}
      </div>
    </motion.div>
  );
}

export default function RewardsPage() {
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<Reward[]>("/api/rewards");
  const [filter, setFilter] = useState<Filter>("active");
  const [redeeming, setRedeeming] = useState<Reward | null>(null);
  const { data: courses } = useApiQuery<Course[]>(redeeming ? "/api/courses" : null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<{ courseTitle: string; finalPrice: number; originalPrice: number } | null>(null);

  const list = useMemo(
    () =>
      (data ?? []).filter((r) =>
        filter === "all" ? true : filter === "active" ? ["UNSCRATCHED", "AVAILABLE"].includes(r.status) : ["REDEEMED", "EXPIRED"].includes(r.status),
      ),
    [data, filter],
  );

  async function reveal(id: string) {
    try {
      return await api.post<Reward>(`/api/rewards/${id}/scratch`);
    } catch (e) {
      toast.error(errorMessage(e));
      return null;
    }
  }

  async function redeem() {
    if (!redeeming || !courseId) return;
    setBusy(true);
    try {
      const res = await api.post<{ pricing: { courseTitle: string; finalPrice: number; originalPrice: number } }>(`/api/rewards/${redeeming.id}/redeem`, { courseId });
      setSuccess(res.pricing);
      await mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function closeModal() {
    setRedeeming(null);
    setCourseId(null);
    setSuccess(null);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Your loot"
        title="Rewards"
        subtitle="Top players in each club win scratch cards and passes every season. Redeem them for course discounts."
      />
      <Tabs
        id="reward-tabs"
        className="mb-6 max-w-md"
        value={filter}
        onChange={setFilter}
        tabs={[
          { value: "active", label: "Active" },
          { value: "used", label: "Used / expired" },
          { value: "all", label: "All" },
        ]}
      />

      {isLoading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-80 rounded-3xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-7 w-7" />}
          title={filter === "active" ? "No rewards yet" : "Nothing here"}
          description="Finish in the top ranks of a club's season leaderboard to win scratch cards & passes."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r, i) => (
            <RewardTicket key={r.id} reward={r} index={i} onReveal={reveal} onDone={() => mutate()} onRedeem={() => setRedeeming(r)} />
          ))}
        </div>
      )}

      <Modal
        open={!!redeeming}
        onClose={closeModal}
        title={success ? "Redeemed! 🎉" : `Redeem ${redeeming?.discountPercent ?? ""}% off`}
        description={success ? undefined : "Pick the course you want to apply this discount to. This can't be undone."}
        size="lg"
        footer={
          success ? (
            <Button onClick={closeModal}>Done</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={closeModal}>
                Cancel
              </Button>
              <Button onClick={redeem} disabled={!courseId} loading={busy}>
                Confirm redemption
              </Button>
            </>
          )
        }
      >
        {success ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-6 text-center">
            <div className="text-5xl">🎓</div>
            <h3 className="mt-3 text-xl font-bold">{success.courseTitle}</h3>
            <div className="mt-2 text-zinc-400 line-through">{formatINR(success.originalPrice)}</div>
            <div className="text-3xl font-black text-emerald-300">{formatINR(success.finalPrice)}</div>
            <p className="mt-3 text-sm text-zinc-400">Your discount is locked in for this course.</p>
          </motion.div>
        ) : !courses ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="py-6 text-center text-sm text-zinc-400">No courses available yet.</p>
        ) : (
          <div className="space-y-2">
            {courses.map((c) => {
              const pct = redeeming?.discountPercent ?? 0;
              const final = c.price - Math.round((c.price * pct) / 100);
              const selected = courseId === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCourseId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border p-3 text-left transition",
                    selected ? "border-violet-400/70 bg-violet-500/15" : "border-white/10 hover:border-white/25",
                  )}
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-cyan-500">
                      <GraduationCap className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{c.title}</div>
                    <div className="text-xs text-zinc-500">{c.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-zinc-500 line-through">{formatINR(c.price)}</div>
                    <div className="font-bold text-emerald-300">{formatINR(final)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
