"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import { Gift, Home, Shield, Trophy, User, Users } from "lucide-react";
import { useApiQuery } from "@/lib/api";
import type { Me } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { levelTitle } from "@/lib/game-meta";
import { Logo } from "./brand";
import { InstallButton } from "./pwa";
import { ProgressBar } from "./ui";

const NAV = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: me } = useApiQuery<Me>("/api/me");
  const isAdmin = me?.user.role === "ADMIN";
  const nav = isAdmin ? [...NAV, { href: "/admin", label: "Admin", icon: Shield }] : NAV;
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const badge = (href: string) => (href === "/rewards" ? me?.stats.unscratched ?? 0 : 0);

  return (
    <div className="min-h-dvh">
      {/* Sidebar: icon rail on tablet, full on desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-white/5 bg-ink-950/70 px-3 py-5 backdrop-blur-xl md:flex lg:w-64 lg:px-5">
        <div className="px-1">
          <Logo className="lg:hidden" compact />
          <Logo className="hidden lg:flex" />
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {nav.map((item) => {
            const isActive = active(item.href);
            const count = badge(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={cn(
                  "relative flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-colors lg:justify-start",
                  isActive ? "text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="side-active"
                    className="absolute inset-0 rounded-xl border border-violet-400/30 bg-gradient-to-r from-violet-600/30 to-fuchsia-600/20"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <item.icon className="relative h-5 w-5 shrink-0" />
                <span className="relative hidden lg:inline">{item.label}</span>
                {count > 0 && (
                  <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-bold text-white lg:static lg:ml-auto lg:h-5 lg:min-w-5">
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <InstallButton className="mb-3 justify-center lg:justify-start" />

        {me && (
          <div className="hidden rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/15 to-fuchsia-600/10 p-4 lg:block">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-violet-200">
                Lv {me.stats.level.level} · {levelTitle(me.stats.level.level)}
              </span>
              <span className="text-zinc-400">{formatNumber(me.stats.level.xp)} XP</span>
            </div>
            <ProgressBar value={me.stats.level.progress} className="mt-2" />
          </div>
        )}

        <div className="mt-4 flex items-center justify-center gap-3 lg:justify-start lg:px-1">
          <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
          <div className="hidden min-w-0 lg:block">
            <div className="truncate text-sm font-semibold">{me?.user.name ?? "Player"}</div>
            <div className="truncate text-xs text-zinc-500">{me?.user.email}</div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-ink-950/75 px-4 backdrop-blur-xl md:hidden">
        <Logo />
        <div className="flex items-center gap-3">
          {me && (
            <Link href="/profile" className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-200">
              <Trophy className="h-3.5 w-3.5" /> Lv {me.stats.level.level}
            </Link>
          )}
          <UserButton />
        </div>
      </header>

      <main className="md:pl-20 lg:pl-64">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-10"
        >
          {children}
        </motion.div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl md:hidden">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}>
          {nav.map((item) => {
            const isActive = active(item.href);
            const count = badge(item.href);
            return (
              <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold">
                {isActive && (
                  <motion.span layoutId="bottom-active" className="absolute top-0 h-0.5 w-10 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400" />
                )}
                <motion.span animate={{ scale: isActive ? 1.15 : 1, y: isActive ? -1 : 0 }} className="relative">
                  <item.icon className={cn("h-5 w-5", isActive ? "text-violet-300" : "text-zinc-500")} />
                  {count > 0 && (
                    <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-fuchsia-500 px-1 text-[9px] text-white">
                      {count}
                    </span>
                  )}
                </motion.span>
                <span className={isActive ? "text-white" : "text-zinc-500"}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
