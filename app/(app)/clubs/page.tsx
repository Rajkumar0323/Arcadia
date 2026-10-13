"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Users } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { ClubSummary } from "@/lib/types";
import { ClubCard } from "@/components/club-card";
import { startNavProgress } from "@/components/nav-progress";
import { EmptyState, Input, PageHeader, Skeleton, Tabs } from "@/components/ui";

export default function ClubsPage() {
  const router = useRouter();
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<ClubSummary[]>("/api/clubs");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [joining, setJoining] = useState<string | null>(null);

  const clubs = useMemo(
    () =>
      (data ?? []).filter(
        (c) => (filter === "all" || c.isMember) && `${c.name} ${c.description}`.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, q, filter],
  );

  async function join(club: ClubSummary) {
    setJoining(club.id);
    try {
      await api.post(`/api/clubs/${club.slug}/join`);
      toast.success(`Welcome to ${club.name}! ${club.icon}`);
      // Go straight to the club; the list refreshes in the background instead of blocking navigation.
      startNavProgress();
      router.push(`/clubs/${club.slug}`);
      void mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setJoining(null);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Discover" title="Clubs" subtitle="Every club has its own arcade, quests and monthly leaderboard." />
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input placeholder="Search clubs…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
        </div>
        <Tabs
          id="club-filter"
          className="sm:w-64"
          value={filter}
          onChange={setFilter}
          tabs={[
            { value: "all", label: "All" },
            { value: "mine", label: "Joined" },
          ]}
        />
      </div>

      {isLoading && !data ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-72 rounded-3xl" />
          ))}
        </div>
      ) : clubs.length === 0 ? (
        <EmptyState icon={<Users className="h-7 w-7" />} title="No clubs found" description={filter === "mine" ? "You haven't joined any clubs yet." : "Try a different search."} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map((c, i) => (
            <ClubCard key={c.id} club={c} index={i} onJoin={() => join(c)} joining={joining === c.id} />
          ))}
        </div>
      )}
    </div>
  );
}
