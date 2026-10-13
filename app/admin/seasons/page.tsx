"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Crown, Flag, ListOrdered, Pencil, Plus, Ticket, Trash2, X } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub, AdminSeason, RewardTier } from "@/lib/admin-types";
import { cn, formatDate, formatNumber, fromLocalInput, toLocalInput } from "@/lib/utils";
import { Avatar, Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Switch } from "@/components/ui";

type Form = { clubId: string; name: string; startsAt: string; endsAt: string; tiers: RewardTier[] };

const DEFAULT_TIERS: RewardTier[] = [
  { rankFrom: 1, rankTo: 1, type: "PASS", minDiscount: 50, maxDiscount: 50, validDays: 60, label: "Champion Pass" },
  { rankFrom: 2, rankTo: 3, type: "SCRATCH_CARD", minDiscount: 25, maxDiscount: 40, validDays: 45, label: "" },
  { rankFrom: 4, rankTo: 10, type: "SCRATCH_CARD", minDiscount: 10, maxDiscount: 25, validDays: 30, label: "" },
];

function status(s: AdminSeason) {
  const now = Date.now();
  if (s.finalizedAt) return { label: "Finalized", color: "#8b5cf6" };
  if (new Date(s.startsAt).getTime() > now) return { label: "Upcoming", color: "#06b6d4" };
  if (new Date(s.endsAt).getTime() > now) return { label: "Live", color: "#10b981" };
  return { label: "Ended · pending", color: "#f59e0b" };
}

function nextMonth() {
  const s = new Date();
  s.setHours(0, 0, 0, 0);
  const e = new Date(s);
  e.setMonth(e.getMonth() + 1);
  return { s, e };
}

