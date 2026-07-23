"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AdminUserSummary } from "@/lib/admin-metrics";

function badgeClass(tier: AdminUserSummary["tier"]) {
  if (tier === "elite") return "bg-amber-300/15 text-amber-200";
  if (tier === "pro") return "bg-[#ff5a2f]/15 text-[#ff9b7f]";
  return "bg-white/5 text-white/45";
}

export default function AdminUserTable({ users }: { users: AdminUserSummary[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return users;
    return users.filter((user) =>
      [user.email, user.name, user.slug, user.tier, user.subscriptionStatus, user.domain]
        .some((value) => value.toLowerCase().includes(normalized))
    );
  }, [query, users]);

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-black">Customers & portfolios</h2>
          <p className="mt-1 text-xs text-white/35">{filtered.length} of {users.length} registered users</p>
        </div>
        <label className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 sm:w-72">
          <Search className="h-4 w-4 text-white/30" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users, plans, domains…"
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/25"
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-xs">
          <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.16em] text-white/30">
            <tr>
              <th className="px-5 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Portfolio</th>
              <th className="px-4 py-3 font-semibold">30d activity</th>
              <th className="px-4 py-3 font-semibold">Domain</th>
              <th className="px-5 py-3 text-right font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {filtered.map((user) => (
              <tr key={user.id} className="transition hover:bg-white/[0.025]">
                <td className="px-5 py-4">
                  <p className="font-bold text-white/85">{user.name}</p>
                  <p className="mt-1 text-white/35">{user.email}</p>
                </td>
                <td className="px-4 py-4"><span className={`rounded-md px-2 py-1 font-bold uppercase ${badgeClass(user.tier)}`}>{user.tier}</span></td>
                <td className="px-4 py-4 capitalize text-white/50">{user.subscriptionStatus}</td>
                <td className="px-4 py-4">
                  {user.slug ? (
                    <><a href={"/" + user.slug} target="_blank" rel="noreferrer" className="font-semibold text-white/70 hover:text-white">{user.slug}</a><p className="mt-1 text-white/30">{user.published ? "Published" : "Draft"}</p></>
                  ) : <span className="text-white/30">Not started</span>}
                </td>
                <td className="px-4 py-4 text-white/50">{user.views.toLocaleString()} views · {user.videoPlays.toLocaleString()} plays</td>
                <td className="px-4 py-4">
                  <p className="max-w-44 truncate text-white/60">{user.domain || "—"}</p>
                  <p className="mt-1 capitalize text-white/30">{user.domainStatus}</p>
                </td>
                <td className="px-5 py-4 text-right text-white/35">{new Date(user.joinedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-white/35">No customers match that search.</p>}
      </div>
    </div>
  );
}
