"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, CheckCircle2, Circle, Plus, Trash2, X } from "lucide-react";
import type { GameType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input, Textarea } from "../ui";

// ---------- content shapes ----------
export type QuizContent = { questions: { prompt: string; options: string[]; answer: number; explanation?: string }[] };
export type TFContent = { statements: { text: string; answer: boolean; explanation?: string }[] };
export type MemoryContent = { pairs: { a: string; b: string }[] };
export type ScrambleContent = { words: { word: string; hint: string }[] };
export type SequenceContent = { rounds: { prompt: string; items: string[] }[] };
export type FillContent = { sentences: { text: string; answers: string[]; hint?: string }[] };

export const TEMPLATES: Record<GameType, unknown> = {
  QUIZ: { questions: [{ prompt: "What is 2 + 2?", options: ["3", "4", "5", "22"], answer: 1, explanation: "" }] },
  TRUE_FALSE: { statements: [{ text: "The Earth orbits the Sun.", answer: true, explanation: "" }] },
  MEMORY_MATCH: { pairs: [{ a: "H₂O", b: "Water" }, { a: "NaCl", b: "Salt" }, { a: "CO₂", b: "Carbon dioxide" }] },
  WORD_SCRAMBLE: { words: [{ word: "PLANET", hint: "Earth is one" }] },
  SEQUENCE: { rounds: [{ prompt: "Order from first to last", items: ["First", "Second", "Third"] }] },
  FILL_BLANK: { sentences: [{ text: "The capital of India is ___.", answers: ["New Delhi", "Delhi"], hint: "" }] },
};

// ---------- shared bits ----------
function move<T>(arr: T[], i: number, dir: -1 | 1) {
  const next = [...arr];
  const j = i + dir;
  if (j < 0 || j >= next.length) return arr;
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function ItemShell({ index, total, onMove, onRemove, children, label }: { index: number; total: number; onMove: (d: -1 | 1) => void; onRemove: () => void; children: React.ReactNode; label: string }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
          {label} {index + 1}
        </span>
        <div className="flex gap-1">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 disabled:opacity-30" aria-label="Move up">
            <ArrowUp className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 disabled:opacity-30" aria-label="Move down">
            <ArrowDown className="h-4 w-4" />
          </button>
          <button type="button" onClick={onRemove} disabled={total <= 1} className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-500/10 disabled:opacity-30" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 py-3 text-sm font-semibold text-zinc-400 transition hover:border-violet-400/50 hover:text-violet-300">
      <Plus className="h-4 w-4" /> {label}
    </button>
  );
}

function StringList({ values, onChange, placeholder, min = 1, max = 8, ordered }: { values: string[]; onChange: (v: string[]) => void; placeholder: string; min?: number; max?: number; ordered?: boolean }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          {ordered && <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-300">{i + 1}</span>}
          <Input value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`${placeholder} ${i + 1}`} className="h-10" />
          {ordered && (
            <button type="button" onClick={() => onChange(move(values, i, -1))} disabled={i === 0} className="rounded p-1 text-zinc-500 hover:text-white disabled:opacity-30">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
          <button type="button" onClick={() => onChange(values.filter((_, j) => j !== i))} disabled={values.length <= min} className="rounded p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {values.length < max && (
        <button type="button" onClick={() => onChange([...values, ""])} className="text-xs font-semibold text-violet-300 hover:text-violet-200">
          + Add {placeholder.toLowerCase()}
        </button>
      )}
    </div>
  );
}

