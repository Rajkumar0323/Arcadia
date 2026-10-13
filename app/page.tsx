"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { ArrowRight, Gift, Sparkles, Trophy, Users, Zap } from "lucide-react";
import { Logo } from "@/components/brand";
import { FloatingShapes } from "@/components/floating-shapes";
import { buttonClasses } from "@/components/ui";
import { GAME_META, GAME_TYPES } from "@/lib/game-meta";
import { APP_NAME } from "@/lib/utils";

const FEATURES = [
  { icon: Users, title: "Join clubs", text: "Code, Math, Science, Language — every club has its own arcade.", color: "from-violet-500 to-indigo-500" },
  { icon: Zap, title: "Play the arcade", text: "Quizzes, swipe cards, memory flips, scrambles and more.", color: "from-amber-500 to-orange-500" },
  { icon: Trophy, title: "Climb leaderboards", text: "Monthly seasons per club. Beat your best, beat your friends.", color: "from-cyan-500 to-blue-500" },
  { icon: Gift, title: "Win rewards", text: "Top players win scratch cards & passes for course discounts.", color: "from-fuchsia-500 to-pink-500" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 16 } } };

function Cta({ size = "lg" }: { size?: "md" | "lg" }) {
  return (
    <>
      <SignedOut>
        <Link href="/sign-up" className={buttonClasses("primary", size)}>
          Start playing free <ArrowRight className="h-4 w-4" />
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={buttonClasses("primary", size)}>
          Go to dashboard <ArrowRight className="h-4 w-4" />
        </Link>
      </SignedIn>
    </>
  );
}

export default function Landing() {
  return (
    <div className="relative overflow-hidden">
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo href="/" />
        <div className="flex items-center gap-2">
          <SignedOut>
            <Link href="/sign-in" className={buttonClasses("ghost", "md")}>
              Sign in
            </Link>
          </SignedOut>
          <Cta size="md" />
        </div>
      </header>

      <section className="relative mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 sm:pt-16">
        <div className="grid-bg absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        <FloatingShapes />
        <motion.div variants={container} initial="hidden" animate="show" className="relative mx-auto max-w-3xl text-center">
          <motion.div variants={item} className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Learning, but make it an arcade
          </motion.div>
          <motion.h1 variants={item} className="text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Play games.
            <br />
            <span className="animate-gradient-x bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300 bg-[length:200%_auto] bg-clip-text text-transparent">
              Top the board.
            </span>
            <br />
            Win courses.
          </motion.h1>
          <motion.p variants={item} className="mx-auto mt-6 max-w-xl text-base text-zinc-400 sm:text-lg">
            {APP_NAME} turns every club into an arcade. Complete quests, climb your club&apos;s monthly leaderboard and
            unlock scratch cards worth real discounts.
          </motion.p>
          <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="no-scrollbar relative -mx-2 mt-12 flex gap-3 overflow-x-auto px-2 pb-4 pt-4 sm:justify-center"
        >
          {GAME_TYPES.map((t, i) => {
            const m = GAME_META[t];
            return (
              <motion.div
                key={t}
                whileHover={{ y: -6, rotate: i % 2 ? 2 : -2 }}
                className="card flex min-w-[150px] flex-col items-center gap-3 p-5"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${m.gradient} shadow-lg`}>
                  <m.icon className="h-6 w-6 text-white" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">{m.label}</div>
                  <div className="text-xs text-zinc-500">{m.short}</div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.div key={f.title} variants={item} whileHover={{ y: -4 }} className="card group p-6">
              <div className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${f.color} transition-transform group-hover:scale-110`}>
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{f.text}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative mt-16 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-cyan-500/10 p-8 text-center sm:p-12"
        >
          <div className="shimmer absolute inset-0 opacity-40" />
          <h2 className="relative text-2xl font-bold sm:text-4xl">Your next course could be 50% off.</h2>
          <p className="relative mx-auto mt-3 max-w-lg text-zinc-300">
            Every month the top players in each club win scratch cards and passes they can redeem on any course.
          </p>
          <div className="relative mt-6 flex justify-center">
            <Cta />
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-500">
        © {new Date().getFullYear()} {APP_NAME}. Play · Learn · Win.
      </footer>
    </div>
  );
}
