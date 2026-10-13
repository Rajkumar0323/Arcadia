"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, RotateCcw, Save, Trash2 } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub, AdminGame } from "@/lib/admin-types";
import type { Difficulty, GameType } from "@/lib/types";
import { DIFFICULTY_META, GAME_META, GAME_TYPES } from "@/lib/game-meta";
import { cn } from "@/lib/utils";
import { Button, ConfirmModal, Field, Input, PageHeader, Select, Spinner, Switch, Textarea } from "../ui";
import { startNavProgress } from "../nav-progress";
import { cleanContent, GameContentEditor, TEMPLATES } from "./game-content-editor";

type Form = {
  clubId: string;
  title: string;
  description: string;
  type: GameType;
  difficulty: Difficulty;
  points: number;
  timeLimit: string;
  isActive: boolean;
  sortOrder: number;
  content: unknown;
};

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export function GameForm({ gameId }: { gameId?: string }) {
  const router = useRouter();
  const api = useApi();
  const { data: clubs } = useApiQuery<AdminClub[]>("/api/admin/clubs");
  const { data: game } = useApiQuery<AdminGame>(gameId ? `/api/admin/games/${gameId}` : null, { revalidateOnFocus: false });
  const [form, setForm] = useState<Form | null>(
    gameId
      ? null
      : { clubId: "", title: "", description: "", type: "QUIZ", difficulty: "MEDIUM", points: 100, timeLimit: "90", isActive: true, sortOrder: 0, content: clone(TEMPLATES.QUIZ) },
  );
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (game && !form) {
      setForm({ ...game, timeLimit: game.timeLimit ? String(game.timeLimit) : "", content: clone(game.content) });
    }
  }, [game, form]);

  useEffect(() => {
    if (form && !form.clubId && clubs?.length) setForm({ ...form, clubId: clubs[0].id });
  }, [clubs, form]);

  if (!form) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  function changeType(t: GameType) {
    if (t === form!.type) return;
    setForm((f) => (f ? { ...f, type: t, content: clone(TEMPLATES[t]) } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        timeLimit: form.timeLimit ? Number(form.timeLimit) : null,
        points: Number(form.points),
        sortOrder: Number(form.sortOrder),
        content: cleanContent(form.type, form.content),
      };
      if (gameId) {
        await api.patch(`/api/admin/games/${gameId}`, body);
        toast.success("Game updated");
      } else {
        const created = await api.post<AdminGame>("/api/admin/games", body);
        toast.success("Game created");
        startNavProgress();
        router.replace(`/admin/games/${created.id}`);
      }
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    try {
      await api.del(`/api/admin/games/${gameId}`);
      toast.success("Game deleted");
      startNavProgress();
      router.push("/admin/games");
    } catch (e) {
      toast.error(errorMessage(e));
      setSaving(false);
    }
  }

  return (
    <div className="pb-24">
      <Link href="/admin/games" className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> All games
      </Link>
      <PageHeader
        eyebrow={gameId ? "Edit game" : "Create game"}
        title={form.title || "Untitled game"}
        actions={
          gameId && (
            <Button variant="ghost" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )
        }
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="space-y-6 xl:col-span-2">
          <section className="card space-y-4 p-5">
            <h2 className="font-bold">Details</h2>
            <Field label="Club">
              <Select value={form.clubId} onChange={(e) => set("clubId", e.target.value)}>
                {!clubs?.length && <option value="">Create a club first</option>}
                {clubs?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Title">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. JavaScript Basics Blitz" />
            </Field>
            <Field label="Description">
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short description shown on the game card" />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Points">
                <Input type="number" min={0} value={form.points} onChange={(e) => set("points", Number(e.target.value))} />
              </Field>
              <Field label="Time (s)" hint="Blank = none">
                <Input type="number" min={10} value={form.timeLimit} onChange={(e) => set("timeLimit", e.target.value)} />
              </Field>
              <Field label="Order">
                <Input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", Number(e.target.value))} />
              </Field>
            </div>
            <Field label="Difficulty">
              <div className="flex gap-2">
                {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => set("difficulty", d)}
                    className={cn("flex-1 rounded-xl border py-2 text-sm font-semibold transition", form.difficulty === d ? DIFFICULTY_META[d].className : "border-white/10 text-zinc-500")}
                  >
                    {DIFFICULTY_META[d].label}
                  </button>
                ))}
              </div>
            </Field>
            <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Published (visible to students)" />
          </section>

          <section className="card p-5">
            <h2 className="mb-1 font-bold">Game type</h2>
            <p className="mb-4 text-xs text-zinc-500">{gameId ? "Changing the type resets the content below." : "Each type has its own play design."}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
              {GAME_TYPES.map((t) => {
                const m = GAME_META[t];
                const active = form.type === t;
                return (
                  <motion.button
                    key={t}
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => changeType(t)}
                    className={cn("relative flex flex-col items-start gap-2 overflow-hidden rounded-2xl border p-3 text-left transition", active ? "border-white/40 bg-white/10" : "border-white/10 hover:border-white/25")}
                  >
                    <span className={cn("grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br", m.gradient)}>
                      <m.icon className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-sm font-semibold">{m.label}</span>
                    <span className="text-[11px] text-zinc-500">{m.short}</span>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </div>

        <section className="card p-5 xl:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const M = GAME_META[form.type];
                return <M.icon className="h-5 w-5" style={{ color: M.accent }} />;
              })()}
              <h2 className="font-bold">{GAME_META[form.type].label} content</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => set("content", clone(TEMPLATES[form.type]))}>
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
          <GameContentEditor key={form.type} type={form.type} value={form.content} onChange={(c) => set("content", c)} />
        </section>
      </div>

      <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-ink-950/90 backdrop-blur-xl lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/admin/games" className="text-sm text-zinc-400 hover:text-white">
            Cancel
          </Link>
          <Button onClick={save} loading={saving} disabled={!form.title.trim() || !form.clubId}>
            <Save className="h-4 w-4" /> {gameId ? "Save changes" : "Create game"}
          </Button>
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        loading={saving}
        danger
        title="Delete this game?"
        description="All attempts for this game are deleted too. Leaderboard points already earned stay. Consider unpublishing instead."
        confirmLabel="Delete game"
      />
    </div>
  );
}