// ---------- per-type editors ----------
function QuizEditor({ value, onChange }: { value: QuizContent; onChange: (v: QuizContent) => void }) {
  const qs = value.questions;
  const setQ = (i: number, q: QuizContent["questions"][number]) => onChange({ questions: qs.map((x, j) => (j === i ? q : x)) });
  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {qs.map((q, i) => (
          <ItemShell key={i} index={i} total={qs.length} label="Question" onMove={(d) => onChange({ questions: move(qs, i, d) })} onRemove={() => onChange({ questions: qs.filter((_, j) => j !== i) })}>
            <Textarea value={q.prompt} onChange={(e) => setQ(i, { ...q, prompt: e.target.value })} placeholder="Question prompt" className="min-h-[60px]" />
            <div className="space-y-2">
              {q.options.map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <button type="button" onClick={() => setQ(i, { ...q, answer: oi })} title="Mark as correct" className={cn("shrink-0", q.answer === oi ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-400")}>
                    {q.answer === oi ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </button>
                  <Input value={opt} onChange={(e) => setQ(i, { ...q, options: q.options.map((o, j) => (j === oi ? e.target.value : o)) })} placeholder={`Option ${oi + 1}`} className={cn("h-10", q.answer === oi && "border-emerald-400/50")} />
                  <button
                    type="button"
                    disabled={q.options.length <= 2}
                    onClick={() => setQ(i, { ...q, options: q.options.filter((_, j) => j !== oi), answer: q.answer === oi ? 0 : q.answer > oi ? q.answer - 1 : q.answer })}
                    className="rounded p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {q.options.length < 6 && (
                <button type="button" onClick={() => setQ(i, { ...q, options: [...q.options, ""] })} className="text-xs font-semibold text-violet-300">
                  + Add option
                </button>
              )}
            </div>
            <Input value={q.explanation ?? ""} onChange={(e) => setQ(i, { ...q, explanation: e.target.value })} placeholder="Explanation shown after the game (optional)" className="h-10" />
          </ItemShell>
        ))}
      </AnimatePresence>
      <AddButton label="Add question" onClick={() => onChange({ questions: [...qs, { prompt: "", options: ["", "", "", ""], answer: 0, explanation: "" }] })} />
    </div>
  );
}

function TFEditor({ value, onChange }: { value: TFContent; onChange: (v: TFContent) => void }) {
  const st = value.statements;
  const setS = (i: number, s: TFContent["statements"][number]) => onChange({ statements: st.map((x, j) => (j === i ? s : x)) });
  return (
    <div className="space-y-3">
      {st.map((s, i) => (
        <ItemShell key={i} index={i} total={st.length} label="Statement" onMove={(d) => onChange({ statements: move(st, i, d) })} onRemove={() => onChange({ statements: st.filter((_, j) => j !== i) })}>
          <Textarea value={s.text} onChange={(e) => setS(i, { ...s, text: e.target.value })} placeholder="Statement" className="min-h-[60px]" />
          <div className="flex gap-2">
            {[true, false].map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => setS(i, { ...s, answer: v })}
                className={cn(
                  "flex-1 rounded-xl border py-2 text-sm font-bold transition",
                  s.answer === v ? (v ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : "border-rose-400 bg-rose-500/20 text-rose-200") : "border-white/10 text-zinc-500",
                )}
              >
                {v ? "TRUE" : "FALSE"}
              </button>
            ))}
          </div>
          <Input value={s.explanation ?? ""} onChange={(e) => setS(i, { ...s, explanation: e.target.value })} placeholder="Explanation (optional)" className="h-10" />
        </ItemShell>
      ))}
      <AddButton label="Add statement" onClick={() => onChange({ statements: [...st, { text: "", answer: true, explanation: "" }] })} />
    </div>
  );
}

