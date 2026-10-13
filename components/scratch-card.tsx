"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import type { Reward } from "@/lib/types";
import { Spinner } from "./ui";

/** Canvas scratch-off. The discount is fetched from the server on first touch, so it can't be peeked at. */
export function ScratchCard({ reward, onReveal, onDone }: { reward: Reward; onReveal: (id: string) => Promise<Reward | null>; onDone?: () => void }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const started = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const moves = useRef(0);
  const [revealed, setRevealed] = useState<Reward | null>(null);
  const [done, setDone] = useState(false);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = wrap.getBoundingClientRect();
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const g = ctx.createLinearGradient(0, 0, width, height);
    g.addColorStop(0, "#a1a1aa");
    g.addColorStop(0.45, "#f4f4f5");
    g.addColorStop(0.55, "#d4d4d8");
    g.addColorStop(1, "#71717a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, width, height);
    // sparkle pattern
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 70; i++) ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    ctx.fillStyle = "rgba(39,39,42,0.75)";
    ctx.font = "800 18px 'Space Grotesk', Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("SCRATCH HERE", width / 2, height / 2 + 2);
    ctx.font = "600 11px Inter, sans-serif";
    ctx.fillText("✦ reveal your discount ✦", width / 2, height / 2 + 22);
  }, []);

  useEffect(() => {
    paint();
  }, [paint]);

  function pos(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function scratch(p: { x: number; y: number }) {
    const ctx = canvasRef.current!.getContext("2d")!;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 44;
    ctx.beginPath();
    const from = last.current ?? p;
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  }

  function clearedRatio() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] === 0) clear++;
    }
    return clear / total;
  }

  async function onDown(e: React.PointerEvent) {
    if (done) return;
    drawing.current = true;
    last.current = null;
    (e.target as Element).setPointerCapture?.(e.pointerId);
    scratch(pos(e));
    if (!started.current) {
      started.current = true;
      const r = await onReveal(reward.id);
      if (r) setRevealed(r);
      else started.current = false;
    }
  }

  function onMove(e: React.PointerEvent) {
    if (!drawing.current || done) return;
    scratch(pos(e));
    if (++moves.current % 8 === 0 && clearedRatio() > 0.5 && revealed) finish();
  }

  function onUp() {
    drawing.current = false;
    last.current = null;
    if (!done && revealed && clearedRatio() > 0.45) finish();
  }

  function finish() {
    if (done) return;
    setDone(true);
    setTimeout(() => onDone?.(), 2200);
    const rect = wrapRef.current?.getBoundingClientRect();
    confetti({
      particleCount: 140,
      spread: 90,
      origin: rect ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: (rect.top + rect.height / 2) / window.innerHeight } : { y: 0.6 },
      colors: ["#fbbf24", "#d946ef", "#8b5cf6", "#22d3ee"],
    });
  }

  const value = revealed?.discountPercent;

  return (
    <div ref={wrapRef} className="relative h-40 w-full select-none overflow-hidden rounded-2xl">
      <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-amber-400 via-fuchsia-500 to-violet-600">
        <div className="grid-bg absolute inset-0 opacity-30" />
        {value != null ? (
          <motion.div initial={{ scale: 0.6 }} animate={done ? { scale: [1, 1.15, 1] } : { scale: 1 }} className="relative text-center text-white">
            <div className="text-5xl font-black drop-shadow-lg">{value}% OFF</div>
            <div className="text-xs font-semibold uppercase tracking-widest opacity-90">on any course</div>
          </motion.div>
        ) : started.current ? (
          <Spinner className="text-white" />
        ) : null}
      </div>
      <motion.canvas
        ref={canvasRef}
        animate={{ opacity: done ? 0 : 1 }}
        transition={{ duration: 0.6 }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="absolute inset-0 touch-none"
        style={{ pointerEvents: done ? "none" : "auto", cursor: "grab" }}
      />
    </div>
  );
}
