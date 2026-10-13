"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { APP_NAME, cn } from "@/lib/utils";

export function Logo({ compact, className, href = "/dashboard" }: { compact?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group flex items-center gap-2.5", className)}>
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-lg shadow-fuchsia-900/40 transition-transform group-hover:rotate-6 group-hover:scale-105">
        <Gamepad2 className="h-5 w-5 text-white" />
        <span className="absolute -inset-1 -z-10 rounded-2xl bg-fuchsia-500/30 blur-md animate-pulse-glow" />
      </span>
      {!compact && <span className="font-display text-lg font-bold tracking-tight">{APP_NAME}</span>}
    </Link>
  );
}
