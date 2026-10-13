"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { CheckSquare, Pencil, Plus, Square, Trash2, Trophy } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub, AdminGameRow, AdminQuest } from "@/lib/admin-types";
import { GAME_META } from "@/lib/game-meta";
import { cn, formatDate, fromLocalInput, toLocalInput } from "@/lib/utils";
import { Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Switch, Textarea } from "@/components/ui";

type Form = { clubId: string; title: string; description: string; bonusPoints: number; startsAt: string; endsAt: string; isActive: boolean; gameIds: string[] };

export default function AdminQuestsPage() {
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<AdminQuest[]>("/api/admin/quests");
  const { data: clubs } = useApiQuery<AdminClub[]>("/api/admin/clubs");
  const [editing, setEditing] = useState<AdminQuest | "new" | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const { data: games } = useApiQuery<AdminGameRow[]>(form?.clubId ? `/api/admin/games?clubId=${form.clubId}` : null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminQuest | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => (f ? { ...f, [k]: v } : f));

  function open(q: AdminQuest | "new") {
    setEditing(q);
    setForm(
      q === "new"
        ? { clubId: clubs?.[0]?.id ?? "", title: "", description: "", bonusPoints: 250, startsAt: toLocalInput(new Date()), endsAt: "", isActive: true, gameIds: [] }
        : { clubId: q.clubId, title: q.title, description: q.description, bonusPoints: q.bonusPoints, startsAt: toLocalInput(q.startsAt), endsAt: toLocalInput(q.endsAt), isActive: q.isActive, gameIds: q.games.map((g) => g.gameId) },
    );
  }

  function toggleGame(id: string) {
    if (!form) return;
    set("gameIds", form.gameIds.includes(id) ? form.gameIds.filter((g) => g !== id) : [...form.gameIds, id]);
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const body = { ...form, startsAt: fromLocalInput(form.startsAt) ?? new Date().toISOString(), endsAt: fromLocalInput(form.endsAt) };
      if (editing === "new") await api.post("/api/admin/quests", body);
      else if (editing) await api.patch(`/api/admin/quests/${editing.id}`, body);
      toast.success("Quest saved");
      setEditing(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.del(`/api/admin/quests/${deleting.id}`);
      toast.success("Quest deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Arcade"
        title="Quests"
        subtitle="Bundle games together. Players who pass every game earn bonus leaderboard points."
        actions={
          <Button onClick={() => open("new")} disabled={!clubs?.length}>
            <Plus className="h-4 w-4" /> New quest
          </Button>
        }
      />
      {isLoading && !data ? (
        <Skeleton className="h-64" />
      ) : !data?.length ? (
        <EmptyState icon="🗺️" title="No quests yet" description="Create a quest to give players a goal and bonus points." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.map((q, i) => (
            <motion.div key={q.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold" style={{ color: q.club.color }}>
                    {q.club.icon} {q.club.name}
                  </div>
                  <h3 className="mt-0.5 font-bold">{q.title}</h3>
                </div>
                <div className="rounded-xl bg-amber-400/15 px-2.5 py-1 text-sm font-black text-amber-300">+{q.bonusPoints}</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {q.games.map((g) => {
                  const M = GAME_META[g.game.type];
                  return (
                    <span key={g.gameId} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-xs">
                      <M.icon className="h-3 w-3" style={{ color: M.accent }} /> {g.game.title}
                    </span>
                  );
                })}
              </div>
              <div className="mt-4 flex flex-1 items-end justify-between text-xs text-zinc-500">
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-3.5 w-3.5" /> {q._count.completions} completions
                  </div>
                  <div>
                    {formatDate(q.startsAt)} → {q.endsAt ? formatDate(q.endsAt) : "no end"}
                  </div>
                  {!q.isActive && <Badge>Inactive</Badge>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setDeleting(q)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" onClick={() => open(q)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing && !!form}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New quest" : "Edit quest"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form?.title.trim() || !form?.gameIds.length}>
              Save quest
            </Button>
          </>
        }
      >
        {form && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Club">
              <Select value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value, gameIds: [] })}>
                {clubs?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Bonus points">
              <Input type="number" min={0} value={form.bonusPoints} onChange={(e) => set("bonusPoints", Number(e.target.value))} />
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[60px]" />
            </Field>
            <Field label="Starts">
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            </Field>
            <Field label="Ends (optional)">
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} />
            </Field>
            <div className="sm:col-span-2">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">Games in this quest ({form.gameIds.length} selected)</div>
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-2xl border border-white/10 p-2">
                {!games?.length && <div className="p-3 text-sm text-zinc-500">This club has no games yet.</div>}
                {games?.map((g) => {
                  const on = form.gameIds.includes(g.id);
                  const M = GAME_META[g.type];
                  return (
                    <button key={g.id} type="button" onClick={() => toggleGame(g.id)} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition", on ? "bg-violet-500/15" : "hover:bg-white/5")}>
                      {on ? <CheckSquare className="h-4 w-4 text-violet-300" /> : <Square className="h-4 w-4 text-zinc-600" />}
                      <M.icon className="h-4 w-4" style={{ color: M.accent }} />
                      <span className="flex-1">{g.title}</span>
                      {on && <span className="text-xs text-violet-300">#{form.gameIds.indexOf(g.id) + 1}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Active" />
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={saving} danger title={`Delete "${deleting?.title}"?`} description="Completion history is removed. Bonus points already awarded stay on the leaderboard." confirmLabel="Delete" />
    </div>
  );
}
