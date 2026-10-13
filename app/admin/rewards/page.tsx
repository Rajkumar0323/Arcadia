"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Ban, Crown, Plus, Search, Ticket } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminClub, AdminReward } from "@/lib/admin-types";
import type { RewardStatus, RewardType } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Avatar, Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton } from "@/components/ui";

const STATUS_COLOR: Record<RewardStatus, string> = {
  UNSCRATCHED: "#d946ef",
  AVAILABLE: "#10b981",
  REDEEMED: "#8b5cf6",
  EXPIRED: "#71717a",
  REVOKED: "#ef4444",
};

type IssueForm = { email: string; clubId: string; type: RewardType; discountPercent: number; validDays: number; title: string };

export default function AdminRewardsPage() {
  const api = useApi();
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [q, setQ] = useState("");
  const params = new URLSearchParams({ ...(status && { status }), ...(type && { type }), ...(q && { q }) });
  const { data, isLoading, mutate } = useApiQuery<AdminReward[]>(`/api/admin/rewards?${params}`);
  const { data: clubs } = useApiQuery<AdminClub[]>("/api/admin/clubs");
  const [issuing, setIssuing] = useState<IssueForm | null>(null);
  const [revoking, setRevoking] = useState<AdminReward | null>(null);
  const [saving, setSaving] = useState(false);

  async function issue() {
    if (!issuing) return;
    setSaving(true);
    try {
      await api.post("/api/admin/rewards", { ...issuing, clubId: issuing.clubId || null });
      toast.success("Reward issued");
      setIssuing(null);
      mutate();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function revoke() {
    if (!revoking) return;
    setSaving(true);
    try {
      await api.patch(`/api/admin/rewards/${revoking.id}/revoke`);
      toast.success("Reward revoked");
      setRevoking(null);
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
        eyebrow="Prizes"
        title="Rewards"
        subtitle="Scratch cards and passes issued to players. Seasons issue them automatically; you can also issue one manually."
        actions={
          <Button onClick={() => setIssuing({ email: "", clubId: "", type: "SCRATCH_CARD", discountPercent: 20, validDays: 30, title: "Special reward" })}>
            <Plus className="h-4 w-4" /> Issue reward
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code or email…" className="pl-10" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.keys(STATUS_COLOR).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0) + s.slice(1).toLowerCase()}
            </option>
          ))}
        </Select>
        <Select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          <option value="SCRATCH_CARD">Scratch cards</option>
          <option value="PASS">Passes</option>
        </Select>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-96" />
      ) : !data?.length ? (
        <EmptyState icon="🎟️" title="No rewards found" description="Rewards appear here when seasons are finalized." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((r, i) => (
                <motion.tr key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i, 20) * 0.02 }} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.user.imageUrl} name={r.user.name} size={30} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{r.user.name}</div>
                        <div className="truncate text-xs text-zinc-500">{r.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 font-semibold">
                      {r.type === "PASS" ? <Crown className="h-4 w-4 text-amber-300" /> : <Ticket className="h-4 w-4 text-fuchsia-300" />}
                      {r.discountPercent}% off
                    </div>
                    <div className="max-w-[220px] truncate text-xs text-zinc-500">
                      {r.club ? `${r.club.icon} ${r.club.name}` : r.title}
                      {r.season && ` · ${r.season.name}`}
                      {r.rank && ` · #${r.rank}`}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{r.code}</td>
                  <td className="px-4 py-3">
                    <Badge color={STATUS_COLOR[r.status]}>{r.status.toLowerCase()}</Badge>
                    {r.course && <div className="mt-1 max-w-[160px] truncate text-xs text-zinc-500">on {r.course.title}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    <div>Issued {formatDate(r.createdAt)}</div>
                    {r.expiresAt && <div>Expires {formatDate(r.expiresAt)}</div>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {["UNSCRATCHED", "AVAILABLE"].includes(r.status) && (
                      <Button variant="ghost" size="sm" onClick={() => setRevoking(r)}>
                        <Ban className="h-4 w-4" /> Revoke
                      </Button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!issuing}
        onClose={() => setIssuing(null)}
        title="Issue a reward"
        description="Send a scratch card or pass to a specific player."
        footer={
          <>
            <Button variant="ghost" onClick={() => setIssuing(null)}>
              Cancel
            </Button>
            <Button onClick={issue} loading={saving} disabled={!issuing?.email || !issuing?.title}>
              Issue
            </Button>
          </>
        }
      >
        {issuing && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Player email" className="sm:col-span-2">
              <Input type="email" value={issuing.email} onChange={(e) => setIssuing({ ...issuing, email: e.target.value })} placeholder="student@example.com" />
            </Field>
            <Field label="Title" className="sm:col-span-2">
              <Input value={issuing.title} onChange={(e) => setIssuing({ ...issuing, title: e.target.value })} />
            </Field>
            <Field label="Type">
              <Select value={issuing.type} onChange={(e) => setIssuing({ ...issuing, type: e.target.value as RewardType })}>
                <option value="SCRATCH_CARD">Scratch card</option>
                <option value="PASS">Pass</option>
              </Select>
            </Field>
            <Field label="Club (optional)">
              <Select value={issuing.clubId} onChange={(e) => setIssuing({ ...issuing, clubId: e.target.value })}>
                <option value="">None</option>
                {clubs?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Discount %">
              <Input type="number" min={1} max={100} value={issuing.discountPercent} onChange={(e) => setIssuing({ ...issuing, discountPercent: Number(e.target.value) })} />
            </Field>
            <Field label="Valid for (days)">
              <Input type="number" min={1} value={issuing.validDays} onChange={(e) => setIssuing({ ...issuing, validDays: Number(e.target.value) })} />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmModal open={!!revoking} onClose={() => setRevoking(null)} onConfirm={revoke} loading={saving} danger title="Revoke this reward?" description={`${revoking?.user.email} will no longer be able to use ${revoking?.code}.`} confirmLabel="Revoke" />
    </div>
  );
}
