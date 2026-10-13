"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Shield, ShieldOff, UserX } from "lucide-react";
import { errorMessage, useApi, useApiQuery } from "@/lib/api";
import type { AdminUser } from "@/lib/admin-types";
import type { Me } from "@/lib/types";
import { formatDate, formatNumber, timeAgo } from "@/lib/utils";
import { Avatar, Badge, Button, EmptyState, Input, PageHeader, Select, Skeleton } from "@/components/ui";

export default function AdminUsersPage() {
  const api = useApi();
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const { data: me } = useApiQuery<Me>("/api/me");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(q);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const params = new URLSearchParams({ page: String(page), pageSize: "20", ...(debounced && { q: debounced }), ...(role && { role }) });
  const { data, isLoading, isValidating, mutate } = useApiQuery<{ total: number; page: number; pageSize: number; users: AdminUser[] }>(`/api/admin/users?${params}`);
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  async function update(u: AdminUser, body: Partial<Pick<AdminUser, "role" | "isBanned">>) {
    try {
      await api.patch(`/api/admin/users/${u.id}`, body);
      toast.success("User updated");
      await mutate(); // keeps the button's spinner up until the row reflects the change
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <div>
      <PageHeader eyebrow="People" title="Users" subtitle={data ? `${formatNumber(data.total)} registered players` : "Registered players"} />

      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email…" className="pl-10" />
        </div>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="USER">Students</option>
          <option value="ADMIN">Admins</option>
        </Select>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-96" />
      ) : !data?.users.length ? (
        <EmptyState icon="👤" title="No users found" />
      ) : (
        <>
          <div className={`card overflow-x-auto transition-opacity ${isValidating ? "opacity-60" : ""}`}>
            <table className="w-full min-w-[820px] text-sm">
              <thead className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Level</th>
                  <th className="px-4 py-3 text-right">Plays</th>
                  <th className="px-4 py-3 text-right">Clubs</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3">Last active</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.users.map((u, i) => {
                  const self = u.id === me?.user.id;
                  return (
                    <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.imageUrl} name={u.name} size={34} />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-semibold">
                              <span className="truncate">{u.name ?? "—"}</span>
                              {u.role === "ADMIN" && <Badge color="#22d3ee">Admin</Badge>}
                              {u.isBanned && <Badge color="#ef4444">Banned</Badge>}
                            </div>
                            <div className="truncate text-xs text-zinc-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">Lv {u.level}</div>
                        <div className="text-xs text-zinc-500">{formatNumber(u.xp)} XP</div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{u._count.attempts}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{u._count.memberships}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-3 text-xs text-zinc-400">{timeAgo(u.lastActiveAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" disabled={self} onClick={() => update(u, { role: u.role === "ADMIN" ? "USER" : "ADMIN" })} title={u.role === "ADMIN" ? "Remove admin" : "Make admin"}>
                            {u.role === "ADMIN" ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" disabled={self} onClick={() => update(u, { isBanned: !u.isBanned })} title={u.isBanned ? "Unban" : "Ban"} className={u.isBanned ? "text-emerald-300" : "text-rose-300"}>
                            <UserX className="h-4 w-4" /> {u.isBanned ? "Unban" : "Ban"}
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
