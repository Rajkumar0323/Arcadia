"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Gamepad2, Plus, Users } from "lucide-react";
import type { ClubSummary } from "@/lib/types";
import { formatNumber, hexToRgba } from "@/lib/utils";
import { Button } from "./ui";
import { Countdown } from "./widgets";

export function ClubCard({
  club,
  onJoin,
  joining,
  index = 0,
}: {
  club: ClubSummary;
  onJoin?: () => void;
  joining?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, type: "spring", stiffness: 130, damping: 18 }}
      whileHover={{ y: -6 }}
      className="group relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80"
    >
      <Link href={`/clubs/${club.slug}`} className="block">
        <div
          className="relative h-32 overflow-hidden"
          style={{
            background: club.coverImage
              ? `center/cover url(${club.coverImage})`
              : `linear-gradient(135deg, ${hexToRgba(club.color, 0.9)}, ${hexToRgba(club.color, 0.25)})`,
          }}
        >
          <div className="grid-bg absolute inset-0 opacity-40" />
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl transition-transform duration-500 group-hover:scale-150" />
          <motion.div
            className="absolute bottom-3 left-4 grid h-16 w-16 place-items-center rounded-2xl border border-white/20 bg-black/30 text-4xl backdrop-blur"
            whileHover={{ rotate: [0, -10, 10, 0] }}
          >
            {club.icon}
          </motion.div>
          {club.activeSeason && (
            <div className="absolute right-3 top-3 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
              <Countdown to={club.activeSeason.endsAt} prefix="Season ends" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold">{club.name}</h3>
          <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-zinc-400">{club.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3.5 w-3.5" /> {formatNumber(club.memberCount)} members
            </span>
            <span className="inline-flex items-center gap-1">
              <Gamepad2 className="h-3.5 w-3.5" /> {club.gameCount} games
            </span>
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        {club.isMember ? (
          <Link
            href={`/clubs/${club.slug}`}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border text-sm font-semibold"
            style={{ borderColor: hexToRgba(club.color, 0.5), color: club.color, background: hexToRgba(club.color, 0.1) }}
          >
            <Check className="h-4 w-4" /> Joined · Enter arcade
          </Link>
        ) : (
          <Button className="w-full" onClick={onJoin} loading={joining}>
            <Plus className="h-4 w-4" /> Join club
          </Button>
        )}
      </div>
    </motion.div>
  );
}
