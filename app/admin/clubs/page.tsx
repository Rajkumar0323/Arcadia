"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Gamepad2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub } from "@/lib/admin-types";
import { hexToRgba } from "@/lib/utils";
import { Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Switch, Textarea } from "@/components/ui";

const EMOJIS = ["💻", "➗", "🔬", "📚", "🎨", "🎵", "🌍", "⚽", "🧠", "🤖", "♟️", "🎮"];
const COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f97316", "#ec4899", "#eab308", "#ef4444", "#3b82f6"];

type Form = { name: string; slug: string; description: string; icon: string; color: string; coverImage: string; isActive: boolean };
const empty: Form = { name: "", slug: "", description: "", icon: "🎮", color: "#8b5cf6", coverImage: "", isActive: true };

export default function AdminClubsPage() {
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<AdminClub[]>("/api/admin/clubs");
  const [editing, setEditing] = useState<AdminClub | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminClub | null>(null);

  function open(club: AdminClub | "new") {
    setEditing(club);
    setForm(
      club === "new"
        ? empty
        : { name: club.name, slug: club.slug, description: club.description, icon: club.icon, color: club.color, coverImage: club.coverImage ?? "", isActive: club.isActive },
    );
  }

  async function save() {
    setSaving(true);
    try {
      const body = { ...form, slug: form.slug || undefined };
      if (editing === "new") await api.post("/api/admin/clubs", body);
      else if (editing) await api.patch(`/api/admin/clubs/${editing.id}`, body);
      toast.success("Club saved");
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
      await api.del(`/api/admin/clubs/${deleting.id}`);
      toast.success("Club deleted");
      setDeleting(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div>
      <PageHeader
        eyebrow="Manage"
        title="Clubs"
        subtitle="Each club has its own arcade, quests, seasons and leaderboard."
        actions={
          <Button onClick={() => open("new")}>
            <Plus className="h-4 w-4" /> New club
          </Button>
        }
      />

      {isLoading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : !data?.length ? (
        <EmptyState icon="🏛️" title="No clubs yet" description="Create your first club to start adding games." action={<Button onClick={() => open("new")}>Create club</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80"
            >
              <div className="flex items-center gap-4 p-5" style={{ background: `linear-gradient(135deg, ${hexToRgba(c.color, 0.35)}, transparent 80%)` }}>
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-black/30 text-3xl">{c.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-bold">{c.name}</h3>
                    {!c.isActive && <Badge>Hidden</Badge>}
                  </div>
                  <div className="text-xs text-zinc-400">/{c.slug}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 divide-x divide-white/5 border-y border-white/5 text-center">
                {[
                  { l: "Members", v: c._count.memberships, i: Users },
                  { l: "Games", v: c._count.games, i: Gamepad2 },
                  { l: "Quests", v: c._count.quests },
                  { l: "Plays", v: c._count.attempts },
                ].map((s) => (
                  <div key={s.l} className="py-3">
                    <div className="font-bold">{s.v}</div>
                    <div className="text-[10px] text-zinc-500">{s.l}</div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 p-3">
                <Button variant="ghost" size="sm" onClick={() => setDeleting(c)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="sm" onClick={() => open(c)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New club" : "Edit club"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.name.trim()}>
              Save club
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Code Club" />
          </Field>
          <Field label="Slug" hint="Leave blank to generate from the name">
            <Input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="code-club" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Field label="Icon (emoji)">
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => set("icon", e)} className={`grid h-9 w-9 place-items-center rounded-lg text-lg ${form.icon === e ? "bg-violet-500/30 ring-2 ring-violet-400" : "bg-white/5 hover:bg-white/10"}`}>
                  {e}
                </button>
              ))}
              <Input value={form.icon} onChange={(e) => set("icon", e.target.value)} className="h-9 w-16 text-center" maxLength={8} />
            </div>
          </Field>
          <Field label="Accent color">
            <div className="flex flex-wrap items-center gap-1.5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => set("color", c)} className={`h-8 w-8 rounded-full ${form.color === c ? "ring-2 ring-white ring-offset-2 ring-offset-ink-900" : ""}`} style={{ background: c }} aria-label={c} />
              ))}
              <input type="color" value={form.color} onChange={(e) => set("color", e.target.value)} className="h-8 w-10 cursor-pointer rounded bg-transparent" />
            </div>
          </Field>
          <Field label="Cover image URL (optional)" className="sm:col-span-2">
            <Input value={form.coverImage} onChange={(e) => set("coverImage", e.target.value)} placeholder="https://…" />
          </Field>
          <div className="sm:col-span-2">
            <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Visible to students" />
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Preview</div>
            <div className="mt-2 flex items-center gap-3 rounded-2xl border p-4" style={{ borderColor: hexToRgba(form.color, 0.4), background: `linear-gradient(135deg, ${hexToRgba(form.color, 0.35)}, transparent)` }}>
              <span className="text-3xl">{form.icon}</span>
              <div>
                <div className="font-bold">{form.name || "Club name"}</div>
                <div className="text-xs text-zinc-400">{form.description || "Description"}</div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={saving}
        danger
        title={`Delete ${deleting?.name}?`}
        description="This permanently deletes the club with all its games, quests, seasons, scores and memberships. Consider hiding it instead."
        confirmLabel="Delete forever"
      />
    </div>
  );
}
