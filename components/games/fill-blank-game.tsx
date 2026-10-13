"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, Lightbulb } from "lucide-react";
import type { FillBlankPayload, GameProps } from "@/lib/types";
import { Button } from "../ui";

type A = (string | null)[];

export function FillBlankGame({ payload, onChange, onFinish }: GameProps<FillBlankPayload, A>) {
  const total = payload.sentences.length;
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(false);
  const [answers, setAnswers] = useState<A>(() => payload.sentences.map(() => null));
  const [sent, setSent] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => onChange(answers), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 450);
    return () => clearTimeout(t);
  }, [index]);

  const s = payload.sentences[index];
  const match = s.text.match(/_{3,}/);
  const before = match ? s.text.slice(0, match.index) : s.text;
  const after = match ? s.text.slice((match.index ?? 0) + match[0].length) : "";

  function submit(skip = false) {
    if (sent) return;
    const next = [...answers];
    next[index] = skip ? null : value.trim() || null;
    setAnswers(next);
    onChange(next);
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setValue("");
      setHint(false);
      if (index + 1 < total) setIndex(index + 1);
      else onFinish(next);
    }, skip ? 150 : 550);
  }

  // live-sync typed text so a timeout still submits it
  useEffect(() => {
    const next = [...answers];
    next[index] = value.trim() || null;
    onChange(next);
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const words = (txt: string) => txt.split(/(\s+)/).filter(Boolean);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-fuchsia-300">
          Sentence {index + 1} of {total}
        </span>
        <div className="flex gap-1">
          {payload.sentences.map((_, i) => (
            <span key={i} className={`h-2 w-2 rounded-full ${i < index ? "bg-fuchsia-400" : i === index ? "bg-white" : "bg-white/15"}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={index}
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -20 }}
          className="card relative overflow-hidden p-6 sm:p-10"
        >
          <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-600/20 blur-3xl" />
          <p className="relative text-xl font-semibold leading-[2.4] sm:text-2xl">
            {words(before).map((w, i) => (
              <motion.span key={`b${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                {w}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={sent ? { opacity: 1, scale: [1, 1.12, 1] } : { opacity: 1, scale: 1 }}
              transition={{ delay: sent ? 0 : 0.25, type: "spring" }}
              className="mx-1 inline-block align-middle"
            >
              <input
                ref={inputRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={sent}
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="?"
                style={{ width: `${Math.max(4, value.length + 1.5)}ch` }}
                className="rounded-xl border-2 border-fuchsia-400/60 bg-fuchsia-500/10 px-3 py-1 text-center font-bold text-fuchsia-100 outline-none transition placeholder:text-fuchsia-300/50 focus:border-fuchsia-300 focus:shadow-[0_0_24px_rgba(217,70,239,0.4)]"
              />
            </motion.span>
            {words(after).map((w, i) => (
              <motion.span key={`a${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.03 }}>
                {w}
              </motion.span>
            ))}
          </p>

          <div className="relative mt-6 flex flex-wrap items-center justify-between gap-3">
            {s.hint ? (
              hint ? (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-zinc-300">
                  💡 {s.hint}
                </motion.span>
              ) : (
                <button type="button" onClick={() => setHint(true)} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-fuchsia-300">
                  <Lightbulb className="h-4 w-4" /> Hint
                </button>
              )
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => submit(true)}>
                Skip
              </Button>
              <Button type="submit" disabled={!value.trim() || sent}>
                Submit <CornerDownLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