function MemoryEditor({ value, onChange }: { value: MemoryContent; onChange: (v: MemoryContent) => void }) {
  const pairs = value.pairs;
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">2–12 pairs. Each pair becomes two cards that players must match.</p>
      {pairs.map((p, i) => (
        <motion.div layout key={i} className="flex items-center gap-2">
          <span className="w-6 text-center text-xs font-bold text-zinc-500">{i + 1}</span>
          <Input value={p.a} onChange={(e) => onChange({ pairs: pairs.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} placeholder="Card A" className="h-10" />
          <span className="text-zinc-500">↔</span>
          <Input value={p.b} onChange={(e) => onChange({ pairs: pairs.map((x, j) => (j === i ? { ...x, b: e.target.value } : x)) })} placeholder="Card B" className="h-10" />
          <button type="button" onClick={() => onChange({ pairs: pairs.filter((_, j) => j !== i) })} disabled={pairs.length <= 2} className="rounded p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      ))}
      {pairs.length < 12 && <AddButton label="Add pair" onClick={() => onChange({ pairs: [...pairs, { a: "", b: "" }] })} />}
    </div>
  );
}

function ScrambleEditor({ value, onChange }: { value: ScrambleContent; onChange: (v: ScrambleContent) => void }) {
  const words = value.words;
  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">Single words only (letters/numbers, 2–16 characters).</p>
      {words.map((w, i) => (
        <motion.div layout key={i} className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:flex-row sm:items-center">
          <Input
            value={w.word}
            onChange={(e) => onChange({ words: words.map((x, j) => (j === i ? { ...x, word: e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase() } : x)) })}
            placeholder="WORD"
            className="h-10 font-mono font-bold tracking-widest sm:w-48"
            maxLength={16}
          />
          <Input value={w.hint} onChange={(e) => onChange({ words: words.map((x, j) => (j === i ? { ...x, hint: e.target.value } : x)) })} placeholder="Hint" className="h-10" />
          <button type="button" onClick={() => onChange({ words: words.filter((_, j) => j !== i) })} disabled={words.length <= 1} className="self-end rounded p-1 text-zinc-500 hover:text-rose-400 disabled:opacity-30 sm:self-auto">
            <Trash2 className="h-4 w-4" />
          </button>
        </motion.div>
      ))}
      <AddButton label="Add word" onClick={() => onChange({ words: [...words, { word: "", hint: "" }] })} />
    </div>
  );
}

function SequenceEditor({ value, onChange }: { value: SequenceContent; onChange: (v: SequenceContent) => void }) {
  const rounds = value.rounds;
  const setR = (i: number, r: SequenceContent["rounds"][number]) => onChange({ rounds: rounds.map((x, j) => (j === i ? r : x)) });
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">Enter items in the CORRECT order — they are shuffled for players.</p>
      {rounds.map((r, i) => (
        <ItemShell key={i} index={i} total={rounds.length} label="Round" onMove={(d) => onChange({ rounds: move(rounds, i, d) })} onRemove={() => onChange({ rounds: rounds.filter((_, j) => j !== i) })}>
          <Input value={r.prompt} onChange={(e) => setR(i, { ...r, prompt: e.target.value })} placeholder="Prompt, e.g. Order the planets from the Sun" className="h-10" />
          <StringList values={r.items} onChange={(items) => setR(i, { ...r, items })} placeholder="Item" min={2} max={8} ordered />
        </ItemShell>
      ))}
      <AddButton label="Add round" onClick={() => onChange({ rounds: [...rounds, { prompt: "", items: ["", "", ""] }] })} />
    </div>
  );
}

function FillEditor({ value, onChange }: { value: FillContent; onChange: (v: FillContent) => void }) {
  const ss = value.sentences;
  const setS = (i: number, s: FillContent["sentences"][number]) => onChange({ sentences: ss.map((x, j) => (j === i ? s : x)) });
  return (
    <div className="space-y-3">
      <p className="text-xs text-zinc-500">
        Write the blank as <code className="rounded bg-white/10 px-1">___</code> (three underscores). Add alternative accepted answers if needed.
      </p>
      {ss.map((s, i) => (
        <ItemShell key={i} index={i} total={ss.length} label="Sentence" onMove={(d) => onChange({ sentences: move(ss, i, d) })} onRemove={() => onChange({ sentences: ss.filter((_, j) => j !== i) })}>
          <Textarea value={s.text} onChange={(e) => setS(i, { ...s, text: e.target.value })} placeholder="The capital of France is ___." className={cn("min-h-[60px]", s.text && !/_{3,}/.test(s.text) && "border-rose-400/60")} />
          <div>
            <div className="mb-1.5 text-xs font-semibold text-zinc-400">Accepted answers</div>
            <StringList values={s.answers} onChange={(answers) => setS(i, { ...s, answers })} placeholder="Answer" max={6} />
          </div>
          <Input value={s.hint ?? ""} onChange={(e) => setS(i, { ...s, hint: e.target.value })} placeholder="Hint (optional)" className="h-10" />
        </ItemShell>
      ))}
      <AddButton label="Add sentence" onClick={() => onChange({ sentences: [...ss, { text: "", answers: [""], hint: "" }] })} />
    </div>
  );
}

export function GameContentEditor({ type, value, onChange }: { type: GameType; value: unknown; onChange: (v: unknown) => void }) {
  const v = value as never;
  switch (type) {
    case "QUIZ":
      return <QuizEditor value={v} onChange={onChange} />;
    case "TRUE_FALSE":
      return <TFEditor value={v} onChange={onChange} />;
    case "MEMORY_MATCH":
      return <MemoryEditor value={v} onChange={onChange} />;
    case "WORD_SCRAMBLE":
      return <ScrambleEditor value={v} onChange={onChange} />;
    case "SEQUENCE":
      return <SequenceEditor value={v} onChange={onChange} />;
    case "FILL_BLANK":
      return <FillEditor value={v} onChange={onChange} />;
  }
}

/** Strips empty optional strings so the API validator is happy. */
export function cleanContent(type: GameType, value: unknown): unknown {
  const v = JSON.parse(JSON.stringify(value));
  const clean = (o: Record<string, unknown>, keys: string[]) => keys.forEach((k) => (o[k] === "" || o[k] == null) && delete o[k]);
  if (type === "QUIZ") (v as QuizContent).questions.forEach((q) => clean(q, ["explanation"]));
  if (type === "TRUE_FALSE") (v as TFContent).statements.forEach((s) => clean(s, ["explanation"]));
  if (type === "FILL_BLANK") (v as FillContent).sentences.forEach((s) => {
    clean(s, ["hint"]);
    s.answers = s.answers.filter((a) => a.trim());
  });
  if (type === "SEQUENCE") (v as SequenceContent).rounds.forEach((r) => (r.items = r.items.filter((x) => x.trim())));
  return v;
}