export default function AdminSeasonsPage() {
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<AdminSeason[]>("/api/admin/seasons");
  const { data: clubs } = useApiQuery<AdminClub[]>("/api/admin/clubs");
  const [editing, setEditing] = useState<AdminSeason | "new" | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<AdminSeason | null>(null);
  const [finalizing, setFinalizing] = useState<AdminSeason | null>(null);
  const [force, setForce] = useState(false);
  const [viewing, setViewing] = useState<AdminSeason | null>(null);
  const { data: standings } = useApiQuery<{ rank: number; points: number; user: { id: string; name: string; imageUrl: string | null; email: string } }[]>(
    viewing ? `/api/admin/seasons/${viewing.id}/standings` : null,
  );

  function open(s: AdminSeason | "new") {
    setEditing(s);
    if (s === "new") {
      const { s: start, e } = nextMonth();
      setForm({ clubId: clubs?.[0]?.id ?? "", name: `Season ${start.toLocaleString("en", { month: "long", year: "numeric" })}`, startsAt: toLocalInput(start), endsAt: toLocalInput(e), tiers: DEFAULT_TIERS.map((t) => ({ ...t })) });
    } else {
      setForm({ clubId: s.clubId, name: s.name, startsAt: toLocalInput(s.startsAt), endsAt: toLocalInput(s.endsAt), tiers: s.tiers.map(({ id: _id, ...t }) => ({ ...t, label: t.label ?? "" })) });
    }
  }

  const setTier = (i: number, patch: Partial<RewardTier>) => setForm((f) => (f ? { ...f, tiers: f.tiers.map((t, j) => (j === i ? { ...t, ...patch } : t)) } : f));

  async function save() {
    if (!form) return;
    setSaving(true);
    try {
      const body = {
        ...form,
        startsAt: fromLocalInput(form.startsAt),
        endsAt: fromLocalInput(form.endsAt),
        tiers: form.tiers.map((t) => ({ ...t, maxDiscount: t.type === "PASS" ? t.maxDiscount : t.maxDiscount, minDiscount: t.type === "PASS" ? t.maxDiscount : t.minDiscount, label: t.label || null })),
      };
      if (editing === "new") await api.post("/api/admin/seasons", body);
      else if (editing) await api.patch(`/api/admin/seasons/${editing.id}`, body);
      toast.success("Season saved");
      setEditing(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function finalize() {
    if (!finalizing) return;
    setSaving(true);
    try {
      const res = await api.post<{ issued: number; players: number }>(`/api/admin/seasons/${finalizing.id}/finalize`, { force });
      toast.success(`Season finalized — ${res.issued} rewards issued to ${res.players} ranked players`);
      setFinalizing(null);
      setForce(false);
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
      await api.del(`/api/admin/seasons/${deleting.id}`);
      toast.success("Season deleted");
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
        eyebrow="Competition"
        title="Seasons & prizes"
        subtitle="Each club runs time-boxed seasons (e.g. monthly). When a season ends, top players automatically receive scratch cards or passes."
        actions={
          <Button onClick={() => open("new")} disabled={!clubs?.length}>
            <Plus className="h-4 w-4" /> New season
          </Button>
        }
      />

      {isLoading && !data ? (
        <Skeleton className="h-64" />
      ) : !data?.length ? (
        <EmptyState icon="🏆" title="No seasons yet" description="Create a season so each club's leaderboard resets and winners get rewards." />
      ) : (
        <div className="space-y-3">
          {data.map((s, i) => {
            const st = status(s);
            return (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="card p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                  <div className="flex flex-1 items-center gap-4">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${s.club.color}33` }}>
                      {s.club.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold">{s.name}</h3>
                        <Badge color={st.color}>{st.label}</Badge>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {s.club.name} · {formatDate(s.startsAt)} → {formatDate(s.endsAt)} · {formatNumber(s._count.attempts)} plays · {s._count.rewards} rewards issued
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.tiers.map((t) => (
                          <span key={t.id} className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2 py-0.5 text-[11px]">
                            {t.type === "PASS" ? <Crown className="h-3 w-3 text-amber-300" /> : <Ticket className="h-3 w-3 text-fuchsia-300" />}#{t.rankFrom}
                            {t.rankTo !== t.rankFrom && `–${t.rankTo}`}: {t.type === "PASS" ? `${t.maxDiscount}%` : `${t.minDiscount}–${t.maxDiscount}%`}
                          </span>
                        ))}
                        {!s.tiers.length && <span className="text-[11px] text-zinc-500">No prize tiers</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setViewing(s)}>
                      <ListOrdered className="h-4 w-4" /> Standings
                    </Button>
                    {!s.finalizedAt && (
                      <>
                        <Button variant="success" size="sm" onClick={() => setFinalizing(s)}>
                          <Flag className="h-4 w-4" /> Finalize
                        </Button>
                        <Button variant="secondary" size="icon" onClick={() => open(s)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(s)} aria-label="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editing && !!form}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New season" : "Edit season"}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form?.name.trim() || !form?.clubId}>
              Save season
            </Button>
          </>
        }
      >
        {form && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Club">
                <Select value={form.clubId} onChange={(e) => setForm({ ...form, clubId: e.target.value })}>
                  {clubs?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Starts">
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
              </Field>
              <Field label="Ends">
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
              </Field>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Prize tiers</h3>
                  <p className="text-xs text-zinc-500">Scratch cards reveal a random discount in the range. Passes give the max discount instantly.</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const last = form.tiers[form.tiers.length - 1];
                    const from = last ? last.rankTo + 1 : 1;
                    setForm({ ...form, tiers: [...form.tiers, { rankFrom: from, rankTo: from, type: "SCRATCH_CARD", minDiscount: 5, maxDiscount: 15, validDays: 30, label: "" }] });
                  }}
                >
                  <Plus className="h-4 w-4" /> Tier
                </Button>
              </div>
              <div className="space-y-2">
                {form.tiers.map((t, i) => (
                  <div key={i} className="grid grid-cols-2 items-end gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-[repeat(6,minmax(0,1fr))_auto]">
                    <Field label="Rank from">
                      <Input type="number" min={1} value={t.rankFrom} onChange={(e) => setTier(i, { rankFrom: Number(e.target.value) })} className="h-10" />
                    </Field>
                    <Field label="Rank to">
                      <Input type="number" min={t.rankFrom} value={t.rankTo} onChange={(e) => setTier(i, { rankTo: Number(e.target.value) })} className="h-10" />
                    </Field>
                    <Field label="Type">
                      <Select value={t.type} onChange={(e) => setTier(i, { type: e.target.value as RewardTier["type"] })} className="h-10">
                        <option value="SCRATCH_CARD">Scratch card</option>
                        <option value="PASS">Pass</option>
                      </Select>
                    </Field>
                    <Field label={t.type === "PASS" ? "—" : "Min %"}>
                      <Input type="number" min={1} max={100} value={t.type === "PASS" ? t.maxDiscount : t.minDiscount} disabled={t.type === "PASS"} onChange={(e) => setTier(i, { minDiscount: Number(e.target.value) })} className={cn("h-10", t.type === "PASS" && "opacity-30")} />
                    </Field>
                    <Field label={t.type === "PASS" ? "Discount %" : "Max %"}>
                      <Input type="number" min={1} max={100} value={t.maxDiscount} onChange={(e) => setTier(i, { maxDiscount: Number(e.target.value) })} className="h-10" />
                    </Field>
                    <Field label="Valid days">
                      <Input type="number" min={1} value={t.validDays} onChange={(e) => setTier(i, { validDays: Number(e.target.value) })} className="h-10" />
                    </Field>
                    <button type="button" onClick={() => setForm({ ...form, tiers: form.tiers.filter((_, j) => j !== i) })} className="mb-2 grid h-8 w-8 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400" aria-label="Remove tier">
                      <X className="h-4 w-4" />
                    </button>
                    <Input value={t.label ?? ""} onChange={(e) => setTier(i, { label: e.target.value })} placeholder="Custom title (optional), e.g. Champion Pass" className="col-span-2 h-10 sm:col-span-6" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`${viewing?.club.icon ?? ""} ${viewing?.name ?? ""} standings`} size="lg">
        {!standings ? (
          <Skeleton className="h-48" />
        ) : !standings.length ? (
          <p className="py-8 text-center text-sm text-zinc-500">No points scored in this season yet.</p>
        ) : (
          <ol className="space-y-1">
            {standings.map((r) => {
              const tier = viewing?.tiers.find((t) => r.rank >= t.rankFrom && r.rank <= t.rankTo);
              return (
                <li key={r.user.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-white/[0.03]">
                  <span className="w-8 text-center text-sm font-bold text-zinc-400">{r.rank}</span>
                  <Avatar src={r.user.imageUrl} name={r.user.name} size={32} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.user.name}</div>
                    <div className="truncate text-xs text-zinc-500">{r.user.email}</div>
                  </div>
                  {tier && <Badge color={tier.type === "PASS" ? "#f59e0b" : "#d946ef"}>{tier.type === "PASS" ? "Pass" : "Scratch"}</Badge>}
                  <span className="w-16 text-right text-sm font-bold">{formatNumber(r.points)}</span>
                </li>
              );
            })}
          </ol>
        )}
      </Modal>

      <Modal
        open={!!finalizing}
        onClose={() => setFinalizing(null)}
        title={`Finalize ${finalizing?.name}?`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setFinalizing(null)}>
              Cancel
            </Button>
            <Button variant="success" onClick={finalize} loading={saving}>
              Finalize & issue rewards
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-sm text-zinc-300">
          <p>This locks the leaderboard and issues rewards to the winners based on the prize tiers. It can&apos;t be undone.</p>
          {finalizing && new Date(finalizing.endsAt) > new Date() && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-amber-200">
              This season is still running.
              <div className="mt-2">
                <Switch checked={force} onChange={setForce} label="End it now and finalize" />
              </div>
            </div>
          )}
        </div>
      </Modal>

      <ConfirmModal open={!!deleting} onClose={() => setDeleting(null)} onConfirm={remove} loading={saving} danger title={`Delete ${deleting?.name}?`} description="Points earned during this season will move to the all-time leaderboard only." confirmLabel="Delete" />
    </div>
  );
}
