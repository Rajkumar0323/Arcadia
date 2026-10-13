"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { UserButton } from "@clerk/nextjs";
import {
  ArrowLeft,
  CalendarRange,
  Gamepad2,
  Gift,
  GraduationCap,
  LayoutDashboard,
  Map,
  Menu,
  ShieldAlert,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import { useApiQuery } from "@/lib/api";
import type { Me } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "../brand";
import { buttonClasses, EmptyState, Spinner } from "../ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clubs", label: "Clubs", icon: UsersRound },
  { href: "/admin/games", label: "Games", icon: Gamepad2 },
  { href: "/admin/quests", label: "Quests", icon: Map },
  { href: "/admin/seasons", label: "Seasons", icon: CalendarRange },
  { href: "/admin/rewards", label: "Rewards", icon: Gift },
  { href: "/admin/courses", label: "Courses", icon: GraduationCap },
  { href: "/admin/users", label: "Users", icon: Users },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = isActive(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={onNavigate}
            className={cn(
              "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "text-white" : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            {active && (
              <motion.span
                layoutId="admin-active"
                className="absolute inset-0 rounded-xl border border-cyan-400/25 bg-gradient-to-r from-cyan-500/20 to-violet-600/20"
                transition={{ type: "spring", stiffness: 400, damping: 34 }}
              />
            )}
            <n.icon className="relative h-4.5 w-4.5 h-[18px] w-[18px]" />
            <span className="relative">{n.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: me, isLoading, error } = useApiQuery<Me>("/api/me");
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  if (isLoading || (!me && !error)) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (!me || me.user.role !== "ADMIN") {
    return (
      <div className="mx-auto max-w-md px-4 pt-24">
        <EmptyState
          icon={<ShieldAlert className="h-7 w-7" />}
          title="Admins only"
          description="Your account doesn't have admin access. Add your email to ADMIN_EMAILS on the API server, or ask an admin to promote you."
          action={
            <Link href="/dashboard" className={buttonClasses("primary")}>
              Back to app
            </Link>
          }
        />
      </div>
    );
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-2">
        <Logo href="/admin" />
        <span className="rounded-md bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">Admin</span>
      </div>
      <div className="mt-8 flex-1">
        <NavList onNavigate={() => setOpen(false)} />
      </div>
      <Link href="/dashboard" className="mb-4 flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-zinc-400 hover:bg-white/5 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to app
      </Link>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <UserButton />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{me.user.name}</div>
          <div className="truncate text-xs text-zinc-500">{me.user.email}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-ink-950/80 p-5 backdrop-blur-xl lg:block">{sidebar}</aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 backdrop-blur-xl lg:hidden">
        <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-white/10" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Logo href="/admin" />
          <span className="rounded-md bg-cyan-400/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-cyan-300">Admin</span>
        </div>
        <UserButton />
      </header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="absolute inset-y-0 left-0 w-72 border-r border-white/10 bg-ink-900 p-5"
            >
              <button onClick={() => setOpen(false)} className="absolute right-3 top-4 rounded-lg p-2 hover:bg-white/10" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="lg:pl-64">
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
