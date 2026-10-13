"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { Course } from "@/lib/types";
import { formatINR } from "@/lib/utils";
import { Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Switch, Textarea } from "@/components/ui";

type Form = { title: string; description: string; price: string; imageUrl: string; category: string; isActive: boolean };
const empty: Form = { title: "", description: "", price: "", imageUrl: "", category: "General", isActive: true };

export default function AdminCoursesPage() {
  const api = useApi();
  const { data, isLoading, mutate } = useApiQuery<Course[]>("/api/admin/courses");
  const [editing, setEditing] = useState<Course | "new" | null>(null);
  const [form, setForm] = useState<Form>(empty);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function open(c: Course | "new") {
    setEditing(c);
    setForm(c === "new" ? empty : { title: c.title, description: c.description, price: String(c.price), imageUrl: c.imageUrl ?? "", category: c.category, isActive: c.isActive });
  }

  async function save() {
    setSaving(true);
    try {
      const body = { ...form, price: Number(form.price) };
      if (editing === "new") await api.post("/api/admin/courses", body);
      else if (editing) await api.patch(`/api/admin/courses/${editing.id}`, body);
      toast.success("Course saved");
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
      await api.del(`/api/admin/courses/${deleting.id}`);
      toast.success("Course deleted");
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
        eyebrow="Catalog"
        title="Courses"
        subtitle="Courses students can redeem their scratch cards and passes on. (Full course section comes later.)"
        actions={
          <Button onClick={() => open("new")}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        }
      />
      {isLoading && !data ? (
        <Skeleton className="h-64" />
      ) : !data?.length ? (
        <EmptyState icon={<GraduationCap className="h-7 w-7" />} title="No courses yet" description="Add courses so students can redeem their rewards." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="card flex flex-col overflow-hidden">
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="grid h-36 place-items-center bg-gradient-to-br from-violet-600/40 to-cyan-500/30">
                  <GraduationCap className="h-10 w-10 text-white/70" />
                </div>
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-2">
                  <Badge>{c.category}</Badge>
                  {!c.isActive && <Badge color="#71717a">Hidden</Badge>}
                </div>
                <h3 className="mt-2 font-bold">{c.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-400">{c.description}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold">{formatINR(c.price)}</div>
                    <div className="text-xs text-zinc-500">{c._count?.redemptions ?? 0} redemptions</div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setDeleting(c)} aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={() => open(c)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New course" : "Edit course"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={saving} disabled={!form.title.trim() || !form.price}>
              Save
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" className="sm:col-span-2">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </Field>
          <Field label="Price (₹)">
            <Input type="number" min={0} value={form.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Category">
            <Input value={form.category} onChange={(e) => set("category", e.target.value)} />
          </Field>
          <Field label="Image URL" className="sm:col-span-2">
            <Input value={form.imageUrl} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Description" className="sm:col-span-2">
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <Switch checked={form.isActive} onChange={(v) => set("isActive", v)} label="Available for redemption" />
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={remove}
        loading={saving}
        danger
        title={`Delete ${deleting?.title}?`}
        description="Rewards already redeemed on this course keep their history."
        confirmLabel="Delete"
      />
    </div>
  );
}
