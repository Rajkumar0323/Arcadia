"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { ArrowLeft, Play, Star, Timer, Trophy, X } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type {
  AttemptResult,
  FillBlankPayload,
  GameRun,
  MemoryPayload,
  QuizPayload,
  ScramblePayload,
  SequencePayload,
  TrueFalsePayload,
} from "@/lib/types";
import { DIFFICULTY_META, GAME_META } from "@/lib/game-meta";
import { cn, formatClock, formatPercent, hexToRgba } from "@/lib/utils";
import { Button, buttonClasses, EmptyState, Spinner } from "../ui";
import { startNavProgress } from "../nav-progress";
import { QuizGame } from "./quiz-game";
import { TrueFalseGame } from "./true-false-game";
import { MemoryGame } from "./memory-game";
import { ScrambleGame } from "./scramble-game";
import { SequenceGame } from "./sequence-game";
import { FillBlankGame } from "./fill-blank-game";
import { GameResults } from "./game-results";

type Phase = "intro" | "countdown" | "playing" | "submitting" | "results";

export function GameRunner({ gameId }: { gameId: string }) {
  const router = useRouter();
  const api = useApi();
  const { data, error, isLoading, mutate } = useApiQuery<GameRun>(`/api/games/${gameId}`, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
    keepPreviousData: false,
  });
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [round, setRound] = useState(0); // remount key for "play again"
  const answersRef = useRef<unknown>(null);
  const startRef = useRef(0);
  const submittedRef = useRef(false);

  const submit = useCallback(
    async (answers: unknown) => {
      if (submittedRef.current || !data) return;
      submittedRef.current = true;
      setPhase("submitting");
      const timeTaken = (Date.now() - startRef.current) / 1000;
      try {
        const res = await api.post<AttemptResult>(`/api/games/${data.game.id}/attempts`, { answers, timeTaken });
        setResult(res);
        setPhase("results");
        if (res.passed) {
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#8b5cf6", "#d946ef", "#22d3ee", "#fbbf24"] });
        }
        if (res.completedQuests.length) {
          setTimeout(() => {
            const end = Date.now() + 1200;
            (function frame() {
              confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0 } });
              confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1 } });
              if (Date.now() < end) requestAnimationFrame(frame);
            })();
          }, 600);
          res.completedQuests.forEach((q) => toast.success(`Quest complete: ${q.title}`, { description: `+${q.bonusPoints} bonus points` }));
        }
      } catch (e) {
        toast.error(errorMessage(e));
        submittedRef.current = false;
        setPhase("playing");
      }
    },
    [api, data],
  );

  // countdown 3-2-1
  useEffect(() => {
    if (phase !== "countdown") return;
    if (count === 0) {
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 750);
    return () => clearTimeout(t);
  }, [phase, count]);

  // timer
  useEffect(() => {
    if (phase !== "playing") return;
    const id = setInterval(() => {
      const s = (Date.now() - startRef.current) / 1000;
      setElapsed(s);
      if (data?.game.timeLimit && s >= data.game.timeLimit) {
        toast.message("⏰ Time's up!");
        submit(answersRef.current);
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, data, submit]);

  function start() {
    submittedRef.current = false;
    answersRef.current = null;
    setResult(null);
    setCount(3);
    setPhase("countdown");
  }

  async function playAgain() {
    await mutate(); // fresh shuffle
    setRound((r) => r + 1);
    start();
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md p-6 pt-24">
        <EmptyState icon="🚫" title="Can't load this game" description={errorMessage(error)} action={<Link href="/clubs" className={buttonClasses("primary")}>Back to clubs</Link>} />
      </div>
    );
  }
  if (isLoading || !data) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const meta = GAME_META[data.game.type];
  const limit = data.game.timeLimit;
  const remaining = limit ? Math.max(0, limit - elapsed) : null;
  const color = data.club.color;

  const gameProps = {
    color,
    onChange: (a: unknown) => {
      answersRef.current = a;
    },
    onFinish: (a: unknown) => submit(a),
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full blur-3xl" style={{ background: hexToRgba(meta.accent, 0.18) }} />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full blur-3xl" style={{ background: hexToRgba(color, 0.15) }} />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={() => {
            startNavProgress();
            router.push(`/clubs/${data.club.slug}`);
          }}
          className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10"
          aria-label="Exit game"
        >
          {phase === "playing" ? <X className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-sm font-bold">{data.game.title}</div>
          <div className="text-xs text-zinc-500">
            {data.club.icon} {data.club.name}
          </div>
        </div>
        <div
          className={cn(
            "flex h-10 min-w-[72px] items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-bold tabular-nums",
            remaining !== null && remaining < 10 && phase === "playing" ? "animate-pulse bg-rose-500/20 text-rose-300" : "bg-white/5",
          )}
        >
          <Timer className="h-4 w-4" />
          {phase === "playing" || phase === "submitting" ? formatClock(remaining ?? elapsed) : limit ? formatClock(limit) : "∞"}
        </div>
      </header>
      {limit && phase === "playing" && (
        <div className="relative z-10 mx-4 h-1 overflow-hidden rounded-full bg-white/10 sm:mx-6">
          <motion.div
            className={cn("h-full bg-gradient-to-r", remaining! < 10 ? "from-rose-500 to-orange-500" : meta.gradient)}
            animate={{ width: `${(remaining! / limit) * 100}%` }}
            transition={{ ease: "linear", duration: 0.2 }}
          />
        </div>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="w-full max-w-md text-center">
              <motion.div
                animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className={cn("mx-auto mb-6 grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br shadow-2xl", meta.gradient)}
              >
                <meta.icon className="h-12 w-12 text-white" />
              </motion.div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: meta.accent }}>
                {meta.label}
              </div>
              <h1 className="text-3xl font-bold">{data.game.title}</h1>
              {data.game.description && <p className="mt-2 text-zinc-400">{data.game.description}</p>}

              <div className="mt-6 flex justify-center gap-2">
                <span className={cn("rounded-full border px-3 py-1 text-xs font-bold", DIFFICULTY_META[data.game.difficulty].className)}>
                  {DIFFICULTY_META[data.game.difficulty].label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold text-amber-300">
                  <Star className="h-3 w-3 fill-current" /> {data.game.points} pts
                </span>
                {limit && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold">
                    <Timer className="h-3 w-3" /> {limit}s
                  </span>
                )}
              </div>

              <ul className="card mt-6 space-y-2 p-4 text-left text-sm text-zinc-300">
                {meta.rules.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span style={{ color: meta.accent }}>▸</span> {r}
                  </li>
                ))}
                {limit && (
                  <li className="flex gap-2">
                    <span style={{ color: meta.accent }}>▸</span> Finish fast for up to +20% speed bonus
                  </li>
                )}
              </ul>

              {data.myBest && (
                <div className="mt-4 inline-flex items-center gap-2 text-sm text-zinc-400">
                  <Trophy className="h-4 w-4 text-amber-300" /> Your best: {data.myBest.pointsEarned} pts · {formatPercent(data.myBest.accuracy)}
                </div>
              )}

              <div className="mt-8">
                {data.isMember ? (
                  <Button size="lg" onClick={start} className="w-full sm:w-auto sm:min-w-[220px]">
                    <Play className="h-5 w-5 fill-current" /> {data.plays ? "Play again" : "Start game"}
                  </Button>
                ) : (
                  <Link href={`/clubs/${data.club.slug}`} className={buttonClasses("primary", "lg")}>
                    Join {data.club.name} to play
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {phase === "countdown" && (
            <motion.div key="countdown" className="grid place-items-center">
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={count}
                  initial={{ scale: 2.4, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.3, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className={cn("bg-gradient-to-br bg-clip-text text-[9rem] font-black leading-none text-transparent", meta.gradient)}
                >
                  {count === 0 ? "GO!" : count}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}

          {(phase === "playing" || phase === "submitting") && data.payload !== null && (
            <motion.div key={`play-${round}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative w-full">
              {data.game.type === "QUIZ" && <QuizGame payload={data.payload as QuizPayload} {...gameProps} />}
              {data.game.type === "TRUE_FALSE" && <TrueFalseGame payload={data.payload as TrueFalsePayload} {...gameProps} />}
              {data.game.type === "MEMORY_MATCH" && <MemoryGame payload={data.payload as MemoryPayload} {...gameProps} />}
              {data.game.type === "WORD_SCRAMBLE" && <ScrambleGame payload={data.payload as ScramblePayload} {...gameProps} />}
              {data.game.type === "SEQUENCE" && <SequenceGame payload={data.payload as SequencePayload} {...gameProps} />}
              {data.game.type === "FILL_BLANK" && <FillBlankGame payload={data.payload as FillBlankPayload} {...gameProps} />}

              {phase === "submitting" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-20 grid place-items-center rounded-3xl bg-ink-950/70 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-3">
                    <Spinner className="h-8 w-8" />
                    <span className="text-sm text-zinc-300">Scoring your run…</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {phase === "results" && result && (
            <GameResults key="results" result={result} accent={meta.accent} gradient={meta.gradient} clubSlug={data.club.slug} onPlayAgain={playAgain} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
