import { Brain, Hand, LayoutGrid, ListOrdered, PenLine, Shuffle, type LucideIcon } from "lucide-react";
import type { Difficulty, GameType } from "./types";

export const GAME_META: Record<
  GameType,
  { label: string; short: string; icon: LucideIcon; gradient: string; accent: string; rules: string[] }
> = {
  QUIZ: {
    label: "Quiz",
    short: "Multiple choice",
    icon: Brain,
    gradient: "from-violet-500 to-indigo-500",
    accent: "#8b5cf6",
    rules: ["Pick one answer per question", "Answers lock in instantly", "Results & explanations at the end"],
  },
  TRUE_FALSE: {
    label: "Swipe True/False",
    short: "Swipe cards",
    icon: Hand,
    gradient: "from-pink-500 to-rose-500",
    accent: "#ec4899",
    rules: ["Swipe right (→) for TRUE", "Swipe left (←) for FALSE", "Or tap the buttons / use arrow keys"],
  },
  MEMORY_MATCH: {
    label: "Memory Match",
    short: "Flip & match",
    icon: LayoutGrid,
    gradient: "from-cyan-500 to-blue-500",
    accent: "#06b6d4",
    rules: ["Flip two cards per move", "Match related pairs", "Fewer moves = more points"],
  },
  WORD_SCRAMBLE: {
    label: "Word Scramble",
    short: "Unscramble",
    icon: Shuffle,
    gradient: "from-amber-500 to-orange-500",
    accent: "#f59e0b",
    rules: ["Tap letters (or type) to build the word", "Use the hint if you're stuck", "Lock in each word to continue"],
  },
  SEQUENCE: {
    label: "Sequence",
    short: "Drag to order",
    icon: ListOrdered,
    gradient: "from-emerald-500 to-teal-500",
    accent: "#10b981",
    rules: ["Drag items into the correct order", "Each item in the right spot scores", "Lock the order to continue"],
  },
  FILL_BLANK: {
    label: "Fill the Blank",
    short: "Type answers",
    icon: PenLine,
    gradient: "from-fuchsia-500 to-purple-500",
    accent: "#d946ef",
    rules: ["Type the missing word", "Spelling matters, case doesn't", "Press Enter to continue"],
  },
};

export const GAME_TYPES = Object.keys(GAME_META) as GameType[];

export const DIFFICULTY_META: Record<Difficulty, { label: string; className: string }> = {
  EASY: { label: "Easy", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  MEDIUM: { label: "Medium", className: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  HARD: { label: "Hard", className: "bg-rose-500/15 text-rose-300 border-rose-500/30" },
};

export function levelTitle(level: number) {
  if (level >= 20) return "Legend";
  if (level >= 12) return "Grandmaster";
  if (level >= 8) return "Champion";
  if (level >= 5) return "Challenger";
  if (level >= 3) return "Explorer";
  return "Rookie";
}
